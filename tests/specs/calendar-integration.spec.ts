/**
 * カレンダー統合テスト
 * Googleカレンダー風UI・予約機能・リアルタイム同期の統合テスト
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Calendar Integration Tests', () => {
  
  /**
   * カレンダー基本機能テスト
   */
  test('should display calendar with correct layout', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Page header should be visible
    await expect(page.locator('.page-title')).toContainText('予約管理カレンダー')
    await expect(page.locator('button:has-text("新規予約")')).toBeVisible()
    
    // Calendar grid should be visible
    await expect(page.locator('.calendar-container')).toBeVisible()
    await expect(page.locator('.calendar-header')).toBeVisible()
    await expect(page.locator('.calendar-body')).toBeVisible()
    
    // View mode selector should be functional
    await expect(page.locator('.view-mode-selector')).toBeVisible()
    await expect(page.locator('button:has-text("月")')).toBeVisible()
    await expect(page.locator('button:has-text("週")')).toBeVisible()
    await expect(page.locator('button:has-text("日")')).toBeVisible()
  })

  /**
   * 表示モード切り替えテスト
   */
  test('should switch between calendar view modes', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Default should be month view
    await expect(page.locator('.calendar-month-view')).toBeVisible()
    
    // Switch to week view
    await page.click('button:has-text("週")')
    await expect(page.locator('.calendar-week-view')).toBeVisible()
    await expect(page.locator('.calendar-month-view')).not.toBeVisible()
    
    // Switch to day view
    await page.click('button:has-text("日")')
    await expect(page.locator('.calendar-day-view')).toBeVisible()
    await expect(page.locator('.calendar-week-view')).not.toBeVisible()
    
    // Switch back to month view
    await page.click('button:has-text("月")')
    await expect(page.locator('.calendar-month-view')).toBeVisible()
    await expect(page.locator('.calendar-day-view')).not.toBeVisible()
  })

  /**
   * 予約モーダル表示テスト
   */
  test('should open and close reservation modal', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Modal should not be visible initially
    await expect(page.locator('.modal-container')).not.toBeVisible()
    
    // Click new reservation button
    await page.click('button:has-text("新規予約")')
    
    // Modal should appear
    await expect(page.locator('.modal-container')).toBeVisible()
    await expect(page.locator('.modal-title')).toContainText('新規予約')
    
    // Close modal using close button
    await page.click('.btn-close')
    await expect(page.locator('.modal-container')).not.toBeVisible()
    
    // Open modal again
    await page.click('button:has-text("新規予約")')
    await expect(page.locator('.modal-container')).toBeVisible()
    
    // Close modal using cancel button
    await page.click('button:has-text("キャンセル")')
    await expect(page.locator('.modal-container')).not.toBeVisible()
  })

  /**
   * 予約作成フローテスト
   */
  test('should create a new reservation successfully', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Open new reservation modal
    await page.click('button:has-text("新規予約")')
    await expect(page.locator('.modal-container')).toBeVisible()
    
    // Fill in reservation details
    await page.fill('input[id="date"]', '2024-01-15')
    await page.selectOption('select[id="time"]', '10:00')
    await page.fill('input[id="customerName"]', 'テスト太郎')
    await page.fill('input[id="customerPhone"]', '090-1234-5678')
    await page.fill('input[id="customerEmail"]', 'test@example.com')
    
    // Select a service
    await page.click('.service-item:has-text("カット")')
    await expect(page.locator('.service-item:has-text("カット")')).toHaveClass(/selected/)
    
    // Select a stylist
    await page.click('input[type="radio"][value="stylist1"]')
    
    // Add notes
    await page.fill('textarea', 'テスト予約です')
    
    // Verify total price is calculated
    await expect(page.locator('.total-price')).toContainText('¥4,000')
    
    // Submit the form
    await page.click('button:has-text("予約作成")')
    
    // Should show success notification
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.toast-success')).toContainText('予約作成')
    
    // Modal should close
    await expect(page.locator('.modal-container')).not.toBeVisible()
  })

  /**
   * フォームバリデーションテスト
   */
  test('should validate reservation form fields', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Open new reservation modal
    await page.click('button:has-text("新規予約")')
    
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("予約作成")')
    await expect(submitButton).toBeDisabled()
    
    // Fill required fields one by one and check button state
    await page.fill('input[id="customerName"]', 'テスト太郎')
    await expect(submitButton).toBeDisabled()
    
    await page.fill('input[id="date"]', '2024-01-15')
    await expect(submitButton).toBeDisabled()
    
    await page.selectOption('select[id="time"]', '10:00')
    await expect(submitButton).toBeDisabled()
    
    await page.click('.service-item:has-text("カット")')
    await expect(submitButton).toBeDisabled()
    
    await page.click('input[type="radio"][value="stylist1"]')
    await expect(submitButton).toBeEnabled()
  })

  /**
   * 時間計算テスト
   */
  test('should calculate service duration and price correctly', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Open new reservation modal
    await page.click('button:has-text("新規予約")')
    
    // Set time
    await page.selectOption('select[id="time"]', '10:00')
    
    // Select single service
    await page.click('.service-item:has-text("カット")')
    
    // Check duration and price
    await expect(page.locator('.time-info .duration')).toContainText('60分')
    await expect(page.locator('.total-price')).toContainText('¥4,000')
    
    // Add another service
    await page.click('.service-item:has-text("カラー")')
    
    // Check updated duration and price
    await expect(page.locator('.time-info .duration')).toContainText('180分')
    await expect(page.locator('.total-price')).toContainText('¥11,000')
    
    // Remove first service
    await page.click('.service-item:has-text("カット")')
    
    // Check updated values
    await expect(page.locator('.time-info .duration')).toContainText('120分')
    await expect(page.locator('.total-price')).toContainText('¥7,000')
  })

  /**
   * カレンダーナビゲーションテスト
   */
  test('should navigate calendar months correctly', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Get current month title
    const initialTitle = await page.locator('.calendar-title h2').textContent()
    
    // Navigate to next month
    await page.click('button[aria-label*="次の月"]')
    const nextTitle = await page.locator('.calendar-title h2').textContent()
    expect(nextTitle).not.toBe(initialTitle)
    
    // Navigate to previous month (back to original)
    await page.click('button[aria-label*="前の月"]')
    const backTitle = await page.locator('.calendar-title h2').textContent()
    expect(backTitle).toBe(initialTitle)
    
    // Test "今日" button
    await page.click('button:has-text("今日")')
    const todayTitle = await page.locator('.calendar-title h2').textContent()
    
    // Should show current month/year
    const currentDate = new Date()
    const expectedYear = currentDate.getFullYear().toString()
    expect(todayTitle).toContain(expectedYear)
  })

  /**
   * レスポンシブデザインテスト
   */
  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/reservations/calendar')
    
    // Header should be responsive
    await expect(page.locator('.page-header')).toBeVisible()
    await expect(page.locator('.page-title')).toBeVisible()
    
    // Calendar should be visible and functional
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    // View mode selector should be responsive
    await expect(page.locator('.view-mode-selector')).toBeVisible()
    
    // Test modal responsiveness
    await page.click('button:has-text("新規予約")')
    await expect(page.locator('.modal-container')).toBeVisible()
    
    // Modal should fit mobile screen
    const modalWidth = await page.locator('.modal-container').evaluate(el => {
      return window.getComputedStyle(el).width
    })
    
    // Modal should not exceed viewport width
    expect(parseInt(modalWidth)).toBeLessThanOrEqual(375)
    
    // Close modal
    await page.click('.btn-close')
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    // All elements should still be visible
    await expect(page.locator('.calendar-container')).toBeVisible()
    await expect(page.locator('.view-mode-selector')).toBeVisible()
  })

  /**
   * エラーハンドリングテスト
   */
  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Mock network error for Firebase requests
    await page.route('**/firestore.googleapis.com/**', route => route.abort())
    
    // Try to open modal (should still work)
    await page.click('button:has-text("新規予約")')
    await expect(page.locator('.modal-container')).toBeVisible()
    
    // Fill form
    await page.fill('input[id="customerName"]', 'テスト太郎')
    await page.fill('input[id="date"]', '2024-01-15')
    await page.selectOption('select[id="time"]', '10:00')
    await page.click('.service-item:has-text("カット")')
    await page.click('input[type="radio"][value="stylist1"]')
    
    // Try to submit (should show error)
    await page.click('button:has-text("予約作成")')
    
    // Should show error notification
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 5000 })
    
    // Modal should remain open
    await expect(page.locator('.modal-container')).toBeVisible()
  })

  /**
   * アクセシビリティテスト
   */
  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab') // Focus on first element
    await page.keyboard.press('Tab') // Navigate to next element
    
    // Test calendar grid navigation
    const calendarDays = page.locator('.calendar-day[tabindex="0"]').first()
    await calendarDays.focus()
    await page.keyboard.press('Enter')
    
    // Should open modal or select day
    const isModalOpen = await page.locator('.modal-container').isVisible()
    const isDaySelected = await calendarDays.evaluate(el => el.classList.contains('selected'))
    
    expect(isModalOpen || isDaySelected).toBeTruthy()
    
    // Test modal keyboard navigation
    if (isModalOpen) {
      await page.keyboard.press('Escape')
      await expect(page.locator('.modal-container')).not.toBeVisible()
    }
    
    // Test view mode keyboard navigation
    await page.locator('button:has-text("週")').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.calendar-week-view')).toBeVisible()
  })

  /**
   * パフォーマンスベースラインテスト
   */
  test('should load calendar within performance thresholds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/reservations/calendar')
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // Calendar should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check for performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      }
    })
    
    expect(metrics.domContentLoaded).toBeLessThan(1500)
    expect(metrics.loadComplete).toBeLessThan(2000)
  })
})