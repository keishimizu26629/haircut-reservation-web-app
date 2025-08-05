// Firebase デバッグ用プラグイン
export default defineNuxtPlugin(() => {
  // Firebase Auth デバッグログ
  console.log('🔥 [Firebase] Debug plugin loaded')

  // Firebase Emulator 接続テスト
  if (process.client) {
    console.log('🔥 [Firebase] Running connection test...')

    // Auth Emulator テスト
    fetch('http://localhost:9099/')
      .then(response => response.json())
      .then(data => {
        console.log('🔥 [Firebase] Auth Emulator connection successful:', data)
      })
      .catch(error => {
        console.error('🔥 [Firebase] Auth Emulator connection failed:', error)
      })

    // Firestore Emulator テスト
    fetch('http://localhost:8080/')
      .then(response => response.text())
      .then(data => {
        console.log('🔥 [Firebase] Firestore Emulator connection successful')
      })
      .catch(error => {
        console.error('🔥 [Firebase] Firestore Emulator connection failed:', error)
      })
  }
})
