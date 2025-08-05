// Firebase AppCheck を完全無効化するプラグイン
export default defineNuxtPlugin(() => {
  if (process.client) {
    console.log('🛑 [AppCheck] Disabling Firebase AppCheck for development')

    // AppCheckの無効化
    if (window && (window as any).firebase) {
      try {
        // AppCheck関連の初期化を停止
        ;(window as any).firebase.appCheck = () => null
      } catch (error) {
        console.log('🛑 [AppCheck] AppCheck disable attempt:', error)
      }
    }
  }
})
