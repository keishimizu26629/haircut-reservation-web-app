/**
 * パフォーマンス監視Composable
 * システム全体のパフォーマンス測定・監視・最適化
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

interface PerformanceMetrics {
  // Page Performance
  pageLoadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  
  // JavaScript Performance
  heapUsed: number
  heapTotal: number
  jsHeapSizeLimit: number
  
  // Network Performance
  networkType: string
  downlink: number
  effectiveType: string
  
  // Custom Metrics
  componentRenderTime: Record<string, number>
  apiResponseTime: Record<string, number>
  firestoreQueryTime: Record<string, number>
}

interface PerformanceConfig {
  trackingEnabled: boolean
  samplingRate: number
  reportingInterval: number
  thresholds: {
    pageLoad: number
    apiResponse: number
    componentRender: number
    memoryUsage: number
  }
}

export const usePerformanceMonitor = () => {
  // Reactive State
  const metrics = ref<Partial<PerformanceMetrics>>({})
  const isTracking = ref(false)
  const warnings = ref<string[]>([])
  
  // Configuration
  const config: PerformanceConfig = {
    trackingEnabled: process.env.NODE_ENV !== 'production',
    samplingRate: 0.1, // 10% sampling in production
    reportingInterval: 30000, // 30 seconds
    thresholds: {
      pageLoad: 3000, // 3 seconds
      apiResponse: 1000, // 1 second
      componentRender: 16, // 60fps = 16ms per frame
      memoryUsage: 50 * 1024 * 1024 // 50MB
    }
  }

  let performanceObserver: PerformanceObserver | null = null
  let reportingInterval: NodeJS.Timeout | null = null

  /**
   * Web Vitals 測定
   */
  const measureWebVitals = () => {
    if (!process.client || !window.performance) return

    // Navigation Timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      metrics.value.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart
      metrics.value.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
    }

    // Performance Observer for Web Vitals
    if ('PerformanceObserver' in window) {
      performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                metrics.value.firstContentfulPaint = entry.startTime
              }
              break
            case 'largest-contentful-paint':
              metrics.value.largestContentfulPaint = entry.startTime
              break
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                metrics.value.cumulativeLayoutShift = 
                  (metrics.value.cumulativeLayoutShift || 0) + (entry as any).value
              }
              break
          }
        })
      })

      try {
        performanceObserver.observe({ 
          entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] 
        })
      } catch (e) {
        console.warn('Performance Observer not supported:', e)
      }
    }
  }

  /**
   * メモリ使用量測定
   */
  const measureMemoryUsage = () => {
    if (!process.client) return

    const memory = (performance as any).memory
    if (memory) {
      metrics.value.heapUsed = memory.usedJSHeapSize
      metrics.value.heapTotal = memory.totalJSHeapSize
      metrics.value.jsHeapSizeLimit = memory.jsHeapSizeLimit

      // Memory usage warning
      if (memory.usedJSHeapSize > config.thresholds.memoryUsage) {
        warnings.value.push(`High memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`)
      }
    }
  }

  /**
   * ネットワーク情報測定
   */
  const measureNetworkInfo = () => {
    if (!process.client) return

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      metrics.value.networkType = connection.type || 'unknown'
      metrics.value.downlink = connection.downlink || 0
      metrics.value.effectiveType = connection.effectiveType || 'unknown'
    }
  }

  /**
   * コンポーネントレンダリング時間測定
   */
  const measureComponentRender = (componentName: string, renderFn: () => Promise<void> | void) => {
    return async () => {
      const startTime = performance.now()
      
      try {
        await renderFn()
      } finally {
        const endTime = performance.now()
        const renderTime = endTime - startTime
        
        if (!metrics.value.componentRenderTime) {
          metrics.value.componentRenderTime = {}
        }
        metrics.value.componentRenderTime[componentName] = renderTime

        // Render time warning
        if (renderTime > config.thresholds.componentRender) {
          warnings.value.push(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`)
        }
      }
    }
  }

  /**
   * API レスポンス時間測定
   */
  const measureApiResponse = async <T>(
    apiName: string, 
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      if (!metrics.value.apiResponseTime) {
        metrics.value.apiResponseTime = {}
      }
      metrics.value.apiResponseTime[apiName] = responseTime

      // API response time warning
      if (responseTime > config.thresholds.apiResponse) {
        warnings.value.push(`Slow API response: ${apiName} took ${responseTime.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      if (!metrics.value.apiResponseTime) {
        metrics.value.apiResponseTime = {}
      }
      metrics.value.apiResponseTime[`${apiName}_error`] = responseTime
      
      throw error
    }
  }

  /**
   * Firestore クエリ時間測定
   */
  const measureFirestoreQuery = async <T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await queryFn()
      const endTime = performance.now()
      const queryTime = endTime - startTime
      
      if (!metrics.value.firestoreQueryTime) {
        metrics.value.firestoreQueryTime = {}
      }
      metrics.value.firestoreQueryTime[queryName] = queryTime
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const queryTime = endTime - startTime
      
      if (!metrics.value.firestoreQueryTime) {
        metrics.value.firestoreQueryTime = {}
      }
      metrics.value.firestoreQueryTime[`${queryName}_error`] = queryTime
      
      throw error
    }
  }

  /**
   * パフォーマンス最適化提案
   */
  const getOptimizationSuggestions = (): string[] => {
    const suggestions: string[] = []
    
    if (metrics.value.pageLoadTime && metrics.value.pageLoadTime > config.thresholds.pageLoad) {
      suggestions.push('ページ読み込み時間が遅いです。画像の最適化やコード分割を検討してください。')
    }
    
    if (metrics.value.largestContentfulPaint && metrics.value.largestContentfulPaint > 2500) {
      suggestions.push('LCP（Largest Contentful Paint）が遅いです。重要なリソースの優先読み込みを検討してください。')
    }
    
    if (metrics.value.cumulativeLayoutShift && metrics.value.cumulativeLayoutShift > 0.1) {
      suggestions.push('CLS（Cumulative Layout Shift）の値が高いです。レイアウトシフトを減らしてください。')
    }
    
    if (metrics.value.heapUsed && metrics.value.heapUsed > config.thresholds.memoryUsage) {
      suggestions.push('メモリ使用量が多いです。不要なオブジェクトの削除やガベージコレクションを検討してください。')
    }
    
    const slowComponents = Object.entries(metrics.value.componentRenderTime || {})
      .filter(([_, time]) => time > config.thresholds.componentRender)
    
    if (slowComponents.length > 0) {
      suggestions.push(`レンダリングが遅いコンポーネント: ${slowComponents.map(([name]) => name).join(', ')}`)
    }
    
    return suggestions
  }

  /**
   * パフォーマンス状況の全体評価
   */
  const getPerformanceScore = (): { score: number; grade: string } => {
    let score = 100
    
    // Page load performance
    if (metrics.value.pageLoadTime) {
      if (metrics.value.pageLoadTime > 5000) score -= 30
      else if (metrics.value.pageLoadTime > 3000) score -= 15
    }
    
    // Web Vitals
    if (metrics.value.largestContentfulPaint) {
      if (metrics.value.largestContentfulPaint > 4000) score -= 25
      else if (metrics.value.largestContentfulPaint > 2500) score -= 10
    }
    
    if (metrics.value.cumulativeLayoutShift) {
      if (metrics.value.cumulativeLayoutShift > 0.25) score -= 20
      else if (metrics.value.cumulativeLayoutShift > 0.1) score -= 10
    }
    
    // Memory usage
    if (metrics.value.heapUsed && metrics.value.jsHeapSizeLimit) {
      const memoryRatio = metrics.value.heapUsed / metrics.value.jsHeapSizeLimit
      if (memoryRatio > 0.8) score -= 15
      else if (memoryRatio > 0.6) score -= 8
    }
    
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
    
    return { score: Math.max(0, score), grade }
  }

  /**
   * パフォーマンスレポートの生成
   */
  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: metrics.value,
      warnings: warnings.value,
      suggestions: getOptimizationSuggestions(),
      score: getPerformanceScore(),
      config
    }
    
    return report
  }

  /**
   * レポート送信（開発環境のみ）
   */
  const sendReport = () => {
    if (config.trackingEnabled && Math.random() < config.samplingRate) {
      const report = generateReport()
      console.log('Performance Report:', report)
      
      // In production, send to analytics service
      // analyticsService.track('performance_report', report)
    }
  }

  /**
   * 定期的なパフォーマンス測定
   */
  const startPerformanceTracking = () => {
    if (!config.trackingEnabled || isTracking.value) return
    
    isTracking.value = true
    
    // Initial measurements
    measureWebVitals()
    measureMemoryUsage()
    measureNetworkInfo()
    
    // Periodic measurements
    reportingInterval = setInterval(() => {
      measureMemoryUsage()
      sendReport()
      
      // Clear old warnings
      if (warnings.value.length > 10) {
        warnings.value = warnings.value.slice(-5)
      }
    }, config.reportingInterval)
  }

  /**
   * パフォーマンス追跡停止
   */
  const stopPerformanceTracking = () => {
    isTracking.value = false
    
    if (performanceObserver) {
      performanceObserver.disconnect()
      performanceObserver = null
    }
    
    if (reportingInterval) {
      clearInterval(reportingInterval)
      reportingInterval = null
    }
  }

  // Computed Properties
  const performanceStatus = computed(() => {
    const score = getPerformanceScore()
    return {
      ...score,
      status: score.score >= 80 ? 'good' : score.score >= 60 ? 'needs-improvement' : 'poor'
    }
  })

  const memoryStatus = computed(() => {
    if (!metrics.value.heapUsed || !metrics.value.jsHeapSizeLimit) return null
    
    const usage = (metrics.value.heapUsed / metrics.value.jsHeapSizeLimit) * 100
    return {
      usage,
      status: usage < 60 ? 'good' : usage < 80 ? 'warning' : 'critical'
    }
  })

  // Lifecycle
  onMounted(() => {
    if (process.client) {
      startPerformanceTracking()
    }
  })

  onUnmounted(() => {
    stopPerformanceTracking()
  })

  return {
    // State
    metrics: readonly(metrics),
    isTracking: readonly(isTracking),
    warnings: readonly(warnings),
    
    // Computed
    performanceStatus,
    memoryStatus,
    
    // Methods
    measureComponentRender,
    measureApiResponse,
    measureFirestoreQuery,
    getOptimizationSuggestions,
    getPerformanceScore,
    generateReport,
    startPerformanceTracking,
    stopPerformanceTracking
  }
}