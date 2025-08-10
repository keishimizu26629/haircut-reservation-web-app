import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// パフォーマンステスト用設定
const PERFORMANCE_CONFIG = {
  FIRESTORE_EMULATOR_HOST: 'localhost:8080',
  AUTH_EMULATOR_HOST: 'localhost:9099',
  MAX_ACCEPTABLE_LOAD_TIME: 3000, // 3秒
  MAX_ACCEPTABLE_SYNC_TIME: 2000,  // 2秒
  BULK_DATA_SIZE: 100,
  CONCURRENT_USERS: 5
};

// パフォーマンス測定用のメトリクス
interface PerformanceMetrics {
  loadTime: number;
  syncTime: number;
  memoryUsage: number;
  networkRequests: number;
}

test.describe('Firebase Performance Tests', () => {
  let mainContext: BrowserContext;
  let mainPage: Page;

  test.beforeAll(async ({ browser }) => {
    mainContext = await browser.newContext({
      // パフォーマンス監視用の設定
      recordVideo: { dir: 'test-results/performance-videos/' },
      recordHar: { path: 'test-results/performance-har/' }
    });

    mainPage = await mainContext.newPage();

    // Firebase Emulator環境変数設定
    await mainPage.addInitScript(`
      window.FIRESTORE_EMULATOR_HOST = '${PERFORMANCE_CONFIG.FIRESTORE_EMULATOR_HOST}';
      window.FIREBASE_AUTH_EMULATOR_HOST = '${PERFORMANCE_CONFIG.AUTH_EMULATOR_HOST}';
      
      // パフォーマンス監視用のインストルメンテーション
      window.performanceMetrics = {
        startTime: 0,
        loadTime: 0,
        syncTime: 0,
        networkRequests: 0
      };
      
      // ネットワークリクエスト数をカウント
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        window.performanceMetrics.networkRequests++;
        return originalFetch.apply(this, args);
      };
    `);
  });

  test.afterAll(async () => {
    await mainContext?.close();
  });

  test.beforeEach(async () => {
    // 管理者としてログイン
    await mainPage.goto('/login');
    await mainPage.fill('[data-testid="email-input"]', 'admin@example.com');
    await mainPage.fill('[data-testid="password-input"]', 'password123');
    
    // ログイン時間測定開始
    const loginStartTime = Date.now();
    await mainPage.click('[data-testid="login-button"]');
    await mainPage.waitForSelector('[data-testid="user-menu"]');
    const loginEndTime = Date.now();

    console.log(`ログイン時間: ${loginEndTime - loginStartTime}ms`);
  });

  test('初期ページ読み込みパフォーマンス', async () => {
    const metrics = await measurePageLoadPerformance(mainPage, '/reservations');

    // パフォーマンス要件の確認
    expect(metrics.loadTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_ACCEPTABLE_LOAD_TIME);
    
    console.log('📊 初期ページ読み込みメトリクス:', metrics);
    expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB以下
  });

  test('大量データ読み込みパフォーマンス', async () => {
    // 大量の予約データを事前作成
    await createBulkTestData(mainPage, PERFORMANCE_CONFIG.BULK_DATA_SIZE);

    // 大量データ表示の測定
    const startTime = Date.now();
    await mainPage.goto('/reservations');
    
    // 全ての予約データが表示されるまで待機
    await mainPage.waitForSelector(`[data-testid="reservation-list"]`);
    await mainPage.waitForFunction(() => {
      const reservationElements = document.querySelectorAll('[data-testid^="reservation-"]');
      return reservationElements.length >= 50; // 最低50件表示
    }, { timeout: 15000 });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(10000); // 10秒以内
    console.log(`大量データ読み込み時間: ${loadTime}ms`);
  });

  test('リアルタイム同期パフォーマンス', async () => {
    // 複数コンテキストでの同期速度測定
    const contexts = await Promise.all(
      Array.from({ length: PERFORMANCE_CONFIG.CONCURRENT_USERS }, async (_, index) => {
        const context = await mainContext.browser()!.newContext();
        const page = await context.newPage();
        
        await page.addInitScript(`
          window.FIRESTORE_EMULATOR_HOST = '${PERFORMANCE_CONFIG.FIRESTORE_EMULATOR_HOST}';
          window.FIREBASE_AUTH_EMULATOR_HOST = '${PERFORMANCE_CONFIG.AUTH_EMULATOR_HOST}';
        `);
        
        return { context, page, id: `user-${index}` };
      })
    );

    try {
      // 全ユーザーをログインさせ、予約画面に移動
      await Promise.all(contexts.map(async ({ page }) => {
        await loginUser(page, 'staff1@example.com', 'password123');
        await page.goto('/reservations');
        await page.waitForSelector('[data-testid="reservation-calendar"]');
      }));

      // 同期パフォーマンステスト実行
      const syncStartTime = Date.now();
      
      // 1番目のユーザーが予約作成
      await createReservation(contexts[0].page, {
        date: '2024-12-25',
        timeSlot: '14:00',
        content: '同期パフォーマンステスト',
        category: 'cut'
      });

      // 他の全ユーザーで同期を確認
      await Promise.all(contexts.slice(1).map(({ page }) =>
        page.waitForSelector('[data-testid="reservation-14:00"]', { timeout: 5000 })
      ));

      const syncEndTime = Date.now();
      const syncTime = syncEndTime - syncStartTime;

      expect(syncTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_ACCEPTABLE_SYNC_TIME);
      console.log(`${PERFORMANCE_CONFIG.CONCURRENT_USERS}ユーザー同期時間: ${syncTime}ms`);

    } finally {
      // コンテキストクリーンアップ
      await Promise.all(contexts.map(({ context }) => context.close()));
    }
  });

  test('メモリリークテスト', async () => {
    const initialMemory = await getMemoryUsage(mainPage);
    
    // 大量の操作を実行（メモリリーク検出）
    for (let i = 0; i < 20; i++) {
      await mainPage.goto('/reservations');
      await createReservation(mainPage, {
        date: '2024-12-26',
        timeSlot: `${String(9 + (i % 10)).padStart(2, '0')}:00`,
        content: `メモリテスト予約 ${i}`,
        category: 'cut'
      });
      
      // DOM要素のクリーンアップ確認
      await mainPage.reload();
      await mainPage.waitForSelector('[data-testid="reservation-calendar"]');
    }

    const finalMemory = await getMemoryUsage(mainPage);
    const memoryIncrease = finalMemory - initialMemory;

    // メモリ増加が20MB以下であることを確認
    expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    console.log(`メモリ使用量増加: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  });

  test('ネットワーク効率性テスト', async () => {
    // ネットワークリクエスト数を監視
    const networkRequests: any[] = [];
    
    mainPage.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        size: request.postDataBuffer()?.length || 0
      });
    });

    await mainPage.goto('/reservations');
    await mainPage.waitForSelector('[data-testid="reservation-calendar"]');

    // 予約を5件作成
    for (let i = 0; i < 5; i++) {
      await createReservation(mainPage, {
        date: '2024-12-27',
        timeSlot: `${String(10 + i).padStart(2, '0')}:00`,
        content: `ネットワークテスト予約 ${i}`,
        category: 'cut'
      });
    }

    // Firebase関連のリクエストのみフィルタ
    const firebaseRequests = networkRequests.filter(req => 
      req.url.includes('firestore') || req.url.includes('firebase')
    );

    // 効率性の確認（不必要な重複リクエストがないか）
    expect(firebaseRequests).toHaveLength.lessThan(50); // 50リクエスト以下
    
    console.log(`Firebase関連ネットワークリクエスト数: ${firebaseRequests.length}`);
  });

  test('同時接続負荷テスト', async () => {
    const LOAD_TEST_USERS = 10;
    const startTime = Date.now();

    // 大量の同時接続を作成
    const loadPromises = Array.from({ length: LOAD_TEST_USERS }, async (_, index) => {
      const context = await mainContext.browser()!.newContext();
      const page = await context.newPage();
      
      try {
        await page.addInitScript(`
          window.FIRESTORE_EMULATOR_HOST = '${PERFORMANCE_CONFIG.FIRESTORE_EMULATOR_HOST}';
        `);
        
        await loginUser(page, `staff${(index % 3) + 1}@example.com`, 'password123');
        await page.goto('/reservations');
        
        // 各ユーザーが予約を作成
        await createReservation(page, {
          date: '2024-12-28',
          timeSlot: `${String(9 + (index % 11)).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`,
          content: `負荷テスト予約 User${index}`,
          category: ['cut', 'color', 'perm'][index % 3] as 'cut' | 'color' | 'perm'
        });
        
        return { success: true, userId: index };
      } catch (error) {
        return { success: false, userId: index, error };
      } finally {
        await context.close();
      }
    });

    const results = await Promise.allSettled(loadPromises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    // 80%以上の成功率を要求
    expect(successCount / LOAD_TEST_USERS).toBeGreaterThan(0.8);
    
    // 全体処理時間が60秒以内
    expect(totalTime).toBeLessThan(60000);

    console.log(`負荷テスト結果: ${successCount}/${LOAD_TEST_USERS} 成功 (${totalTime}ms)`);
  });
});

// パフォーマンス測定ヘルパー関数群
async function measurePageLoadPerformance(page: Page, url: string): Promise<PerformanceMetrics> {
  const startTime = Date.now();
  
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  const endTime = Date.now();
  const loadTime = endTime - startTime;

  // ブラウザ内のパフォーマンスメトリクス取得
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      networkRequests: (window as any).performanceMetrics?.networkRequests || 0
    };
  });

  return {
    loadTime,
    syncTime: 0,
    memoryUsage: metrics.memoryUsage,
    networkRequests: metrics.networkRequests
  };
}

async function createBulkTestData(page: Page, count: number): Promise<void> {
  console.log(`📝 ${count}件のテストデータを作成中...`);
  
  const batchSize = 10;
  for (let i = 0; i < count; i += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, count - i) }, (_, batchIndex) => {
      const index = i + batchIndex;
      return {
        date: '2024-12-30',
        timeSlot: `${String(9 + (index % 11)).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`,
        content: `パフォーマンステスト予約 ${index + 1}`,
        category: ['cut', 'color', 'perm'][index % 3] as 'cut' | 'color' | 'perm',
        status: 'active'
      };
    });

    // バッチ作成をAPIで実行
    await page.evaluate(async (reservations) => {
      await Promise.all(reservations.map(async (reservation) => {
        const response = await fetch('/.netlify/functions/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservation)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
      }));
    }, batch);

    // レート制限を回避するため少し待機
    await page.waitForTimeout(100);
  }
  
  console.log(`✅ ${count}件のテストデータ作成完了`);
}

async function getMemoryUsage(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
}

async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForSelector('[data-testid="user-menu"]');
}

async function createReservation(page: Page, reservation: any): Promise<void> {
  await page.click('[data-testid="new-reservation-button"]');
  await page.fill('[data-testid="reservation-date"]', reservation.date);
  await page.selectOption('[data-testid="reservation-time"]', reservation.timeSlot);
  await page.fill('[data-testid="reservation-content"]', reservation.content);
  await page.selectOption('[data-testid="reservation-category"]', reservation.category);
  await page.click('[data-testid="save-reservation"]');
  await page.waitForSelector('[data-testid="save-success"]', { timeout: 5000 });
}