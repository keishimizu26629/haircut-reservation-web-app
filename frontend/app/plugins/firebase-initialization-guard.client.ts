/**
 * Firebase初期化ガード - VueFire統合版（競合解消）
 * ❌ DISABLED: VueFire モジュールとの競合を避けるため簡素化
 * VueFire が Firebase の初期化を管理するため、最小限の監視のみ実行
 */

export default defineNuxtPlugin(() => {
  if (!process.client) return

  // VueFire統合環境での最小限監視
  console.log('🛡️ Firebase Guard (VueFire Mode): Minimal monitoring active')

  // VueFire初期化状態の監視のみ
  const monitorVueFireState = () => {
    const checkInterval = setInterval(() => {
      // VueFire が正常に初期化されているかチェック
      if (window.nuxtApp?.$vuefire || window.vuefire) {
        console.log('✅ VueFire integration detected and healthy')
        clearInterval(checkInterval)
      }
    }, 1000)

    // 30秒でタイムアウト
    setTimeout(() => {
      clearInterval(checkInterval)
    }, 30000)
  }

  // 開発環境でのみ監視実行
  if (process.env.NODE_ENV === 'development') {
    monitorVueFireState()
  }

  return {
    provide: {
      firebaseGuard: {
        mode: 'vuefire-integrated',
        status: 'minimal-monitoring'
      }
    }
  }
})

// TypeScript型定義拡張
declare global {
  interface Window {
    vuefire?: any
    nuxtApp?: any
  }
}