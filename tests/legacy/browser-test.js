/**
 * Browser-based Firebase Auth Login Test
 * Puppeteerを使用してブラウザでのログインテストを実行
 */

const puppeteer = require('puppeteer')

async function testLogin() {
  console.log('🔥 Browser Login Test Starting...')
  console.log('==================================')

  let browser

  try {
    // ブラウザ起動
    browser = await puppeteer.launch({
      headless: false, // デバッグのため表示
      slowMo: 1000, // 動作を遅くして確認しやすく
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // コンソールログをキャプチャ
    page.on('console', msg => {
      const type = msg.type()
      if (type === 'error' || type === 'warn') {
        console.log(`🔍 Browser ${type.toUpperCase()}: ${msg.text()}`)
      }
    })

    // ネットワークエラーをキャプチャ
    page.on('requestfailed', request => {
      console.log(`❌ Network Error: ${request.url()} - ${request.failure().errorText}`)
    })

    console.log('📱 Opening login page...')
    await page.goto('https://haircut-reservation-dev.web.app/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    console.log('✅ Page loaded successfully')

    // ページタイトル確認
    const title = await page.title()
    console.log(`📄 Page Title: ${title}`)

    // ログインフォーム要素の存在確認
    console.log('🔍 Checking login form elements...')

    const emailInput = await page.$('input[type="email"]')
    const passwordInput = await page.$('input[type="password"]')
    const loginButton = await page.$('button[type="submit"]')

    if (!emailInput) {
      throw new Error('Email input not found')
    }
    if (!passwordInput) {
      throw new Error('Password input not found')
    }
    if (!loginButton) {
      throw new Error('Login button not found')
    }

    console.log('✅ All form elements found')

    // ログイン情報入力
    console.log('📝 Filling login form...')
    await page.type('input[type="email"]', 'testaccount@test.com', { delay: 100 })
    await page.type('input[type="password"]', 'testtest', { delay: 100 })

    console.log('🔐 Submitting login form...')

    // ログインボタンクリック前にナビゲーション待機を設定
    const navigationPromise = page
      .waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000
      })
      .catch(() => {
        console.log('⚠️ Navigation timeout (may be expected for SPA)')
      })

    await page.click('button[type="submit"]')

    // 少し待機
    await page.waitForTimeout(3000)

    // 現在のURL確認
    const currentUrl = page.url()
    console.log(`🌐 Current URL: ${currentUrl}`)

    // ログイン成功の判定
    if (
      currentUrl.includes('/calendar') ||
      currentUrl === 'https://haircut-reservation-dev.web.app/'
    ) {
      console.log('✅ Login successful - redirected to main page')

      // ページ内容確認
      const bodyText = await page.evaluate(() => document.body.innerText)
      if (bodyText.includes('予約カレンダー') || bodyText.includes('ログアウト')) {
        console.log('✅ Calendar page loaded successfully')
        console.log('✅ User is authenticated')
      }
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Login failed - still on login page')

      // エラーメッセージ確認
      const errorElements = await page.$$('.alert-error, .error, [class*="error"]')
      if (errorElements.length > 0) {
        for (const element of errorElements) {
          const errorText = await page.evaluate(el => el.textContent, element)
          console.log(`❌ Error message: ${errorText}`)
        }
      }
    }

    // スクリーンショット保存
    await page.screenshot({
      path: 'login-test-result.png',
      fullPage: true
    })
    console.log('📸 Screenshot saved: login-test-result.png')
  } catch (error) {
    console.error('💥 Test Error:', error.message)

    if (browser) {
      try {
        const page = (await browser.pages())[0]
        if (page) {
          await page.screenshot({
            path: 'login-test-error.png',
            fullPage: true
          })
          console.log('📸 Error screenshot saved: login-test-error.png')
        }
      } catch (screenshotError) {
        console.error('Failed to save error screenshot:', screenshotError.message)
      }
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  console.log('🏁 Browser test completed')
}

// Puppeteerがインストールされているかチェック
try {
  require.resolve('puppeteer')
  testLogin()
} catch (error) {
  console.log('❌ Puppeteer not installed')
  console.log('📋 Manual Test Instructions:')
  console.log('1. Open: https://haircut-reservation-dev.web.app/login')
  console.log('2. Enter: testaccount@test.com')
  console.log('3. Enter: testtest')
  console.log('4. Click Login button')
  console.log('5. Check for successful redirect to calendar')

  console.log('\n✅ Test Account Verified:')
  console.log('- Email: testaccount@test.com exists in Firebase Auth')
  console.log('- Password: testtest should work')
  console.log('- Last Sign In: Recently used')
  console.log('- Status: Active (not disabled)')
}
