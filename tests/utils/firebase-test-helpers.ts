import { Page, BrowserContext } from '@playwright/test';

// Firebase Emulator設定
export const FIREBASE_CONFIG = {
  EMULATOR_HOST: 'localhost',
  FIRESTORE_PORT: 8080,
  AUTH_PORT: 9099,
  UI_PORT: 4000,
  PROJECT_ID: 'simple-reservation-test'
};

// テスト用アカウント情報
export const TEST_ACCOUNTS = {
  ADMIN: {
    email: 'admin@example.com',
    password: 'password123',
    displayName: '管理者',
    role: 'admin'
  },
  STAFF1: {
    email: 'staff1@example.com',
    password: 'password123',
    displayName: 'スタッフ1',
    role: 'staff'
  },
  STAFF2: {
    email: 'staff2@example.com',
    password: 'password123',
    displayName: 'スタッフ2',
    role: 'staff'
  }
};

// 標準的な予約テストデータ
export const TEST_RESERVATIONS = {
  BASIC: {
    date: '2024-12-15',
    timeSlot: '10:30',
    content: 'テスト予約',
    category: 'cut',
    status: 'active'
  },
  ADVANCED: {
    date: '2024-12-16',
    timeSlot: '14:00',
    content: '高度なテスト予約',
    category: 'color',
    status: 'active'
  }
} as const;

/**
 * Firebase Emulator環境の初期化
 */
export async function initializeFirebaseEmulator(page: Page): Promise<void> {
  await page.addInitScript(`
    // Firebase Emulator設定を注入
    window.FIRESTORE_EMULATOR_HOST = '${FIREBASE_CONFIG.EMULATOR_HOST}:${FIREBASE_CONFIG.FIRESTORE_PORT}';
    window.FIREBASE_AUTH_EMULATOR_HOST = '${FIREBASE_CONFIG.EMULATOR_HOST}:${FIREBASE_CONFIG.AUTH_PORT}';
    window.FIREBASE_PROJECT_ID = '${FIREBASE_CONFIG.PROJECT_ID}';
    
    // テスト環境フラグ
    window.IS_TEST_ENVIRONMENT = true;
    
    // Firebase初期化完了を待つためのPromise
    window.firebaseInitialized = new Promise((resolve) => {
      window.resolveFirebaseInit = resolve;
    });
    
    console.log('🔥 Firebase Emulator configuration injected');
  `);
}

/**
 * Firebase Emulator接続状態の確認
 */
export async function verifyFirebaseConnection(page: Page): Promise<boolean> {
  try {
    const connectionStatus = await page.evaluate(async () => {
      // Firestore接続テスト
      const firestoreResponse = await fetch(`http://${window.FIRESTORE_EMULATOR_HOST}`);
      
      // Auth Emulator接続テスト
      const authResponse = await fetch(`http://${window.FIREBASE_AUTH_EMULATOR_HOST}`);
      
      return {
        firestore: firestoreResponse.ok,
        auth: authResponse.ok
      };
    });
    
    return connectionStatus.firestore && connectionStatus.auth;
  } catch (error) {
    console.error('Firebase connection verification failed:', error);
    return false;
  }
}

/**
 * テストユーザーでのログイン
 */
export async function loginWithTestUser(
  page: Page, 
  userType: keyof typeof TEST_ACCOUNTS
): Promise<void> {
  const account = TEST_ACCOUNTS[userType];
  
  await page.goto('/login');
  
  await page.fill('[data-testid="email-input"]', account.email);
  await page.fill('[data-testid="password-input"]', account.password);
  await page.click('[data-testid="login-button"]');
  
  // ログイン完了を待機
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
  
  console.log(`✅ Logged in as ${account.displayName}`);
}

/**
 * テスト予約の作成
 */
export async function createTestReservation(
  page: Page,
  reservation = TEST_RESERVATIONS.BASIC
): Promise<string> {
  await page.click('[data-testid="new-reservation-button"]');
  
  await page.fill('[data-testid="reservation-date"]', reservation.date);
  await page.selectOption('[data-testid="reservation-time"]', reservation.timeSlot);
  await page.fill('[data-testid="reservation-content"]', reservation.content);
  await page.selectOption('[data-testid="reservation-category"]', reservation.category);
  
  await page.click('[data-testid="save-reservation"]');
  await page.waitForSelector('[data-testid="save-success"]', { timeout: 5000 });
  
  // 作成された予約のIDを取得
  const reservationId = await page.evaluate(() => {
    const successElement = document.querySelector('[data-testid="save-success"]');
    return successElement?.getAttribute('data-reservation-id') || 'unknown';
  });
  
  console.log(`✅ Created test reservation: ${reservationId}`);
  return reservationId;
}

/**
 * Firestore データのクリーンアップ
 */
