# 詳細テストケース仕様書

## 1. 認証フローテストケース

### 1.1 ユーザー登録フロー

#### テストケース: AUTH-001
**カテゴリ**: 単体テスト  
**対象**: POST /api/auth/register  
**優先度**: 高

**ケース 1-1: 有効なデータでの顧客登録**
```typescript
describe('Customer Registration - Valid Data', () => {
  const validCustomerData = {
    email: 'customer@example.com',
    password: 'SecurePass123!',
    firstName: '田中',
    lastName: '太郎',
    role: 'customer'
  };

  it('should create customer account successfully', async () => {
    // Firebase Auth ユーザー作成
    // Firestore ユーザードキュメント作成
    // 顧客権限の設定確認
    // レスポンスの妥当性確認
  });
});
```

**ケース 1-2: テナントオーナー登録**
```typescript
describe('Tenant Owner Registration', () => {
  const validOwnerData = {
    email: 'owner@salon.com',
    password: 'OwnerPass123!',
    firstName: '佐藤',
    lastName: '花子',
    role: 'tenant_owner',
    tenantId: 'salon-001'
  };

  it('should create tenant owner with correct permissions', async () => {
    // 管理者権限の設定確認
    // テナント関連付けの確認
  });
});
```

**ケース 1-3: スタッフ登録**
```typescript
describe('Staff Registration', () => {
  it('should create staff account with limited permissions', async () => {
    // スタッフ権限の設定確認
    // テナント制限の確認
  });
});
```

**ケース 1-4: バリデーションエラー**
```typescript
describe('Registration Validation', () => {
  it('should reject invalid email format', async () => {
    // 無効なメールアドレス
  });
  
  it('should reject weak password', async () => {
    // 弱いパスワード
  });
  
  it('should reject missing required fields', async () => {
    // 必須フィールドの欠如
  });
});
```

### 1.2 認証トークン検証フロー

#### テストケース: AUTH-002
**カテゴリ**: 単体・統合テスト  
**対象**: AuthMiddleware.verifyToken  
**優先度**: 高

**ケース 2-1: 有効なトークン検証**
```typescript
describe('Token Verification - Valid Token', () => {
  it('should verify valid Firebase ID token', async () => {
    // 有効なトークンの検証
    // ユーザーデータの取得確認
    // req.userへの設定確認
  });
});
```

**ケース 2-2: 無効なトークン処理**
```typescript
describe('Token Verification - Invalid Token', () => {
  it('should reject expired token', async () => {
    // 期限切れトークン
  });
  
  it('should reject malformed token', async () => {
    // 不正形式のトークン
  });
  
  it('should reject missing authorization header', async () => {
    // Authorizationヘッダーなし
  });
});
```

**ケース 2-3: 停止・無効ユーザー処理**
```typescript
describe('Suspended User Handling', () => {
  it('should reject suspended user', async () => {
    // 停止ユーザーの拒否
  });
  
  it('should reject inactive user', async () => {
    // 非アクティブユーザーの拒否
  });
});
```

### 1.3 権限・ロール検証フロー

#### テストケース: AUTH-003
**カテゴリ**: 単体・統合テスト  
**対象**: AuthMiddleware権限チェック  
**優先度**: 高

**ケース 3-1: テナント別権限チェック**
```typescript
describe('Tenant-Specific Permission Check', () => {
  it('should allow access to own tenant resources', async () => {
    // 自分のテナントリソースへのアクセス
  });
  
  it('should deny access to other tenant resources', async () => {
    // 他のテナントリソースへのアクセス拒否
  });
});
```

**ケース 3-2: ロール別権限チェック**
```typescript
describe('Role-Based Permission Check', () => {
  it('should allow tenant_owner full access', async () => {
    // テナントオーナーの全権限
  });
  
  it('should limit staff permissions', async () => {
    // スタッフの制限権限
  });
  
  it('should limit customer permissions', async () => {
    // 顧客の制限権限
  });
});
```

## 2. 予約機能テストケース

### 2.1 予約作成フロー

#### テストケース: BOOKING-001
**カテゴリ**: 単体・統合テスト  
**対象**: POST /api/tenants/:tenantId/reservations  
**優先度**: 高

**ケース 4-1: 有効な予約作成**
```typescript
describe('Reservation Creation - Valid Booking', () => {
  const validBookingData = {
    staffId: 'staff-001',
    serviceIds: ['service-001', 'service-002'],
    appointmentDate: '2024-12-25',
    startTime: '10:00',
    customerInfo: {
      name: '山田太郎',
      email: 'yamada@example.com',
      phone: '090-1234-5678'
    }
  };

  it('should create reservation successfully', async () => {
    // 予約作成
    // 料金計算確認
    // 時間計算確認
    // 顧客情報保存確認
  });
});
```

**ケース 4-2: 時間競合チェック**
```typescript
describe('Time Conflict Check', () => {
  it('should reject overlapping appointments', async () => {
    // 重複する予約の拒否
  });
  
  it('should allow adjacent appointments', async () => {
    // 隣接する予約の許可
  });
});
```

**ケース 4-3: 営業時間チェック**
```typescript
describe('Business Hours Validation', () => {
  it('should reject appointments outside business hours', async () => {
    // 営業時間外の予約拒否
  });
  
  it('should reject appointments during break time', async () => {
    // 休憩時間の予約拒否
  });
});
```

### 2.2 予約更新フロー

#### テストケース: BOOKING-002
**カテゴリ**: 単体・統合テスト  
**対象**: PUT /api/tenants/:tenantId/reservations/:id  
**優先度**: 高

