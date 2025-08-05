// 新規登録画面のPlaywright E2Eテスト
// Firebase Emulator環境での新規ユーザー登録フローをテスト

import { test, expect } from '@playwright/test'
import { beforeEachTest, TEST_USERS } from './setup'

test.describe('新規登録画面', () => {
  test.beforeEach(async ({ page }) => {
    // 共通のセットアップ処理
    await beforeEachTest(page)
    
    // Firebase Emulatorが起動している前提でテスト実行
    await page.goto('/register')
  })

  test('新規登録画面の表示確認', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle('新規登録 - 美容室予約システム')

    // ヘッダー要素の確認
    await expect(page.locator('.brand-title')).toHaveText('新規アカウント作成')
    await expect(page.locator('.brand-subtitle')).toContainText('美容室予約システムのアカウントを作成してください')

    // ロゴの表示確認
    await expect(page.locator('.brand-logo i')).toBeVisible()

    // フォーム要素の存在確認
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
    await expect(page.locator('#terms')).toBeVisible()

    // ボタンの確認
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('.google-login-button')).toBeVisible()

    // リンクの確認
    await expect(page.locator('a[href="/login"]')).toBeVisible()
    await expect(page.locator('a[href="/terms"]')).toBeVisible()
    await expect(page.locator('a[href="/privacy"]')).toBeVisible()
  })

  test('フォーム入力フィールドの動作確認', async ({ page }) => {
    const nameInput = page.locator('#name')
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const confirmPasswordInput = page.locator('#confirmPassword')
    const termsCheckbox = page.locator('#terms')

    // お名前入力の確認
    await nameInput.fill('テスト太郎')
    await expect(nameInput).toHaveValue('テスト太郎')

    // メールアドレス入力の確認
    await emailInput.fill('test@example.com')
    await expect(emailInput).toHaveValue('test@example.com')

    // パスワード入力の確認
    await passwordInput.fill('password123')
    await expect(passwordInput).toHaveValue('password123')

    // パスワード確認入力の確認
    await confirmPasswordInput.fill('password123')
    await expect(confirmPasswordInput).toHaveValue('password123')

    // 利用規約チェックボックス
    await termsCheckbox.check()
    await expect(termsCheckbox).toBeChecked()
  })

  test('パスワード表示/非表示切り替えの確認', async ({ page }) => {
    const passwordInput = page.locator('#password')
    const confirmPasswordInput = page.locator('#confirmPassword')
    const passwordToggle = page.locator('.form-input-wrapper:has(#password) .password-toggle')
    const confirmPasswordToggle = page.locator('.form-input-wrapper:has(#confirmPassword) .password-toggle')

    // パスワードフィールドの表示/非表示切り替え
    await passwordInput.fill('password123')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // パスワード確認フィールドの表示/非表示切り替え
    await confirmPasswordInput.fill('password123')
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    
    await confirmPasswordToggle.click()
    await expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    
    await confirmPasswordToggle.click()
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password')
  })

  test('入力バリデーションの確認', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    
    // 空の状態で送信ボタンが無効化されていることを確認
    await expect(submitButton).toBeDisabled()

    // お名前のバリデーション
    await page.fill('#name', 'あ')
    await page.locator('#name').blur()
    await expect(page.locator('#name-error')).toBeVisible()
    await expect(page.locator('#name-error')).toContainText('お名前は2文字以上で入力してください')

    // 無効なメールアドレスでのバリデーション
    await page.fill('#email', 'invalid-email')
    await page.locator('#email').blur()
    await expect(page.locator('#email-error')).toBeVisible()
    await expect(page.locator('#email-error')).toContainText('有効なメールアドレスを入力してください')

    // 弱いパスワードでのバリデーション
    await page.fill('#password', '123')
    await page.locator('#password').blur()
    await expect(page.locator('#password-error')).toBeVisible()
    await expect(page.locator('#password-error')).toContainText('パスワードは6文字以上で入力してください')

    // パスワード不一致のバリデーション
    await page.fill('#password', 'password123')
    await page.fill('#confirmPassword', 'different123')
    await page.locator('#confirmPassword').blur()
    await expect(page.locator('#confirmPassword-error')).toBeVisible()
    await expect(page.locator('#confirmPassword-error')).toContainText('パスワードが一致しません')

    // 利用規約未同意のバリデーション
    await page.fill('#name', 'テスト太郎')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.fill('#confirmPassword', 'password123')
    // 利用規約チェックを入れずにフォーカスを外す
    await page.locator('#terms').focus()
    await page.keyboard.press('Tab')
    
    // 送信ボタンが無効のままであることを確認
    await expect(submitButton).toBeDisabled()
  })

  test('パスワード強度バリデーションの確認', async ({ page }) => {
    // 英字のみのパスワード
    await page.fill('#password', 'password')
    await page.locator('#password').blur()
    await expect(page.locator('#password-error')).toBeVisible()
    await expect(page.locator('#password-error')).toContainText('パスワードは英字と数字を含む必要があります')

    // 数字のみのパスワード
    await page.fill('#password', '12345678')
    await page.locator('#password').blur()
    await expect(page.locator('#password-error')).toBeVisible()
    await expect(page.locator('#password-error')).toContainText('パスワードは英字と数字を含む必要があります')

    // 正しいパスワード（英字+数字）
    await page.fill('#password', 'password123')
    await page.locator('#password').blur()
    await expect(page.locator('#password-error')).not.toBeVisible()
  })

  test('リアルタイムバリデーションの確認', async ({ page }) => {
    // パスワード変更時の確認パスワード再検証
    await page.fill('#password', 'password123')
    await page.fill('#confirmPassword', 'password123')
    await page.locator('#confirmPassword').blur()
    await expect(page.locator('#confirmPassword-error')).not.toBeVisible()

    // パスワードを変更すると確認パスワードエラーが表示される
    await page.fill('#password', 'newpassword123')
    await page.locator('#password').blur()
    await expect(page.locator('#confirmPassword-error')).toBeVisible()
    await expect(page.locator('#confirmPassword-error')).toContainText('パスワードが一致しません')
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

  test('正常な新規登録フロー', async ({ page }) => {
    // 一意のメールアドレスを生成（テスト用）
    const timestamp = Date.now()
    const testEmail = `testuser${timestamp}@example.com`
    const testPassword = 'testpass123'

    // フォームに入力
    await page.fill('#name', 'テスト太郎')
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)
    await page.check('#terms')

    // 送信ボタンが有効化されることを確認
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeEnabled()

    // フォーム送信
    await submitButton.click()

    // ローディング状態の確認
    await expect(submitButton).toContainText('アカウント作成中...')
    await expect(submitButton).toBeDisabled()

    // 成功時のリダイレクト確認（タイムアウトを長めに設定）
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test('メールアドレス重複エラーの確認', async ({ page }) => {
    // グローバルセットアップで作成された既存ユーザーを使用
    const { email } = TEST_USERS.existing

    await page.fill('#name', 'テスト太郎')
    await page.fill('#email', email)
    await page.fill('#password', 'password123')
    await page.fill('#confirmPassword', 'password123')
    await page.check('#terms')

    await page.click('button[type="submit"]')

    // エラーメッセージの表示確認
    await expect(page.locator('.global-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.global-error h4')).toContainText('登録エラー')
    await expect(page.locator('.global-error p')).toContainText('このメールアドレスは既に使用されています')
  })

  test('Google認証ボタンの動作確認', async ({ page }) => {
    const googleButton = page.locator('.google-login-button')
    
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toContainText('Googleでアカウント作成')
    
    // ボタンクリック（実際のGoogle認証は発生しない）
    await googleButton.click()
    
    // ローディング状態の確認
    await expect(googleButton).toBeDisabled()
  })

  test('利用規約とプライバシーポリシーリンクの確認', async ({ page }) => {
    const termsLink = page.locator('a[href="/terms"]')
    const privacyLink = page.locator('a[href="/privacy"]')

    await expect(termsLink).toBeVisible()
    await expect(termsLink).toHaveText('利用規約')
    await expect(termsLink).toHaveAttribute('target', '_blank')

    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveText('プライバシーポリシー')
    await expect(privacyLink).toHaveAttribute('target', '_blank')
  })

  test('フォーム要素のアクセシビリティ確認', async ({ page }) => {
    // ARIA属性の確認
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'false')
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
    await expect(page.locator('#name')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('#email')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('#password')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('.form-input-wrapper:has(#password) .password-toggle')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('#confirmPassword')).toBeFocused()
  })

  test('レスポンシブデザインの確認', async ({ page }) => {
    // モバイルサイズでの表示確認
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.locator('.register-container')).toBeVisible()
    await expect(page.locator('.register-form-card')).toBeVisible()
    
    // フォーム要素が適切に表示されることを確認
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('フォーム送信後のUI状態確認', async ({ page }) => {
    const timestamp = Date.now()
    const testEmail = `testuser${timestamp}@example.com`

    await page.fill('#name', 'テスト太郎')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'password123')
    await page.fill('#confirmPassword', 'password123')
    await page.check('#terms')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // 送信中の状態確認
    await expect(submitButton).toBeDisabled()
    await expect(submitButton).toContainText('アカウント作成中...')
    await expect(page.locator('.loading-spinner')).toBeVisible()
  })

  test('カスタムチェックボックスの動作確認', async ({ page }) => {
    const termsCheckbox = page.locator('#terms')
    const customCheckmark = page.locator('.checkmark')
    
    // 初期状態（未チェック）
    await expect(termsCheckbox).not.toBeChecked()
    
    // チェックボックスをクリック
    await termsCheckbox.click()
    await expect(termsCheckbox).toBeChecked()
    
    // カスタムチェックマークがスタイル変更されていることを確認
    await expect(customCheckmark).toBeVisible()
    
    // 再度クリックで未チェック状態に戻る
    await termsCheckbox.click()
    await expect(termsCheckbox).not.toBeChecked()
  })

  test('エラーメッセージの表示アニメーション確認', async ({ page }) => {
    await page.fill('#name', 'あ')
    await page.locator('#name').blur()
    
    // エラーメッセージのアニメーション表示確認
    const errorElement = page.locator('#name-error')
    await expect(errorElement).toBeVisible()
    
    // エラーの色やスタイルが適用されていることを確認
    await expect(page.locator('#name')).toHaveClass(/error/)
    await expect(page.locator('.form-input-wrapper:has(#name) .form-icon')).toHaveClass(/error/)
  })

  test('ログインページへのナビゲーション確認', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]')
    
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toContainText('ログイン')
    
    // リンククリックでログインページに遷移
    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })
})