/**
 * 管理者専用ミドルウェア
 * 管理者権限を持つユーザーのみアクセスを許可
 */
import { useAuth } from '../composables/useAuth'

export default defineNuxtRouteMiddleware((to, from) => {
  // クライアントサイドでのみ実行
  if (process.server) return

  const { isAuthenticated, userRole } = useAuth()

  // 認証されていない場合はログインページにリダイレクト
  if (!isAuthenticated.value) {
    console.warn('🔒 Admin access denied: Not authenticated')
    return navigateTo('/login')
  }

  // 管理者権限がない場合はホームページにリダイレクト（MVP: 予約画面）
  const allowedRoles = ['admin', 'manager']
  if (!allowedRoles.includes(userRole.value)) {
    console.warn('🔒 Admin access denied: Insufficient permissions', {
      userRole: userRole.value,
      allowedRoles,
      redirectTo: '/'
    })

    // MVP対応: 管理者権限がない場合は予約画面にリダイレクト
    return navigateTo('/')
  }

  console.log('✅ Admin access granted:', {
    userRole: userRole.value,
    route: to.path
  })
})