**ケース 5-1: 予約時間変更**
```typescript
describe('Reservation Time Update', () => {
  it('should update appointment time successfully', async () => {
    // 予約時間の変更
    // 競合チェック
    // 料金再計算
  });
});
```

**ケース 5-2: 権限別更新制限**
```typescript
describe('Permission-Based Update Restrictions', () => {
  it('should allow customer to update limited fields', async () => {
    // 顧客の制限された更新
  });
  
  it('should allow staff full update access', async () => {
    // スタッフの完全更新権限
  });
});
```

### 2.3 予約キャンセルフロー

#### テストケース: BOOKING-003
**カテゴリ**: 単体・統合テスト  
**対象**: DELETE /api/tenants/:tenantId/reservations/:id  
**優先度**: 高

**ケース 6-1: キャンセル制限時間チェック**
```typescript
describe('Cancellation Deadline Check', () => {
  it('should allow cancellation before deadline', async () => {
    // 期限前のキャンセル許可
  });
  
  it('should reject cancellation after deadline', async () => {
    // 期限後のキャンセル拒否
  });
});
```

## 3. ルーティング変更後の回帰テスト

### 3.1 APIエンドポイント回帰テスト

#### テストケース: REGRESSION-001
**カテゴリ**: 回帰テスト  
**対象**: 全APIエンドポイント  
**優先度**: 高

**ケース 7-1: 既存APIの互換性**
```typescript
describe('API Backward Compatibility', () => {
  it('should maintain existing endpoint responses', async () => {
    // 既存レスポンス形式の維持
  });
  
  it('should maintain error response format', async () => {
    // エラーレスポンス形式の維持
  });
});
```

**ケース 7-2: 認証フロー回帰**
```typescript
describe('Authentication Flow Regression', () => {
  it('should maintain login flow', async () => {
    // ログインフローの維持
  });
  
  it('should maintain token refresh flow', async () => {
    // トークン更新フローの維持
  });
});
```

### 3.2 データベース操作回帰テスト

#### テストケース: REGRESSION-002
**カテゴリ**: 回帰テスト  
**対象**: Firestore操作  
**優先度**: 高

**ケース 8-1: データ整合性**
```typescript
describe('Data Integrity Regression', () => {
  it('should maintain user data structure', async () => {
    // ユーザーデータ構造の維持
  });
  
  it('should maintain reservation data structure', async () => {
    // 予約データ構造の維持
  });
});
```

## 4. E2Eテストケース（Playwright）

### 4.1 完全な予約フロー

#### テストケース: E2E-001
**カテゴリ**: E2Eテスト  
**対象**: 予約完了フロー  
**優先度**: 高

```typescript
describe('Complete Booking Flow E2E', () => {
  test('customer can complete full booking process', async ({ page }) => {
    // 1. ホームページアクセス
    await page.goto('/');
    
    // 2. サービス選択
    await page.click('[data-testid="service-selection"]');
    await page.click('[data-testid="service-haircut"]');
    
    // 3. スタッフ選択
    await page.click('[data-testid="staff-selection"]');
    await page.click('[data-testid="staff-tanaka"]');
    
    // 4. 日時選択
    await page.click('[data-testid="date-selection"]');
    await page.click('[data-testid="time-10-00"]');
    
    // 5. 顧客情報入力
    await page.fill('[data-testid="customer-name"]', '山田太郎');
    await page.fill('[data-testid="customer-email"]', 'yamada@test.com');
    
    // 6. 予約確定
    await page.click('[data-testid="confirm-booking"]');
    
    // 7. 完了画面確認
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
  });
});
```

### 4.2 認証フロー

#### テストケース: E2E-002
**カテゴリ**: E2Eテスト  
**対象**: ログイン・ログアウト  
**優先度**: 高

```typescript
describe('Authentication Flow E2E', () => {
  test('user can login and logout', async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // ダッシュボード表示確認
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // ログアウト
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/');
  });
});
```

## 5. 単体テスト詳細

### 5.1 サービス層テスト

#### AuthService単体テスト
```typescript
describe('AuthService Unit Tests', () => {
  test('createUser should create user with correct permissions', async () => {
    // モック設定
    // 実行
    // 検証
  });
  
  test('verifyToken should validate Firebase token', async () => {
    // トークン検証ロジック
  });
});
```

#### ReservationService単体テスト
```typescript
describe('ReservationService Unit Tests', () => {
  test('createReservation should calculate time and price correctly', async () => {
    // 時間・料金計算ロジック
  });
  
  test('checkAvailability should detect conflicts', async () => {
    // 空き時間チェックロジック
  });
});
```

### 5.2 コントローラー層テスト

#### AuthController統合テスト
```typescript
describe('AuthController Integration Tests', () => {
  test('registration endpoint should handle validation errors', async () => {
    // バリデーションエラーハンドリング
  });
});
```

## 6. テスト実行戦略

### 6.1 テストピラミッド
1. **単体テスト (70%)**: サービス・ユーティリティ関数
2. **統合テスト (20%)**: コントローラー・API層
3. **E2Eテスト (10%)**: 主要ユーザーフロー

### 6.2 テスト環境
- **単体・統合**: Jest + Firestore Emulator
- **E2E**: Playwright + 実環境またはステージング環境

### 6.3 継続的テスト
- **Pre-commit**: 単体テストと静的解析
- **CI/CD**: 全テストスイート実行
- **定期回帰**: 週次の完全テスト実行