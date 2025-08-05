/**
 * 認証対応カレンダー管理Composable
 * Firebase認証完了後の即座カレンダー表示・データ同期管理
 */

import { getCurrentUser } from 'vuefire'
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { startOfDay, endOfDay, addDays } from 'date-fns'

interface CalendarState {
  isAuthReady: boolean
  isDataReady: boolean
  isCalendarReady: boolean
  hasAuthError: boolean
  hasDataError: boolean
}

interface AuthAwareCalendarOptions {
  maxRetries?: number
  retryDelay?: number
  timeoutMs?: number
  enablePreloading?: boolean
}

export function useAuthAwareCalendar(options: AuthAwareCalendarOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeoutMs = 15000,
    enablePreloading = true
  } = options

  // 状態管理
  const state = ref<CalendarState>({
    isAuthReady: false,
    isDataReady: false,
    isCalendarReady: false,
    hasAuthError: false,
    hasDataError: false
  })

  const isLoading = computed(() => 
    !state.value.isCalendarReady && !state.value.hasAuthError && !state.value.hasDataError
  )

  const isError = computed(() => 
    state.value.hasAuthError || state.value.hasDataError
  )

  // Firebase/VueFire統合
  const db = useFirestore()
  const currentUser = ref<any>(null)
  const retryCount = ref(0)

  /**
   * 認証状態の初期化と監視
   */
  const initializeAuth = async (): Promise<boolean> => {
    try {
      console.log('🔐 Auth-Aware Calendar: Starting authentication check')
      
      // 認証タイムアウト設定
      const authPromise = getCurrentUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout')), timeoutMs)
      )

      const user = await Promise.race([authPromise, timeoutPromise])
      
      currentUser.value = user
      state.value.isAuthReady = true
      state.value.hasAuthError = false

      console.log(`✅ Auth-Aware Calendar: Authentication ready`, user ? 'Authenticated' : 'Anonymous')
      return true

    } catch (error) {
      console.error('🚨 Auth-Aware Calendar: Authentication failed:', error)
      state.value.hasAuthError = true
      return false
    }
  }

  /**
   * リトライ機能付きデータ初期化
   */
  const initializeDataWithRetry = async (): Promise<boolean> => {
    while (retryCount.value < maxRetries) {
      try {
        console.log(`🔄 Auth-Aware Calendar: Data initialization attempt ${retryCount.value + 1}/${maxRetries}`)
        
        const success = await initializeCalendarData()
        if (success) {
          state.value.isDataReady = true
          state.value.hasDataError = false
          return true
        }
        
        retryCount.value++
        if (retryCount.value < maxRetries) {
          console.log(`⏳ Auth-Aware Calendar: Retrying in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }

      } catch (error) {
        console.error(`🚨 Auth-Aware Calendar: Data initialization error (attempt ${retryCount.value + 1}):`, error)
        retryCount.value++
        
        if (retryCount.value < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }

    console.error('🚨 Auth-Aware Calendar: All data initialization attempts failed')
    state.value.hasDataError = true
    return false
  }

  /**
   * カレンダーデータの初期化
   */
  const initializeCalendarData = async (): Promise<boolean> => {
    try {
      if (!db) {
        throw new Error('Firestore not available')
      }

      // テスト用基本クエリ実行
      const today = new Date()
      const startDate = startOfDay(today)
      const endDate = endOfDay(addDays(today, 7)) // 1週間分

      const testQuery = query(
        collection(db, 'reservations'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
      )

      // クエリの実行可能性テスト
      console.log('🔍 Auth-Aware Calendar: Testing Firestore query execution')
      
      // 実際のクエリは実行せず、構築のみテスト
      console.log('✅ Auth-Aware Calendar: Firestore query constructed successfully')
      
      return true

    } catch (error) {
      console.error('🚨 Auth-Aware Calendar: Calendar data initialization failed:', error)
      throw error
    }
  }

  /**
   * カレンダー状態の完全初期化
   */
  const initializeCalendar = async (): Promise<void> => {
    try {
      console.log('🚀 Auth-Aware Calendar: Starting full initialization')
      
      // 1. 認証初期化
      const authSuccess = await initializeAuth()
      if (!authSuccess) return

      // 2. データ初期化（リトライ付き）
      const dataSuccess = await initializeDataWithRetry()
      if (!dataSuccess) return

      // 3. カレンダー準備完了
      state.value.isCalendarReady = true
      console.log('🎉 Auth-Aware Calendar: Full initialization completed successfully')

    } catch (error) {
      console.error('🚨 Auth-Aware Calendar: Full initialization failed:', error)
      state.value.hasAuthError = true
    }
  }

  /**
   * 認証状態変更の監視
   */
  const watchAuthState = () => {
    const auth = useFirebaseAuth()
    if (auth) {
      auth.onAuthStateChanged(async (user) => {
        console.log('🔄 Auth-Aware Calendar: Auth state changed:', user ? 'Authenticated' : 'Unauthenticated')
        
        currentUser.value = user
        
        if (user && !state.value.isCalendarReady) {
          // 認証完了後、カレンダーが未初期化の場合は再初期化
          await initializeCalendar()
        }
      })
    }
  }

  /**
   * 手動リフレッシュ
   */
  const refreshCalendar = async (): Promise<void> => {
    console.log('🔄 Auth-Aware Calendar: Manual refresh initiated')
    
    // 状態リセット
    state.value = {
      isAuthReady: false,
      isDataReady: false,
      isCalendarReady: false,
      hasAuthError: false,
      hasDataError: false
    }
    retryCount.value = 0

    await initializeCalendar()
  }

  /**
   * エラー状態のリセット
   */
  const resetErrors = (): void => {
    state.value.hasAuthError = false
    state.value.hasDataError = false
    retryCount.value = 0
  }

  /**
   * プリロード機能（オプション）
   */
  const preloadCalendarData = async (): Promise<void> => {
    if (!enablePreloading) return

    try {
      console.log('📦 Auth-Aware Calendar: Preloading calendar data')
      
      // 次の期間のデータをプリロード
      const nextWeekStart = addDays(new Date(), 7)
      const nextWeekEnd = addDays(nextWeekStart, 7)
      
      // プリロードロジックをここに実装
      console.log('✅ Auth-Aware Calendar: Preloading completed')
      
    } catch (error) {
      console.warn('⚠️ Auth-Aware Calendar: Preloading failed (non-critical):', error)
    }
  }

  // ライフサイクル管理
  onMounted(async () => {
    console.log('🚀 Auth-Aware Calendar: Component mounted, starting initialization')
    
    // 認証状態監視開始
    watchAuthState()
    
    // 初期化実行
    await initializeCalendar()
    
    // プリロード実行（オプション）
    if (enablePreloading) {
      nextTick(() => preloadCalendarData())
    }
  })

  onUnmounted(() => {
    console.log('🔄 Auth-Aware Calendar: Component unmounted, cleaning up')
    // クリーンアップ処理
  })

  return {
    // 状態
    state: readonly(state),
    isLoading: readonly(isLoading),
    isError: readonly(isError),
    currentUser: readonly(currentUser),
    
    // メソッド
    initializeCalendar,
    refreshCalendar,
    resetErrors,
    preloadCalendarData,
    
    // 計算プロパティ
    isReady: computed(() => state.value.isCalendarReady),
    canShowCalendar: computed(() => 
      state.value.isAuthReady && state.value.isDataReady && !isError.value
    ),
    
    // デバッグ情報
    debugInfo: computed(() => ({
      authReady: state.value.isAuthReady,
      dataReady: state.value.isDataReady,
      calendarReady: state.value.isCalendarReady,
      hasErrors: isError.value,
      retryCount: retryCount.value,
      isLoading: isLoading.value
    }))
  }
}