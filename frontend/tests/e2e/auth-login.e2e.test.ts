// ログイン画面のPlaywright E2Eテスト
// Firebase Emulator環境での認証フローをテスト

import { test, expect } from '@playwright/test'
import { beforeEachTest, TEST_USERS } from './setup'

test.describe('ログイン画面', () => {
  test.beforeEach(async ({ page }) => {
    // 共通のセットアップ処理
    await beforeEachTest(page)
    
    // Firebase Emulatorが起動している前提でテスト実行
    await page.goto('/login')
  })

  test('ログイン画面の表示確認', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle('ログイン - 美容室予約システム')

    // ヘッダー要素の確認
    await expect(page.locator('.brand-title')).toHaveText('美容室予約システム')
    await expect(page.locator('.brand-subtitle')).toHaveText('アカウントにログイン')

    // ロゴの表示確認
    await expect(page.locator('.brand-logo i')).toBeVisible()

    // フォーム要素の存在確認
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#remember')).toBeVisible()

    // ボタンの確認
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('.google-login-button')).toBeVisible()

    // リンクの確認
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible()
    await expect(page.locator('a[href="/register"]')).toBeVisible()
  })

  test('フォーム入力フィールドの動作確認', async ({ page }) => {
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')

    // メールアドレス入力の確認
    await emailInput.fill('test@example.com')
    await expect(emailInput).toHaveValue('test@example.com')

    // パスワード入力の確認
    await passwordInput.fill('password123')
    await expect(passwordInput).toHaveValue('password123')

    // パスワードの表示/非表示切り替え
    const passwordToggle = page.locator('.password-toggle')
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Remember Me チェックボックス
    const rememberCheckbox = page.locator('#remember')
    await rememberCheckbox.check()
    await expect(rememberCheckbox).toBeChecked()
  })

  test('入力バリデーションの確認', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    
    // 空の状態で送信ボタンが無効化されていることを確認
    await expect(submitButton).toBeDisabled()

    // 無効なメールアドレスでのバリデーション
    await page.fill('#email', 'invalid-email')
    await page.locator('#email').blur()
    await expect(page.locator('#email-error')).toBeVisible()
    await expect(page.locator('#email-error')).toContainText('メールアドレスの形式が正しくありません')

    // 短いパスワードでのバリデーション
    await page.fill('#password', '123')
    await page.locator('#password').blur()
    await expect(page.locator('#password-error')).toBeVisible()
    await expect(page.locator('#password-error')).toContainText('パスワードは8文字以上で入力してください')

    // 正しい入力でボタンが有効化されることを確認
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await expect(submitButton).toBeEnabled()
  })

  test('エラーメッセージのクリア動作', async ({ page }) => {
    // エラー状態を作成
    await page.fill('#email', 'invalid-email')
    await page.locator('#email').blur()
    await expect(page.locator('#email-error')).toBeVisible()

    // 正しい入力でエラーがクリアされることを確認
    await page.fill('#email', 'test@example.com')
    await expect(page.locator('#email-error')).not.toBeVisible()
  })

  test('認証エラー表示のテスト', async ({ page }) => {
    // 存在しないアカウントでログイン試行（Firebase Emulator環境）
    await page.fill('#email', 'nonexistent@example.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // ローディング状態の確認
    await expect(page.locator('button[type="submit"]')).toContainText('ログイン中...')

    // エラーメッセージの表示確認
    await expect(page.locator('.global-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.global-error h4')).toContainText('ログインエラー')
    await expect(page.locator('.global-error p')).toContainText('このメールアドレスで登録されたアカウントが見つかりません')
  })

  test('正常なログインフロー（テストユーザー作成前提）', async ({ page }) => {
    // グローバルセットアップで作成されたテストユーザーを使用
    const { email, password } = TEST_USERS.testUser

    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.click('button[type="submit"]')

    // ローディング状態の確認
    await expect(page.locator('button[type="submit"]')).toContainText('ログイン中...')

    // 成功時のリダイレクト確認（タイムアウトを長めに設定）
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test('Google認証ボタンの動作確認', async ({ page }) => {
    const googleButton = page.locator('.google-login-button')
    
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toContainText('Googleでログイン')
    
    // ボタンクリック（実際のGoogle認証は発生しない）
    await googleButton.click()
    
    // ローディング状態の確認
    await expect(googleButton).toBeDisabled()
  })

  test('フォーム要素のアクセシビリティ確認', async ({ page }) => {
    // ARIA属性の確認
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'false')
    
    // エラー時のaria-invalid属性変更確認
    await page.fill('#email', 'invalid')
    await page.locator('#email').blur()
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true')
    
    // aria-describedby属性の確認
    await expect(page.locator('#email')).toHaveAttribute('aria-describedby', 'email-error')
  })

  test('キーボードナビゲーションの確認', async ({ page }) => {
    // Tabキーでのフォーカス移動
    await page.keyboard.press('Tab')
    await expect(page.locator('#email')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('#password')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('.password-toggle')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('#remember')).toBeFocused()
  })

  test('レスポンシブデザインの確認', async ({ page }) => {
    // モバイルサイズでの表示確認
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.locator('.login-container')).toBeVisible()
    await expect(page.locator('.login-form-card')).toBeVisible()
    
    // フォーム要素が適切に表示されることを確認
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('フォーム送信後のUI状態確認', async ({ page }) => {
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // 送信中の状態確認
    await expect(submitButton).toBeDisabled()
    await expect(submitButton).toContainText('ログイン中...')
    await expect(page.locator('.loading-spinner')).toBeVisible()
  })

  test('ページリロード後の状態確認', async ({ page }) => {
    // Remember meをチェック
    await page.check('#remember')
    
    // ページリロード
    await page.reload()
    
    // Remember me状態が保持されていることを確認
    await expect(page.locator('#remember')).toBeChecked()
  })

  test('エラーメッセージの表示アニメーション確認', async ({ page }) => {
    await page.fill('#email', 'invalid')
    await page.locator('#email').blur()
    
    // エラーメッセージのアニメーション表示確認
    const errorElement = page.locator('#email-error')
    await expect(errorElement).toBeVisible()
    
    // エラーの色やスタイルが適用されていることを確認
    await expect(page.locator('#email')).toHaveClass(/error/)
    await expect(page.locator('.form-icon')).toHaveClass(/error/)
  })
})