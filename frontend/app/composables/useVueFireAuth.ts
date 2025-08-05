/**
 * VueFire統合認証Composable
 * VueFireモジュールと統合したFirebase認証管理
 */

import { getCurrentUser, useFirebaseAuth } from 'vuefire'
import type { User } from 'firebase/auth'

export interface VueFireAuthReturn {
  user: Ref<User | null | undefined>
  isAuthenticated: ComputedRef<boolean>
  isLoading: Ref<boolean>
  signOut: () => Promise<void>
  getCurrentUserData: () => Promise<User | null>
  checkAuthState: () => Promise<boolean>
}

export function useVueFireAuth(): VueFireAuthReturn {
  const auth = useFirebaseAuth()
  const user = ref<User | null | undefined>(undefined)
  const isLoading = ref(true)

  // VueFire getCurrentUser を使用
  const initializeAuth = async () => {
    try {
      isLoading.value = true
      const currentUser = await getCurrentUser()
      user.value = currentUser
      console.log('🔥 VueFire Auth initialized:', currentUser ? 'Authenticated' : 'Not authenticated')
    } catch (error) {
      console.error('🔥 VueFire Auth initialization error:', error)
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  // 認証状態の監視
  const isAuthenticated = computed(() => {
    return !!user.value && user.value !== undefined
  })

  // サインアウト
  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase Auth not available')
    }

    try {
      await auth.signOut() 
      user.value = null
      console.log('🔥 VueFire Auth: Signed out successfully')
    } catch (error) {
      console.error('🔥 VueFire Auth sign out error:', error)
      throw error
    }
  }

  // 現在のユーザーデータ取得
  const getCurrentUserData = async (): Promise<User | null> => {
    try {
      const currentUser = await getCurrentUser()
      user.value = currentUser
      return currentUser
    } catch (error) {
      console.error('🔥 VueFire Auth getCurrentUser error:', error)
      return null
    }
  }

  // 認証状態チェック
  const checkAuthState = async (): Promise<boolean> => {
    try {
      const currentUser = await getCurrentUser()
      user.value = currentUser
      return !!currentUser
    } catch (error) {
      console.error('🔥 VueFire Auth state check error:', error)
      user.value = null
      return false
    }
  }

  // 初期化
  onMounted(() => {
    initializeAuth()
  })

  // 認証状態の変更を監視（VueFire方式）
  if (auth) {
    auth.onAuthStateChanged((newUser) => {
      user.value = newUser
      isLoading.value = false
      console.log('🔥 VueFire Auth state changed:', newUser ? 'Authenticated' : 'Not authenticated')
    })
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading: readonly(isLoading),
    signOut,
    getCurrentUserData,
    checkAuthState
  }
}

/**
 * VueFire Firestore Composable
 * VueFireモジュールと統合したFirestore操作
 */
export function useVueFirestore() {
  const db = useFirestore()
  
  if (!db) {
    throw new Error('Firestore not available - ensure VueFire is properly configured')
  }

  console.log('🔥 VueFire Firestore initialized')
  
  return {
    db,
    // VueFire の useDocument, useCollection などが使用可能
  }
}

/**
 * 既存コードとの互換性を保つためのエイリアス
 */
export function useFirebaseCompat() {
  const auth = useFirebaseAuth()
  const db = useFirestore()
  
  return {
    // 既存のアクセサ名での提供
    $firebaseAuth: auth,
    $firestore: db,
    // VueFire統合表示
    integration: 'vuefire'
  }
}