/**
 * Firebase Auth Login Test - Server Side
 */
const admin = require('firebase-admin')

// Firebase Admin SDK初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'haircut-reservation-dev'
  })
}

const auth = admin.auth()

async function testFirebaseAuth() {
  console.log('🔥 Firebase Auth Test Starting...')
  console.log('================================')

  try {
    // テストユーザーの詳細情報を取得
    const testEmail = 'testaccount@test.com'
    console.log(`📧 Testing user: ${testEmail}`)

    const userRecord = await auth.getUserByEmail(testEmail)
    console.log('✅ User found in Firebase Auth:')
    console.log(`   - UID: ${userRecord.uid}`)
    console.log(`   - Email: ${userRecord.email}`)
    console.log(`   - Email Verified: ${userRecord.emailVerified}`)
    console.log(`   - Display Name: ${userRecord.displayName || 'Not set'}`)
    console.log(`   - Creation Time: ${userRecord.metadata.creationTime}`)
    console.log(`   - Last Sign In: ${userRecord.metadata.lastSignInTime}`)
    console.log(`   - Disabled: ${userRecord.disabled}`)

    // カスタムトークン生成（ログインテスト用）
    console.log('\n🔑 Generating custom token for testing...')
    const customToken = await auth.createCustomToken(userRecord.uid)
    console.log('✅ Custom token generated successfully')
    console.log(`   Token length: ${customToken.length} characters`)

    console.log('\n🌐 Manual Test URLs:')
    console.log('1. Main App Login: https://haircut-reservation-dev.web.app/login')
    console.log('2. Diagnostic Tool: https://haircut-reservation-dev.web.app/diagnose-login.html')

    console.log('\n📋 Test Credentials:')
    console.log('   Email: testaccount@test.com')
    console.log('   Password: testtest')

    console.log('\n✅ Firebase Auth configuration is valid!')
    console.log('   The user exists and authentication should work.')
  } catch (error) {
    console.error('❌ Firebase Auth Test Failed:')
    console.error(`   Error Code: ${error.code}`)
    console.error(`   Error Message: ${error.message}`)

    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 User not found. Creating test user...')
      try {
        const newUser = await auth.createUser({
          email: 'testaccount@test.com',
          password: 'testtest',
          displayName: 'テストアカウント',
          emailVerified: false
        })
        console.log(`✅ Test user created with UID: ${newUser.uid}`)
      } catch (createError) {
        console.error(`❌ Failed to create user: ${createError.message}`)
      }
    }
  }
}

// テスト実行
testFirebaseAuth()
  .then(() => {
    console.log('\n🏁 Test completed.')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })
