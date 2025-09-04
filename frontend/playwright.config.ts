import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.test.ts',
  fullyParallel: false, // 認証テストは順次実行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],

  // グローバルセットアップ
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Firebase Emulator環境用の設定
    ignoreHTTPSErrors: true,
    headless: !!process.env.CI,
    actionTimeout: 30000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    // CI環境以外では複数ブラウザテストを無効化（高速化のため）
    ...(process.env.CI
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] }
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] }
          }
        ]
      : [])
  ],

  webServer: process.env.SKIP_WEBSERVER
    ? []
    : [
        {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
          stderr: 'pipe',
          stdout: 'pipe'
        }
      ]
})
