import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// Firebase Emulator設定
const FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const AUTH_EMULATOR_HOST = 'localhost:9099';

// データ整合性テスト用のテストデータ
const INTEGRITY_TEST_DATA = {
  reservations: [
    {
      id: 'test-reservation-1',
      date: '2024-12-15',
      timeSlot: '09:00',
      content: '整合性テスト予約1',
      category: 'cut',
      status: 'active'
    },
    {
      id: 'test-reservation-2', 
      date: '2024-12-15',
      timeSlot: '10:30',
      content: '整合性テスト予約2',
      category: 'color',
      status: 'active'
    }
  ]
};

test.describe('Firebase Data Integrity Tests', () => {
  let primaryContext: BrowserContext;
  let secondaryContext: BrowserContext;
  let primaryPage: Page;
  let secondaryPage: Page;

  test.beforeAll(async ({ browser }) => {
    // 2つの独立したブラウザコンテキスト作成
    primaryContext = await browser.newContext({
      extraHTTPHeaders: { 'X-Test-Role': 'primary' }
    });
    
    secondaryContext = await browser.newContext({
      extraHTTPHeaders: { 'X-Test-Role': 'secondary' }
    });

    primaryPage = await primaryContext.newPage();
    secondaryPage = await secondaryContext.newPage();

    // Firebase Emulator設定を注入
    await Promise.all([
      primaryPage.addInitScript(`
        window.FIRESTORE_EMULATOR_HOST = '${FIRESTORE_EMULATOR_HOST}';
        window.FIREBASE_AUTH_EMULATOR_HOST = '${AUTH_EMULATOR_HOST}';
      `),
      secondaryPage.addInitScript(`
        window.FIRESTORE_EMULATOR_HOST = '${FIRESTORE_EMULATOR_HOST}';
        window.FIREBASE_AUTH_EMULATOR_HOST = '${AUTH_EMULATOR_HOST}';
      `)
    ]);
  });

  test.afterAll(async () => {
    await Promise.all([
      primaryContext?.close(),
      secondaryContext?.close()
    ]);
  });

  test.beforeEach(async () => {
    // 管理者としてログイン
    await Promise.all([
      loginAsAdmin(primaryPage),
      loginAsAdmin(secondaryPage)
    ]);

    // 予約一覧画面に移動
    await Promise.all([
      primaryPage.goto('/reservations'),
      secondaryPage.goto('/reservations')
    ]);
  });

  test('Firebase Emulator環境でのCRUD操作整合性確認', async () => {
    const testReservation = INTEGRITY_TEST_DATA.reservations[0];

    // CREATE: Primary画面で予約作成
    await createReservationViaAPI(primaryPage, testReservation);

    // READ: Secondary画面で作成された予約が即座に表示されることを確認
    await expect(secondaryPage.locator(`[data-testid="reservation-${testReservation.timeSlot}"]`))
      .toContainText(testReservation.content, { timeout: 5000 });

    // UPDATE: Secondary画面で予約を更新
    const updatedContent = '整合性テスト予約1 - 更新済み';
    await updateReservationViaAPI(secondaryPage, testReservation.id, { content: updatedContent });

    // Primary画面で更新が反映されることを確認
    await expect(primaryPage.locator(`[data-testid="reservation-${testReservation.timeSlot}"]`))
      .toContainText(updatedContent, { timeout: 5000 });

    // DELETE: Primary画面で予約を削除
    await deleteReservationViaAPI(primaryPage, testReservation.id);

    // Secondary画面で削除が反映されることを確認
    await expect(secondaryPage.locator(`[data-testid="reservation-${testReservation.timeSlot}"]`))
      .not.toBeVisible({ timeout: 5000 });

    console.log('✅ CRUD操作整合性確認完了');
  });

  test('トランザクション整合性：バッチ更新の原子性', async () => {
    // 複数予約を同時作成
    await Promise.all(
      INTEGRITY_TEST_DATA.reservations.map(reservation =>
        createReservationViaAPI(primaryPage, reservation)
      )
    );

    // バッチ更新実行（全予約のステータスを'completed'に変更）
    await executeBatchUpdate(primaryPage, INTEGRITY_TEST_DATA.reservations.map(r => r.id), {
      status: 'completed'
    });

    // 全ての予約が一貫してupdateされていることを確認
    for (const reservation of INTEGRITY_TEST_DATA.reservations) {
      await expect(secondaryPage.locator(`[data-testid="reservation-status-${reservation.id}"]`))
        .toHaveText('completed', { timeout: 5000 });
    }

    console.log('✅ バッチ更新原子性確認完了');
  });

  test('ネットワーク不安定時のデータ一貫性', async () => {
    const testReservation = {
      ...INTEGRITY_TEST_DATA.reservations[0],
      content: 'ネットワーク不安定テスト'
    };

    // Primary側でネットワーク遅延をシミュレート
    await primaryContext.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒遅延
      await route.continue();
    });

    // 遅延環境で予約作成
    const createStartTime = Date.now();
    await createReservationViaAPI(primaryPage, testReservation);
    const createEndTime = Date.now();

    // Secondary側（正常ネットワーク）で即座に同期されることを確認
    await expect(secondaryPage.locator(`[data-testid="reservation-${testReservation.timeSlot}"]`))
      .toContainText(testReservation.content, { timeout: 8000 });

    // 遅延があっても最終的にデータ一貫性が保たれることを確認
    expect(createEndTime - createStartTime).toBeGreaterThan(1000);

    console.log('✅ ネットワーク不安定時データ一貫性確認完了');
  });

  test('並列操作時の楽観的ロック動作確認', async () => {
    const testReservation = INTEGRITY_TEST_DATA.reservations[1];
    
    // 予約を事前作成
    await createReservationViaAPI(primaryPage, testReservation);

    // 両方の画面で同じ予約の編集開始（楽観的ロック取得）
    await Promise.all([
      startEditReservation(primaryPage, testReservation.id),
      startEditReservation(secondaryPage, testReservation.id)
    ]);

    // 異なる内容で同時更新を試行
    const primaryUpdate = { content: 'Primary側更新' };
    const secondaryUpdate = { content: 'Secondary側更新' };

    const [primaryResult, secondaryResult] = await Promise.allSettled([
      updateReservationViaAPI(primaryPage, testReservation.id, primaryUpdate),
      updateReservationViaAPI(secondaryPage, testReservation.id, secondaryUpdate)
    ]);

    // どちらか一方は成功、もう一方は競合エラーになることを確認
    const successCount = [primaryResult, secondaryResult].filter(result => result.status === 'fulfilled').length;
    const failureCount = [primaryResult, secondaryResult].filter(result => result.status === 'rejected').length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    console.log('✅ 楽観的ロック動作確認完了');
  });

  test('Firebase Emulator Firestoreルール適用確認', async () => {
    // 未認証ユーザーでのアクセス試行
    const unauthenticatedContext = await primaryContext.browser()!.newContext();
    const unauthenticatedPage = await unauthenticatedContext.newPage();

    await unauthenticatedPage.addInitScript(`
      window.FIRESTORE_EMULATOR_HOST = '${FIRESTORE_EMULATOR_HOST}';
      window.FIREBASE_AUTH_EMULATOR_HOST = '${AUTH_EMULATOR_HOST}';
    `);

    await unauthenticatedPage.goto('/reservations');

    // 未認証ではデータにアクセスできないことを確認
    await expect(unauthenticatedPage.locator('[data-testid="unauthorized-message"]'))
      .toBeVisible({ timeout: 5000 });

    await unauthenticatedContext.close();

    console.log('✅ Firestoreセキュリティルール確認完了');
  });

  test('大量データ処理時の整合性確認', async () => {
    const BULK_DATA_SIZE = 50;
    const bulkReservations = Array.from({ length: BULK_DATA_SIZE }, (_, index) => ({
      id: `bulk-reservation-${index}`,
      date: '2024-12-20',
      timeSlot: `${String(9 + Math.floor(index / 6)).padStart(2, '0')}:${String((index % 6) * 10).padStart(2, '0')}`,
      content: `大量データテスト ${index + 1}`,
      category: ['cut', 'color', 'perm'][index % 3] as 'cut' | 'color' | 'perm',
      status: 'active' as const
    }));

    // 大量データ投入開始時刻
    const bulkInsertStartTime = Date.now();

    // バッチサイズ10で分割して投入
    const batchSize = 10;
    for (let i = 0; i < bulkReservations.length; i += batchSize) {
      const batch = bulkReservations.slice(i, i + batchSize);
      await Promise.all(
        batch.map(reservation => createReservationViaAPI(primaryPage, reservation))
      );
      await primaryPage.waitForTimeout(100); // レート制限回避
    }

    const bulkInsertEndTime = Date.now();

    // Secondary側で全データが同期されることを確認
    for (const reservation of bulkReservations.slice(0, 10)) { // 最初の10件をサンプル確認
      await expect(secondaryPage.locator(`[data-testid="reservation-${reservation.timeSlot}"]`))
        .toContainText(reservation.content, { timeout: 15000 });
    }

    // パフォーマンス確認（50件の投入・同期が30秒以内）
    const totalTime = bulkInsertEndTime - bulkInsertStartTime;
    expect(totalTime).toBeLessThan(30000);

    console.log(`✅ 大量データ処理整合性確認完了: ${totalTime}ms`);
  });
});

