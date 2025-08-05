import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// Firebase Emulator設定
const FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const AUTH_EMULATOR_HOST = 'localhost:9099';

// テスト用スタッフアカウント
const STAFF_ACCOUNTS = [
  { email: 'staff1@example.com', password: 'password123', name: 'スタッフ1' },
  { email: 'staff2@example.com', password: 'password123', name: 'スタッフ2' },
  { email: 'admin@example.com', password: 'password123', name: '管理者' }
];

// テスト専用の予約データ
const TEST_RESERVATION = {
  date: '2024-12-15',
  timeSlot: '10:30',
  content: 'E2Eテスト予約 - リアルタイム同期確認',
  category: 'cut',
  status: 'active'
};

test.describe('Firebase Realtime Sync E2E Tests', () => {
  let staff1Context: BrowserContext;
  let staff2Context: BrowserContext;
  let adminContext: BrowserContext;
  
  let staff1Page: Page;
  let staff2Page: Page;
  let adminPage: Page;

  test.beforeAll(async ({ browser }) => {
    // 複数ブラウザコンテキスト作成（分離環境）
    staff1Context = await browser.newContext({
      // Firebase Emulator環境変数
      extraHTTPHeaders: {
        'X-Test-Environment': 'emulator'
      }
    });
    
    staff2Context = await browser.newContext({
      extraHTTPHeaders: {
        'X-Test-Environment': 'emulator'
      }
    });
    
    adminContext = await browser.newContext({
      extraHTTPHeaders: {
        'X-Test-Environment': 'emulator'
      }
    });

    // 各コンテキストでページ作成
    staff1Page = await staff1Context.newPage();
    staff2Page = await staff2Context.newPage();
    adminPage = await adminContext.newPage();

    // Firebase Emulator接続確認
    await Promise.all([
      staff1Page.addInitScript(`
        window.FIRESTORE_EMULATOR_HOST = '${FIRESTORE_EMULATOR_HOST}';
        window.FIREBASE_AUTH_EMULATOR_HOST = '${AUTH_EMULATOR_HOST}';
      `),
      staff2Page.addInitScript(`
        window.FIRESTORE_EMULATOR_HOST = '${FIRESTORE_EMULATOR_HOST}';
        window.FIREBASE_AUTH_EMULATOR_HOST = '${AUTH_EMULATOR_HOST}';
      `),
      adminPage.addInitScript(`
        window.FIRESTORE_EMULATOR_HOST = '${FIRESTORE_EMULATOR_HOST}';
        window.FIREBASE_AUTH_EMULATOR_HOST = '${AUTH_EMULATOR_HOST}';
      `)
    ]);
  });

  test.afterAll(async () => {
    // コンテキストクリーンアップ
    await Promise.all([
      staff1Context?.close(),
      staff2Context?.close(), 
      adminContext?.close()
    ]);
  });

  test.beforeEach(async () => {
    // 各テスト前にクリーンな状態でログイン
    await Promise.all([
      loginAsStaff(staff1Page, STAFF_ACCOUNTS[0]),
      loginAsStaff(staff2Page, STAFF_ACCOUNTS[1]),
      loginAsStaff(adminPage, STAFF_ACCOUNTS[2])
    ]);

    // 予約管理画面に移動
    await Promise.all([
      staff1Page.goto('/reservations'),
      staff2Page.goto('/reservations'),
      adminPage.goto('/reservations')
    ]);

    // ページ読み込み完了を待機
    await Promise.all([
      staff1Page.waitForSelector('[data-testid="reservation-calendar"]'),
      staff2Page.waitForSelector('[data-testid="reservation-calendar"]'),
      adminPage.waitForSelector('[data-testid="reservation-calendar"]')
    ]);
  });

  test('複数スタッフによるリアルタイム予約同期', async () => {
    // Staff1が予約を作成
    await createReservation(staff1Page, TEST_RESERVATION);

    // Staff2とAdminの画面で新しい予約が即座に表示されることを確認（5秒以内）
    await Promise.all([
      expect(staff2Page.locator(`[data-testid="reservation-${TEST_RESERVATION.timeSlot}"]`))
        .toContainText(TEST_RESERVATION.content, { timeout: 5000 }),
      expect(adminPage.locator(`[data-testid="reservation-${TEST_RESERVATION.timeSlot}"]`))
        .toContainText(TEST_RESERVATION.content, { timeout: 5000 })
    ]);

    console.log('✅ リアルタイム予約同期テスト完了');
  });

  test('同時編集時の競合検出・解決', async () => {
    // 事前に予約を作成
    await createReservation(adminPage, TEST_RESERVATION);
    
    // 両方のスタッフが同じ予約を編集開始
    await Promise.all([
      staff1Page.click(`[data-testid="edit-reservation-${TEST_RESERVATION.timeSlot}"]`),
      staff2Page.click(`[data-testid="edit-reservation-${TEST_RESERVATION.timeSlot}"]`)
    ]);

    // 異なる内容で同時に更新を試行
    const staff1Update = 'スタッフ1による更新';
    const staff2Update = 'スタッフ2による更新';

    await Promise.all([
      updateReservationContent(staff1Page, staff1Update),
      updateReservationContent(staff2Page, staff2Update)
    ]);

    // 両方のユーザーが保存ボタンをクリック（競合発生）
    await Promise.all([
      staff1Page.click('[data-testid="save-reservation"]'),
      staff2Page.click('[data-testid="save-reservation"]')
    ]);

    // 競合通知の表示を確認（どちらか一方は競合エラーが表示される）
    const staff1HasConflict = await staff1Page.locator('[data-testid="conflict-notification"]').isVisible();
    const staff2HasConflict = await staff2Page.locator('[data-testid="conflict-notification"]').isVisible();

    expect(staff1HasConflict || staff2HasConflict).toBeTruthy();

    console.log('✅ 同時編集競合検出テスト完了');
  });

  test('ネットワーク切断・再接続時のデータ同期', async () => {
    // Staff1がオフライン状態で予約を作成
    await staff1Context.setOffline(true);
    
    await createReservation(staff1Page, {
      ...TEST_RESERVATION,
      content: 'オフライン時の予約作成'
    });

    // オフライン時は保存ボタンが無効化されるか、ペンディング状態になることを確認
    const saveButton = staff1Page.locator('[data-testid="save-reservation"]');
    await expect(saveButton).toBeDisabled();

    // ネットワーク復旧
    await staff1Context.setOffline(false);

    // 自動同期の待機（10秒以内）
    await staff1Page.waitForSelector('[data-testid="sync-success"]', { timeout: 10000 });

    // 他のスタッフ画面でもデータが同期されることを確認
    await expect(staff2Page.locator(`[data-testid="reservation-${TEST_RESERVATION.timeSlot}"]`))
      .toContainText('オフライン時の予約作成', { timeout: 8000 });

    console.log('✅ ネットワーク切断・再接続同期テスト完了');
  });

  test('30分枠×複数予約の同時表示パフォーマンス', async () => {
    const performanceStartTime = Date.now();

    // 複数の予約を並列で作成（負荷テスト）
    const reservations = [
      { ...TEST_RESERVATION, timeSlot: '09:00', content: '予約1' },
      { ...TEST_RESERVATION, timeSlot: '09:30', content: '予約2' },
      { ...TEST_RESERVATION, timeSlot: '10:00', content: '予約3' },
      { ...TEST_RESERVATION, timeSlot: '10:30', content: '予約4' },
      { ...TEST_RESERVATION, timeSlot: '11:00', content: '予約5' },
      { ...TEST_RESERVATION, timeSlot: '11:30', content: '予約6' },
      { ...TEST_RESERVATION, timeSlot: '12:00', content: '予約7' },
      { ...TEST_RESERVATION, timeSlot: '12:30', content: '予約8' }
    ];

    // Admin画面で複数予約を高速作成
    for (const reservation of reservations) {
      await createReservation(adminPage, reservation);
      await adminPage.waitForTimeout(200); // 負荷調整
    }

    // 全ての予約がStaff画面に表示されるまでの時間を測定
    const syncPromises = reservations.map(reservation =>
      staff1Page.waitForSelector(`[data-testid="reservation-${reservation.timeSlot}"]`, { timeout: 10000 })
    );

    await Promise.all(syncPromises);

    const totalSyncTime = Date.now() - performanceStartTime;
    
    // パフォーマンス要件：8個の予約同期が15秒以内
    expect(totalSyncTime).toBeLessThan(15000);

    console.log(`✅ パフォーマンステスト完了: ${totalSyncTime}ms`);
  });

  test('Firebase Emulator UI連携確認', async () => {
    // Firebase Emulator UIでデータを確認
    const emulatorUIPage = await staff1Context.newPage();
    await emulatorUIPage.goto('http://localhost:4000/firestore');

    // Firestoreデータが正しく表示されることを確認
    await expect(emulatorUIPage.locator('[data-testid="firestore-collections"]'))
      .toContainText('reservations');

    await emulatorUIPage.close();

    console.log('✅ Firebase Emulator UI連携確認完了');
  });
});

