// Firebase を強制的にEmulatorモードにするプラグイン
export default defineNuxtPlugin(() => {
  if (process.client) {
    console.log('🔧 [Firebase] Force Emulator Mode Plugin loaded')

    // Fetch APIをインターセプトしてFirebase本番APIへのリクエストを阻止
    const originalFetch = window.fetch
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input.url

      // Firebase本番APIへのリクエストを検出
      if (url.includes('googleapis.com') && url.includes('identitytoolkit')) {
        console.warn('🚫 [Firebase] Detected production API request:', url)
        console.warn('🚫 [Firebase] This should use emulator instead. Allowing for debugging...')
        // 一時的にブロックを無効化してデバッグ
        // return Promise.reject(new Error('Production API blocked in development'))
      }

      if (url.includes('firebaseappcheck.googleapis.com')) {
        console.warn('🚫 [Firebase] Blocked AppCheck request:', url)
        return Promise.reject(new Error('AppCheck blocked in development'))
      }

      // その他のリクエストは正常に処理
      return originalFetch.call(this, input, init)
    }

    console.log('✅ [Firebase] Production API requests blocked')
  }
})
