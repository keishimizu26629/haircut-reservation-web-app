/**
 * Firebase Client Plugin - VueFire compatibility check
 * VueFireが初期化を管理するため、このプラグインは設定確認のみ行う
 */
export default defineNuxtPlugin(async () => {
  if (import.meta.client) {
    console.log('🔥 Firebase Client Plugin: VueFire integration mode')

    // runtimeConfigから環境変数を取得
    const config = useRuntimeConfig()

    // 環境変数の確認（デバッグ用）
    console.log('🔥 Firebase Config Check:', {
      projectId: config.public.firebase?.projectId,
      apiKey: config.public.firebase?.apiKey
        ? '***' + config.public.firebase.apiKey.slice(-4)
        : 'not set',
      env: config.public.firebaseEnv
    })
  }

  return {
    provide: {
      firebaseIntegration: 'vuefire-managed'
    }
  }
})
