/**
 * E2E Login Test with Detailed Logging
 * ログイン機能の詳細テストとデバッグ
 */

const https = require('https')
const fs = require('fs')

class E2ELoginTest {
  constructor() {
    this.baseUrl = 'https://haircut-reservation-dev.web.app'
    this.testCredentials = {
      email: 'testaccount@test.com',
      password: 'testtest'
    }
    this.logFile = `e2e-test-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${message}`
    console.log(logMessage)
    fs.appendFileSync(this.logFile, logMessage + '\n')
  }

  async httpRequest(url, method = 'GET', headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        method,
        headers: {
          'User-Agent': 'E2E-Test-Bot/1.0',
          ...headers
        }
      }

      const req = https.request(url, options, res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          })
        })
      })

      req.on('error', reject)
      req.setTimeout(10000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
  }

  async testSiteAccessibility() {
    this.log('🌐 Testing site accessibility...')

    try {
      const response = await this.httpRequest(this.baseUrl)
      this.log(`✅ Site accessible: ${response.statusCode}`, 'SUCCESS')
      this.log(`📋 Content-Type: ${response.headers['content-type']}`)
      this.log(`🔒 CSP Header: ${response.headers['content-security-policy'] || 'Not set'}`)

      // HTMLの基本構造チェック
      const hasTitle = response.body.includes('<title>')
      const hasNuxt = response.body.includes('_nuxt')
      const hasFirebase = response.body.includes('firebase')

      this.log(`📄 HTML Structure: Title=${hasTitle}, Nuxt=${hasNuxt}, Firebase=${hasFirebase}`)

      return response.statusCode === 200
    } catch (error) {
      this.log(`❌ Site accessibility failed: ${error.message}`, 'ERROR')
      return false
    }
  }

  async testLoginPage() {
    this.log('🔐 Testing login page...')

    try {
      const loginUrl = `${this.baseUrl}/login`
      const response = await this.httpRequest(loginUrl)

      this.log(`✅ Login page accessible: ${response.statusCode}`, 'SUCCESS')

      // ログインページの要素チェック
      const hasEmailInput =
        response.body.includes('type="email"') || response.body.includes('email')
      const hasPasswordInput =
        response.body.includes('type="password"') || response.body.includes('password')
      const hasLoginButton = response.body.includes('ログイン') || response.body.includes('login')

      this.log(
        `📋 Login Form Elements: Email=${hasEmailInput}, Password=${hasPasswordInput}, Button=${hasLoginButton}`
      )

      return response.statusCode === 200
    } catch (error) {
      this.log(`❌ Login page test failed: ${error.message}`, 'ERROR')
      return false
    }
  }

  async testDiagnosticTool() {
    this.log('🔧 Testing diagnostic tool...')

    try {
      const diagUrl = `${this.baseUrl}/diagnose-login.html`
      const response = await this.httpRequest(diagUrl)

      this.log(`✅ Diagnostic tool accessible: ${response.statusCode}`, 'SUCCESS')

      const hasFirebaseInit = response.body.includes('initializeApp')
      const hasLoginTest = response.body.includes('testLogin')

      this.log(`🔧 Diagnostic Features: Firebase=${hasFirebaseInit}, LoginTest=${hasLoginTest}`)

      return response.statusCode === 200
    } catch (error) {
      this.log(`❌ Diagnostic tool test failed: ${error.message}`, 'ERROR')
      return false
    }
  }

  async testFirebaseConfig() {
    this.log('🔥 Testing Firebase configuration...')

    try {
      // Firebase設定の確認
      const response = await this.httpRequest(this.baseUrl)

      const hasApiKey = response.body.includes('AIzaSyBTvdrOvdcdhNrONF_b9uXeInoqvVmKYfY')
      const hasProjectId = response.body.includes('haircut-reservation-dev')
      const hasAuthDomain = response.body.includes('haircut-reservation-dev.firebaseapp.com')

      this.log(
        `🔥 Firebase Config: ApiKey=${hasApiKey}, ProjectId=${hasProjectId}, AuthDomain=${hasAuthDomain}`
      )

      return hasApiKey && hasProjectId && hasAuthDomain
    } catch (error) {
      this.log(`❌ Firebase config test failed: ${error.message}`, 'ERROR')
      return false
    }
  }

  async generateManualTestInstructions() {
    this.log('📋 Generating manual test instructions...')

    const instructions = `
=== MANUAL E2E LOGIN TEST INSTRUCTIONS ===

🎯 Test Objective: Verify login functionality works end-to-end

📋 Pre-Test Checklist:
✅ Site is accessible: ${this.baseUrl}
✅ Login page loads: ${this.baseUrl}/login
✅ Diagnostic tool available: ${this.baseUrl}/diagnose-login.html

🔐 Test Credentials:
Email: ${this.testCredentials.email}
Password: ${this.testCredentials.password}

📝 Manual Test Steps:

STEP 1: Open Login Page
- Navigate to: ${this.baseUrl}/login
- Verify page loads without errors
- Check browser console for any errors
- Confirm login form is visible

STEP 2: Enter Credentials
- Email field: ${this.testCredentials.email}
- Password field: ${this.testCredentials.password}
- Click "ログイン" button

STEP 3: Monitor Authentication
- Watch browser console for Firebase auth logs
- Look for authentication success messages
- Check for any CSP or security errors

STEP 4: Verify Redirect
- Should redirect to main calendar page (/)
- Verify user is authenticated
- Check that logout button is visible

STEP 5: Test Navigation
- Try accessing protected pages
- Verify authentication persists
- Test logout functionality

🔧 Diagnostic Tool Test:
- Open: ${this.baseUrl}/diagnose-login.html
- Click "ログインテスト" button
- Verify Firebase initialization status
- Check authentication state

❌ Troubleshooting:
- If page freezes: Check infinite redirect loops
- If login fails: Verify Firebase Auth errors
- If blank page: Check CSP violations
- If network errors: Check Firebase API calls

📊 Expected Results:
✅ Smooth login without freezing
✅ Successful authentication
✅ Proper redirect to calendar
✅ Persistent authentication state
✅ No console errors
`

    this.log(instructions)
    fs.writeFileSync('manual-e2e-test-instructions.txt', instructions)
    this.log('📄 Manual test instructions saved to: manual-e2e-test-instructions.txt')
  }

  async runFullTest() {
    this.log('🚀 Starting E2E Login Test Suite...')
    this.log('=====================================')

    const results = {
      siteAccessible: false,
      loginPageWorking: false,
      diagnosticToolWorking: false,
      firebaseConfigValid: false
    }

    // Test 1: Site Accessibility
    results.siteAccessible = await this.testSiteAccessibility()

    // Test 2: Login Page
    results.loginPageWorking = await this.testLoginPage()

    // Test 3: Diagnostic Tool
    results.diagnosticToolWorking = await this.testDiagnosticTool()

    // Test 4: Firebase Config
    results.firebaseConfigValid = await this.testFirebaseConfig()

    // Generate Manual Test Instructions
    await this.generateManualTestInstructions()

    // Summary
    this.log('🏁 E2E Test Results Summary:')
    this.log('============================')

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL'
      this.log(`${status} ${test}`)
    })

    const allPassed = Object.values(results).every(result => result)
    this.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

    if (allPassed) {
      this.log('✅ Ready for manual login testing!')
      this.log(`🌐 Login URL: ${this.baseUrl}/login`)
      this.log(`🔧 Diagnostic URL: ${this.baseUrl}/diagnose-login.html`)
    } else {
      this.log('❌ Please fix failed tests before manual testing')
    }

    this.log(`📄 Full test log saved to: ${this.logFile}`)

    return results
  }
}

// テスト実行
const test = new E2ELoginTest()
test
  .runFullTest()
  .then(results => {
    process.exit(Object.values(results).every(r => r) ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  })
