import { expect, test } from '@playwright/test'

test.describe('Dev Environment Auth Debug', () => {
  test.beforeEach(async ({ page }) => {
    // コンソールログを監視
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`)
    })

    // ネットワークエラーを監視
    page.on('requestfailed', request => {
      console.log(
        `[NETWORK ERROR] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`
      )
    })

    // レスポンスを監視
    page.on('response', response => {
      if (!response.ok() && response.url().includes('firebase')) {
        console.log(`[FIREBASE ERROR] ${response.status()} ${response.url()}`)
      }
    })
  })

  test('should debug login issue with existing user', async ({ page }) => {
    console.log('🔍 Starting login debug test...')

    // ログインページに移動
    await page.goto('http://localhost:3000/login')

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle')

    console.log('📍 Page loaded, checking elements...')

    // フォーム要素の存在確認
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const loginButton = page.locator('button[type="submit"]')

    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    await expect(loginButton).toBeVisible({ timeout: 10000 })

    console.log('✅ Login form elements are visible')

    // Firebase設定を確認
    const firebaseConfig = await page.evaluate(() => {
      return {
        // @ts-ignore
        env: window.__NUXT__?.config?.public?.firebaseEnv,
        // @ts-ignore
        projectId: window.__NUXT__?.config?.public?.firebase?.projectId
      }
    })

    console.log('🔥 Firebase Config:', firebaseConfig)

    // テストユーザーでログイン試行
    await emailInput.fill('testtest@test.com')
    await passwordInput.fill('testtest')

    console.log('📝 Filled login form with test credentials')

    // 詳細なコンソールログを収集
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(`${msg.type()}: ${text}`)
      if (text.includes('🔒') || text.includes('🔐') || text.includes('Auth')) {
        console.log(`[AUTH LOG] ${text}`)
      }
    })

    // ログインボタンをクリック
    await loginButton.click()

    console.log('🔘 Clicked login button, waiting for response...')

    // ログイン後の詳細な状態確認
    await page.waitForTimeout(3000)

    // 現在のURLを確認
    const currentUrl = page.url()
    console.log('📍 Current URL:', currentUrl)

    // 詳細な認証状態の確認
    const detailedAuthState = await page.evaluate(() => {
      try {
        return {
          // @ts-ignore
          authDebug: window.__AUTH_DEBUG__ || 'Not available',
          // @ts-ignore
          nuxtConfig: window.__NUXT__?.config?.public?.firebaseEnv || 'Not available',
          currentPath: window.location.pathname,
          // @ts-ignore
          authStore: window.$pinia?.state?.value?.auth || 'Store not available'
        }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    console.log('🔒 Detailed Auth State:', JSON.stringify(detailedAuthState, null, 2))

    // セッションストレージの確認
    const sessionInfo = await page.evaluate(() => {
      try {
        return {
          localStorage: {
            lastActivity: localStorage.getItem('lastActivity'),
            keys: Object.keys(localStorage)
          },
          sessionStorage: {
            keys: Object.keys(sessionStorage)
          }
        }
      } catch (error) {
        return { error: 'Storage access failed' }
      }
    })

    console.log('💾 Session Info:', JSON.stringify(sessionInfo, null, 2))

    // 最終判定
    if (currentUrl.includes('/calendar')) {
      console.log('✅ Login successful - redirected to calendar')
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Login failed - still on login page')

      // エラーメッセージの確認
      const errorMessage = await page.locator('[role="alert"], .alert, .error').textContent()
      if (errorMessage) {
        console.log('❌ Error message:', errorMessage)
      }

      // 関連するコンソールログを出力
      console.log('📋 Recent Console Logs:')
      consoleLogs.slice(-10).forEach(log => console.log(`  ${log}`))
    } else {
      console.log('⚠️ Unexpected redirect:', currentUrl)
    }
  })

  test('should debug registration flow', async ({ page }) => {
    console.log('🔍 Testing registration flow...')

    // 新規登録ページに移動
    await page.goto('http://localhost:3000/register')
    await page.waitForLoadState('networkidle')

    console.log('📍 Registration page loaded')

    // フォーム要素の存在確認
    const nameInput = page.locator('input[type="text"]').first()
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]').first()
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1)
    const termsCheckbox = page.locator('input[type="checkbox"]')
    const registerButton = page.locator('button[type="submit"]')

    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    await expect(confirmPasswordInput).toBeVisible({ timeout: 10000 })
    await expect(termsCheckbox).toBeVisible({ timeout: 10000 })
    await expect(registerButton).toBeVisible({ timeout: 10000 })

    console.log('✅ Registration form elements are visible')

    // テストデータで登録試行
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    const testName = 'テストユーザー'

    await nameInput.fill(testName)
    await emailInput.fill(testEmail)
    await passwordInput.fill(testPassword)
    await confirmPasswordInput.fill(testPassword)
    await termsCheckbox.check()

    console.log('📝 Filled registration form with test data')

    // 詳細なコンソールログを収集
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(`${msg.type()}: ${text}`)
      if (text.includes('🔒') || text.includes('🔐') || text.includes('Registration')) {
        console.log(`[REG LOG] ${text}`)
      }
    })

    // 登録ボタンをクリック
    await registerButton.click()

    console.log('🔘 Clicked register button, waiting for response...')

    // 登録後の詳細な状態確認
    await page.waitForTimeout(5000)

    // 現在のURLを確認
    const currentUrl = page.url()
    console.log('📍 Current URL after registration:', currentUrl)

    // 最終判定
    if (currentUrl.includes('/calendar')) {
      console.log('✅ Registration successful - redirected to calendar')
    } else if (currentUrl.includes('/register')) {
      console.log('❌ Registration failed - still on registration page')

      // エラーメッセージの確認
      const errorMessage = await page.locator('[role="alert"], .alert, .error').textContent()
      if (errorMessage) {
        console.log('❌ Error message:', errorMessage)
      }

      // 関連するコンソールログを出力
      console.log('📋 Recent Console Logs:')
      consoleLogs.slice(-10).forEach(log => console.log(`  ${log}`))
    } else {
      console.log('⚠️ Unexpected redirect:', currentUrl)
    }
  })

  test('should check Firebase connection and user existence', async ({ page }) => {
    console.log('🔍 Checking Firebase connection and user data...')

    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    // Firebase接続テスト用のスクリプトを実行
    const connectionTest = await page.evaluate(async () => {
      try {
        // @ts-ignore
        const { getFirebaseInstances } = window

        if (!getFirebaseInstances) {
          return { error: 'Firebase instances not available' }
        }

        const { auth } = getFirebaseInstances()

        return {
          success: true,
          authConnected: !!auth,
          currentUser: auth.currentUser?.email || null,
          config: {
            projectId: auth.app.options.projectId,
            apiKey: auth.app.options.apiKey?.slice(-4) || 'not set'
          }
        }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          details: String(error)
        }
      }
    })

    console.log('🔥 Firebase Connection Test:', JSON.stringify(connectionTest, null, 2))

    // ログイン試行と詳細なエラー情報収集
    await page.locator('input[type="email"]').fill('testtest@test.com')
    await page.locator('input[type="password"]').fill('testtest')

    // ネットワークリクエストを監視
    const networkRequests: any[] = []
    page.on('request', request => {
      if (request.url().includes('googleapis.com') || request.url().includes('firebase')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          headers: Object.fromEntries(Object.entries(request.headers()))
        })
      }
    })

    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)

    console.log('🌐 Firebase Network Requests:', JSON.stringify(networkRequests, null, 2))
  })
})
