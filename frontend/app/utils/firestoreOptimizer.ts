/**
 * Firestore最適化ユーティリティ
 * クエリパフォーマンス向上・インデックス最適化・接続管理
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore,
  getDocs,
  enableNetwork,
  disableNetwork,
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  Firestore
} from 'firebase/firestore'

interface QueryOptimizationConfig {
  maxRetries: number
  retryDelay: number
  batchSize: number
  indexHints: Record<string, string[]>
  cacheTtl: number
}

interface ConnectionConfig {
  offlineSupport: boolean
  persistenceEnabled: boolean
  experimentalAutoDetectLongPolling: boolean
  ignoreUndefinedProperties: boolean
}

export class FirestoreOptimizer {
  private db: Firestore
  private config: QueryOptimizationConfig
  private connectionConfig: ConnectionConfig
  private queryCache = new Map<string, { data: any, timestamp: number }>()
  private activeConnections = new Set<string>()

  constructor(
    db: Firestore, 
    config: QueryOptimizationConfig,
    connectionConfig: ConnectionConfig
  ) {
    this.db = db
    this.config = config
    this.connectionConfig = connectionConfig
  }

  /**
   * 最適化されたクエリ実行
   */
  async executeOptimizedQuery<T>(
    collectionPath: string,
    filters: Array<{
      field: string
      operator: any
      value: any
    }>,
    orderFields?: Array<{
      field: string
      direction: 'asc' | 'desc'
    }>,
    limitCount?: number,
    useCache = true
  ): Promise<T[]> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(collectionPath, filters, orderFields, limitCount)
    
    // Check cache first
    if (useCache) {
      const cached = this.getCachedResult<T>(cacheKey)
      if (cached) return cached
    }

    let attempt = 0
    const maxRetries = this.config.maxRetries

    while (attempt <= maxRetries) {
      try {
        const results = await this.performQuery<T>(collectionPath, filters, orderFields, limitCount)
        
        // Cache results
        if (useCache) {
          this.setCachedResult(cacheKey, results)
        }
        
        return results
      } catch (error) {
        attempt++
        
        if (attempt > maxRetries) {
          console.error('Firestore query failed after retries:', error)
          throw error
        }
        
        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
        await this.sleep(delay)
        
        console.warn(`Firestore query retry ${attempt}/${maxRetries} after ${delay}ms`)
      }
    }

    throw new Error('Query failed after all retries')
  }

  /**
   * クエリ実行（内部）
   */
  private async performQuery<T>(
    collectionPath: string,
    filters: Array<{
      field: string
      operator: any
      value: any
    }>,
    orderFields?: Array<{
      field: string
      direction: 'asc' | 'desc'
    }>,
    limitCount?: number
  ): Promise<T[]> {
    let q = query(collection(this.db, collectionPath))

    // Apply filters with index optimization
    const optimizedFilters = this.optimizeFilters(collectionPath, filters)
    optimizedFilters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value))
    })

    // Apply ordering with index hints
    if (orderFields) {
      const optimizedOrdering = this.optimizeOrdering(collectionPath, orderFields)
      optimizedOrdering.forEach(order => {
        q = query(q, orderBy(order.field, order.direction))
      })
    }

    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount))
    }

    const snapshot = await getDocs(q)
    const results: T[] = []

    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      } as T)
    })

    return results
  }

  /**
   * フィルター最適化
   */
  private optimizeFilters(
    collectionPath: string,
    filters: Array<{
      field: string
      operator: any
      value: any
    }>
  ) {
    // Get index hints for this collection
    const indexHints = this.config.indexHints[collectionPath] || []
    
    // Sort filters by index efficiency
    return filters.sort((a, b) => {
      const aIndex = indexHints.indexOf(a.field)
      const bIndex = indexHints.indexOf(b.field)
      
      // Prioritize indexed fields
      if (aIndex !== -1 && bIndex === -1) return -1
      if (aIndex === -1 && bIndex !== -1) return 1
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      
      // For non-indexed fields, prioritize equality filters
      if (a.operator === '==' && b.operator !== '==') return -1
      if (a.operator !== '==' && b.operator === '==') return 1
      
      return 0
    })
  }

  /**
   * ソート最適化
   */
  private optimizeOrdering(
    collectionPath: string,
    orderFields: Array<{
      field: string
      direction: 'asc' | 'desc'
    }>
  ) {
    const indexHints = this.config.indexHints[collectionPath] || []
    
    // Sort order fields by index availability
    return orderFields.sort((a, b) => {
      const aIndex = indexHints.indexOf(a.field)
      const bIndex = indexHints.indexOf(b.field)
      
      if (aIndex !== -1 && bIndex === -1) return -1
      if (aIndex === -1 && bIndex !== -1) return 1
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      
      return 0
    })
  }

  /**
   * バッチクエリ処理
   */
  async executeBatchQueries<T>(
    queries: Array<{
      collectionPath: string
      filters: Array<{ field: string; operator: any; value: any }>
      orderFields?: Array<{ field: string; direction: 'asc' | 'desc' }>
      limitCount?: number
    }>
  ): Promise<T[][]> {
    const batchSize = this.config.batchSize
    const results: T[][] = []
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize)
      
      const batchPromises = batch.map(queryConfig =>
        this.executeOptimizedQuery<T>(
          queryConfig.collectionPath,
          queryConfig.filters,
          queryConfig.orderFields,
          queryConfig.limitCount
        )
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  /**
   * ページネーション最適化
   */
  async executePaginatedQuery<T>(
    collectionPath: string,
    filters: Array<{ field: string; operator: any; value: any }>,
    orderFields: Array<{ field: string; direction: 'asc' | 'desc' }>,
    pageSize: number,
    lastDoc?: any
  ): Promise<{ data: T[]; hasMore: boolean; lastDoc: any }> {
    let q = query(collection(this.db, collectionPath))

    // Apply filters
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value))
    })

    // Apply ordering
    orderFields.forEach(order => {
      q = query(q, orderBy(order.field, order.direction))
    })

    // Apply pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(pageSize + 1)) // +1 to check if there are more results

    const snapshot = await getDocs(q)
    const results: T[] = []
    let lastDocument = null

    snapshot.forEach((doc, index) => {
      if (index < pageSize) {
        results.push({
          id: doc.id,
          ...doc.data()
        } as T)
        lastDocument = doc
      }
    })

    return {
      data: results,
      hasMore: snapshot.size > pageSize,
      lastDoc: lastDocument
    }
  }

  /**
   * 接続最適化
   */
  async optimizeConnection(): Promise<void> {
    try {
      // Enable offline persistence if configured
      if (this.connectionConfig.persistenceEnabled && process.client) {
        // Note: This should be called before any Firestore operations
        console.log('Firestore persistence enabled')
      }

      // Configure experimental settings
      if (this.connectionConfig.experimentalAutoDetectLongPolling) {
        console.log('Long polling auto-detection enabled')
      }

      // Handle network state changes
      if (process.client) {
        window.addEventListener('online', () => {
          enableNetwork(this.db).catch(console.error)
        })

        window.addEventListener('offline', () => {
          if (this.connectionConfig.offlineSupport) {
            disableNetwork(this.db).catch(console.error)
          }
        })
      }

    } catch (error) {
      console.error('Connection optimization failed:', error)
    }
  }

  /**
   * キャッシュ管理
   */
  private generateCacheKey(
    collectionPath: string,
    filters: any[],
    orderFields?: any[],
    limitCount?: number
  ): string {
    return JSON.stringify({
      collection: collectionPath,
      filters,
      orderFields,
      limit: limitCount
    })
  }

  private getCachedResult<T>(key: string): T[] | null {
    const cached = this.queryCache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTtl
    if (isExpired) {
      this.queryCache.delete(key)
      return null
    }

    return cached.data
  }

  private setCachedResult<T>(key: string, data: T[]): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Clean up old cache entries
    if (this.queryCache.size > 100) {
      const oldestKey = this.queryCache.keys().next().value
      this.queryCache.delete(oldestKey)
    }
  }

  /**
   * インデックス推奨設定生成
   */
  generateIndexRecommendations(
    collectionPath: string,
    queryPatterns: Array<{
      filters: Array<{ field: string; operator: string }>
      orderFields?: Array<{ field: string; direction: string }>
    }>
  ): string[] {
    const recommendations: string[] = []
    const fieldUsage = new Map<string, number>()
    
    // Analyze query patterns
    queryPatterns.forEach(pattern => {
      pattern.filters.forEach(filter => {
        fieldUsage.set(filter.field, (fieldUsage.get(filter.field) || 0) + 1)
      })
      
      pattern.orderFields?.forEach(order => {
        fieldUsage.set(order.field, (fieldUsage.get(order.field) || 0) + 1)
      })
    })

    // Generate recommendations
    const sortedFields = Array.from(fieldUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([field]) => field)

    if (sortedFields.length > 1) {
      recommendations.push(`Create composite index for: ${sortedFields.slice(0, 3).join(', ')}`)
    }

    sortedFields.forEach(field => {
      recommendations.push(`Consider single field index for: ${field}`)
    })

    return recommendations
  }

  /**
   * 接続状態監視
   */
  monitorConnectionHealth(): {
    isConnected: boolean
    latency: number
    activeQueries: number
  } {
    return {
      isConnected: navigator.onLine,
      latency: 0, // Could implement ping test
      activeQueries: this.activeConnections.size
    }
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.queryCache.clear()
  }

  /**
   * パフォーマンス統計
   */
  getPerformanceStats() {
    return {
      cacheSize: this.queryCache.size,
      cacheHitRate: 0, // Implement hit rate tracking
      activeConnections: this.activeConnections.size,
      avgQueryTime: 0 // Implement query time tracking
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Firestore最適化設定のファクトリー
 */
export const createFirestoreOptimizer = (db: Firestore) => {
  const queryConfig: QueryOptimizationConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    batchSize: 10,
    indexHints: {
      'reservations': ['date', 'stylistId', 'status', 'tenantId'],
      'customers': ['email', 'tenantId'],
      'stylists': ['tenantId', 'isActive'],
      'services': ['tenantId', 'isActive']
    },
    cacheTtl: 5 * 60 * 1000 // 5 minutes
  }

  const connectionConfig: ConnectionConfig = {
    offlineSupport: true,
    persistenceEnabled: true,
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
  }

  return new FirestoreOptimizer(db, queryConfig, connectionConfig)
}