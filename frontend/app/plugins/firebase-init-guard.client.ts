// Firebase初期化完了を保証するプラグイン
export default defineNuxtPlugin({
  name: 'firebase-init-guard',
  async setup() {
    if (process.client) {
      console.log('🛡️ [Firebase Guard] Ensuring Firebase initialization...')

      // Firebase初期化完了を待機
      let retries = 0
      const maxRetries = 30 // 3秒間待機

      const waitForFirebase = async (): Promise<boolean> => {
        try {
          const { getApp } = await import('firebase/app')
          const app = getApp()

          if (app) {
            console.log('✅ [Firebase Guard] Firebase app ready:', app.name)
            return true
          }
        } catch (error) {
          // Firebase未初期化の場合は続行
        }

        if (retries < maxRetries) {
          retries++
          await new Promise(resolve => setTimeout(resolve, 100))
          return waitForFirebase()
        }

        console.warn('⚠️ [Firebase Guard] Firebase initialization timeout')
        return false
      }

      await waitForFirebase()

      // DOM読み込み完了も待機
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          const handler = () => {
            document.removeEventListener('readystatechange', handler)
            resolve(true)
          }
          document.addEventListener('readystatechange', handler)
        })
      }

      console.log('✅ [Firebase Guard] Initialization guard complete')
    }
  }
})
