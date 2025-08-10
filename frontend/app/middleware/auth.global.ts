/**
 * グローバル認証ミドルウェア - VueFire統合版
 * 高機能auth.tsの機能をグローバルミドルウェアとして適用
 */

import type { User } from 'firebase/auth'
import { getAuth } from 'firebase/auth'

// 認証設定（auth.tsと統一）
const AUTH_CONFIG = {
  publicRoutes: ['/', '/login', '/register'],
  authRoutes: ['/login', '/register'],
  protectedRoutes: ['/calendar'],
  adminRoutes: ['/admin', '/admin/users', '/admin/settings', '/admin/analytics'],
  defaultRedirect: '/calendar',
  loginRedirect: '/login'
}

// セッション期限チェック
function isSessionExpired(): boolean {
  if (import.meta.server) return false

  try {
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0')
    const currentTime = Date.now()
    const sessionTimeout = 8 * 60 * 60 * 1000 // 8時間
    return currentTime - lastActivity > sessionTimeout
  } catch {
    return true
  }
}

// セッション活動記録更新
function updateLastActivity(): void {
  if (import.meta.client) {
    localStorage.setItem('lastActivity', Date.now().toString())
  }
}

export default defineNuxtRouteMiddleware(async to => {
  try {
    // サーバーサイドでは認証チェックをスキップ
    if (import.meta.server) {
      console.log('🔒 Global Auth: Skipped (SSR)')
      return
    }

    console.log(`🔒 Global Auth: Checking ${to.path}`)

    // 認証状態の確認を少し遅延させて、初期化を待つ
    // 本番環境では初期化により時間がかかる可能性があるため、より長い待機時間を設定
    const waitTime = process.env.NODE_ENV === 'production' ? 500 : 100
    await new Promise(resolve => setTimeout(resolve, waitTime))

    // 1. VueFire から現在のユーザー取得
    let currentUser: User | null = null
    try {
      const auth = getAuth()
      currentUser = auth.currentUser
    } catch (error) {
      console.warn('🔒 Failed to get current user:', error)
      currentUser = null
    }

    // 1.5. AuthStoreからも認証状態を確認（フォールバック）
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()
    const authStoreUser = authStore.user

    console.log('🔒 Auth state comparison:', {
      vueFireUser: !!currentUser,
      authStoreUser: !!authStoreUser,
      vueFireUid: currentUser?.uid,
      authStoreUid: authStoreUser?.uid
    })

    // VueFireとAuthStoreのいずれかで認証されていれば有効とする
    const effectiveUser = currentUser || authStoreUser

    // 2. セッション期限チェック
    const isExpired = isSessionExpired()
    const isAuthenticated = !!effectiveUser && !isExpired

    console.log('🔒 Authentication check details:', {
      effectiveUser: !!effectiveUser,
      effectiveUserUid: effectiveUser?.uid,
      isExpired,
      isAuthenticated,
      sessionCheck: !isExpired
    })

    // 3. セッション活動記録更新
    if (isAuthenticated) {
      updateLastActivity()
    }

    // 4. パブリックルートチェック
    const isPublicRoute = AUTH_CONFIG.publicRoutes.some(
      route => to.path === route || to.path.startsWith(route + '/')
    )

    if (isPublicRoute) {
      // パブリックページは常にアクセス許可
      console.log(`✅ Public route: ${to.path}`)
      return
    }

    // 5. 認証ページアクセスチェック（認証済みユーザーの認証ページアクセス制限）
    if (AUTH_CONFIG.authRoutes.includes(to.path)) {
      if (isAuthenticated) {
        console.log(`🔒 Authenticated user accessing auth page, redirecting to dashboard`)
        return navigateTo(AUTH_CONFIG.defaultRedirect)
      }
      // 未認証ユーザーは認証ページアクセス許可
      return
    }

    // 6. 未認証ユーザーの保護されたページアクセス制限
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(to.fullPath)
      console.log(`🔒 Unauthenticated access to ${to.path}, redirecting to login`)
      return navigateTo(`${AUTH_CONFIG.loginRedirect}?returnUrl=${returnUrl}`)
    }

    // 7. 管理者ページアクセスチェック
    if (
      AUTH_CONFIG.adminRoutes.some(route => to.path === route || to.path.startsWith(route + '/'))
    ) {
      try {
        const token = await currentUser!.getIdToken()
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) throw new Error('Invalid token format')
        const payload = JSON.parse(atob(tokenParts[1]!))
        const userRole = payload.role || payload.custom_claims?.role || 'user'

        if (userRole !== 'admin') {
          console.log(`🔒 Non-admin access to ${to.path}, redirecting to dashboard`)
          return navigateTo(AUTH_CONFIG.defaultRedirect)
        }
      } catch (error) {
        console.warn('🔒 Failed to check admin role:', error)
        return navigateTo(AUTH_CONFIG.defaultRedirect)
      }
    }

    console.log(`✅ Access granted to ${to.path}`)
  } catch (error) {
    console.error('🔒 Global auth middleware error:', error)

    // エラー時の安全な処理
    const isPublicRoute = AUTH_CONFIG.publicRoutes.includes(to.path)
    if (!isPublicRoute) {
      console.warn('🔒 Authentication error, redirecting to login')
      return navigateTo(AUTH_CONFIG.loginRedirect)
    }
  }
})
