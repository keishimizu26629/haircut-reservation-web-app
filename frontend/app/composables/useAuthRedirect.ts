/**
 * 認証リダイレクト管理Composable
 * 認証成功後の自動Home遷移システム + returnUrl対応
 */

import { getCurrentUser } from 'vuefire'

interface AuthRedirectOptions {
  defaultSuccessRoute?: string
  defaultFailureRoute?: string
  preserveQueryParams?: boolean
  allowedReturnRoutes?: string[]
}

export function useAuthRedirect(options: AuthRedirectOptions = {}) {
  const {
    defaultSuccessRoute = '/dashboard',
    defaultFailureRoute = '/login',
    preserveQueryParams = true,
    allowedReturnRoutes = ['/dashboard', '/booking', '/reservations', '/profile', '/settings']
  } = options

  /**
   * 認証成功後のリダイレクト処理
   */
  const handleAuthSuccess = async (customRoute?: string): Promise<void> => {
    try {
      console.log('🚀 Auth success redirect initiated')
      
      // 1. カスタムルートが指定されている場合
      if (customRoute) {
        console.log(`🚀 Redirecting to custom route: ${customRoute}`)
        await navigateTo(customRoute)
        return
      }

      // 2. returnUrl パラメータをチェック
      const route = useRoute()
      const returnUrl = route.query.returnUrl as string

      if (returnUrl) {
        // セキュリティチェック：許可されたルートのみ
        const decodedUrl = decodeURIComponent(returnUrl)
        const isAllowed = allowedReturnRoutes.some(allowedRoute => 
          decodedUrl === allowedRoute || decodedUrl.startsWith(allowedRoute + '/')
        )

        if (isAllowed) {
          console.log(`🚀 Redirecting to return URL: ${decodedUrl}`)
          await navigateTo(decodedUrl)
          return
        } else {
          console.warn(`🚨 Unsafe return URL blocked: ${decodedUrl}`)
        }
      }

      // 3. デフォルトのサクセスルートへリダイレクト
      console.log(`🚀 Redirecting to default success route: ${defaultSuccessRoute}`)
      await navigateTo(defaultSuccessRoute)

    } catch (error) {
      console.error('🚨 Auth success redirect failed:', error)
      // エラー時はデフォルトルートへ
      await navigateTo(defaultSuccessRoute)
    }
  }

  /**
   * 認証失敗時のリダイレクト処理
   */
  const handleAuthFailure = async (errorMessage?: string): Promise<void> => {
    try {
      console.log('🚨 Auth failure redirect initiated')
      
      if (errorMessage) {
        console.warn(`🚨 Auth failure reason: ${errorMessage}`)
      }

      // クエリパラメータとして現在のページを保存
      const route = useRoute()
      const currentPath = route.fullPath
      
      // パブリックページでない場合のみreturnUrlを設定
      const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']
      const shouldPreserveReturn = !publicRoutes.includes(route.path)

      if (shouldPreserveReturn && preserveQueryParams) {
        const returnUrl = encodeURIComponent(currentPath)
        console.log(`🚨 Redirecting to login with return URL: ${currentPath}`)
        await navigateTo(`${defaultFailureRoute}?returnUrl=${returnUrl}`)
      } else {
        console.log(`🚨 Redirecting to login`)
        await navigateTo(defaultFailureRoute)
      }

    } catch (error) {
      console.error('🚨 Auth failure redirect failed:', error)
      await navigateTo(defaultFailureRoute)
    }
  }

  /**
   * ログアウト後のリダイレクト処理
   */
  const handleLogout = async (targetRoute?: string): Promise<void> => {
    try {
      console.log('🚪 Logout redirect initiated')
      
      // セッション情報をクリア
      if (process.client) {
        localStorage.removeItem('lastActivity')
        // 他のセッション関連データもクリア
        sessionStorage.clear()
      }

      const redirectTo = targetRoute || '/'
      console.log(`🚪 Redirecting after logout to: ${redirectTo}`)
      await navigateTo(redirectTo)

    } catch (error) {
      console.error('🚨 Logout redirect failed:', error)
      await navigateTo('/')
    }
  }

  /**
   * 認証状態に基づく自動リダイレクト
   */
  const autoRedirectByAuthState = async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser()
      const route = useRoute()
      
      if (currentUser) {
        // 認証済みユーザーが認証ページにいる場合
        const authPages = ['/login', '/register', '/forgot-password', '/reset-password']
        if (authPages.includes(route.path)) {
          console.log('🚀 Authenticated user on auth page, redirecting to dashboard')
          await handleAuthSuccess()
        }
      } else {
        // 未認証ユーザーが保護されたページにいる場合
        const protectedPages = ['/dashboard', '/booking', '/reservations', '/profile', '/settings']
        const isProtectedPage = protectedPages.some(page => 
          route.path === page || route.path.startsWith(page + '/')
        )
        
        if (isProtectedPage) {
          console.log('🚨 Unauthenticated user on protected page, redirecting to login')
          await handleAuthFailure('Authentication required')
        }
      }
    } catch (error) {
      console.error('🚨 Auto redirect failed:', error)
    }
  }

  /**
   * returnUrl の検証
   */
  const validateReturnUrl = (url: string): boolean => {
    try {
      const decodedUrl = decodeURIComponent(url)
      
      // 外部URLを防ぐ
      if (decodedUrl.includes('://') || decodedUrl.startsWith('//')) {
        return false
      }
      
      // 許可されたルートのチェック
      return allowedReturnRoutes.some(allowedRoute => 
        decodedUrl === allowedRoute || decodedUrl.startsWith(allowedRoute + '/')
      )
    } catch {
      return false
    }
  }

  /**
   * 現在のページをreturnUrlとして取得
   */
  const getCurrentReturnUrl = (): string => {
    const route = useRoute()
    return encodeURIComponent(route.fullPath)
  }

  return {
    handleAuthSuccess,
    handleAuthFailure,
    handleLogout,
    autoRedirectByAuthState,
    validateReturnUrl,
    getCurrentReturnUrl
  }
}

/**
 * ログインページ専用のComposable
 */
export function useLoginRedirect() {
  const authRedirect = useAuthRedirect()

  /**
   * ログイン成功時の処理
   */
  const onLoginSuccess = async (user?: any): Promise<void> => {
    console.log('✅ Login successful, processing redirect...')
    
    if (user) {
      console.log(`✅ User logged in: ${user.email}`)
    }
    
    await authRedirect.handleAuthSuccess()
  }

  /**
   * ログイン失敗時の処理
   */
  const onLoginError = (error: any): void => {
    console.error('❌ Login failed:', error)
    
    // ユーザーフレンドリーなエラーメッセージを表示
    // （実際のUIトーストやアラートはここで実装）
    let message = 'ログインに失敗しました'
    
    if (error.code === 'auth/user-not-found') {
      message = 'ユーザーが見つかりません'
    } else if (error.code === 'auth/wrong-password') {
      message = 'パスワードが間違っています'
    } else if (error.code === 'auth/invalid-email') {
      message = 'メールアドレスが無効です'
    }
    
    console.log(`🚨 Login error message: ${message}`)
  }

  return {
    onLoginSuccess,
    onLoginError,
    ...authRedirect
  }
}