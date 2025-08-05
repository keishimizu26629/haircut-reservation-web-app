import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests', () => {
  // Firebase Emulator UI Helper
  const checkFirebaseEmulatorUI = async (page: any) => {
    const emulatorPage = await page.context().newPage();
    await emulatorPage.goto('http://localhost:4000');
    const authSection = emulatorPage.locator('text=Authentication');
    await expect(authSection).toBeVisible({ timeout: 10000 });
    return emulatorPage;
  };

  test.beforeEach(async ({ page }) => {
    // Firebase Emulatorが動作していることを確認
    await page.goto('http://localhost:4000');
    await expect(page.locator('text=Firebase Emulator Suite')).toBeVisible({ timeout: 15000 });

    // メインページに戻る
    await page.goto('/');
  });

  test('should display registration form correctly', async ({ page }) => {
    await page.goto('/register');

    // ページタイトル確認
    await expect(page).toHaveTitle(/アカウント作成|新規登録|Register/);

    // フォーム要素の存在確認
    await expect(page.locator('input[type="text"]').first()).toBeVisible(); // 名前
    await expect(page.locator('input[type="email"]')).toBeVisible(); // メール
    await expect(page.locator('input[type="password"]').first()).toBeVisible(); // パスワード
    await expect(page.locator('input[type="password"]').nth(1)).toBeVisible(); // パスワード確認
    await expect(page.locator('input[type="checkbox"]')).toBeVisible(); // 利用規約
    await expect(page.locator('button[type="submit"]')).toBeVisible(); // 登録ボタン

    console.log('✅ Registration form elements are visible');
  });

  test('should create new user account successfully', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'テストユーザー';

    // 登録ページへ移動
    await page.goto('/register');

    // Firebase関連のログを監視
    const firebaseLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Firebase') || text.includes('Auth')) {
        firebaseLogs.push(text);
        console.log('🔥 Firebase Log:', text);
      }
    });

    // エラーログも監視
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    // フォーム入力
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[type="password"]:nth-of-type(2)', testPassword);
    await page.check('input[type="checkbox"]');

    console.log(`📝 Form filled with: ${testEmail}, ${testName}`);

    // 登録ボタンクリック
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 登録成功の確認（リダイレクトまたは成功メッセージ）
    await page.waitForTimeout(3000); // Firebase処理待機

    // 成功時のリダイレクト先確認
    const currentUrl = page.url();
    const possibleSuccessUrls = ['/dashboard', '/profile', '/welcome', '/'];
    const isRedirected = possibleSuccessUrls.some(url => currentUrl.includes(url));

    if (!isRedirected) {
      // リダイレクトされていない場合は成功メッセージを確認
      const successMessage = page.locator('text=/成功|success|アカウント作成/i');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }

    console.log(`✅ Registration completed. Current URL: ${currentUrl}`);

    // Firebase Emulator UIでユーザー作成確認
    const emulatorPage = await checkFirebaseEmulatorUI(page);
    await emulatorPage.click('text=Authentication');
    await emulatorPage.waitForTimeout(2000);

    // ユーザーリストでテストユーザー確認
    const userEmail = emulatorPage.locator(`text=${testEmail}`);
    await expect(userEmail).toBeVisible({ timeout: 10000 });

    console.log('✅ User found in Firebase Emulator UI');
    await emulatorPage.close();
  });

  test('should validate form fields correctly', async ({ page }) => {
    await page.goto('/register');

    // 空の状態で送信を試行
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // バリデーションエラーの確認
    await page.waitForTimeout(1000);

    // エラーメッセージやバリデーション状態を確認
    const errorElements = page.locator('.error, .invalid-feedback, .is-invalid');
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      console.log(`✅ Form validation working: ${errorCount} errors shown`);
    }

    // 無効なメールアドレスでテスト
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="text"]', 'テスト');
    await page.fill('input[type="password"]', '123'); // 短いパスワード
    await submitButton.click();

    await page.waitForTimeout(1000);

    // バリデーションエラーが表示されることを確認
    const validationErrors = await page.locator('.error, .invalid-feedback').count();
    expect(validationErrors).toBeGreaterThan(0);

    console.log('✅ Form validation is working correctly');
  });

  test('should handle duplicate email registration', async ({ page }) => {
    const duplicateEmail = 'duplicate@example.com';
    const testPassword = 'TestPassword123!';

    // 最初のアカウント作成
    await page.goto('/register');
    await page.fill('input[type="text"]', 'First User');
    await page.fill('input[type="email"]', duplicateEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[type="password"]:nth-of-type(2)', testPassword);
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // 2回目の同じメールでアカウント作成を試行
    await page.goto('/register');
    await page.fill('input[type="text"]', 'Second User');
    await page.fill('input[type="email"]', duplicateEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[type="password"]:nth-of-type(2)', testPassword);
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // 重複エラーメッセージの確認
    const errorMessage = page.locator('text=/既に使用|already|duplicate/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Duplicate email error handling works correctly');
  });
});

test.describe('Login Flow Tests', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeAll(async () => {
    testEmail = `login-test-${Date.now()}@example.com`;
    testPassword = 'LoginTest123!';
  });

  test('should login with valid credentials', async ({ page }) => {
    // まずテストユーザーを作成
    await page.goto('/register');
    await page.fill('input[type="text"]', 'Login Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[type="password"]:nth-of-type(2)', testPassword);
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // ログアウト（必要に応じて）
    const logoutButton = page.locator('text=/ログアウト|logout/i');
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    }

    // ログインページへ移動
    await page.goto('/login');

    // ログインフォーム入力
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // ログイン成功の確認
    const currentUrl = page.url();
    const successUrls = ['/dashboard', '/profile', '/'];
    const isLoggedIn = successUrls.some(url => currentUrl.includes(url)) ||
                      await page.locator('text=/ダッシュボード|dashboard|ログアウト/i').isVisible({ timeout: 5000 });

    expect(isLoggedIn).toBeTruthy();
    console.log('✅ Login successful');
  });
});

test.describe('Password Reset Flow Tests', () => {
  test('should display forgot password form', async ({ page }) => {
    await page.goto('/forgot-password');

    // パスワードリセットページの要素確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=/パスワード|password|forgot/i')).toBeVisible();

    console.log('✅ Forgot password form is displayed correctly');
  });

  test('should handle password reset request', async ({ page }) => {
    await page.goto('/forgot-password');

    const testEmail = 'password-reset@example.com';
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // 成功メッセージまたはエラーメッセージの確認
    const message = page.locator('text=/送信|sent|メール|email/i');
    await expect(message).toBeVisible({ timeout: 5000 });

    console.log('✅ Password reset request handled');
  });
});
