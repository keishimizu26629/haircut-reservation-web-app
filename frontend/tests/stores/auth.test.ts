import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'

// Firebase auth mocks
const mockSignInWithEmailAndPassword = vi.fn()
const mockCreateUserWithEmailAndPassword = vi.fn()
const mockSignOut = vi.fn()
const mockSignInWithPopup = vi.fn()
const mockUpdateProfile = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: mockSignInWithPopup,
  updateProfile: mockUpdateProfile,
}))

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $auth: {
      currentUser: null,
      onAuthStateChanged: vi.fn()
    }
  })
}))

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const authStore = useAuthStore()
      
      expect(authStore.user).toBeNull()
      expect(authStore.loading).toBe(false)
      expect(authStore.error).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('getters', () => {
    it('isAuthenticated: ユーザーがnullの場合はfalseを返す', () => {
      const authStore = useAuthStore()
      authStore.setUser(null)
      
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('isAuthenticated: ユーザーが存在する場合はtrueを返す', () => {
      const authStore = useAuthStore()
      const mockUser = { email: 'test@example.com', displayName: 'Test User' } as any
      authStore.setUser(mockUser)
      
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('userDisplayName: displayNameがある場合はそれを返す', () => {
      const authStore = useAuthStore()
      const mockUser = { email: 'test@example.com', displayName: 'Test User' } as any
      authStore.setUser(mockUser)
      
      expect(authStore.userDisplayName).toBe('Test User')
    })

    it('userDisplayName: displayNameがない場合はemailを返す', () => {
      const authStore = useAuthStore()
      const mockUser = { email: 'test@example.com' } as any
      authStore.setUser(mockUser)
      
      expect(authStore.userDisplayName).toBe('test@example.com')
    })

    it('userDisplayName: ユーザーがnullの場合はUserを返す', () => {
      const authStore = useAuthStore()
      authStore.setUser(null)
      
      expect(authStore.userDisplayName).toBe('User')
    })
  })

  describe('actions', () => {
    describe('setUser', () => {
      it('ユーザーを正しく設定する', () => {
        const authStore = useAuthStore()
        const mockUser = { email: 'test@example.com' } as any
        
        authStore.setUser(mockUser)
        
        expect(authStore.user).toBe(mockUser)
        expect(authStore.error).toBeNull()
      })
    })

    describe('setLoading', () => {
      it('ローディング状態を正しく設定する', () => {
        const authStore = useAuthStore()
        
        authStore.setLoading(true)
        expect(authStore.loading).toBe(true)
        
        authStore.setLoading(false)
        expect(authStore.loading).toBe(false)
      })
    })

    describe('setError', () => {
      it('エラー状態を正しく設定する', () => {
        const authStore = useAuthStore()
        
        authStore.setError('Test error')
        expect(authStore.error).toBe('Test error')
        
        authStore.setError(null)
        expect(authStore.error).toBeNull()
      })
    })

    describe('signInWithEmail', () => {
      it('成功時: ユーザーを設定してローディングを解除する', async () => {
        const authStore = useAuthStore()
        const mockUser = { email: 'test@example.com' } as any
        mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser })
        
        const result = await authStore.signInWithEmail('test@example.com', 'password')
        
        expect(result).toBe(mockUser)
        expect(authStore.user).toBe(mockUser)
        expect(authStore.loading).toBe(false)
        expect(authStore.error).toBeNull()
      })

      it('失敗時: エラーメッセージを設定してローディングを解除する', async () => {
        const authStore = useAuthStore()
        mockSignInWithEmailAndPassword.mockRejectedValue({ code: 'auth/user-not-found' })
        
        await expect(authStore.signInWithEmail('test@example.com', 'password'))
          .rejects.toThrow('No account found with this email address.')
        
        expect(authStore.loading).toBe(false)
        expect(authStore.error).toBe('No account found with this email address.')
      })
    })

    describe('getFirebaseErrorMessage', () => {
      it('既知のエラーコードに対して適切なメッセージを返す', () => {
        const authStore = useAuthStore()
        
        expect(authStore.getFirebaseErrorMessage('auth/user-not-found'))
          .toBe('No account found with this email address.')
        expect(authStore.getFirebaseErrorMessage('auth/wrong-password'))
          .toBe('Incorrect password. Please try again.')
        expect(authStore.getFirebaseErrorMessage('auth/email-already-in-use'))
          .toBe('An account with this email already exists.')
        expect(authStore.getFirebaseErrorMessage('unknown-error'))
          .toBe('An error occurred. Please try again.')
      })
    })
  })
})