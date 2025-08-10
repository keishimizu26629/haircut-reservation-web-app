import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const apiURL = process.env.API_URL || 'http://localhost:3001';
const headless = process.env.HEADLESS === 'true' || process.env.CI === 'true';

// Firebase Emulator設定
const FIREBASE_EMULATOR_HOST = 'localhost';
const FIRESTORE_PORT = 8080;
const AUTH_PORT = 9099;
const FIREBASE_UI_PORT = 4000;

export default defineConfig({
  testDir: './specs',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4, // 並列実行最適化
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    process.env.CI ? ['github'] : ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Global timeout for each action */
    actionTimeout: 15000, // Firebase操作用に延長
    /* Global timeout for navigation */
    navigationTimeout: 45000, // Firebase接続用に延長
    /* Headless mode */
    headless,
    /* Firebase Emulator環境変数 */
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    // デスクトップブラウザ（同期テスト用）
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Firebase Emulator用設定
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
    },

    // 複数ブラウザコンテキスト用専用プロジェクト
    {
      name: 'multi-context-chrome',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
      testMatch: '**/multi-context/**/*.spec.ts',
    },

    // モバイル（リアルタイム同期テスト用）
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
    },

    // パフォーマンステスト専用
    {
      name: 'performance-test',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
      testMatch: '**/performance/**/*.spec.ts',
    },
  ],

  /* Global setup and teardown - 一時的に無効化 */
  // globalSetup: require.resolve('./global-setup.ts'),
  // globalTeardown: require.resolve('./global-teardown.ts'),

  /* Firebase Emulator Suite + Nuxt dev server起動 - 一時的に無効化 */
  // webServer: process.env.CI ? undefined : [
  //   // Firebase Emulator Suite起動
  //   {
  //     command: 'cd ../simple-reservation && npm run start:dev',
  //     url: `http://${FIREBASE_EMULATOR_HOST}:${FIREBASE_UI_PORT}`,
  //     timeout: 60 * 1000,
  //     reuseExistingServer: true, // 既存サーバーを再利用
  //     stdout: 'pipe',
  //     stderr: 'pipe',
  //   },
  //   // Nuxt開発サーバー起動（フロントエンド用）
  //   {
  //     command: 'cd ../frontend && npm run dev',
  //     url: baseURL,
  //     timeout: 120 * 1000,
  //     reuseExistingServer: true,
  //     stdout: 'pipe',
  //     stderr: 'pipe',
  //   }
  // ],

  /* Test timeout */
  timeout: 60 * 1000, // Firebase操作用に延長
  expect: {
    /* Timeout for expect() assertions */
    timeout: 15 * 1000, // リアルタイム同期用に延長
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Firebase Emulator設定をテスト環境変数として設定 */
  metadata: {
    FIRESTORE_EMULATOR_HOST: `${FIREBASE_EMULATOR_HOST}:${FIRESTORE_PORT}`,
    FIREBASE_AUTH_EMULATOR_HOST: `${FIREBASE_EMULATOR_HOST}:${AUTH_PORT}`,
    FIREBASE_UI_URL: `http://${FIREBASE_EMULATOR_HOST}:${FIREBASE_UI_PORT}`,
  },
});
