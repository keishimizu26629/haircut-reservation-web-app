/**
 * Firebase Client Plugin - VueFire統合版（競合解消）
 * ❌ DISABLED: VueFire モジュールとの競合を避けるため無効化
 * VueFire が Firebase の初期化を処理するため、このプラグインは使用しない
 */

export default defineNuxtPlugin(async () => {
  // VueFire integration - skip manual Firebase initialization to avoid conflicts
  console.log('🔥 Firebase Client Plugin: Skipped (VueFire handles Firebase initialization)')
  
  return {
    provide: {
      // VueFire provides Firebase services automatically via composables
      firebaseIntegration: 'vuefire-managed'
    }
  }
})