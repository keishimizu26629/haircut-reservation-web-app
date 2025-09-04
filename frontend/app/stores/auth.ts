import { getApp } from 'firebase/app'
import type { User } from 'firebase/auth'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { defineStore } from 'pinia'

// Firebase初期化
export function getFirebaseInstances() {
  try {
    const app = getApp()
    const auth = getAuth(app)
    const firestore = getFirestore(app)

    // Emulator接続（FIREBASE_ENV=local の場合）
    if (process.env.FIREBASE_ENV === 'local' && import.meta.client) {
      try {
        // Auth Emulator
        if (!('config' in auth && (auth as { config?: { emulator?: unknown } }).config?.emulator)) {
          const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
          connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true })
          console.log('🔥 Auth Emulator connected:', authEmulatorHost)
        }

        // Firestore Emulator
        const settings = (firestore as { _settings?: { host?: string } })._settings
        if (
          !settings?.host?.includes('localhost') &&
          !settings?.host?.includes('firebase-emulator')
        ) {
          const firestoreEmulatorHost =
            process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'
          const [host, port] = firestoreEmulatorHost.split(':')
          if (host && port) {
            connectFirestoreEmulator(firestore, host, parseInt(port))
            console.log('🔥 Firestore Emulator connected:', firestoreEmulatorHost)
          }
        }
      } catch (error) {
        console.warn('Firebase Emulator connection failed:', error)
      }
    }

    return { auth, firestore }
  } catch (error) {
    console.error('Firebase initialization error:', error)
    throw error
  }
}

// 認証ストア
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: state => !!state.user,
    isLoading: state => state.loading,
    userEmail: state => state.user?.email || '',
    userName: state => state.user?.displayName || state.user?.email || 'User'
  },

  actions: {
    setUser(user: User | null) {
      this.user = user
      this.error = null
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    async checkAuthState() {
      console.log('🔒 AuthStore: Checking authentication state...')
      this.setLoading(true)

      try {
        const { auth } = getFirebaseInstances()

        // 認証永続化を確実にする（Docker環境対応）
        if (!process.env.FIREBASE_ENV || process.env.FIREBASE_ENV !== 'local') {
          try {
            const { setPersistence, browserLocalPersistence } = await import('firebase/auth')
            await setPersistence(auth, browserLocalPersistence)
            console.log('🔒 AuthStore: Auth persistence confirmed')
          } catch (persistenceError) {
            console.warn('🔒 AuthStore: Auth persistence warning:', persistenceError)
          }
        }

        return new Promise(resolve => {
          const unsubscribe = auth.onAuthStateChanged(async user => {
            console.log('🔒 AuthStore: Auth state changed:', !!user)

            try {
              if (user) {
                this.setUser(user)
                // セッション活動記録を更新
                if (import.meta.client) {
                  localStorage.setItem('lastActivity', Date.now().toString())
                }
                console.log('🔒 AuthStore: User authenticated')
                resolve(true)
              } else {
                this.setUser(null)
                console.log('🔒 AuthStore: User not authenticated')
                resolve(false)
              }
            } catch (error) {
              console.error('🔒 AuthStore: Error in auth state check:', error)
              this.setError('認証状態の確認中にエラーが発生しました')
              resolve(false)
            } finally {
              this.setLoading(false)
              unsubscribe()
            }
          })
        })
      } catch (error) {
        console.error('🔒 AuthStore: Failed to check auth state:', error)
        this.setError('認証状態の確認に失敗しました')
        this.setLoading(false)
        return false
      }
    }
  }
})
