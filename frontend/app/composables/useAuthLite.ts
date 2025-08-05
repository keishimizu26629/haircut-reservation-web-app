/**
 * 軽量版認証Composable - 予約画面専用
 * パフォーマンス最適化のため、必要最小限の機能のみ実装
 */
import { getCurrentUser } from 'vuefire'
import { signOut } from 'firebase/auth'

export const useAuthLite = () => {
  const { $firebaseAuth } = useNuxtApp()
  
  // 軽量な状態管理
  const user = ref(null)
  const loading = ref(true)
  
  // Firebase認証状態の監視（VueFireの最適化された方法）
  const initAuth = async () => {
    try {
      user.value = await getCurrentUser()
    } catch (error) {
      console.warn('認証状態の取得に失敗:', error)
      user.value = null
    } finally {
      loading.value = false
    }
  }
  
  // 簡単なログアウト処理
  const logout = async () => {
    try {
      await signOut($firebaseAuth)
      user.value = null
      await navigateTo('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
      // エラー時でもログインページへ
      await navigateTo('/login')
    }
  }
  
  // 管理者判定（簡易版）
  const isAdmin = computed(() => {
    return user.value?.role === 'admin' || 
           user.value?.isAdmin || 
           user.value?.customClaims?.admin === true
  })
  
  // 初期化
  onMounted(() => {
    initAuth()
  })
  
  return {
    user: readonly(user),
    loading: readonly(loading),
    signOut: logout,
    isAdmin: readonly(isAdmin)
  }
}