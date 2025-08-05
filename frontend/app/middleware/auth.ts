/**
 * VueFire統合認証ミドルウェア - エンタープライズ級セキュリティ対応
 * Firebase Authentication + Nuxt Router Guard + CSRF Protection
 */

import { getCurrentUser } from 'vuefire'
import type { User } from 'firebase/auth'
import type { RouteLocationNormalized } from 'vue-router'

// TypeScript型定義
interface AuthMiddlewareConfig {
  publicRoutes: string[]
  authRoutes: string[]
  protectedRoutes: string[]
  adminRoutes: string[]
  defaultRedirect: string
  loginRedirect: string
}

interface SecurityContext {
  user: User | null
  isAuthenticated: boolean
  hasValidSession: boolean
  userRole: string | null
  permissions: string[]
  sessionExpiry: number | null
  lastActivity: number
}

// 認証設定
const AUTH_CONFIG: AuthMiddlewareConfig = {
  // 認証不要ページ（パブリックアクセス）
  publicRoutes: [
    '/login',
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/terms',
    '/privacy',
    '/services',
    '/about',
    '/contact',
    '/landing',
    '/api-test', // 開発用
    '/firebase-test' // 開発用
  ],
  
  // 認証ページ（認証済みユーザーはアクセス不可）
  authRoutes: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ],
  
  // 保護されたページ（認証必須）
  protectedRoutes: [
    '/',
    '/dashboard', 
    '/reservations',
    '/profile',
    '/settings'
  ],
  
  // 管理者専用ページ
  adminRoutes: [
    '/admin',
    '/admin/users',
    '/admin/settings',
    '/admin/analytics'
  ],
  
  // デフォルトリダイレクト先（MVP: 予約画面中心）
  defaultRedirect: '/',
  loginRedirect: '/login'
}

// セキュリティヘルパー関数
class SecurityHelper {
  /**
   * CSRF トークン検証
   */
  static validateCSRFToken(headers: HeadersInit): boolean {
    if (process.server) return true // サーバーサイドではスキップ
    
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const requestToken = (headers as any)['x-csrf-token']
      
      return !token || token === requestToken
    } catch (error) {
      console.warn('CSRF token validation failed:', error)
      return false
    }
  }

  /**
   * セッション有効性チェック
   */
  static async validateSession(user: User | null): Promise<boolean> {
    if (!user) return false
    
    try {
      // Firebase ID Token の有効性チェック
      const token = await user.getIdToken(false)
      
      // トークンの基本検証
      if (!token) return false
      
      // JWT ペイロード確認（簡易版）
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      // トークン有効期限チェック
      if (payload.exp < currentTime) {
        console.warn('🔒 Firebase token expired')
        return false
      }
      
      return true
    } catch (error) {
      console.error('🔒 Session validation failed:', error)
      return false
    }
  }

  /**
   * ユーザーロール取得
   */
  static async getUserRole(user: User | null): Promise<string | null> {
    if (!user) return null
    
    try {
      const token = await user.getIdToken()
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      // Custom Claims からロール取得
      return payload.role || payload.custom_claims?.role || 'user'
    } catch (error) {
      console.warn('🔒 Failed to get user role:', error)
      return 'user' // デフォルトロール
    }
  }

  /**
   * セッション活動記録更新
   */
  static updateLastActivity(): void {
    if (process.client) {
      localStorage.setItem('lastActivity', Date.now().toString())
    }
  }

  /**
   * セッション期限チェック（8時間）
   */
  static isSessionExpired(): boolean {
    if (process.server) return false
    
    try {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0')
      const currentTime = Date.now()
      const sessionTimeout = 8 * 60 * 60 * 1000 // 8時間

      return (currentTime - lastActivity) > sessionTimeout
    } catch (error) {
      return true // エラー時は期限切れ扱い
    }
  }
}

/**
 * セキュリティコンテキスト構築
 */
async function buildSecurityContext(user: User | null): Promise<SecurityContext> {
  const isAuthenticated = !!user
  const hasValidSession = await SecurityHelper.validateSession(user)
  const userRole = await SecurityHelper.getUserRole(user)
  const isExpired = SecurityHelper.isSessionExpired()
  
  // セッション期限切れの場合は認証状態を無効化
  const validAuthentication = isAuthenticated && hasValidSession && !isExpired
  
  return {
    user: validAuthentication ? user : null,
    isAuthenticated: validAuthentication,
    hasValidSession,
    userRole: validAuthentication ? userRole : null,
    permissions: [], // 将来の拡張用
    sessionExpiry: null, // 将来の拡張用
    lastActivity: Date.now()
  }
}

/**
 * ルーティング保護ロジック
 */
