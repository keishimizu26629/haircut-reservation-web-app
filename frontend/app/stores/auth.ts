import { defineStore } from 'pinia'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  connectAuthEmulator,
  type User} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getApp } from 'firebase/app'

// =====================================
// Firebase Utilities
// =====================================

function getFirebaseInstances() {
  try {
    const app = getApp()
    const auth = getAuth(app)
    const firestore = getFirestore(app)

    console.log('🔐 [Firebase] App config:', app.options)
    console.log('🔐 [Firebase] Process env:', { dev: process.dev, client: process.client })

    // Emulator接続（開発環境のみ）
    if (process.dev && process.client) {
      console.log('🔐 [Firebase] Attempting emulator connection...')
      try {
        // Auth Emulator接続
        const authEmulatorUrl = 'http://localhost:9099'
        const isAuthConnected = (auth as any).config?.emulator || (auth as any)._config?.emulator
        
        if (!isAuthConnected) {
          connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true })
          console.log('🔐 [Firebase] Auth emulator connected to:', authEmulatorUrl)
        } else {
          console.log('🔐 [Firebase] Auth emulator already connected')
        }

        // Firestore Emulator接続
        const firestoreSettings = (firestore as any)._settings || {}
        const isFirestoreConnected = firestoreSettings.host?.includes('localhost') || firestoreSettings.ssl === false
        
        if (!isFirestoreConnected) {
          connectFirestoreEmulator(firestore, 'localhost', 8080)
          console.log('🔐 [Firebase] Firestore emulator connected to: localhost:8080')
        } else {
          console.log('🔐 [Firebase] Firestore emulator already connected')
        }

        // Emulator接続の検証
        console.log('🔐 [Firebase] Auth config:', {
          emulator: (auth as any).config?.emulator || (auth as any)._config?.emulator,
          currentUser: auth.currentUser
        })
        console.log('🔐 [Firebase] Firestore settings:', firestoreSettings)
        
      } catch (emulatorError: any) {
        console.error('🔐 [Firebase] Emulator connection failed:', emulatorError?.message || 'Unknown error')
        console.error('🔐 [Firebase] Full error:', emulatorError)
      }
    }

    return { auth, firestore }
  } catch (error) {
    console.error('🔐 [Firebase] Failed to get Firebase instances:', error)

    // フォールバック: 再試行メカニズム
    if (process.client) {
      console.log('🔐 [Firebase] Attempting fallback initialization...')
      throw new Error('Firebase not initialized. Please refresh the page.')
    }

    throw error
  }
}

// =====================================
// Types & Interfaces
// =====================================

interface UserProfile {
  displayName?: string
  phoneNumber?: string
  tenantId?: string | undefined
  role?: 'admin' | 'staff' | 'customer'
  isActive?: boolean
}

interface TenantInfo {
  id: string
  name: string
  businessType: string
  isActive: boolean
  createdAt: any
}

interface SecuritySettings {
  lastPasswordChange?: any
  loginAttempts?: number
  lastLoginAttempt?: any
  isLocked?: boolean
  lockExpiry?: any
  trustedDevices?: string[]
}

interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  tenantInfo: TenantInfo | null
  loading: boolean
  error: string | null
  securitySettings: SecuritySettings | null
  sessionExpiry: number | null
}

interface LoginAttempt {
  timestamp: number
  ip: string
  userAgent: string
  success: boolean
}

