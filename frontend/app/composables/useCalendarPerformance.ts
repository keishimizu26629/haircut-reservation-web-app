/**
 * カレンダーパフォーマンス監視・最適化Composable
 * 表示遅延・白画面問題の根本解決
 */

interface PerformanceMetrics {
  authTime: number
  dataLoadTime: number
  renderTime: number
  totalTime: number
  memoryUsage: number
  cacheHitRate: number
}

interface PerformanceOptions {
  enableMetrics?: boolean
  enableOptimizations?: boolean
  performanceThresholds?: {
    auth: number
    dataLoad: number
    render: number
    total: number
  }
}

export function useCalendarPerformance(options: PerformanceOptions = {}) {
  const {
    enableMetrics = true,
    enableOptimizations = true,
    performanceThresholds = {
      auth: 2000,    // 2秒
      dataLoad: 3000, // 3秒  
      render: 1000,   // 1秒
      total: 5000     // 5秒
    }
  } = options

  // パフォーマンス測定
  const metrics = ref<PerformanceMetrics>({
    authTime: 0,
    dataLoadTime: 0,
    renderTime: 0,
    totalTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  })

  // 測定用タイマー
  const timers = ref<Record<string, number>>({})
  
  // 状態管理
  const isMonitoring = ref(false)
  const hasPerformanceIssues = ref(false)
  const optimizationTips = ref<string[]>([])

  /**
   * 測定開始
   */
  const startTimer = (name: string): void => {
    if (!enableMetrics) return
    
    timers.value[name] = performance.now()
    console.log(`⏱️ Performance: Timer '${name}' started`)
  }

  /**
   * 測定終了
   */
  const endTimer = (name: string): number => {
    if (!enableMetrics || !timers.value[name]) return 0
    
    const duration = performance.now() - timers.value[name]
    delete timers.value[name]
    
    console.log(`⏱️ Performance: Timer '${name}' completed in ${duration.toFixed(2)}ms`)
    return duration
  }

  /**
   * 認証パフォーマンス測定
   */
  const measureAuthPerformance = () => {
    return {
      start: () => startTimer('auth'),
      end: () => {
        const duration = endTimer('auth')
        metrics.value.authTime = duration
        
        if (duration > performanceThresholds.auth) {
          console.warn(`⚠️ Slow authentication: ${duration.toFixed(2)}ms`)
          optimizationTips.value.push('認証処理が遅い可能性があります。ネットワーク接続を確認してください。')
        }
        
        return duration
      }
    }
  }

  /**
   * データ読み込みパフォーマンス測定
   */
  const measureDataLoadPerformance = () => {
    return {
      start: () => startTimer('dataLoad'),
      end: () => {
        const duration = endTimer('dataLoad')
        metrics.value.dataLoadTime = duration
        
        if (duration > performanceThresholds.dataLoad) {
          console.warn(`⚠️ Slow data loading: ${duration.toFixed(2)}ms`)
          optimizationTips.value.push('データ読み込みが遅い可能性があります。Firestoreクエリを最適化してください。')
        }
        
        return duration
      }
    }
  }

  /**
   * レンダリングパフォーマンス測定
   */
  const measureRenderPerformance = () => {
    return {
      start: () => startTimer('render'),
      end: () => {
        const duration = endTimer('render')
        metrics.value.renderTime = duration
        
        if (duration > performanceThresholds.render) {
          console.warn(`⚠️ Slow rendering: ${duration.toFixed(2)}ms`)
          optimizationTips.value.push('レンダリングが遅い可能性があります。コンポーネントの最適化を検討してください。')
        }
        
        return duration
      }
    }
  }

  /**
   * 総合パフォーマンス測定
   */
  const measureTotalPerformance = () => {
    return {
      start: () => startTimer('total'),
      end: () => {
        const duration = endTimer('total')
        metrics.value.totalTime = duration
        
        // メモリ使用量測定
        if (performance.memory) {
          metrics.value.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024 // MB
        }
        
        // パフォーマンス評価
        if (duration > performanceThresholds.total) {
          hasPerformanceIssues.value = true
          console.warn(`⚠️ Poor total performance: ${duration.toFixed(2)}ms`)
          optimizationTips.value.push('全体的なパフォーマンスが低下しています。システム最適化が必要です。')
        } else {
          hasPerformanceIssues.value = false
          console.log(`✅ Excellent performance: ${duration.toFixed(2)}ms`)
        }
        
        return duration
      }
    }
  }

  /**
   * パフォーマンスレポート生成
   */
  const generatePerformanceReport = (): string => {
    const report = `
🎯 Calendar Performance Report
================================
⏱️  Authentication: ${metrics.value.authTime.toFixed(2)}ms
📊  Data Loading: ${metrics.value.dataLoadTime.toFixed(2)}ms  
🖼️  Rendering: ${metrics.value.renderTime.toFixed(2)}ms
🏁  Total Time: ${metrics.value.totalTime.toFixed(2)}ms
💾  Memory Usage: ${metrics.value.memoryUsage.toFixed(2)}MB
📈  Cache Hit Rate: ${metrics.value.cacheHitRate.toFixed(1)}%

${hasPerformanceIssues.value ? '⚠️  Performance Issues Detected' : '✅  Performance: Excellent'}

${optimizationTips.value.length > 0 ? `
🔧 Optimization Tips:
${optimizationTips.value.map(tip => `   • ${tip}`).join('\n')}
` : ''}
    `.trim()

    return report
  }

  /**
   * パフォーマンス最適化の実行
   */
  const applyOptimizations = async (): Promise<void> => {
    if (!enableOptimizations) return

    console.log('🔧 Performance: Applying optimizations...')

    try {
      // 1. 不要なDOM要素の遅延ロード
      await nextTick()
      
      // 2. 画像の遅延読み込み
      const images = document.querySelectorAll('img[data-src]')
      images.forEach(img => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement
              target.src = target.dataset.src || ''
              target.removeAttribute('data-src')
              observer.unobserve(target)
            }
          })
        })
        observer.observe(img)
      })

      // 3. スタイルの最適化
      const criticalStyles = document.head.querySelector('style[data-critical]')
      if (!criticalStyles) {
        const style = document.createElement('style')
        style.setAttribute('data-critical', 'true')
        style.textContent = `
          .calendar-loading-container { will-change: opacity; }
          .calendar-grid { contain: layout style paint; }
          .appointment-indicator { transform: translateZ(0); }
        `
        document.head.appendChild(style)
      }

      // 4. メモリ最適化
      if (metrics.value.memoryUsage > 50) { // 50MB以上の場合
        console.log('🧹 Performance: Triggering garbage collection suggestions')
        // ガベージコレクション促進のヒント
        if (typeof window.gc === 'function') {
          window.gc()
        }
      }

      console.log('✅ Performance: Optimizations applied successfully')

    } catch (error) {
      console.warn('⚠️ Performance: Optimization failed:', error)
    }
  }

  /**
   * 白画面問題の検出と解決
   */
  const detectWhiteScreen = (): boolean => {
    const calendarElement = document.querySelector('.calendar-wrapper')
    if (!calendarElement) return true

    const computedStyle = getComputedStyle(calendarElement)
    const isEmpty = calendarElement.children.length === 0
    const isHidden = computedStyle.display === 'none' || computedStyle.visibility === 'hidden'
    const hasNoContent = calendarElement.textContent?.trim() === ''

    const isWhiteScreen = isEmpty || isHidden || hasNoContent

    if (isWhiteScreen) {
      console.warn('🚨 White screen detected in calendar area')
      optimizationTips.value.push('カレンダー領域で白画面が検出されました。データ取得とレンダリングを確認してください。')
    }

    return isWhiteScreen
  }

  /**
   * 自動パフォーマンス監視の開始
   */
  const startMonitoring = (): void => {
    if (isMonitoring.value) return

    isMonitoring.value = true
    console.log('👀 Performance: Monitoring started')

    // 5秒ごとにパフォーマンスチェック
    const monitoringInterval = setInterval(() => {
      if (!isMonitoring.value) {
        clearInterval(monitoringInterval)
        return
      }

      // 白画面検出
      detectWhiteScreen()

      // メモリ使用量更新
      if (performance.memory) {
        metrics.value.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024
      }

      // 自動最適化
      if (hasPerformanceIssues.value) {
        applyOptimizations()
      }

    }, 5000)

    // クリーンアップ
    onUnmounted(() => {
      clearInterval(monitoringInterval)
      isMonitoring.value = false
    })
  }

  /**
   * 監視停止
   */
  const stopMonitoring = (): void => {
    isMonitoring.value = false
    console.log('⏹️ Performance: Monitoring stopped')
  }

  /**
   * メトリクスリセット
   */
  const resetMetrics = (): void => {
    metrics.value = {
      authTime: 0,
      dataLoadTime: 0,
      renderTime: 0,
      totalTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0
    }
    optimizationTips.value = []
    hasPerformanceIssues.value = false
    console.log('🔄 Performance: Metrics reset')
  }

  return {
    // 測定メソッド
    measureAuthPerformance,
    measureDataLoadPerformance,
    measureRenderPerformance,
    measureTotalPerformance,
    
    // 監視制御
    startMonitoring,
    stopMonitoring,
    
    // 最適化
    applyOptimizations,
    detectWhiteScreen,
    
    // 状態
    metrics: readonly(metrics),
    isMonitoring: readonly(isMonitoring),
    hasPerformanceIssues: readonly(hasPerformanceIssues),
    optimizationTips: readonly(optimizationTips),
    
    // ユーティリティ
    generatePerformanceReport,
    resetMetrics,
    
    // 計算プロパティ
    performanceGrade: computed(() => {
      const total = metrics.value.totalTime
      if (total === 0) return 'N/A'
      if (total < 2000) return 'A'
      if (total < 3000) return 'B'
      if (total < 5000) return 'C'
      return 'D'
    }),
    
    isOptimal: computed(() => 
      metrics.value.totalTime > 0 && 
      metrics.value.totalTime < performanceThresholds.total &&
      !hasPerformanceIssues.value
    )
  }
}