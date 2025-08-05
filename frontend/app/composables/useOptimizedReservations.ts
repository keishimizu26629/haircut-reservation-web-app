/**
 * 最適化された予約管理Composable
 * パフォーマンス最適化・キャッシュ・バッチ処理対応
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch,
  getDocs,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore'
import { useTenant } from '~/composables/useTenant'
import type { Unsubscribe } from 'firebase/firestore'

interface OptimizedReservationData {
  id?: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  customerEmail: string
  serviceIds: string[]
  stylistId: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalPrice: number
  totalDuration: number
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum cache size
}

interface PaginationConfig {
  pageSize: number
  preloadPages: number
}

class ReservationCache {
  private cache = new Map<string, { data: OptimizedReservationData[], timestamp: number }>()
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.config = config
  }

  set(key: string, data: OptimizedReservationData[]): void {
    // LRU cache implementation
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      timestamp: Date.now()
    })
  }

  get(key: string): OptimizedReservationData[] | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.config.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Implement hit rate tracking if needed
    }
  }
}

export const useOptimizedReservations = () => {
  // Reactive State
  const reservations = ref<OptimizedReservationData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const totalCount = ref(0)

  // Configuration
  const cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50 // 50 different queries
  }

  const paginationConfig: PaginationConfig = {
    pageSize: 50,
    preloadPages: 2
  }

  // Cache instance
  const cache = new ReservationCache(cacheConfig)
  
  // Firebase
  const { $firestore } = useNuxtApp()
  const { getCurrentTenant, getTenantPath } = useTenant()
  
  // Unsubscribe functions
  let unsubscribes: Unsubscribe[] = []

  /**
   * 期間に基づく最適化されたクエリ
   */
  const loadReservationsByDateRange = async (
    startDate: string,
    endDate: string,
    options: {
      useCache?: boolean
      realtime?: boolean
      stylistId?: string
      status?: string[]
    } = {}
  ) => {
    const {
      useCache = true,
      realtime = true,
      stylistId,
      status
    } = options

    loading.value = true
    error.value = null

    try {
      const tenant = getCurrentTenant()
      const reservationsPath = getTenantPath('reservations')
      
      // Generate cache key
      const cacheKey = `${tenant.id}-${startDate}-${endDate}-${stylistId || 'all'}-${status?.join(',') || 'all'}`
      
      // Check cache first
      if (useCache) {
        const cached = cache.get(cacheKey)
        if (cached) {
          reservations.value = cached
          loading.value = false
          return cached
        }
      }

      // Build query
      const reservationsRef = collection($firestore, reservationsPath)
      let q = query(
        reservationsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      )

      // Add additional filters
      if (stylistId) {
        q = query(q, where('stylistId', '==', stylistId))
      }

      if (status && status.length > 0) {
        q = query(q, where('status', 'in', status))
      }

      if (realtime) {
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newReservations: OptimizedReservationData[] = []
          
          snapshot.forEach((doc) => {
            newReservations.push({
              id: doc.id,
              ...doc.data()
            } as OptimizedReservationData)
          })
          
          reservations.value = newReservations
          totalCount.value = newReservations.length
          
          // Update cache
          if (useCache) {
            cache.set(cacheKey, newReservations)
          }

          loading.value = false
        }, (err) => {
          console.error('リアルタイムリスナーエラー:', err)
          error.value = 'データの取得に失敗しました'
          loading.value = false
        })

        unsubscribes.push(unsubscribe)
      } else {
        // One-time fetch
        const snapshot = await getDocs(q)
        const newReservations: OptimizedReservationData[] = []
        
        snapshot.forEach((doc) => {
          newReservations.push({
            id: doc.id,
            ...doc.data()
          } as OptimizedReservationData)
        })
        
        reservations.value = newReservations
        totalCount.value = newReservations.length
        
        // Update cache
        if (useCache) {
          cache.set(cacheKey, newReservations)
        }

        loading.value = false
      }

    } catch (err) {
      console.error('予約データ取得エラー:', err)
      error.value = 'データの取得に失敗しました'
      loading.value = false
    }
  }

  /**
   * バッチ操作による一括更新
   */
  const batchUpdateReservations = async (
    updates: Array<{
      id: string
      data: Partial<OptimizedReservationData>
    }>
  ) => {
    loading.value = true
    
    try {
      const reservationsPath = getTenantPath('reservations')
      const batch = writeBatch($firestore)
      
      updates.forEach(({ id, data }) => {
        const docRef = doc($firestore, reservationsPath, id)
        batch.update(docRef, {
          ...data,
          updatedAt: new Date()
        })
      })
      
      await batch.commit()
      
      // Clear cache to force refresh
      cache.clear()
      
      loading.value = false
      return true
      
    } catch (err) {
      console.error('バッチ更新エラー:', err)
      error.value = 'バッチ更新に失敗しました'
      loading.value = false
      throw err
    }
  }

  /**
   * インデックス最適化されたクエリ
   */
  const loadReservationsByIndex = async (
    indexType: 'stylist' | 'status' | 'customer',
    value: string,
    dateRange?: { start: string; end: string }
  ) => {
    loading.value = true
    error.value = null

    try {
      const reservationsPath = getTenantPath('reservations')
      const reservationsRef = collection($firestore, reservationsPath)
      
      let q = query(reservationsRef)
      
      // Add index-based filter
      switch (indexType) {
        case 'stylist':
          q = query(q, where('stylistId', '==', value))
          break
        case 'status':
          q = query(q, where('status', '==', value))
          break
        case 'customer':
          q = query(q, where('customerEmail', '==', value))
          break
      }
      
      // Add date range if specified
      if (dateRange) {
        q = query(
          q,
          where('date', '>=', dateRange.start),
          where('date', '<=', dateRange.end)
        )
      }
      
      q = query(q, orderBy('date', 'desc'), limit(paginationConfig.pageSize))
      
      const snapshot = await getDocs(q)
      const results: OptimizedReservationData[] = []
      
      snapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data()
        } as OptimizedReservationData)
      })
      
      reservations.value = results
      hasMore.value = results.length === paginationConfig.pageSize
      loading.value = false
      
      return results
      
    } catch (err) {
      console.error('インデックスクエリエラー:', err)
      error.value = 'データの取得に失敗しました'
      loading.value = false
      throw err
    }
  }

  /**
   * メモリ使用量最適化
   */
  const optimizeMemoryUsage = () => {
    // Clear old cache entries
    cache.clear()
    
    // Limit reservations in memory
    if (reservations.value.length > 1000) {
      reservations.value = reservations.value.slice(0, 500)
    }
  }

  /**
   * ネットワーク状態管理
   */
  const handleNetworkState = async (online: boolean) => {
    try {
      if (online) {
        await enableNetwork($firestore)
      } else {
        await disableNetwork($firestore)
      }
    } catch (err) {
      console.error('ネットワーク状態変更エラー:', err)
    }
  }

  // Computed Properties
  const reservationsByDate = computed(() => {
    const grouped: Record<string, OptimizedReservationData[]> = {}
    
    reservations.value.forEach(reservation => {
      if (!grouped[reservation.date]) {
        grouped[reservation.date] = []
      }
      grouped[reservation.date].push(reservation)
    })
    
    return grouped
  })

  const reservationsByStatus = computed(() => {
    const grouped: Record<string, OptimizedReservationData[]> = {}
    
    reservations.value.forEach(reservation => {
      if (!grouped[reservation.status]) {
        grouped[reservation.status] = []
      }
      grouped[reservation.status].push(reservation)
    })
    
    return grouped
  })

  const cacheStats = computed(() => cache.getStats())

  // Cleanup
  onUnmounted(() => {
    unsubscribes.forEach(unsubscribe => unsubscribe())
    unsubscribes = []
    cache.clear()
  })

  // Performance monitoring
  const getPerformanceMetrics = () => {
    return {
      reservationsCount: reservations.value.length,
      cacheStats: cacheStats.value,
      activeListeners: unsubscribes.length,
      memoryUsage: process.client ? (performance as any).memory : null
    }
  }

  return {
    // State
    reservations: readonly(reservations),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    totalCount: readonly(totalCount),

    // Computed
    reservationsByDate,
    reservationsByStatus,
    cacheStats,

    // Methods
    loadReservationsByDateRange,
    loadReservationsByIndex,
    batchUpdateReservations,
    optimizeMemoryUsage,
    handleNetworkState,
    getPerformanceMetrics
  }
}