// ヘルパー関数群
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  
  await page.fill('[data-testid="email-input"]', 'admin@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
}

async function createReservationViaAPI(page: Page, reservation: any): Promise<void> {
  // JavaScript APIを直接呼び出し（より高速）
  await page.evaluate(async (reservationData) => {
    const response = await fetch('/.netlify/functions/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData)
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
  }, reservation);
}

async function updateReservationViaAPI(page: Page, id: string, updates: any): Promise<void> {
  await page.evaluate(async ({ reservationId, updateData }) => {
    const response = await fetch(`/.netlify/functions/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
  }, { reservationId: id, updateData: updates });
}

async function deleteReservationViaAPI(page: Page, id: string): Promise<void> {
  await page.evaluate(async (reservationId) => {
    const response = await fetch(`/.netlify/functions/reservations/${reservationId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
  }, id);
}

async function executeBatchUpdate(page: Page, ids: string[], updates: any): Promise<void> {
  await page.evaluate(async ({ reservationIds, updateData }) => {
    const response = await fetch('/.netlify/functions/reservations/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: reservationIds,
        updates: updateData
      })
    });
    if (!response.ok) throw new Error(`Batch API Error: ${response.status}`);
  }, { reservationIds: ids, updateData: updates });
}

async function startEditReservation(page: Page, id: string): Promise<void> {
  await page.click(`[data-testid="edit-reservation-${id}"]`);
  await page.waitForSelector(`[data-testid="reservation-form-${id}"]`);
}