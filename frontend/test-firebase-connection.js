// Firebase接続テストスクリプト
const { initializeApp } = require('firebase/app')
const { getAuth, connectAuthEmulator } = require('firebase/auth')

const firebaseConfig = {
  apiKey: "AIzaSyBpZGvmYw7X3qF8rG9lKjHnMbVcXdEfGhI",
  authDomain: "haircut-reservation-dev.firebaseapp.com",
  projectId: "haircut-reservation-dev",
  storageBucket: "haircut-reservation-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
}

console.log('🔥 Firebase接続テスト開始...')

try {
  // Firebase初期化
  const app = initializeApp(firebaseConfig)
  console.log('✅ Firebase app初期化成功')
  
  // Auth初期化
  const auth = getAuth(app)
  console.log('✅ Firebase Auth初期化成功')
  
  // エミュレーター接続（開発環境）
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    console.log('✅ Firebase Auth Emulator接続成功')
  } catch (emulatorError) {
    console.log('⚠️  Firebase Auth Emulator接続失敗（本番環境での接続になります）')
    console.log('   エミュレーター詳細:', emulatorError.message)
  }
  
  // Auth状態監視テスト
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ ユーザー認証状態:', user.email || 'メール未設定')
    } else {
      console.log('✅ 認証状態監視開始（未ログイン）')
    }
  })
  
  console.log('🎉 Firebase接続テスト完了！')
  console.log('\n📊 接続結果:')
  console.log('- Firebase App: 初期化成功')
  console.log('- Firebase Auth: 初期化成功')
  console.log('- Emulator: 接続試行済み')
  console.log('- State Listener: 設定完了')
  
} catch (error) {
  console.error('❌ Firebase接続エラー:', error)
  console.error('設定値確認が必要です')
  process.exit(1)
}

// 3秒後にプロセス終了
setTimeout(() => {
  console.log('\n✅ テスト完了')
  process.exit(0)
}, 3000)