// ヘルパー関数群
async function loginAsStaff(page: Page, account: typeof STAFF_ACCOUNTS[0]): Promise<void> {
  await page.goto('/login');
  
  await page.fill('[data-testid="email-input"]', account.email);
  await page.fill('[data-testid="password-input"]', account.password);
  await page.click('[data-testid="login-button"]');
  
  // ログイン完了を待機
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
}

async function createReservation(page: Page, reservation: typeof TEST_RESERVATION): Promise<void> {
  // 新規予約ボタンをクリック
  await page.click('[data-testid="new-reservation-button"]');
  
  // 予約フォームに入力
  await page.fill('[data-testid="reservation-date"]', reservation.date);
  await page.selectOption('[data-testid="reservation-time"]', reservation.timeSlot);
  await page.fill('[data-testid="reservation-content"]', reservation.content);
  await page.selectOption('[data-testid="reservation-category"]', reservation.category);
  
  // 保存
  await page.click('[data-testid="save-reservation"]');
  
  // 保存完了を待機
  await page.waitForSelector('[data-testid="save-success"]', { timeout: 5000 });
}

async function updateReservationContent(page: Page, newContent: string): Promise<void> {
  await page.fill('[data-testid="reservation-content"]', '');
  await page.fill('[data-testid="reservation-content"]', newContent);
}