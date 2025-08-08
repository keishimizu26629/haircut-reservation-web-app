/**
 * Enhanced Authentication Composable
 * マルチテナント対応・複数プロバイダー統合・エンタープライズ機能
 */
import { useAuthStore } from '../stores/auth'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  getIdToken,
  getIdTokenResult,
  type User,
  type UserCredential,
  type ConfirmationResult
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'

// Types
interface UserProfile {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  phoneNumber?: string
  tenantId?: string
  role: 'customer' | 'staff' | 'manager' | 'admin'
  permissions: string[]
  createdAt: any
  updatedAt: any
  lastLoginAt: any
  emailVerified: boolean
  isActive: boolean
}

interface SignUpData {
  email: string
  password: string
  displayName?: string
  phoneNumber?: string
  tenantId?: string
  role?: UserProfile['role']
}

export const useAuth = () => {
  const authStore = useAuthStore()
  const { $firebaseAuth, $firestore, $firebaseMultiTenant } = useNuxtApp()
  const router = useRouter()

  // Enhanced state
  const profile = ref<UserProfile | null>(null)
  const tenant = ref<any | null>(null)
  const authError = ref<string | null>(null)

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider()
  googleProvider.addScope('profile')
  googleProvider.addScope('email')
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  })

  // Phone Auth Configuration
  let recaptchaVerifier: RecaptchaVerifier | null = null

  const initializeRecaptcha = (containerId: string = 'recaptcha-container') => {
    if (process.client && !recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier($firebaseAuth, containerId, {
        size: 'normal',
        callback: () => console.log('✅ reCAPTCHA verified'),
        'expired-callback': () => {
          console.warn('⚠️ reCAPTCHA expired')
          recaptchaVerifier = null
        }
      })
    }
    return recaptchaVerifier
  }

  // User Profile Management
  const createUserProfile = async (user: User, additionalData: Partial<UserProfile> = {}): Promise<UserProfile> => {
    const defaultTenantId = $firebaseMultiTenant?.defaultTenantId || 'default-salon'

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || additionalData.displayName || '',
      photoURL: user.photoURL || additionalData.photoURL || '',
      phoneNumber: user.phoneNumber || additionalData.phoneNumber || '',
      tenantId: additionalData.tenantId || defaultTenantId,
      role: additionalData.role || 'customer',
      permissions: getDefaultPermissions(additionalData.role || 'customer'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      emailVerified: user.emailVerified,
      isActive: true,
      ...additionalData
    }

    await setDoc(doc($firestore, 'users', user.uid), userProfile)

    // Create customer record if needed
    if (userProfile.role === 'customer') {
      await setDoc(doc($firestore, 'customers', user.uid), {
        userId: user.uid,
        tenantId: userProfile.tenantId,
        personalInfo: {
          displayName: userProfile.displayName,
          email: userProfile.email,
          phoneNumber: userProfile.phoneNumber
        },
        preferences: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    return userProfile
  }

  const getDefaultPermissions = (role: UserProfile['role']): string[] => {
    const permissionMap = {
      customer: ['view_services', 'create_reservation', 'view_own_reservations'],
      staff: ['view_services', 'manage_reservations', 'view_customers', 'manage_schedule'],
      manager: ['view_services', 'manage_reservations', 'view_customers', 'manage_schedule', 'view_reports', 'manage_staff'],
      admin: ['*']
    }
    return permissionMap[role] || permissionMap.customer
  }

  const loadUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc($firestore, 'users', uid))
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile

        // Update last login
        await updateDoc(doc($firestore, 'users', uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        profile.value = profileData
        return profileData
      }
      return null
    } catch (error) {
      console.error('Failed to load user profile:', error)
      return null
    }
  }

  // Enhanced Authentication Methods
  const signUpWithEmail = async (signUpData: SignUpData): Promise<UserCredential> => {
    try {
      authError.value = null

      const userCredential = await createUserWithEmailAndPassword(
        $firebaseAuth,
        signUpData.email,
        signUpData.password
      )

      if (signUpData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: signUpData.displayName
        })
      }

      await createUserProfile(userCredential.user, signUpData)
      await sendEmailVerification(userCredential.user)

      // Track event
      if (process.client && window.gtag) {
        window.gtag('event', 'sign_up', {
          method: 'email',
          user_id: userCredential.user.uid
        })
      }

      return userCredential
    } catch (error: any) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }
  }

  const signInWithGoogle = async (tenantId?: string): Promise<UserCredential> => {
    try {
      authError.value = null

      const userCredential = await signInWithPopup($firebaseAuth, googleProvider)

      // Check if profile exists
      const existingProfile = await loadUserProfile(userCredential.user.uid)
      if (!existingProfile) {
        await createUserProfile(userCredential.user, { tenantId })
      }

      // Track event
      if (process.client && window.gtag) {
        window.gtag('event', 'login', {
          method: 'google',
          user_id: userCredential.user.uid
        })
      }

      return userCredential
    } catch (error: any) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }
  }

  const signInWithPhone = async (phoneNumber: string, recaptchaContainerId?: string): Promise<ConfirmationResult> => {
    try {
      authError.value = null

      if (!recaptchaVerifier) {
        initializeRecaptcha(recaptchaContainerId)
      }

      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA の初期化に失敗しました')
      }

      return await signInWithPhoneNumber($firebaseAuth, phoneNumber, recaptchaVerifier)
    } catch (error: any) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    try {
      authError.value = null
      await sendPasswordResetEmail($firebaseAuth, email)
    } catch (error: any) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }
  }

  // Permission Management
  const hasPermission = (permission: string): boolean => {
    if (!profile.value) return false

    if (profile.value.role === 'admin' || profile.value.permissions.includes('*')) {
      return true
    }

    return profile.value.permissions.includes(permission)
  }

  const hasRole = (role: UserProfile['role']): boolean => {
    return profile.value?.role === role
  }

  const isInTenant = (tenantId: string): boolean => {
    return profile.value?.tenantId === tenantId
  }

  // Token Management
  const getAuthToken = async (forceRefresh: boolean = false): Promise<string | null> => {
    if (!authStore.user) return null

    try {
      return await getIdToken(authStore.user, forceRefresh)
    } catch (error) {
      console.error('Failed to get auth token:', error)
      return null
    }
  }

  // Error Handling
  const getAuthErrorMessage = (error: any): string => {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'ユーザーが見つかりません',
      'auth/wrong-password': 'パスワードが正しくありません',
      'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
      'auth/weak-password': 'パスワードが短すぎます（6文字以上）',
      'auth/invalid-email': 'メールアドレスの形式が正しくありません',
      'auth/too-many-requests': '試行回数が多すぎます。しばらく待ってから再試行してください',
      'auth/network-request-failed': 'ネットワークエラーが発生しました',
      'auth/popup-closed-by-user': 'ポップアップが閉じられました'
    }

    return errorMessages[error.code] || error.message || '認証エラーが発生しました'
  }

  // Auth State Listener
  onMounted(() => {
    const unsubscribe = onAuthStateChanged($firebaseAuth, async (user) => {
      if (user) {
        await loadUserProfile(user.uid)
      } else {
        profile.value = null
        tenant.value = null
      }
    })

    onUnmounted(() => {
      unsubscribe()
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
      }
    })
  })

  return {
    // Original store state
    user: computed(() => authStore.user),
    currentUser: computed(() => authStore.user), // エイリアスとして追加
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error || authError.value),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userDisplayName: computed(() => authStore.userDisplayName),
    userEmail: computed(() => authStore.userEmail),

    // Enhanced state
    profile: readonly(profile),
    tenant: readonly(tenant),
    authError: readonly(authError),

    // Original store actions
    login: authStore.login,
    register: authStore.register,
    loginWithGoogle: authStore.loginWithGoogle,
    logout: authStore.logout,
    updateUserProfile: authStore.updateUserProfile,
    clearError: authStore.clearError,
    initializeAuth: authStore.initializeAuth,

    // Enhanced authentication methods
    signUpWithEmail,
    signInWithGoogle,
    signInWithPhone,
    resetPassword,

    // Profile management
    loadUserProfile,
    createUserProfile,

    // Permission management
    hasPermission,
    hasRole,
    isInTenant,

    // Token management
    getAuthToken,

    // Utilities
    initializeRecaptcha,
    getAuthErrorMessage
  }
}