export async function cleanupFirestoreData(page: Page): Promise<void> {
  await page.evaluate(async () => {
    try {
      // REST APIを使用してFirestore Emulatorデータをクリア
      const response = await fetch(`http://localhost:${window.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${window.FIREBASE_PROJECT_ID}/databases/(default)/documents`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('🧹 Firestore data cleaned up');
      } else {
        console.warn('⚠️ Firestore cleanup failed:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Firestore cleanup error:', error);
    }
  });
}

/**
 * Firebase Auth Emulatorのクリーンアップ
 */
export async function cleanupAuthData(page: Page): Promise<void> {
  await page.evaluate(async () => {
    try {
      const response = await fetch(`http://localhost:${window.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${window.FIREBASE_PROJECT_ID}/accounts`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('🧹 Auth data cleaned up');
      } else {
        console.warn('⚠️ Auth cleanup failed:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Auth cleanup error:', error);
    }
  });
}

/**
 * 複数ブラウザコンテキストでの同期テスト用セットアップ
 */
export async function setupMultiContextTest(
  contexts: BrowserContext[],
  userTypes: (keyof typeof TEST_ACCOUNTS)[]
): Promise<Page[]> {
  const pages = await Promise.all(
    contexts.map(async (context) => {
      const page = await context.newPage();
      await initializeFirebaseEmulator(page);
      return page;
    })
  );
  
  // 各ページで異なるユーザーでログイン
  await Promise.all(
    pages.map(async (page, index) => {
      const userType = userTypes[index] || 'STAFF1';
      await loginWithTestUser(page, userType);
      await page.goto('/reservations');
      await page.waitForSelector('[data-testid="reservation-calendar"]');
    })
  );
  
  return pages;
}

/**
 * リアルタイム同期の待機
 */
export async function waitForRealtimeSync(
  pages: Page[],
  expectedData: string,
  selector: string,
  timeoutMs = 5000
): Promise<void> {
  await Promise.all(
    pages.map(page =>
      page.waitForSelector(selector, { timeout: timeoutMs })
        .then(() => page.waitForFunction(
          (sel, data) => {
            const element = document.querySelector(sel);
            return element && element.textContent?.includes(data);
          },
          [selector, expectedData],
          { timeout: timeoutMs }
        ))
    )
  );
}

/**
 * Firebase Emulator UIでのデータ確認
 */
export async function verifyDataInEmulatorUI(
  page: Page,
  collection: string,
  expectedCount?: number
): Promise<boolean> {
  const emulatorPage = await page.context().newPage();
  
  try {
    await emulatorPage.goto(`http://localhost:${FIREBASE_CONFIG.UI_PORT}/firestore`);
    
    // コレクションが存在することを確認
    const collectionExists = await emulatorPage.isVisible(`[data-testid="firestore-collection-${collection}"]`);
    
    if (expectedCount !== undefined) {
      // ドキュメント数の確認
      const documentCount = await emulatorPage.locator(`[data-testid="collection-${collection}-count"]`).textContent();
      const actualCount = parseInt(documentCount || '0', 10);
      return collectionExists && actualCount === expectedCount;
    }
    
    return collectionExists;
  } finally {
    await emulatorPage.close();
  }
}

/**
 * パフォーマンス測定用のメトリクス取得
 */
export async function getPerformanceMetrics(page: Page): Promise<{
  loadTime: number;
  memoryUsage: number;
  networkRequests: number;
}> {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    const memory = (performance as any).memory;
    
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      memoryUsage: memory ? memory.usedJSHeapSize : 0,
      networkRequests: (window as any).performanceMetrics?.networkRequests || 0
    };
  });
}

/**
 * ネットワーク条件のシミュレート
 */
export async function simulateNetworkConditions(
  context: BrowserContext,
  condition: 'offline' | 'slow' | 'fast'
): Promise<void> {
  switch (condition) {
    case 'offline':
      await context.setOffline(true);
      break;
    case 'slow':
      await context.setOffline(false);
      // 遅い3G相当の設定
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      break;
    case 'fast':
      await context.setOffline(false);
      await context.unroute('**/*');
      break;
  }
}

/**
 * 大量テストデータの生成
 */
export async function generateBulkTestData(count: number): Promise<any[]> {
  return Array.from({ length: count }, (_, index) => ({
    id: `test-reservation-${index}`,
    date: '2024-12-20',
    timeSlot: `${String(9 + Math.floor(index / 6)).padStart(2, '0')}:${String((index % 6) * 10).padStart(2, '0')}`,
    content: `バルクテスト予約 ${index + 1}`,
    category: ['cut', 'color', 'perm'][index % 3],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

/**
 * Firebase Emulator Suiteの健康状態チェック
 */
export async function checkEmulatorHealth(): Promise<{
  firestore: boolean;
  auth: boolean;
  ui: boolean;
}> {
  try {
    const [firestoreResponse, authResponse, uiResponse] = await Promise.allSettled([
      fetch(`http://${FIREBASE_CONFIG.EMULATOR_HOST}:${FIREBASE_CONFIG.FIRESTORE_PORT}`),
      fetch(`http://${FIREBASE_CONFIG.EMULATOR_HOST}:${FIREBASE_CONFIG.AUTH_PORT}`),
      fetch(`http://${FIREBASE_CONFIG.EMULATOR_HOST}:${FIREBASE_CONFIG.UI_PORT}`)
    ]);
    
    return {
      firestore: firestoreResponse.status === 'fulfilled' && firestoreResponse.value.ok,
      auth: authResponse.status === 'fulfilled' && authResponse.value.ok,
      ui: uiResponse.status === 'fulfilled' && uiResponse.value.ok
    };
  } catch (error) {
    return { firestore: false, auth: false, ui: false };
  }
}