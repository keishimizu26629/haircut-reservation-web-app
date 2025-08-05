/**
 * Playwright E2Eテスト: シンプル予約管理アプリ - 基本予約フロー
 * 
 * テスト対象: 予約の作成・編集・削除・ステータス管理の基本フロー
 * 優先度: 最優先 (Phase 1 - 4時間以内完了目標)
 * 
 * @description 美容室スタッフが日常的に行う予約操作の完全テスト
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// テストデータ定義
const TEST_DATA = {
  reservation: {
    customerName: '田中 花子',
    customerPhone: '090-1234-5678',
    date: '2024-12-26', // 明日の日付 (テスト実行日に応じて調整)
    time: '10:00',
    category: 'cut',
    details: 'カット+シャンプー希望。前回と同じ長さで。'
  },
  updatedReservation: {
    customerName: '田中 花子',
    customerPhone: '090-1234-5678', 
    date: '2024-12-26',
    time: '10:30', // 時間変更
    category: 'color', // カテゴリー変更
    details: 'カット+カラー希望。明るめの茶色で。'
  }
};

test.describe('シンプル予約管理アプリ - 基本予約フロー', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // テスト用ブラウザコンテキスト作成
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo'
    });
    
    page = await context.newPage();
    
    // テスト環境URLに移動 (環境に応じて調整)
    await page.goto('http://localhost:3000/calendar-demo');
    
    // 初期ロード完了まで待機
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.calendar-container')).toBeVisible();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('新規予約作成フロー', () => {
    
    test('空の時間枠クリックで新規予約モーダルが開く', async () => {
      // 10:00の空き時間枠をクリック
      const timeSlot = page.locator('.time-slot').filter({ hasText: '10:00' }).first();
      await timeSlot.click();
      
      // モーダルが表示されることを確認
      const modal = page.locator('.reservation-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('.modal-title')).toContainText('新規予約');
      
      // 時間が自動選択されていることを確認
      const timeSelect = modal.locator('select[data-testid="time-select"]');
      await expect(timeSelect).toHaveValue('10:00');
    });

    test('必須項目入力で予約作成成功', async () => {
      // 新規予約モーダルを開く
      await page.locator('button[data-testid="new-reservation-btn"]').click();
      const modal = page.locator('.reservation-modal');
      
      // 必須項目を入力
      await modal.locator('input[data-testid="customer-name"]').fill(TEST_DATA.reservation.customerName);
      await modal.locator('input[data-testid="customer-phone"]').fill(TEST_DATA.reservation.customerPhone);
      await modal.locator('input[data-testid="date-input"]').fill(TEST_DATA.reservation.date);
      await modal.locator('select[data-testid="time-select"]').selectOption(TEST_DATA.reservation.time);
      
      // カテゴリー選択 (カット)
      await modal.locator(`button[data-category="${TEST_DATA.reservation.category}"]`).click();
      
      // 詳細情報入力
      await modal.locator('textarea[data-testid="details-input"]').fill(TEST_DATA.reservation.details);
      
      // 保存ボタンクリック
      await modal.locator('button[data-testid="save-btn"]').click();
      
      // 成功メッセージ確認
      await expect(page.locator('.success-message')).toContainText('予約を作成しました');
      
      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible();
      
      // カレンダーに予約が表示されることを確認
      const reservationCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await expect(reservationCard).toBeVisible();
      await expect(reservationCard).toHaveClass(/category-cut/);
    });

    test('必須項目未入力時のバリデーションエラー表示', async () => {
      // 新規予約モーダルを開く
      await page.locator('button[data-testid="new-reservation-btn"]').click();
      const modal = page.locator('.reservation-modal');
      
      // 何も入力せずに保存ボタンクリック
      await modal.locator('button[data-testid="save-btn"]').click();
      
      // エラーメッセージ確認
      await expect(modal.locator('.error-message')).toContainText('お名前を入力してください');
      await expect(modal.locator('.error-message')).toContainText('カテゴリーを選択してください');
      
      // モーダルは開いたまま
      await expect(modal).toBeVisible();
    });

    test('過去日付選択時のバリデーションエラー', async () => {
      await page.locator('button[data-testid="new-reservation-btn"]').click();
      const modal = page.locator('.reservation-modal');
      
      // 過去の日付を入力
      await modal.locator('input[data-testid="date-input"]').fill('2023-01-01');
      await modal.locator('button[data-testid="save-btn"]').click();
      
      // エラーメッセージ確認
      await expect(modal.locator('.error-message')).toContainText('過去の日付は選択できません');
    });
  });

  test.describe('予約編集フロー', () => {
    
    test.beforeEach(async () => {
      // テスト用予約を事前作成
      await createTestReservation(page, TEST_DATA.reservation);
    });

    test('既存予約クリックで編集モーダルが開く', async () => {
      // 作成した予約カードをクリック
      const reservationCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await reservationCard.click();
      
      // 編集モーダルが表示されることを確認
      const modal = page.locator('.reservation-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('.modal-title')).toContainText('予約編集');
      
      // 既存データが入力されていることを確認
      await expect(modal.locator('input[data-testid="customer-name"]')).toHaveValue(TEST_DATA.reservation.customerName);
      await expect(modal.locator('select[data-testid="time-select"]')).toHaveValue(TEST_DATA.reservation.time);
    });

    test('予約情報更新成功', async () => {
      // 予約を編集モードで開く
      const reservationCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await reservationCard.click();
      const modal = page.locator('.reservation-modal');
      
      // 時間とカテゴリーを変更
      await modal.locator('select[data-testid="time-select"]').selectOption(TEST_DATA.updatedReservation.time);
      await modal.locator(`button[data-category="${TEST_DATA.updatedReservation.category}"]`).click();
      await modal.locator('textarea[data-testid="details-input"]').fill(TEST_DATA.updatedReservation.details);
      
      // 更新ボタンクリック
      await modal.locator('button[data-testid="update-btn"]').click();
      
      // 成功メッセージ確認
      await expect(page.locator('.success-message')).toContainText('予約を更新しました');
      
      // カレンダーで変更が反映されていることを確認
      const updatedCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await expect(updatedCard).toHaveClass(/category-color/);
      
      // 時間枠が移動していることを確認
      const newTimeSlot = page.locator('.time-slot').filter({ hasText: TEST_DATA.updatedReservation.time });
      await expect(newTimeSlot.locator('.reservation-card')).toBeVisible();
    });

    test('ステータス変更フロー', async () => {
      const reservationCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await reservationCard.click();
      const modal = page.locator('.reservation-modal');
      
      // ステータスを「確認済み」に変更
      await modal.locator('select[data-testid="status-select"]').selectOption('confirmed');
      await modal.locator('button[data-testid="update-btn"]').click();
      
      // ステータス表示の変更確認
      await expect(page.locator('.success-message')).toContainText('予約を更新しました');
      
      // 予約カードのステータス表示確認
      await expect(reservationCard.locator('.status-indicator')).toHaveClass(/status-confirmed/);
    });
  });

  test.describe('予約削除フロー', () => {
    
    test.beforeEach(async () => {
      await createTestReservation(page, TEST_DATA.reservation);
    });

    test('削除確認ダイアログ表示と削除実行', async () => {
      // 予約を編集モードで開く
      const reservationCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await reservationCard.click();
      const modal = page.locator('.reservation-modal');
      
      // 削除ボタンクリック
      await modal.locator('button[data-testid="delete-btn"]').click();
      
      // 確認ダイアログ表示確認
      const confirmDialog = page.locator('.confirm-dialog');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText('本当に削除しますか？');
      await expect(confirmDialog).toContainText(TEST_DATA.reservation.customerName);
      
      // 削除実行
      await confirmDialog.locator('button[data-testid="confirm-delete"]').click();
      
      // 成功メッセージ確認
      await expect(page.locator('.success-message')).toContainText('予約を削除しました');
      
      // カレンダーから予約が消えていることを確認
      await expect(page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName })).not.toBeVisible();
    });

    test('削除キャンセル', async () => {
      const reservationCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await reservationCard.click();
      const modal = page.locator('.reservation-modal');
      
      await modal.locator('button[data-testid="delete-btn"]').click();
      
      // キャンセルボタンクリック
      const confirmDialog = page.locator('.confirm-dialog');
      await confirmDialog.locator('button[data-testid="cancel-delete"]').click();
      
      // ダイアログが閉じることを確認
      await expect(confirmDialog).not.toBeVisible();
      
      // 予約が残っていることを確認
      await expect(reservationCard).toBeVisible();
    });
  });

  test.describe('カテゴリー色分け表示', () => {
    
    test('各カテゴリーの色分け表示確認', async () => {
      const categories = [
        { name: 'cut', color: '#FFE4E1', label: 'カット' },
        { name: 'color', color: '#E0E4FF', label: 'カラー' },
        { name: 'perm', color: '#E4FFE0', label: 'パーマ' },
        { name: 'straight', color: '#FFF0E4', label: 'ストレート' },
        { name: 'other', color: '#F0E4FF', label: 'その他' }
      ];
      
      for (const category of categories) {
        // 各カテゴリーの予約を作成
        await createTestReservation(page, {
          ...TEST_DATA.reservation,
          customerName: `${category.label}テスト`,
          time: `${10 + categories.indexOf(category)}:00`,
          category: category.name
        });
        
        // 色分け表示確認
        const reservationCard = page.locator('.reservation-card').filter({ hasText: `${category.label}テスト` });
        await expect(reservationCard).toHaveClass(new RegExp(`category-${category.name}`));
        
        // 背景色確認 (CSS computed styleで検証)
        const backgroundColor = await reservationCard.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        // RGB値に変換して近似比較 (ブラウザによる色表現の差異を考慮)
        expect(backgroundColor).toMatch(/rgb\(\s*255,\s*228,\s*225\s*\)|rgb\(\s*224,\s*228,\s*255\s*\)|rgb\(\s*228,\s*255,\s*224\s*\)|rgb\(\s*255,\s*240,\s*228\s*\)|rgb\(\s*240,\s*228,\s*255\s*\)/);
      }
    });
  });

  test.describe('パフォーマンス要件検証', () => {
    
    test('予約作成操作のレスポンス時間 (500ms以内)', async () => {
      const startTime = Date.now();
      
      // 新規予約作成操作
      await page.locator('button[data-testid="new-reservation-btn"]').click();
      const modal = page.locator('.reservation-modal');
      
      await modal.locator('input[data-testid="customer-name"]').fill('パフォーマンステスト');
      await modal.locator('select[data-testid="time-select"]').selectOption('14:00');
      await modal.locator('button[data-category="cut"]').click();
      await modal.locator('button[data-testid="save-btn"]').click();
      
      // 成功メッセージが表示されるまでの時間を測定
      await expect(page.locator('.success-message')).toBeVisible();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 500ms以内の要件確認
      expect(responseTime).toBeLessThan(500);
      console.log(`予約作成レスポンス時間: ${responseTime}ms`);
    });

    test('予約編集操作のレスポンス時間 (500ms以内)', async () => {
      // テスト用予約を事前作成
      await createTestReservation(page, TEST_DATA.reservation);
      
      const startTime = Date.now();
      
      // 予約編集操作
      const reservationCard = page.locator('.reservation-card').filter({ hasText: TEST_DATA.reservation.customerName });
      await reservationCard.click();
      const modal = page.locator('.reservation-modal');
      
      await modal.locator('select[data-testid="time-select"]').selectOption('15:00');
      await modal.locator('button[data-testid="update-btn"]').click();
      
      await expect(page.locator('.success-message')).toBeVisible();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500);
      console.log(`予約編集レスポンス時間: ${responseTime}ms`);
    });
  });

  test.describe('エラーハンドリング', () => {
    
    test('重複時間の予約作成エラー', async () => {
      // 最初の予約を作成
      await createTestReservation(page, TEST_DATA.reservation);
      
      // 同じ時間に別の予約を作成試行
      await page.locator('button[data-testid="new-reservation-btn"]').click();
      const modal = page.locator('.reservation-modal');
      
      await modal.locator('input[data-testid="customer-name"]').fill('重複テスト');
      await modal.locator('input[data-testid="date-input"]').fill(TEST_DATA.reservation.date);
      await modal.locator('select[data-testid="time-select"]').selectOption(TEST_DATA.reservation.time);
      await modal.locator('button[data-category="cut"]').click();
      await modal.locator('button[data-testid="save-btn"]').click();
      
      // 競合エラーメッセージ確認
      await expect(modal.locator('.error-message')).toContainText('時間が重複しています');
      await expect(modal.locator('.error-message')).toContainText(TEST_DATA.reservation.customerName);
    });

    test('ネットワークエラー時の表示', async () => {
      // ネットワークを無効化
      await context.setOffline(true);
      
      // 予約作成を試行
      await page.locator('button[data-testid="new-reservation-btn"]').click();
      const modal = page.locator('.reservation-modal');
      
      await modal.locator('input[data-testid="customer-name"]').fill('ネットワークエラーテスト');
      await modal.locator('select[data-testid="time-select"]').selectOption('16:00');
      await modal.locator('button[data-category="cut"]').click();
      await modal.locator('button[data-testid="save-btn"]').click();
      
      // オフライン表示確認
      await expect(page.locator('.offline-banner')).toBeVisible();
      await expect(page.locator('.offline-banner')).toContainText('オフライン状態です');
      
      // ネットワークを復元
      await context.setOffline(false);
      
      // 自動同期確認
      await expect(page.locator('.offline-banner')).not.toBeVisible();
    });
  });
});

/**
 * テスト用予約作成ヘルパー関数
 */
async function createTestReservation(page: Page, reservationData: any) {
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
  
  // 作成完了を待機
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(modal).not.toBeVisible();
}