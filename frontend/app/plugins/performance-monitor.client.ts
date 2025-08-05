/**
 * パフォーマンス監視プラグイン
 * 商用運用品質保証のためのパフォーマンス監視
 */

export default defineNuxtPlugin(() => {
  // Performance monitoring (production only)
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    
    // Memory usage monitoring
    const monitorMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryInfo = {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          timestamp: Date.now()
        }
        
        // Log if memory usage is high (>50MB)
        if (memoryInfo.usedJSHeapSize > 50) {
          console.warn('High memory usage detected:', memoryInfo)
        }
        
        return memoryInfo
      }
      return null
    }

    // Page load performance tracking
    const trackPageLoad = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigationTiming) {
          const loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart
          const domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart
          const firstContentfulPaint = navigationTiming.loadEventStart - navigationTiming.fetchStart
          
          const performanceData = {
            loadTime: Math.round(loadTime),
            domContentLoaded: Math.round(domContentLoaded),
            firstContentfulPaint: Math.round(firstContentfulPaint),
            url: window.location.href,
            userAgent: navigator.userAgent
          }
          
          // Log if load time is slow (>3s)
          if (loadTime > 3000) {
            console.warn('Slow page load detected:', performanceData)
          }
          
          return performanceData
        }
      }
      return null
    }

    // Firebase operation timing
    const trackFirebaseOperations = () => {
      const originalFetch = window.fetch
      window.fetch = async function(...args) {
        const [resource] = args
        const startTime = performance.now()
        
        try {
          const response = await originalFetch.apply(this, args)
          const endTime = performance.now()
          const duration = endTime - startTime
          
          // Log slow Firebase operations (>500ms)
          if (typeof resource === 'string' && resource.includes('firestore') && duration > 500) {
            console.warn('Slow Firebase operation:', {
              url: resource,
              duration: Math.round(duration),
              status: response.status
            })
          }
          
          return response
        } catch (error) {
          const endTime = performance.now()
          const duration = endTime - startTime
          
          console.error('Firebase operation failed:', {
            url: resource,
            duration: Math.round(duration),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          throw error
        }
      }
    }

    // Initialize monitoring
    setTimeout(() => {
      trackPageLoad()
      monitorMemoryUsage()
      trackFirebaseOperations()
      
      // Monitor memory usage every 30 seconds
      setInterval(monitorMemoryUsage, 30000)
    }, 1000)

    // Monitor route changes for performance
    const router = useRouter()
    router.afterEach((to, from) => {
      setTimeout(() => {
        const loadTime = performance.now()
        console.info('Route change performance:', {
          from: from.path,
          to: to.path,
          loadTime: Math.round(loadTime)
        })
      }, 100)
    })
  }

  // Development performance hints
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Warn about large bundle sizes in development
    setTimeout(() => {
      const scripts = document.querySelectorAll('script[src]')
      scripts.forEach(script => {
        const src = script.getAttribute('src')
        if (src && src.includes('chunk') && src.length > 50) {
          console.info('Large chunk detected:', src)
        }
      })
    }, 2000)
  }
})