// =====================================
// Auth Store with Enhanced Security
// =====================================

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    userProfile: null,
    tenantInfo: null,
    loading: false,
    error: null,
    securitySettings: null,
    sessionExpiry: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userDisplayName: (state) => state.userProfile?.displayName || state.user?.displayName || state.user?.email || 'User',
    userEmail: (state) => state.user?.email || '',
    userRole: (state) => state.userProfile?.role || 'customer',
    userTenantId: (state) => state.userProfile?.tenantId || null,
    isAdmin: (state) => state.userProfile?.role === 'admin',
    isStaff: (state) => ['admin', 'staff'].includes(state.userProfile?.role || ''),
    isAccountLocked: (state) => {
      if (!state.securitySettings?.isLocked) return false
      if (!state.securitySettings?.lockExpiry) return false
      return Date.now() < state.securitySettings.lockExpiry
    },
    sessionTimeRemaining: (state) => {
      if (!state.sessionExpiry) return null
      const remaining = state.sessionExpiry - Date.now()
      return remaining > 0 ? remaining : 0
    }
  },

  actions: {
    // =====================================
    // State Management
    // =====================================

    setUser(user: User | null) {
      this.user = user
      if (!user) {
        this.userProfile = null
        this.tenantInfo = null
        this.securitySettings = null
        this.sessionExpiry = null
      }
      this.error = null
    },

    setUserProfile(profile: UserProfile | null) {
      this.userProfile = profile
    },

    setTenantInfo(tenant: TenantInfo | null) {
      this.tenantInfo = tenant
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    setSessionExpiry(expiry: number) {
      this.sessionExpiry = expiry
    },

    // =====================================
    // Security Functions
    // =====================================

    async recordLoginAttempt(success: boolean, email?: string) {
      try {
        const attempt: LoginAttempt = {
          timestamp: Date.now(),
          ip: await this.getClientIP(),
          userAgent: navigator.userAgent,
          success
        }

        // Firestoreに記録
        if (email) {
          const { $firestore } = useNuxtApp() as any
          const attemptsRef = doc($firestore, 'loginAttempts', email)
          const attemptsDoc = await getDoc(attemptsRef)

          const existingAttempts = attemptsDoc.exists() ? attemptsDoc.data().attempts || [] : []
          const newAttempts = [...existingAttempts, attempt].slice(-10) // 最新10件のみ保持

          await setDoc(attemptsRef, {
            email,
            attempts: newAttempts,
            lastAttempt: serverTimestamp()
          }, { merge: true })
        }
      } catch (error) {
        console.warn('Failed to record login attempt:', error)
      }
    },

    async checkAccountLockStatus(email: string): Promise<boolean> {
      try {
        const { $firestore } = useNuxtApp() as any
        const userRef = doc($firestore, 'users', email.replace('@', '_at_').replace('.', '_dot_'))
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          const security = data.security || {}

          if (security.isLocked && security.lockExpiry && Date.now() < security.lockExpiry) {
            return true
          }

          // ロック期限が過ぎていたら自動解除
          if (security.isLocked && security.lockExpiry && Date.now() >= security.lockExpiry) {
            await updateDoc(userRef, {
              'security.isLocked': false,
              'security.lockExpiry': null,
              'security.loginAttempts': 0
            })
          }
        }

        return false
      } catch (error) {
        console.warn('Failed to check account lock status:', error)
        return false
      }
    },

    async updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>) {
      try {
        const { $firestore } = useNuxtApp() as any
        const userRef = doc($firestore, 'users', userId)

        await updateDoc(userRef, {
          'security': {
            ...this.securitySettings,
            ...updates,
            lastUpdated: serverTimestamp()
          }
        })

        this.securitySettings = { ...this.securitySettings, ...updates }
      } catch (error) {
        console.error('Failed to update security settings:', error)
      }
    },

    async getClientIP(): Promise<string> {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip || 'unknown'
      } catch {
        return 'unknown'
      }
    },

    // =====================================
    // Enhanced Authentication Methods
    // =====================================

    async signInWithEmail(email: string, password: string) {
      this.setLoading(true)
      this.setError(null)

      try {
        // アカウントロック状態チェック
        const isLocked = await this.checkAccountLockStatus(email)
        if (isLocked) {
          throw new Error('アカウントがロックされています。しばらく時間をおいてからお試しください。')
        }

        const { auth } = getFirebaseInstances()

        console.log('🔐 [Auth] Sign in - Firebase Auth instance:', auth)

        const credential = await signInWithEmailAndPassword(auth, email, password)

        // ログイン成功の記録
        await this.recordLoginAttempt(true, email)

        // ユーザー情報とテナント情報を取得
        await this.loadUserProfile(credential.user.uid)

        // セッション有効期限設定（8時間）
        this.setSessionExpiry(Date.now() + 8 * 60 * 60 * 1000)

        this.setUser(credential.user)
        return credential.user

      } catch (error: any) {
        console.error('Login error:', error)

        // ログイン失敗の記録
        await this.recordLoginAttempt(false, email)

        const errorMessage = this.getFirebaseErrorMessage(error.code) || error.message
        this.setError(errorMessage)
        throw new Error(errorMessage)

      } finally {
        this.setLoading(false)
      }
    },

    async signUpWithEmail(email: string, password: string, profile?: UserProfile) {
      this.setLoading(true)
      this.setError(null)

      console.log('🔐 [Auth] Starting email signup process', { email, hasProfile: !!profile })

      try {
        // Firebase SDKを直接使用
        const { auth, firestore } = getFirebaseInstances()

        console.log('🔐 [Auth] Firebase Auth instance:', auth)
        console.log('🔐 [Auth] Firebase Firestore instance:', firestore)

        const credential = await createUserWithEmailAndPassword(auth, email, password)
        console.log('🔐 [Auth] User created successfully:', credential.user.uid)

        // プロフィール情報の更新
        if (profile?.displayName) {
          await updateProfile(credential.user, {
            displayName: profile.displayName
          })
        }

        // Firestoreにユーザープロフィール作成
        const userProfile: UserProfile = {
          displayName: profile?.displayName || '',
          phoneNumber: profile?.phoneNumber || '',
          tenantId: profile?.tenantId || undefined,
          role: profile?.role || 'customer',
          isActive: true
        }

        const userRef = doc(firestore, 'users', credential.user.uid)
        await setDoc(userRef, {
          ...userProfile,
          email: credential.user.email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          security: {
            loginAttempts: 0,
            isLocked: false,
            trustedDevices: []
          }
        })

        // メール確認送信
        await sendEmailVerification(credential.user)

        this.setUser(credential.user)
        this.setUserProfile(userProfile)

        return credential.user

      } catch (error: any) {
        console.error('🔐 [Auth] Registration failed - Full error:', error)
        console.error('🔐 [Auth] Error code:', error.code)
        console.error('🔐 [Auth] Error message:', error.message)
        console.error('🔐 [Auth] Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack,
          customData: error.customData
        })
        const errorMessage = this.getFirebaseErrorMessage(error.code)
        this.setError(errorMessage)
        throw new Error(errorMessage)

      } finally {
        this.setLoading(false)
      }
    },

    async signInWithGoogle() {
      this.setLoading(true)
      this.setError(null)

      try {
        const { $auth } = useNuxtApp() as any
        const provider = new GoogleAuthProvider()

        // 追加のスコープ要求
        provider.addScope('profile')
        provider.addScope('email')

        const credential = await signInWithPopup($auth, provider)

        // 新規ユーザーの場合、プロフィール作成
        const isNewUser = credential.user.metadata.creationTime === credential.user.metadata.lastSignInTime
        if (isNewUser) {
          await this.createUserProfile(credential.user, 'google')
        }

        // ユーザー情報とテナント情報を取得
        await this.loadUserProfile(credential.user.uid)

        // セッション有効期限設定
        this.setSessionExpiry(Date.now() + 8 * 60 * 60 * 1000)

        this.setUser(credential.user)
        return credential.user

      } catch (error: any) {
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
          const errorMessage = this.getFirebaseErrorMessage(error.code)
          this.setError(errorMessage)
          throw new Error(errorMessage)
        }
        return null
      } finally {
        this.setLoading(false)
      }
    },

    // =====================================
    // User Profile Management
    // =====================================

    async loadUserProfile(userId: string) {
      try {
        const { $firestore } = useNuxtApp() as any
        const userRef = doc($firestore, 'users', userId)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          const profile: UserProfile = {
            displayName: data.displayName,
            phoneNumber: data.phoneNumber,
            tenantId: data.tenantId,
            role: data.role,
            isActive: data.isActive
          }

          this.setUserProfile(profile)

          // セキュリティ設定も取得
          if (data.security) {
            this.securitySettings = data.security
          }

          // テナント情報取得
          if (data.tenantId) {
            await this.loadTenantInfo(data.tenantId)
          }

          // 最終ログイン時間更新
          await updateDoc(userRef, {
            lastLogin: serverTimestamp()
          })
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    },

    async loadTenantInfo(tenantId: string) {
      try {
        const { $firestore } = useNuxtApp() as any
        const tenantRef = doc($firestore, 'tenants', tenantId)
        const tenantDoc = await getDoc(tenantRef)

        if (tenantDoc.exists()) {
          const data = tenantDoc.data()
          const tenantInfo: TenantInfo = {
            id: tenantDoc.id,
            name: data.name,
            businessType: data.businessType,
            isActive: data.isActive,
            createdAt: data.createdAt
          }

          this.setTenantInfo(tenantInfo)
        }
      } catch (error) {
        console.error('Failed to load tenant info:', error)
      }
    },

    async createUserProfile(user: User, signInMethod: string) {
      try {
        const { $firestore } = useNuxtApp() as any
        const userRef = doc($firestore, 'users', user.uid)

        const profile = {
          displayName: user.displayName || '',
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          role: 'customer',
          isActive: true,
          signInMethod,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          security: {
            loginAttempts: 0,
            isLocked: false,
            trustedDevices: []
          }
        }

        await setDoc(userRef, profile)
      } catch (error) {
        console.error('Failed to create user profile:', error)
      }
    },

    // =====================================
    // Password & Security Management
    // =====================================

    async sendPasswordReset(email: string) {
      try {
        const { $auth } = useNuxtApp() as any
        await sendPasswordResetEmail($auth, email)
      } catch (error: any) {
        const errorMessage = this.getFirebaseErrorMessage(error.code)
        throw new Error(errorMessage)
      }
    },

    async changePassword(currentPassword: string, newPassword: string) {
      if (!this.user) {
        throw new Error('ユーザーが認証されていません')
      }

      try {
        // 再認証
        const credential = EmailAuthProvider.credential(this.user.email!, currentPassword)
        await reauthenticateWithCredential(this.user, credential)

        // パスワード更新
        await updatePassword(this.user, newPassword)

        // セキュリティ設定更新
        await this.updateSecuritySettings(this.user.uid, {
          lastPasswordChange: serverTimestamp()
        })

      } catch (error: any) {
        const errorMessage = this.getFirebaseErrorMessage(error.code)
        throw new Error(errorMessage)
      }
    },

    // =====================================
    // Session Management
    // =====================================

    extendSession() {
      // セッションを延長（8時間）
      this.setSessionExpiry(Date.now() + 8 * 60 * 60 * 1000)
    },

    checkSessionExpiry() {
      if (this.sessionExpiry && Date.now() > this.sessionExpiry) {
        this.logout()
        throw new Error('セッションが期限切れです。再度ログインしてください。')
      }
    },

    // =====================================
    // Logout
    // =====================================

    async logout() {
      this.setLoading(true)
      this.setError(null)

      try {
        const { $auth } = useNuxtApp() as any
        await signOut($auth)
        this.setUser(null)

        // Remember me設定をクリア
        localStorage.removeItem('rememberLogin')

      } catch (error: any) {
        const errorMessage = 'ログアウトに失敗しました。もう一度お試しください。'
        this.setError(errorMessage)
        throw new Error(errorMessage)

      } finally {
        this.setLoading(false)
      }
    },

    // =====================================
    // Error Message Translation
    // =====================================

    getFirebaseErrorMessage(errorCode: string): string {
      const { $t } = useNuxtApp() as any

      switch (errorCode) {
        case 'auth/user-not-found':
          return $t?.('auth.errors.userNotFound') || 'ユーザーが見つかりません'
        case 'auth/wrong-password':
          return $t?.('auth.errors.wrongPassword') || 'パスワードが正しくありません'
        case 'auth/email-already-in-use':
          return $t?.('auth.errors.emailAlreadyInUse') || 'このメールアドレスは既に使用されています'
        case 'auth/weak-password':
          return $t?.('auth.errors.weakPassword') || 'パスワードが弱すぎます'
        case 'auth/invalid-email':
          return $t?.('auth.errors.invalidEmail') || 'メールアドレスが無効です'
        case 'auth/too-many-requests':
          return $t?.('auth.errors.tooManyRequests') || 'リクエストが多すぎます'
        case 'auth/user-disabled':
          return $t?.('auth.errors.userDisabled') || 'ユーザーが無効化されています'
        case 'auth/requires-recent-login':
          return $t?.('auth.errors.sessionExpired') || 'セッションが期限切れです'
        case 'auth/network-request-failed':
          return $t?.('auth.errors.networkError') || 'ネットワークエラーです'
        case 'auth/popup-closed-by-user':
          return $t?.('auth.errors.popupClosed') || 'ポップアップが閉じられました'
        case 'auth/popup-blocked':
          return $t?.('auth.errors.popupBlocked') || 'ポップアップがブロックされました'
        case 'auth/invalid-credential':
          return $t?.('auth.errors.invalidEmail') || '認証情報が無効です'
        case 'auth/account-exists-with-different-credential':
          return $t?.('auth.errors.emailAlreadyInUse') || 'アカウントが既に存在します'
        default:
          return $t?.('notifications.error.unknownError') || '不明なエラーが発生しました'
      }
    },

    // =====================================
    // Initialization
    // =====================================

    async initializeAuth() {
      const { $auth } = useNuxtApp() as any

      return new Promise<void>((resolve) => {
        const unsubscribe = $auth.onAuthStateChanged(async (user: any) => {
          if (user) {
            await this.loadUserProfile(user.uid)
            // セッション復元
            const savedExpiry = localStorage.getItem('sessionExpiry')
            if (savedExpiry) {
              const expiry = parseInt(savedExpiry)
              if (Date.now() < expiry) {
                this.setSessionExpiry(expiry)
              } else {
                // 期限切れの場合はログアウト
                await this.logout()
              }
            }
          }

          this.setUser(user)
          unsubscribe()
          resolve()
        })
      })
    }
  }
})
