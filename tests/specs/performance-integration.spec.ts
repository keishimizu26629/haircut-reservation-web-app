/**
 * パフォーマンス統合テスト
 * 最適化されたシステムの性能評価・負荷テスト・安定性確認
 */

import { test, expect, Page } from '@playwright/test'

interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  memoryUsage?: number
}

test.describe('Performance Integration Tests', () => {
  let performanceData: PerformanceMetrics[] = []

  /**
   * パフォーマンス測定ヘルパー
   */
  async function measurePagePerformance(page: Page, url: string): Promise<PerformanceMetrics> {
    await page.goto(url)
    
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paintEntries = performance.getEntriesByType('paint')
      
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      const lcpEntry = performance.getEntriesByType('largest-contentful-paint')[0] as any
      
      return {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: fcpEntry?.startTime || 0,
        largestContentfulPaint: lcpEntry?.startTime || 0,
        cumulativeLayoutShift: 0, // CLS requires special handling
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      }
    })
    
    return metrics
  }

  /**
   * リアルタイム同期パフォーマンステスト
   */
  test('should handle real-time updates efficiently', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Wait for calendar to load
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    const startTime = Date.now()
    
    // Simulate multiple real-time updates
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        // Simulate Firestore real-time update
        window.dispatchEvent(new CustomEvent('firestore-update', {
          detail: { reservationCount: Math.floor(Math.random() * 100) }
        }))
      })
      
      await page.waitForTimeout(100) // Small delay between updates
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Performance assertion: Should handle 10 updates in less than 2 seconds
    expect(totalTime).toBeLessThan(2000)
    
    // UI should remain responsive
    const calendarGrid = page.locator('.calendar-grid')
    await expect(calendarGrid).toBeVisible()
  })

  /**
   * 大量データ処理パフォーマンステスト
   */
  test('should handle large reservation datasets efficiently', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Inject large dataset for testing
    await page.evaluate(() => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `reservation-${i}`,
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '11:00',
        customerName: `Customer ${i}`,
        status: 'confirmed'
      }))
      
      // Simulate loading large dataset
      window.dispatchEvent(new CustomEvent('load-large-dataset', {
        detail: { reservations: largeDataset }
      }))
    })
    
    const startTime = performance.now()
    
    // Wait for rendering to complete
    await page.waitForTimeout(1000)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Performance assertion: Should render 1000 items in less than 500ms
    expect(renderTime).toBeLessThan(500)
    
    // Check memory usage
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Memory should not exceed 100MB
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024)
  })

  /**
   * モバイルパフォーマンステスト
   */
  test('should perform well on mobile devices', async ({ page }) => {
    // Simulate mobile device
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Simulate slower mobile network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
      await route.continue()
    })
    
    const metrics = await measurePagePerformance(page, '/reservations/calendar')
    
    // Mobile performance thresholds
    expect(metrics.pageLoadTime).toBeLessThan(5000) // 5 seconds
    expect(metrics.firstContentfulPaint).toBeLessThan(3000) // 3 seconds
    expect(metrics.largestContentfulPaint).toBeLessThan(4000) // 4 seconds
    
    // Test touch interactions
    const calendarDay = page.locator('.calendar-day').first()
    await calendarDay.tap()
    
    // Modal should open quickly
    await expect(page.locator('.modal-container')).toBeVisible({ timeout: 1000 })
  })

  /**
   * 同時アクセス負荷テスト
   */
  test('should handle concurrent users efficiently', async ({ browser }) => {
    const concurrentUsers = 5
    const contexts = []
    const pages = []
    
    // Create multiple browser contexts (simulate different users)
    for (let i = 0; i < concurrentUsers; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      contexts.push(context)
      pages.push(page)
    }
    
    const startTime = Date.now()
    
    // All users navigate to calendar simultaneously
    const navigationPromises = pages.map(page => 
      page.goto('/reservations/calendar')
    )
    
    await Promise.all(navigationPromises)
    
    // All users should see the calendar
    const visibilityPromises = pages.map(page =>
      expect(page.locator('.calendar-container')).toBeVisible()
    )
    
    await Promise.all(visibilityPromises)
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Should handle 5 concurrent users in less than 10 seconds
    expect(totalTime).toBeLessThan(10000)
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()))
  })

  /**
   * メモリリーク検出テスト
   */
  test('should not have memory leaks during extended usage', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Simulate extended usage with multiple operations
    for (let i = 0; i < 20; i++) {
      // Open and close reservation modal
      await page.click('button:has-text("新規予約")')
      await expect(page.locator('.modal-container')).toBeVisible()
      await page.click('button:has-text("キャンセル")')
      await expect(page.locator('.modal-container')).not.toBeVisible()
      
      // Change view modes
      await page.click('button:has-text("週")')
      await page.waitForTimeout(100)
      await page.click('button:has-text("月")')
      await page.waitForTimeout(100)
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc()
      }
    })
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be less than 10MB after 20 operations
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
  })

  /**
   * ネットワーク障害耐性テスト
   */
  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Wait for initial load
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    // Simulate network failure
    await page.route('**/*', route => route.abort())
    
    // Try to create a reservation
    await page.click('button:has-text("新規予約")')
    await expect(page.locator('.modal-container')).toBeVisible()
    
    // Fill form
    await page.fill('input[id="customerName"]', 'Test Customer')
    await page.fill('input[id="date"]', '2024-01-15')
    await page.selectOption('select[id="time"]', '10:00')
    
    // Try to save (should fail gracefully)
    await page.click('button:has-text("予約作成")')
    
    // Should show error notification
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 5000 })
    
    // Restore network
    await page.unroute('**/*')
    
    // Try again (should work)
    await page.click('button:has-text("予約作成")')
    
    // Should show success notification eventually
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 })
  })

  /**
   * Firebase接続最適化テスト
   */
  test('should optimize Firebase connections', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Monitor network requests
    const networkRequests: string[] = []
    page.on('request', request => {
      if (request.url().includes('firestore') || request.url().includes('googleapis')) {
        networkRequests.push(request.url())
      }
    })
    
    // Wait for initial load
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    // Perform various operations
    await page.click('button:has-text("週")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("日")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("月")')
    await page.waitForTimeout(500)
    
    // Firebase connections should be reused (limited number of unique connections)
    const uniqueConnections = new Set(networkRequests.map(url => {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.host}`
    }))
    
    // Should not create excessive Firebase connections
    expect(uniqueConnections.size).toBeLessThan(5)
  })

  /**
   * パフォーマンス回帰テスト
   */
  test('should maintain consistent performance across sessions', async ({ page }) => {
    const testRuns = 3
    const metrics: PerformanceMetrics[] = []
    
    for (let i = 0; i < testRuns; i++) {
      const runMetrics = await measurePagePerformance(page, '/reservations/calendar')
      metrics.push(runMetrics)
      
      // Clear cache between runs
      await page.evaluate(() => {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name))
          })
        }
      })
    }
    
    // Calculate performance consistency
    const loadTimes = metrics.map(m => m.pageLoadTime)
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
    const maxVariation = Math.max(...loadTimes) - Math.min(...loadTimes)
    
    // Performance should be consistent (variation < 50% of average)
    expect(maxVariation).toBeLessThan(avgLoadTime * 0.5)
    
    // All runs should meet performance thresholds
    metrics.forEach(metric => {
      expect(metric.pageLoadTime).toBeLessThan(3000)
      expect(metric.firstContentfulPaint).toBeLessThan(2000)
    })
  })

  test.afterEach(async () => {
    // Collect performance data for reporting
    // This could be sent to analytics in real implementation
  })
})