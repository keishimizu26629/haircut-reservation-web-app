/**
 * Playwright E2Eテスト: シンプル予約管理アプリ - 色分け表示検証
 * 
 * テスト対象: カテゴリー別色分け表示とアクセシビリティ
 * 優先度: 高 (Phase 1 - 4時間以内完了目標)
 * 
 * @description 美容室スタッフの視覚的判別能力向上のための色分けシステムテスト
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// カテゴリー色定義 (仕様書から)
const COLOR_SCHEME = {
  cut: {
    name: 'カット',
    backgroundColor: '#FFE4E1', // 淡いピンク
    borderColor: '#FF69B4',
    icon: '✂️',
    cssClass: 'category-cut'
  },
  color: {
    name: 'カラー', 
    backgroundColor: '#E0E4FF', // 淡い青
    borderColor: '#4169E1',
    icon: '🎨',
    cssClass: 'category-color'
  },
  perm: {
    name: 'パーマ',
    backgroundColor: '#E4FFE0', // 淡い緑
    borderColor: '#32CD32',
    icon: '〰️',
    cssClass: 'category-perm'
  },
  straight: {
    name: 'ストレート',
    backgroundColor: '#FFF0E4', // 淡いオレンジ
    borderColor: '#FFA500',
    icon: '💧',
    cssClass: 'category-straight'
  },
  other: {
    name: 'その他',
    backgroundColor: '#F0E4FF', // 淡い紫
    borderColor: '#9370DB', 
    icon: '⚪',
    cssClass: 'category-other'
  }
};

// RGB色変換ヘルパー
function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// 色の近似比較 (ブラウザの色表現差異を考慮)
function isColorApproximate(actual: string, expected: string, tolerance: number = 10): boolean {
  const actualRgb = actual.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const expectedRgb = hexToRgb(expected);
  
  if (!actualRgb) return false;
  
  const actualR = parseInt(actualRgb[1]);
  const actualG = parseInt(actualRgb[2]);
  const actualB = parseInt(actualRgb[3]);
  
  return Math.abs(actualR - expectedRgb.r) <= tolerance &&
         Math.abs(actualG - expectedRgb.g) <= tolerance &&
         Math.abs(actualB - expectedRgb.b) <= tolerance;
}

test.describe('シンプル予約管理アプリ - 色分け表示検証', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo'
    });
    
    page = await context.newPage();
    await page.goto('http://localhost:3000/calendar-demo');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.calendar-container')).toBeVisible();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('基本色分け表示', () => {
    
    test('全カテゴリーの色分け表示確認', async () => {
      // 各カテゴリーの予約を作成してテスト
      for (const [categoryKey, categoryData] of Object.entries(COLOR_SCHEME)) {
        const testReservation = {
          customerName: `${categoryData.name}テスト`,
          date: '2024-12-26',
          time: `${9 + Object.keys(COLOR_SCHEME).indexOf(categoryKey)}:00`,
          category: categoryKey
        };
        
        // 予約作成
        await createReservationForColorTest(page, testReservation);
        
        // 作成した予約カードを取得
        const reservationCard = page.locator('.reservation-card')
          .filter({ hasText: testReservation.customerName });
        
        // CSS クラスの確認
        await expect(reservationCard).toHaveClass(new RegExp(categoryData.cssClass));
        
        // 背景色の確認 (計算済みスタイル)
        const backgroundColor = await reservationCard.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        // 色の近似チェック
        const isCorrectColor = isColorApproximate(backgroundColor, categoryData.backgroundColor);
        expect(isCorrectColor).toBeTruthy();
        
        console.log(`${categoryData.name}: 期待色=${categoryData.backgroundColor}, 実際=${backgroundColor}`);
      }
    });

    test('アイコン表示確認', async () => {
      // 各カテゴリーのアイコン表示をテスト
      for (const [categoryKey, categoryData] of Object.entries(COLOR_SCHEME)) {
        const testReservation = {
          customerName: `アイコンテスト${categoryData.name}`,
          date: '2024-12-26',
          time: `${14 + Object.keys(COLOR_SCHEME).indexOf(categoryKey)}:00`,
          category: categoryKey
        };
        
        await createReservationForColorTest(page, testReservation);
        
        const reservationCard = page.locator('.reservation-card')
          .filter({ hasText: testReservation.customerName });
        
        // アイコンまたは絵文字が表示されていることを確認
        const cardContent = await reservationCard.textContent();
        const hasIcon = cardContent?.includes(categoryData.icon) || 
                       await reservationCard.locator('.category-icon').isVisible();
        
        expect(hasIcon).toBeTruthy();
      }
    });

    test('境界線色の確認', async () => {
      for (const [categoryKey, categoryData] of Object.entries(COLOR_SCHEME)) {
        const testReservation = {
          customerName: `境界線テスト${categoryData.name}`,
          date: '2024-12-27',
          time: `${9 + Object.keys(COLOR_SCHEME).indexOf(categoryKey)}:00`,
          category: categoryKey
        };
        
        await createReservationForColorTest(page, testReservation);
        
        const reservationCard = page.locator('.reservation-card')
          .filter({ hasText: testReservation.customerName });
        
        // 境界線またはボーダーの色確認
        const borderColor = await reservationCard.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.borderLeftColor || styles.borderColor;
        });
        
        // 境界線色が適切に設定されていることを確認
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'transparent') {
          const isCorrectBorder = isColorApproximate(borderColor, categoryData.borderColor);
          expect(isCorrectBorder).toBeTruthy();
        }
      }
    });
  });

  test.describe('視覚的区別性テスト', () => {
    
    test('隣接カテゴリーの区別可能性', async () => {
      // 隣接する時間枠に異なるカテゴリーの予約を配置
      const adjacentReservations = [
        { customerName: '区別テスト1', time: '10:00', category: 'cut' },
        { customerName: '区別テスト2', time: '10:30', category: 'color' },
        { customerName: '区別テスト3', time: '11:00', category: 'perm' }
      ];
      
      for (const reservation of adjacentReservations) {
        await createReservationForColorTest(page, {
          ...reservation,
          date: '2024-12-26'
        });
      }
      
      // 各予約カードの背景色を取得
      const colors = [];
      for (const reservation of adjacentReservations) {
        const card = page.locator('.reservation-card')
          .filter({ hasText: reservation.customerName });
        const bgColor = await card.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        colors.push(bgColor);
      }
      
      // 全ての色が異なることを確認
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
      
      console.log('隣接予約の色:', colors);
    });

    test('高コントラストモード対応', async () => {
      // 高コントラストモード設定を有効化
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      // または設定で高コントラストモードを有効化
      await page.evaluate(() => {
        document.documentElement.classList.add('high-contrast-mode');
      });
      
      // テスト予約作成
      const contrastTestReservation = {
        customerName: 'コントラストテスト',
        date: '2024-12-26',
        time: '15:00',
        category: 'cut'
      };
      
      await createReservationForColorTest(page, contrastTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: contrastTestReservation.customerName });
      
      // 高コントラスト時の色確認
      const highContrastBgColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      const textColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).color
      );
      
      // コントラスト比計算 (簡易版)
      expect(highContrastBgColor).not.toBe(textColor);
      console.log(`高コントラスト: 背景=${highContrastBgColor}, 文字=${textColor}`);
    });

    test('色覚異常対応確認', async () => {
      // 色だけでなく形状・パターンでも区別できることをテスト
      for (const [categoryKey, categoryData] of Object.entries(COLOR_SCHEME)) {
        const testReservation = {
          customerName: `色覚テスト${categoryData.name}`,
          date: '2024-12-28',
          time: `${10 + Object.keys(COLOR_SCHEME).indexOf(categoryKey)}:00`,
          category: categoryKey
        };
        
        await createReservationForColorTest(page, testReservation);
        
        const reservationCard = page.locator('.reservation-card')
          .filter({ hasText: testReservation.customerName });
        
        // アイコン・絵文字による区別が可能であることを確認
        const cardText = await reservationCard.textContent();
        expect(cardText).toContain(categoryData.icon);
        
        // CSS クラスによる区別も確認
        await expect(reservationCard).toHaveClass(new RegExp(categoryData.cssClass));
        
        // パターン・境界線による区別確認
        const borderStyle = await reservationCard.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            borderLeftWidth: styles.borderLeftWidth,
            borderLeftStyle: styles.borderLeftStyle
          };
        });
        
        // 境界線が設定されていることを確認
        expect(borderStyle.borderLeftWidth).not.toBe('0px');
      }
    });
  });

  test.describe('レスポンシブ色分け表示', () => {
    
    test('PC画面での色分け表示', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
      
      const pcTestReservation = {
        customerName: 'PC表示テスト',
        date: '2024-12-26',
        time: '16:00',
        category: 'color'
      };
      
      await createReservationForColorTest(page, pcTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: pcTestReservation.customerName });
      
      // PC画面での色とサイズ確認
      const cardBox = await reservationCard.boundingBox();
      expect(cardBox?.width).toBeGreaterThan(100); // PC用の適切なサイズ
      
      const backgroundColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(isColorApproximate(backgroundColor, COLOR_SCHEME.color.backgroundColor)).toBeTruthy();
    });

    test('タブレット画面での色分け表示', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const tabletTestReservation = {
        customerName: 'タブレット表示テスト',
        date: '2024-12-26',
        time: '17:00',
        category: 'perm'
      };
      
      await createReservationForColorTest(page, tabletTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: tabletTestReservation.customerName });
      
      // タブレット画面での表示確認
      const backgroundColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(isColorApproximate(backgroundColor, COLOR_SCHEME.perm.backgroundColor)).toBeTruthy();
      
      // タッチターゲットとしての適切なサイズ確認
      const cardBox = await reservationCard.boundingBox();
      expect(cardBox?.height).toBeGreaterThanOrEqual(44); // タッチターゲット最小サイズ
    });

    test('スマートフォン画面での色分け表示', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileTestReservation = {
        customerName: 'スマホ表示テスト',
        date: '2024-12-26',
        time: '18:00',
        category: 'straight'
      };
      
      await createReservationForColorTest(page, mobileTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: mobileTestReservation.customerName });
      
      // スマートフォン画面での色確認
      const backgroundColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(isColorApproximate(backgroundColor, COLOR_SCHEME.straight.backgroundColor)).toBeTruthy();
      
      // モバイル用タッチターゲットサイズ確認
      const cardBox = await reservationCard.boundingBox();
      expect(cardBox?.height).toBeGreaterThanOrEqual(44);
      expect(cardBox?.width).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('動的色変更テスト', () => {
    
    test('カテゴリー変更時の色更新', async () => {
      // 初期予約作成 (カット)
      const dynamicTestReservation = {
        customerName: '動的色変更テスト',
        date: '2024-12-26',
        time: '12:00',
        category: 'cut'
      };
      
      await createReservationForColorTest(page, dynamicTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: dynamicTestReservation.customerName });
      
      // 初期色確認 (カット - 淡いピンク)
      let backgroundColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(isColorApproximate(backgroundColor, COLOR_SCHEME.cut.backgroundColor)).toBeTruthy();
      
      // カテゴリー変更 (カット → カラー)
      await reservationCard.click();
      const modal = page.locator('.reservation-modal');
      await modal.locator('button[data-category="color"]').click();
      await modal.locator('button[data-testid="update-btn"]').click();
      
      // 成功メッセージ確認
      await expect(page.locator('.success-message')).toBeVisible();
      
      // 変更後の色確認 (カラー - 淡い青)
      backgroundColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(isColorApproximate(backgroundColor, COLOR_SCHEME.color.backgroundColor)).toBeTruthy();
      
      // CSS クラスも更新されていることを確認
      await expect(reservationCard).toHaveClass(/category-color/);
    });

    test('リアルタイム色同期', async () => {
      // 複数ブラウザコンテキストでのテストが必要な場合
      // ここでは単一ページでの動的更新をテスト
      
      const realtimeTestReservation = {
        customerName: 'リアルタイム色テスト',
        date: '2024-12-26',
        time: '13:00',
        category: 'other'
      };
      
      await createReservationForColorTest(page, realtimeTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: realtimeTestReservation.customerName });
      
      // 色の即座反映確認
      const backgroundColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(isColorApproximate(backgroundColor, COLOR_SCHEME.other.backgroundColor)).toBeTruthy();
      
      // アニメーション・トランジション効果確認
      const transitionProperty = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).transitionProperty
      );
      
      // スムーズな色変更のためのトランジション設定確認
      expect(transitionProperty).toMatch(/background|all/);
    });
  });

  test.describe('アクセシビリティ色分け', () => {
    
    test('スクリーンリーダー対応色情報', async () => {
      const a11yTestReservation = {
        customerName: 'アクセシビリティテスト',
        date: '2024-12-26',
        time: '19:00',
        category: 'cut'
      };
      
      await createReservationForColorTest(page, a11yTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: a11yTestReservation.customerName });
      
      // aria-label やデータ属性での色情報提供確認
      const ariaLabel = await reservationCard.getAttribute('aria-label');
      const categoryAttr = await reservationCard.getAttribute('data-category');
      
      expect(categoryAttr).toBe('cut');
      
      // アクセシブルな色情報が含まれていることを確認
      if (ariaLabel) {
        expect(ariaLabel).toMatch(/カット|cut/i);
      }
    });

    test('キーボードナビゲーション時の色表示', async () => {
      const keyboardTestReservation = {
        customerName: 'キーボードテスト',
        date: '2024-12-26',
        time: '20:00',
        category: 'perm'
      };
      
      await createReservationForColorTest(page, keyboardTestReservation);
      
      const reservationCard = page.locator('.reservation-card')
        .filter({ hasText: keyboardTestReservation.customerName });
      
      // キーボードフォーカス時の視覚的フィードバック確認
      await reservationCard.focus();
      
      const focusOutlineColor = await reservationCard.evaluate((el) => 
        window.getComputedStyle(el).outlineColor
      );
      
      // フォーカス時のアウトライン色が適切に設定されていることを確認
      expect(focusOutlineColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(focusOutlineColor).not.toBe('transparent');
    });
  });
});

/**
 * 色分けテスト用予約作成ヘルパー関数
 */
async function createReservationForColorTest(page: Page, reservationData: any) {
  await page.locator('button[data-testid="new-reservation-btn"]').click();
  const modal = page.locator('.reservation-modal');
  
  await modal.locator('input[data-testid="customer-name"]').fill(reservationData.customerName);
  await modal.locator('input[data-testid="date-input"]').fill(reservationData.date);
  await modal.locator('select[data-testid="time-select"]').selectOption(reservationData.time);
  await modal.locator(`button[data-category="${reservationData.category}"]`).click();
  
  await modal.locator('button[data-testid="save-btn"]').click();
  
  // 作成完了を待機
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(modal).not.toBeVisible();
}