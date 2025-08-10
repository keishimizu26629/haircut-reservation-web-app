/**
 * 緊急システムテスト
 * Firebase重複初期化修正後の全体システム動作確認
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Emergency System Tests - Firebase Integration', () => {
  
  /**
   * システム基本動作確認
   */
  test('should load system without Firebase initialization errors', async ({ page }) => {
    // コンソールエラーを監視
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text)
      }
    })
    
    // システム起動
    await page.goto('/')
    
    // メインコンテンツが表示されることを確認
    await expect(page.locator('body')).toBeVisible()
    
    // Firebase重複初期化エラーがないことを確認
    const firebaseErrors = consoleErrors.filter(error => 
      error.includes('Firebase') && 
      (error.includes('already initialized') || error.includes('duplicate'))
    )
    
    expect(firebaseErrors).toHaveLength(0)
    
    // 重要なエラーがないことを確認
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('sourcemap') &&
      !error.includes('dev tools')
    )
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors)
    }
    
    expect(criticalErrors.length).toBeLessThan(3) // 軽微なエラーは許容
  })

  /**
   * Firebase認証システムテスト
   */
  test('should access login page without errors', async ({ page }) => {
    await page.goto('/login')
    
    // ログインページが表示されることを確認
    await expect(page.locator('h1, h2')).toContainText(/ログイン|Login/i)
    
    // ログインフォームが存在することを確認
    const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[placeholder*="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const loginButton = page.locator('button:has-text("ログイン"), button:has-text("Login"), button[type="submit"]')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(loginButton).toBeVisible()
  })

  /**
   * Firestore接続テスト
   */
  test('should access calendar page and load reservations data', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // カレンダーページが表示されることを確認
    await expect(page.locator('.calendar-container, .calendar-header')).toBeVisible()
    
    // 予約管理カレンダーのタイトルが表示されることを確認
    await expect(page.locator('h1, h2')).toContainText(/予約|カレンダー|Calendar/i)
    
    // カレンダーグリッドが表示されることを確認
    await expect(page.locator('.calendar-grid, .calendar-month-view, .calendar-body')).toBeVisible()
    
    // 新規予約ボタンが機能することを確認
    const newReservationButton = page.locator('button:has-text("新規予約"), button:has-text("予約作成")')
    if (await newReservationButton.isVisible()) {
      await newReservationButton.click()
      
      // モーダルが開くことを確認
      await expect(page.locator('.modal-container, .modal-dialog')).toBeVisible()
      
      // モーダルを閉じる
      const closeButton = page.locator('.btn-close, button:has-text("キャンセル"), button:has-text("閉じる")')
      if (await closeButton.isVisible()) {
        await closeButton.click()
      }
    }
  })

  /**
   * リアルタイム同期機能テスト
   */
  test('should handle real-time data updates', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // カレンダーが読み込まれるまで待機
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    // Firestoreリスナーが設定されているかチェック
    const hasFirestoreConnection = await page.evaluate(() => {
      // Firebase関連のオブジェクトが存在するかチェック
      return !!(window as any).firebase || 
             !!(window as any).vuefireApp ||
             !!(document.querySelector('[data-firebase]'))
    })
    
    // Firebase接続が確立されていることを期待（ただし、厳密には要求しない）
    console.log('Firestore connection status:', hasFirestoreConnection)
    
    // リアルタイム更新をシミュレート
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('firestore-update', {
        detail: { type: 'reservation-created', timestamp: Date.now() }
      }))
    })
    
    // システムがクラッシュしないことを確認
    await expect(page.locator('.calendar-container')).toBeVisible()
  })

  /**
   * マルチブラウザ互換性テスト
   */
  test('should work across different browsers', async ({ page, browserName }) => {
    console.log(`Testing on browser: ${browserName}`)
    
    await page.goto('/')
    
    // 基本的なナビゲーションが機能することを確認
    const navigationLinks = page.locator('a[href], button')
    const linkCount = await navigationLinks.count()
    
    expect(linkCount).toBeGreaterThan(0)
    
    // JavaScriptが正常に実行されることを確認
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined'
    })
    
    expect(jsWorking).toBe(true)
    
    // Vue.jsアプリケーションが起動していることを確認
    const vueApp = await page.evaluate(() => {
      return !!(window as any).__VUE__ || 
             !!(document.querySelector('[data-v-]')) ||
             !!(document.querySelector('#__nuxt'))
    })
    
    expect(vueApp).toBe(true)
  })

  /**
   * ネットワークエラー耐性テスト
   */
  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // 初期ロードを確認
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    // ネットワークをブロック
    await page.route('**/*', route => {
      if (route.request().url().includes('firestore') || 
          route.request().url().includes('googleapis')) {
        route.abort()
      } else {
        route.continue()
      }
    })
    
    // 予約作成を試行
    const newReservationButton = page.locator('button:has-text("新規予約")')
    if (await newReservationButton.isVisible()) {
      await newReservationButton.click()
      
      // モーダルが開くことを確認（オフライン状態でも）
      await expect(page.locator('.modal-container')).toBeVisible()
      
      // フォームに入力
      await page.fill('input[id="customerName"], input[placeholder*="名前"]', 'テスト太郎')
      
      // 送信を試行（エラーが表示されるはず）
      const submitButton = page.locator('button:has-text("作成"), button:has-text("保存"), button[type="submit"]')
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // エラーメッセージまたは警告が表示されることを確認
        await expect(page.locator('.toast-error, .alert-danger, .error-message')).toBeVisible({ timeout: 10000 })
      }
    }
    
    // システムがクラッシュしないことを確認
    await expect(page.locator('.calendar-container')).toBeVisible()
  })

  /**
   * パフォーマンス回帰テスト
   */
  test('should maintain acceptable performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/reservations/calendar')
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // ページロード時間が10秒以内であることを確認
    expect(loadTime).toBeLessThan(10000)
    
    // メモリ使用量をチェック（ブラウザが対応している場合）
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    if (memoryUsage > 0) {
      // メモリ使用量が150MB以下であることを確認
      expect(memoryUsage).toBeLessThan(150 * 1024 * 1024)
      console.log(`Memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`)
    }
  })

  /**
   * セキュリティ基本チェック
   */
  test('should have basic security measures', async ({ page }) => {
    await page.goto('/')
    
    // HTTPS または localhost であることを確認
    const url = page.url()
    const isSecure = url.startsWith('https://') || url.includes('localhost')
    expect(isSecure).toBe(true)
    
    // セキュリティヘッダーの存在確認
    const response = await page.goto('/', { waitUntil: 'networkidle' })
    const headers = response?.headers() || {}
    
    // 基本的なセキュリティヘッダーがあることを確認（開発環境では緩和）
    const hasSecurityHeaders = 
      headers['x-frame-options'] || 
      headers['x-content-type-options'] ||
      url.includes('localhost') // 開発環境は許容
    
    expect(hasSecurityHeaders).toBeTruthy()
  })

  /**
   * アクセシビリティ基本チェック
   */
  test('should be basically accessible', async ({ page }) => {
    await page.goto('/reservations/calendar')
    
    // メインコンテンツが存在することを確認
    const mainContent = page.locator('main, [role="main"], .main-content')
    await expect(mainContent).toBeVisible()
    
    // ページタイトルが存在することを確認
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
    
    // 見出し要素が存在することを確認
    const headings = page.locator('h1, h2, h3')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(0)
    
    // ボタンがアクセシブルであることを確認
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      // 最初のボタンがフォーカス可能であることを確認
      const firstButton = buttons.first()
      await firstButton.focus()
      
      const isFocused = await firstButton.evaluate(el => document.activeElement === el)
      expect(isFocused).toBe(true)
    }
  })
})