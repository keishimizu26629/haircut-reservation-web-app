/**
 * Playwright E2Eテスト: シンプル予約管理アプリ - 複数端末同期
 * 
 * テスト対象: 複数端末・ブラウザ間でのリアルタイム同期機能
 * 優先度: 高 (Phase 1 - 4時間以内完了目標)
 * 
 * @description 美容室の複数スタッフが同時に使用する環境での同期テスト
 */

import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';

// テストデータ定義
const SYNC_TEST_DATA = {
  staff1Reservation: {
    customerName: '同期テスト1号',
    customerPhone: '090-1111-1111',
    date: '2024-12-26',
    time: '09:00',
    category: 'cut',
    details: 'スタッフ1が作成した予約'
  },
  staff2Reservation: {
    customerName: '同期テスト2号', 
    customerPhone: '090-2222-2222',
    date: '2024-12-26',
    time: '10:00',
    category: 'color',
    details: 'スタッフ2が作成した予約'
  },
  updatedReservation: {
    customerName: '同期テスト1号',
    customerPhone: '090-1111-1111',
    date: '2024-12-26',
    time: '09:30', // 時間変更
    category: 'perm', // カテゴリー変更
    details: 'スタッフ2が編集した予約'
  }
};

test.describe('シンプル予約管理アプリ - 複数端末同期', () => {
  let browser1: Browser;
  let browser2: Browser;
  let context1: BrowserContext;
  let context2: BrowserContext;
  let staff1Page: Page;
  let staff2Page: Page;

  test.beforeAll(async ({ browser, playwright }) => {
    // 2つのブラウザインスタンスを作成 (異なる端末をシミュレート)
    browser1 = browser;
    browser2 = await playwright.chromium.launch();
    
    // スタッフ1のコンテキスト (PC環境をシミュレート)
    context1 = await browser1.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    // スタッフ2のコンテキスト (タブレット環境をシミュレート)
    context2 = await browser2.newContext({
      viewport: { width: 768, height: 1024 },
      locale: 'ja-JP', 
      timezoneId: 'Asia/Tokyo',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/604.1'
    });
    
    staff1Page = await context1.newPage();
    staff2Page = await context2.newPage();
    
    // 両方のページでアプリを開く
    await Promise.all([
      staff1Page.goto('http://localhost:3000/calendar-demo'),
      staff2Page.goto('http://localhost:3000/calendar-demo')
    ]);
    
    // 初期ロード完了まで待機
    await Promise.all([
      staff1Page.waitForLoadState('networkidle'),
      staff2Page.waitForLoadState('networkidle')
    ]);
    
    await Promise.all([
      expect(staff1Page.locator('.calendar-container')).toBeVisible(),
      expect(staff2Page.locator('.calendar-container')).toBeVisible()
    ]);
  });

  test.afterAll(async () => {
    await context1.close();
    await context2.close();
    await browser2.close();
  });

  test.describe('リアルタイム予約同期', () => {
    
    test('スタッフ1の予約作成がスタッフ2に即座反映', async () => {
      // スタッフ1が予約作成
      await createReservation(staff1Page, SYNC_TEST_DATA.staff1Reservation);
      
      // スタッフ2の画面で自動的に反映されることを確認 (最大5秒待機)
      const staff2ReservationCard = staff2Page.locator('.reservation-card')
        .filter({ hasText: SYNC_TEST_DATA.staff1Reservation.customerName });
      
      await expect(staff2ReservationCard).toBeVisible({ timeout: 5000 });
      await expect(staff2ReservationCard).toHaveClass(/category-cut/);
      
      // 時間枠も正しく反映されていることを確認
      const timeSlot = staff2Page.locator('.time-slot')
        .filter({ hasText: SYNC_TEST_DATA.staff1Reservation.time });
      await expect(timeSlot.locator('.reservation-card')).toBeVisible();
    });

    test('スタッフ2の予約作成がスタッフ1に即座反映', async () => {
      // スタッフ2が予約作成
      await createReservation(staff2Page, SYNC_TEST_DATA.staff2Reservation);
      
      // スタッフ1の画面で自動的に反映されることを確認
      const staff1ReservationCard = staff1Page.locator('.reservation-card')
        .filter({ hasText: SYNC_TEST_DATA.staff2Reservation.customerName });
      
      await expect(staff1ReservationCard).toBeVisible({ timeout: 5000 });
      await expect(staff1ReservationCard).toHaveClass(/category-color/);
    });

    test('予約編集の同期', async () => {
      // スタッフ1の予約をスタッフ2が編集
      const staff2ReservationCard = staff2Page.locator('.reservation-card')
        .filter({ hasText: SYNC_TEST_DATA.staff1Reservation.customerName });
      await staff2ReservationCard.click();
      
      const modal = staff2Page.locator('.reservation-modal');
      await modal.locator('select[data-testid="time-select"]').selectOption(SYNC_TEST_DATA.updatedReservation.time);
      await modal.locator(`button[data-category="${SYNC_TEST_DATA.updatedReservation.category}"]`).click();
      await modal.locator('textarea[data-testid="details-input"]').fill(SYNC_TEST_DATA.updatedReservation.details);
      await modal.locator('button[data-testid="update-btn"]').click();
      
      // スタッフ1の画面で変更が反映されることを確認
      const staff1UpdatedCard = staff1Page.locator('.reservation-card')
        .filter({ hasText: SYNC_TEST_DATA.staff1Reservation.customerName });
      
      // カテゴリー変更が反映されることを確認
      await expect(staff1UpdatedCard).toHaveClass(/category-perm/, { timeout: 5000 });
      
      // 時間枠移動が反映されることを確認
      const newTimeSlot = staff1Page.locator('.time-slot')
        .filter({ hasText: SYNC_TEST_DATA.updatedReservation.time });
      await expect(newTimeSlot.locator('.reservation-card')).toBeVisible({ timeout: 5000 });
    });

    test('予約削除の同期', async () => {
      // スタッフ1が予約削除
      const staff1ReservationCard = staff1Page.locator('.reservation-card')
        .filter({ hasText: SYNC_TEST_DATA.staff2Reservation.customerName });
      await staff1ReservationCard.click();
      
      const modal = staff1Page.locator('.reservation-modal');
      await modal.locator('button[data-testid="delete-btn"]').click();
      
      const confirmDialog = staff1Page.locator('.confirm-dialog');
      await confirmDialog.locator('button[data-testid="confirm-delete"]').click();
      
      // スタッフ2の画面から予約が消えることを確認
      const staff2ReservationCard = staff2Page.locator('.reservation-card')
        .filter({ hasText: SYNC_TEST_DATA.staff2Reservation.customerName });
      await expect(staff2ReservationCard).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('同期パフォーマンス', () => {
    
    test('同期遅延時間測定 (100ms以内目標)', async () => {
      const testReservation = {
        customerName: '同期速度テスト',
        date: '2024-12-26',
        time: '11:00',
        category: 'cut'
      };
      
      // 同期開始時間記録
      const syncStartTime = Date.now();
      
      // スタッフ1が予約作成
      await createReservation(staff1Page, testReservation);
      
      // スタッフ2で反映されるまでの時間測定
      const staff2Card = staff2Page.locator('.reservation-card')
        .filter({ hasText: testReservation.customerName });
      
      await expect(staff2Card).toBeVisible();
      const syncEndTime = Date.now();
      
      const syncDelay = syncEndTime - syncStartTime;
      console.log(`同期遅延時間: ${syncDelay}ms`);
      
      // 目標の100ms以内か確認 (現実的には500ms以内を許容)
      expect(syncDelay).toBeLessThan(500);
    });

    test('大量データ同期時のパフォーマンス', async () => {
      // 10件の予約を短時間で作成
      const reservations = Array.from({ length: 10 }, (_, i) => ({
        customerName: `大量同期テスト${i + 1}`,
        date: '2024-12-27',
        time: `${9 + i}:00`,
        category: ['cut', 'color', 'perm'][i % 3]
      }));
      
      const startTime = Date.now();
      
      // 並列で予約作成
      for (const reservation of reservations) {
        await createReservation(staff1Page, reservation, false); // 完了待機なし
      }
      
      // 全ての予約がスタッフ2に同期されることを確認
      for (const reservation of reservations) {
        const card = staff2Page.locator('.reservation-card')
          .filter({ hasText: reservation.customerName });
        await expect(card).toBeVisible({ timeout: 10000 });
      }
      
      const endTime = Date.now();
      const totalSyncTime = endTime - startTime;
      
      console.log(`10件予約の総同期時間: ${totalSyncTime}ms`);
      
      // 10秒以内で全て同期されることを確認
      expect(totalSyncTime).toBeLessThan(10000);
    });
  });

  test.describe('同時編集競合処理', () => {
    
    test('同一予約の同時編集競合検出', async () => {
      // テスト用予約を作成
      const conflictTestReservation = {
        customerName: '競合テスト',
        date: '2024-12-26',
        time: '13:00',
        category: 'cut'
      };
      
      await createReservation(staff1Page, conflictTestReservation);
      
      // 両方のスタッフが同時に同じ予約を編集開始
      const staff1Card = staff1Page.locator('.reservation-card')
        .filter({ hasText: conflictTestReservation.customerName });
      const staff2Card = staff2Page.locator('.reservation-card')
        .filter({ hasText: conflictTestReservation.customerName }); 
      
      // 同時クリック
      await Promise.all([
        staff1Card.click(),
        staff2Card.click()
      ]);
      
      const staff1Modal = staff1Page.locator('.reservation-modal');
      const staff2Modal = staff2Page.locator('.reservation-modal');
      
      // 両方のモーダルが開いていることを確認
      await expect(staff1Modal).toBeVisible();
      await expect(staff2Modal).toBeVisible();
      
      // スタッフ1が先に保存
      await staff1Modal.locator('select[data-testid="time-select"]').selectOption('13:30');
      await staff1Modal.locator('button[data-testid="update-btn"]').click();
      
      // スタッフ2が後で異なる変更を保存試行
      await staff2Modal.locator(`button[data-category="color"]`).click();
      await staff2Modal.locator('button[data-testid="update-btn"]').click();
      
      // 競合ダイアログまたは警告が表示されることを確認
      const conflictDialog = staff2Page.locator('.conflict-dialog, .conflict-warning, .error-message');
      await expect(conflictDialog).toBeVisible({ timeout: 3000 });
      
      // 競合解決オプションが提示されることを確認
      const conflictMessage = await conflictDialog.textContent();
      expect(conflictMessage).toMatch(/競合|conflict|他のスタッフ|編集中/i);
    });

    test('競合解決後の同期確認', async () => {
      // 競合解決テスト用予約作成
      const resolveTestReservation = {
        customerName: '競合解決テスト',
        date: '2024-12-26',
        time: '14:00',
        category: 'cut'
      };
      
      await createReservation(staff1Page, resolveTestReservation);
      
      // スタッフ1が編集
      const staff1Card = staff1Page.locator('.reservation-card')
        .filter({ hasText: resolveTestReservation.customerName });
      await staff1Card.click();
      
      const staff1Modal = staff1Page.locator('.reservation-modal');
      await staff1Modal.locator('select[data-testid="time-select"]').selectOption('14:30');
      await staff1Modal.locator('button[data-testid="update-btn"]').click();
      
      // 保存完了を待機
      await expect(staff1Page.locator('.success-message')).toBeVisible();
      
      // スタッフ2の画面で最新状態が反映されることを確認
      const staff2Card = staff2Page.locator('.reservation-card')
        .filter({ hasText: resolveTestReservation.customerName });
      
      // 新しい時間枠に移動していることを確認
      const newTimeSlot = staff2Page.locator('.time-slot')
        .filter({ hasText: '14:30' });
      await expect(newTimeSlot.locator('.reservation-card')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('デバイス間UI適応', () => {
    
    test('PC・タブレット画面での同期表示確認', async () => {
      // タッチターゲットサイズの確認
      const staff2TouchButton = staff2Page.locator('button[data-testid="new-reservation-btn"]');
      const buttonBox = await staff2TouchButton.boundingBox();
      
      // タブレット用のタッチターゲットサイズ (44px以上) を確認
      expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      
      // 予約作成して両画面で表示確認
      const deviceTestReservation = {
        customerName: 'デバイステスト',
        date: '2024-12-26',
        time: '15:00',
        category: 'color'
      };
      
      await createReservation(staff2Page, deviceTestReservation);
      
      // PC画面 (staff1) で正常表示確認
      const pcCard = staff1Page.locator('.reservation-card')
        .filter({ hasText: deviceTestReservation.customerName });
      await expect(pcCard).toBeVisible();
      
      // タブレット画面 (staff2) で正常表示確認
      const tabletCard = staff2Page.locator('.reservation-card')
        .filter({ hasText: deviceTestReservation.customerName });
      await expect(tabletCard).toBeVisible();
    });

    test('レスポンシブ同期とタッチ操作', async () => {
      // タブレットでのタッチ操作
      const touchTestReservation = {
        customerName: 'タッチ操作テスト',
        date: '2024-12-26', 
        time: '16:00',
        category: 'perm'
      };
      
      // タブレット (staff2) でタッチ操作として予約作成
      await staff2Page.locator('button[data-testid="new-reservation-btn"]').tap();
      const modal = staff2Page.locator('.reservation-modal');
      
      await modal.locator('input[data-testid="customer-name"]').fill(touchTestReservation.customerName);
      await modal.locator('select[data-testid="time-select"]').selectOption(touchTestReservation.time);
      await modal.locator(`button[data-category="${touchTestReservation.category}"]`).tap();
      await modal.locator('button[data-testid="save-btn"]').tap();
      
      // PC画面で同期確認
      const pcCard = staff1Page.locator('.reservation-card')
        .filter({ hasText: touchTestReservation.customerName });
      await expect(pcCard).toBeVisible({ timeout: 5000 });
      await expect(pcCard).toHaveClass(/category-perm/);
    });
  });

  test.describe('ネットワーク状況での同期', () => {
    
    test('一時的なネットワーク切断からの復旧同期', async () => {
      // スタッフ2のネットワークを切断
      await context2.setOffline(true);
      
      // オフライン状態でスタッフ2が予約作成試行
      const offlineReservation = {
        customerName: 'オフライン作成テスト',
        date: '2024-12-26',
        time: '17:00', 
        category: 'cut'
      };
      
      await createReservation(staff2Page, offlineReservation, false);
      
      // オフライン表示が出ることを確認
      const offlineBanner = staff2Page.locator('.offline-banner, .offline-warning');
      await expect(offlineBanner).toBeVisible({ timeout: 3000 });
      
      // ネットワーク復旧
      await context2.setOffline(false);
      
      // 自動同期でスタッフ1に反映されることを確認
      const staff1Card = staff1Page.locator('.reservation-card')
        .filter({ hasText: offlineReservation.customerName });
      await expect(staff1Card).toBeVisible({ timeout: 10000 });
    });

    test('低速ネットワークでの同期品質', async () => {
      // 低速ネットワーク条件をシミュレート
      await context1.route('**/*', async route => {
        // 500ms遅延を追加
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });
      
      const slowNetworkReservation = {
        customerName: '低速ネットワークテスト',
        date: '2024-12-26',
        time: '18:00',
        category: 'color'
      };
      
      const startTime = Date.now();
      await createReservation(staff1Page, slowNetworkReservation);
      
      // スタッフ2での同期確認
      const staff2Card = staff2Page.locator('.reservation-card')
        .filter({ hasText: slowNetworkReservation.customerName });
      await expect(staff2Card).toBeVisible({ timeout: 15000 });
      
      const endTime = Date.now();
      const syncTime = endTime - startTime;
      
      console.log(`低速ネットワーク同期時間: ${syncTime}ms`);
      
      // 15秒以内での同期を確認
      expect(syncTime).toBeLessThan(15000);
    });
  });
});

/**
 * 予約作成ヘルパー関数
 */
async function createReservation(page: Page, reservationData: any, waitForCompletion: boolean = true) {
  await page.locator('button[data-testid="new-reservation-btn"]').click();
  const modal = page.locator('.reservation-modal');
  
  await modal.locator('input[data-testid="customer-name"]').fill(reservationData.customerName);
  if (reservationData.customerPhone) {
    await modal.locator('input[data-testid="customer-phone"]').fill(reservationData.customerPhone);
  }
  await modal.locator('input[data-testid="date-input"]').fill(reservationData.date);
  await modal.locator('select[data-testid="time-select"]').selectOption(reservationData.time);
  await modal.locator(`button[data-category="${reservationData.category}"]`).click();
  
  if (reservationData.details) {
    await modal.locator('textarea[data-testid="details-input"]').fill(reservationData.details);
  }
  
  await modal.locator('button[data-testid="save-btn"]').click();
  
  if (waitForCompletion) {
    // 作成完了を待機
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(modal).not.toBeVisible();
  }
}