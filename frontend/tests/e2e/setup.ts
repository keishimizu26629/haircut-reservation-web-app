// E2Eテスト用セットアップファイル
// Firebase Emulator環境での初期データ設定とテストユーザー作成

import { chromium, Browser, Page } from '@playwright/test'

// テスト用ユーザーデータ
export const TEST_USERS = {
  existing: {
    email: 'existing@example.com',
    password: 'testpass123',
    name: '既存ユーザー'
  },
  testUser: {
    email: 'testuser@example.com',
    password: 'testpass123',
    name: 'テストユーザー'
  }
}

// Firebase Emulator接続確認
export async function waitForFirebaseEmulator(page: Page, timeout = 30000) {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    try {
      await page.goto('http://localhost:4000', { timeout: 5000 })
      const title = await page.title()
      if (title.includes('Firebase Emulator Suite')) {
        console.log('Firebase Emulator確認完了')
        return true
      }
    } catch (error) {
      // エミュレーターがまだ起動していない場合
      await page.waitForTimeout(1000)
    }
  }
  
  throw new Error('Firebase Emulatorが起動していません')
}

// テストユーザーの作成
export async function createTestUser(page: Page, email: string, password: string, name: string) {
  try {
    await page.goto('/register')
    
    // フォーム入力
    await page.fill('#name', name)
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.fill('#confirmPassword', password)
    await page.check('#terms')
    
    // 登録実行
    await page.click('button[type="submit"]')
    
    // 成功確認（ダッシュボードにリダイレクト）
    await page.waitForURL('/dashboard', { timeout: 15000 })
    
    // ログアウト
    await page.goto('/login')
    
    console.log(`テストユーザー作成完了: ${email}`)
    return true
  } catch (error) {
    console.log(`テストユーザー作成スキップ（既存の可能性）: ${email}`)
    return false
  }
}

// E2Eテスト環境のセットアップ
export async function setupE2EEnvironment() {
  let browser: Browser | null = null
  
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    
    // Firebase Emulator接続確認
    await waitForFirebaseEmulator(page)
    
    // テストユーザーの作成
    for (const [key, userData] of Object.entries(TEST_USERS)) {
      await createTestUser(page, userData.email, userData.password, userData.name)
    }
    
    console.log('E2Eテスト環境セットアップ完了')
    
    await browser.close()
    return true
  } catch (error) {
    console.error('E2Eテスト環境セットアップエラー:', error)
    if (browser) {
      await browser.close()
    }
    throw error
  }
}

// テスト実行前の共通セットアップ
export async function beforeEachTest(page: Page) {
  try {
    // ローカルストレージクリア（エラーハンドリング付き）
    await page.evaluate(() => {
      try {
        if (typeof Storage !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
      } catch (error) {
        // localStorage/sessionStorage アクセスエラーを無視
        console.log('Storage clear skipped:', error.message)
      }
    })
    
    // Cookie削除
    await page.context().clearCookies()
  } catch (error) {
    // セットアップエラーを無視してテスト続行
    console.log('Setup warning:', error.message)
  }
}

// Firebase認証状態のクリア
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    // Firebase認証状態をクリア
    if (window.localStorage) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.startsWith('firebase_')) {
          localStorage.removeItem(key)
        }
      })
    }
  })
}