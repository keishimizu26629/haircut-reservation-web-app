/**
 * 最適化Firestore Composable
 * 認証完了後の即座データ取得・キャッシュ管理
 */

import { getCurrentUser } from 'vuefire'
import { collection, query, where, orderBy, Timestamp, getDocs, onSnapshot } from 'firebase/firestore'
import { startOfDay, endOfDay, addDays } from 'date-fns'

interface FirestoreCache {
  [key: string]: {
    data: any[]
    timestamp: number
    ttl: number
  }
}

interface OptimizedQueryOptions {
  enableCache?: boolean
  cacheTtl?: number
  prefetchRange?: number
  enableRealtime?: boolean
  maxRetries?: number
}

export function useOptimizedFirestore(options: OptimizedQueryOptions = {}) {
  const {
    enableCache = true,
    cacheTtl = 5 * 60 * 1000, // 5分
    prefetchRange = 14, // 14日間
    enableRealtime = true,
    maxRetries = 3
  } = options

  // キャッシュ管理
  const cache = ref<FirestoreCache>({})
  const activeListeners = new Map<string, () => void>()
  
  // 状態管理
  const isLoading = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')
  const lastSyncTime = ref<number>(0)

  const db = useFirestore()

  /**
   * キャッシュキーの生成
   */
  const generateCacheKey = (
    collection: string,
    startDate: Date,
    endDate: Date,
    userId?: string
  ): string => {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]
    return `${collection}_${start}_${end}_${userId || 'anonymous'}`
  }

  /**
   * キャッシュの有効性チェック
   */
  const isCacheValid = (cacheKey: string): boolean => {
    const cached = cache.value[cacheKey]
    if (!cached) return false
    
    const now = Date.now()
    return now - cached.timestamp < cached.ttl
  }

  /**
   * キャッシュからデータ取得
   */
  const getCachedData = (cacheKey: string): any[] | null => {
    if (!enableCache || !isCacheValid(cacheKey)) return null
    
    console.log(`📦 Firestore Cache: Hit for ${cacheKey}`)
    return cache.value[cacheKey].data
  }

  /**
   * キャッシュにデータ保存
   */
  const setCachedData = (cacheKey: string, data: any[]): void => {
    if (!enableCache) return
    
    cache.value[cacheKey] = {
      data: [...data],
      timestamp: Date.now(),
      ttl: cacheTtl
    }
    
    console.log(`💾 Firestore Cache: Stored ${data.length} items for ${cacheKey}`)
  }

  /**
   * 認証状態取得
   */
  const getCurrentUserSafe = async (): Promise<any> => {
    try {
      return await getCurrentUser()
    } catch (error) {
      console.warn('🔒 Optimized Firestore: Auth check failed:', error)
      return null
    }
  }

  /**
   * 最適化された予約データ取得
   */
  const getReservations = async (
    startDate: Date,
    endDate: Date,
    useCache: boolean = true
  ): Promise<any[]> => {
    try {
      isLoading.value = true
      hasError.value = false

      // 認証確認
      const currentUser = await getCurrentUserSafe()
      const userId = currentUser?.uid

      // キャッシュチェック
      const cacheKey = generateCacheKey('reservations', startDate, endDate, userId)
      if (useCache) {
        const cachedData = getCachedData(cacheKey)
        if (cachedData) {
          isLoading.value = false
          return cachedData
        }
      }

      console.log(`🔍 Firestore Query: Fetching reservations ${startDate.toDateString()} - ${endDate.toDateString()}`)

      // Firestoreクエリ実行
      const reservationsRef = collection(db, 'reservations')
      const q = query(
        reservationsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      )

      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // キャッシュに保存
      setCachedData(cacheKey, data)
      lastSyncTime.value = Date.now()

      console.log(`✅ Firestore Query: Retrieved ${data.length} reservations`)
      return data

    } catch (error) {
      console.error('🚨 Firestore Query Error:', error)
      hasError.value = true
      errorMessage.value = error.message || 'データ取得に失敗しました'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * リアルタイムリスナーの設定
   */
  const setupRealtimeListener = (
    startDate: Date,
    endDate: Date,
    callback: (data: any[]) => void
  ): string => {
    try {
      const listenerId = `listener_${Date.now()}_${Math.random()}`
      
      const reservationsRef = collection(db, 'reservations')
      const q = query(
        reservationsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      )

      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          console.log(`🔄 Firestore Realtime: Updated ${data.length} reservations`)
          
          // キャッシュ更新
          const currentUser = getCurrentUserSafe()
          const cacheKey = generateCacheKey('reservations', startDate, endDate, currentUser?.uid)
          setCachedData(cacheKey, data)
          
          callback(data)
          lastSyncTime.value = Date.now()
        },
        (error) => {
          console.error('🚨 Firestore Realtime Error:', error)
          hasError.value = true
          errorMessage.value = error.message || 'リアルタイム同期に失敗しました'
        }
      )

      activeListeners.set(listenerId, unsubscribe)
      console.log(`👂 Firestore Realtime: Listener ${listenerId} started`)
      
      return listenerId

    } catch (error) {
      console.error('🚨 Firestore Realtime Setup Error:', error)
      throw error
    }
  }

  /**
   * リアルタイムリスナーの停止
   */
  const stopRealtimeListener = (listenerId: string): void => {
    const unsubscribe = activeListeners.get(listenerId)
    if (unsubscribe) {
      unsubscribe()
      activeListeners.delete(listenerId)
      console.log(`🔇 Firestore Realtime: Listener ${listenerId} stopped`)
    }
  }

  /**
   * データプリフェッチ
   */
  const prefetchData = async (baseDate: Date = new Date()): Promise<void> => {
    try {
      console.log('📦 Firestore Prefetch: Starting data preload')
      
      const startDate = startOfDay(baseDate)
      const endDate = endOfDay(addDays(baseDate, prefetchRange))
      
      await getReservations(startDate, endDate, false) // キャッシュを使わずに取得
      
      console.log('✅ Firestore Prefetch: Completed successfully')
    } catch (error) {
      console.warn('⚠️ Firestore Prefetch: Failed (non-critical):', error)
    }
  }

  /**
   * キャッシュクリア
   */
  const clearCache = (): void => {
    cache.value = {}
    console.log('🗑️ Firestore Cache: Cleared all cached data')
  }

  /**
   * エラーリセット
   */
  const resetError = (): void => {
    hasError.value = false
    errorMessage.value = ''
  }

  /**
   * 全リスナー停止
   */
  const stopAllListeners = (): void => {
    activeListeners.forEach((unsubscribe, listenerId) => {
      unsubscribe()
      console.log(`🔇 Firestore: Stopped listener ${listenerId}`)
    })
    activeListeners.clear()
  }

  // クリーンアップ
  onUnmounted(() => {
    stopAllListeners()
    console.log('🧹 Firestore: Cleanup completed')
  })

  return {
    // データ取得
    getReservations,
    prefetchData,
    
    // リアルタイム
    setupRealtimeListener,
    stopRealtimeListener,
    
    // 状態管理
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
    errorMessage: readonly(errorMessage),
    lastSyncTime: readonly(lastSyncTime),
    
    // キャッシュ管理
    clearCache,
    getCachedData,
    isCacheValid,
    
    // エラー処理
    resetError,
    
    // クリーンアップ
    stopAllListeners,
    
    // デバッグ情報
    debugInfo: computed(() => ({
      cacheSize: Object.keys(cache.value).length,
      activeListeners: activeListeners.size,
      lastSync: lastSyncTime.value,
      hasError: hasError.value,
      isLoading: isLoading.value
    }))
  }
}