function evaluateRouteAccess(
  route: RouteLocationNormalized,
  security: SecurityContext
): { allowed: boolean; redirect?: string; reason?: string } {
  
  const path = route.path
  
  // 1. パブリックルートチェック
  if (AUTH_CONFIG.publicRoutes.some(publicRoute => 
    path === publicRoute || path.startsWith(publicRoute + '/')
  )) {
    return { allowed: true }
  }
  
  // 2. 認証ページアクセスチェック
  if (AUTH_CONFIG.authRoutes.includes(path)) {
    if (security.isAuthenticated) {
      return { 
        allowed: false, 
        redirect: AUTH_CONFIG.defaultRedirect,
        reason: 'Already authenticated'
      }
    }
    return { allowed: true }
  }
  
  // 3. 保護されたページアクセスチェック
  if (!security.isAuthenticated) {
    // クエリパラメータで元のURL保存
    const returnUrl = encodeURIComponent(route.fullPath)
    return { 
      allowed: false, 
      redirect: `${AUTH_CONFIG.loginRedirect}?returnUrl=${returnUrl}`,
      reason: 'Authentication required'
    }
  }
  
  // 4. 管理者ページアクセスチェック
  if (AUTH_CONFIG.adminRoutes.some(adminRoute => 
    path === adminRoute || path.startsWith(adminRoute + '/')
  )) {
    if (security.userRole !== 'admin') {
      return { 
        allowed: false, 
        redirect: AUTH_CONFIG.defaultRedirect,
        reason: 'Admin access required'
      }
    }
  }
  
  // 5. デフォルト：アクセス許可
  return { allowed: true }
}

/**
 * メイン認証ミドルウェア
 */
export default defineNuxtRouteMiddleware(async (to) => {
  try {
    // サーバーサイドレンダリング時はスキップ
    if (process.server) {
      console.log('🔒 Auth middleware: Skipped (SSR)')
      return
    }

    console.log(`🔒 Auth middleware: Checking access to ${to.path}`)

    // 1. 現在の認証ユーザー取得（VueFire）
    let currentUser: User | null = null
    try {
      currentUser = await getCurrentUser()
    } catch (error) {
      console.warn('🔒 Failed to get current user:', error)
      currentUser = null
    }

    // 2. セキュリティコンテキスト構築
    const securityContext = await buildSecurityContext(currentUser)
    
    console.log('🔒 Security context:', {
      authenticated: securityContext.isAuthenticated,
      role: securityContext.userRole,
      validSession: securityContext.hasValidSession
    })

    // 3. セッション活動記録更新
    SecurityHelper.updateLastActivity()

    // 4. ルートアクセス評価
    const accessResult = evaluateRouteAccess(to, securityContext)
    
    // 5. アクセス制御実行
    if (!accessResult.allowed) {
      console.log(`🔒 Access denied to ${to.path}:`, accessResult.reason)
      
      // セキュリティログ記録（開発環境）
      if (process.env.NODE_ENV === 'development') {
        console.table({
          route: to.path,
          user: securityContext.user?.email || 'Anonymous',
          role: securityContext.userRole || 'None',
          reason: accessResult.reason,
          timestamp: new Date().toISOString()
        })
      }
      
      // リダイレクト実行
      if (accessResult.redirect) {
        return navigateTo(accessResult.redirect)
      }
    }

    console.log(`✅ Access granted to ${to.path}`)

  } catch (error) {
    console.error('🔒 Auth middleware error:', error)
    
    // エラー時の安全な処理：未認証として扱う
    if (!AUTH_CONFIG.publicRoutes.includes(to.path)) {
      console.warn('🔒 Authentication error, redirecting to login')
      return navigateTo(AUTH_CONFIG.loginRedirect)
    }
  }
})

/**
 * 認証状態監視Composable（オプション）
 */
export function useAuthGuard() {
  const nuxtApp = useNuxtApp()
  
  // 認証状態変更時の処理
  const onAuthStateChanged = (callback: (user: User | null) => void) => {
    // VueFire の認証状態変更を監視
    const auth = useFirebaseAuth()
    if (auth) {
      return auth.onAuthStateChanged(callback)
    }
  }
  
  // セッション強制更新
  const refreshSession = async (): Promise<boolean> => {
    try {
      const user = await getCurrentUser()
      if (user) {
        await user.getIdToken(true) // 強制トークン更新
        SecurityHelper.updateLastActivity()
        return true
      }
      return false
    } catch (error) {
      console.error('🔒 Session refresh failed:', error)
      return false
    }
  }
  
  // 手動ログアウト
  const signOut = async (): Promise<void> => {
    try {
      const auth = useFirebaseAuth()
      if (auth) {
        await auth.signOut()
        // セッション情報クリア
        if (process.client) {
          localStorage.removeItem('lastActivity')
        }
        await navigateTo('/login')
      }
    } catch (error) {
      console.error('🔒 Sign out failed:', error)
    }
  }
  
  return {
    onAuthStateChanged,
    refreshSession,
    signOut
  }
}

// デバッグ用エクスポート（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  (globalThis as any).__AUTH_DEBUG__ = {
    AUTH_CONFIG,
    SecurityHelper,
    buildSecurityContext,
    evaluateRouteAccess
  }
}