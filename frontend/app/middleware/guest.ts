export default defineNuxtRouteMiddleware(() => {
  // サーバーサイドでは認証チェックをスキップ
  if (process.server) return

  const { $auth } = useNuxtApp()
  const user = $auth?.currentUser

  // 認証済みユーザーは認証ページにアクセスできない
  if (user) {
    return navigateTo('/dashboard')
  }
})