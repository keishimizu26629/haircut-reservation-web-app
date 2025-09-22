# 環境設定ガイド

このドキュメントでは、アプリケーションの環境設定について説明します。

## 📁 環境ファイル構成

```
frontend/
├── .env.local          # ローカル開発環境（Firebase Emulator使用）
├── .env.development    # 開発環境（Firebase Cloud Development）
├── .env.production     # 本番環境（Firebase Cloud Production）
└── .env.example        # 環境変数テンプレート
```

## 🔧 環境変数一覧

### 基本設定

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NODE_ENV` | Node.js実行環境 | `development`, `production` |
| `NUXT_ENV` | Nuxt環境識別子 | `local`, `development`, `production` |
| `FIREBASE_ENV` | Firebase環境識別子 | `local`, `development`, `production` |

### Firebase設定

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `FIREBASE_PROJECT_ID` | FirebaseプロジェクトID | ✅ |
| `FIREBASE_API_KEY` | Firebase APIキー | ✅ |
| `FIREBASE_AUTH_DOMAIN` | Firebase認証ドメイン | ✅ |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storageバケット | ✅ |
| `FIREBASE_MESSAGING_SENDER_ID` | FCM送信者ID | ✅ |
| `FIREBASE_APP_ID` | Firebase アプリID | ✅ |

### Firebase Emulator設定（ローカル開発のみ）

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `FIREBASE_AUTH_EMULATOR_HOST` | Auth Emulatorホスト | `localhost:9099` |
| `FIRESTORE_EMULATOR_HOST` | Firestore Emulatorホスト | `localhost:8080` |
| `FIREBASE_DATABASE_EMULATOR_HOST` | Database Emulatorホスト | `localhost:9000` |
| `FIREBASE_STORAGE_EMULATOR_HOST` | Storage Emulatorホスト | `localhost:9199` |
| `FIREBASE_FUNCTIONS_EMULATOR_HOST` | Functions Emulatorホスト | `localhost:5001` |

### マルチテナント設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `ENABLE_MULTI_TENANT` | マルチテナント機能の有効/無効 | `true` |
| `DEFAULT_TENANT_ID` | デフォルトテナントID | `default-salon` |

### 機能フラグ

| 変数名 | 説明 | 開発環境 | 本番環境 |
|--------|------|----------|----------|
| `ENABLE_DEBUG_MODE` | デバッグモード | `true` | `false` |
| `ENABLE_DEVTOOLS` | 開発ツール | `true` | `false` |
| `ENABLE_MOCK_DATA` | モックデータ使用 | `true` | `false` |
| `ENABLE_ANALYTICS` | Google Analytics | `false` | `true` |
| `ENABLE_ERROR_REPORTING` | エラーレポート | `true` | `true` |
| `ENABLE_PERFORMANCE_MONITORING` | パフォーマンス監視 | `true` | `true` |

## 🚀 環境別セットアップ

### ローカル開発環境

1. `.env.local` ファイルを作成（または `.env.example` をコピー）
2. Firebase Emulatorを起動
3. アプリケーションを起動

```bash
# Firebase Emulatorを起動
npm run emulators:start

# 別ターミナルでアプリケーションを起動
npm run dev
```

### 開発環境デプロイ

1. CI/CDパイプラインで環境変数を設定
2. `.env.development` の変数を実際の値で置換
3. デプロイを実行

### 本番環境デプロイ

1. CI/CDパイプラインで本番環境変数を設定
2. セキュリティ設定を確認
3. 本番デプロイを実行

## 🔍 環境設定の確認

### 1. 環境情報の表示

開発者コンソールで以下を実行：

```javascript
// 環境情報を表示
const { getDeveloperInfo } = useEnvironment()
console.table(getDeveloperInfo())
```

### 2. 設定バリデーション

```javascript
// 設定の妥当性をチェック
import { EnvironmentValidator } from '~/utils/environmentValidator'

const config = useRuntimeConfig()
const validation = await EnvironmentValidator.validateEnvironment(config.public)
console.log('Validation Result:', validation)
```

## 🏢 マルチテナント機能

### テナント切り替え

```javascript
const { changeTenant } = useTenant()

// テナントを切り替え
await changeTenant('dev-salon')
```

### テナント固有機能の確認

```javascript
const { hasFeature } = useTenant()

// 決済機能が有効かチェック
if (hasFeature('payments')) {
  // 決済機能を表示
}
```

### テナント固有のFirestoreパス

```javascript
const { getTenantPath } = useTenant()

// テナント固有のコレクションパスを取得
const reservationsPath = getTenantPath('reservations')
// 結果: "tenants/salon-id/reservations"
```

## 🛡️ セキュリティ考慮事項

### 本番環境での必須設定

- `ENABLE_HTTPS_REDIRECT=true`
- `ENABLE_HSTS=true`
- `ENABLE_CSP=true`
- `ENABLE_DEBUG_MODE=false`
- `ENABLE_MOCK_DATA=false`

### 環境変数の管理

- 機密情報は環境変数で管理
- `.env.*` ファイルは `.gitignore` に追加（`.env.example` 除く）
- CI/CDパイプラインでセキュアな環境変数設定

## 📊 監視とログ

### エラーレポート

本番環境では自動的にエラーレポートが有効になります。

### パフォーマンス監視

Firebase Performance Monitoring により、アプリケーションのパフォーマンスを監視できます。

### ログレベル

| 環境 | ログレベル | 出力内容 |
|------|-----------|----------|
| ローカル | `debug` | 詳細なデバッグ情報 |
| 開発 | `debug` | 開発用情報 |
| 本番 | `error` | エラーのみ |

## 🔧 トラブルシューティング

### Firebase Emulatorに接続できない

1. Emulatorが起動しているか確認
2. ポート番号が正しいか確認
3. ファイアウォール設定を確認

```bash
# Emulator状態確認
lsof -i :4000,8080,9099,9000,9199,5001
```

### 環境変数が反映されない

1. `.env` ファイルの場所を確認
2. ファイル名が正しいか確認（`.env.local` など）
3. アプリケーションを再起動
4. ブラウザのキャッシュをクリア

### テナント切り替えができない

1. `ENABLE_MULTI_TENANT=true` が設定されているか確認
2. ブラウザのセッションストレージを確認
3. 開発者コンソールでエラーを確認

## 📚 関連ファイル

- `nuxt.config.ts` - Nuxt設定ファイル
- `plugins/environment.client.ts` - 環境設定プラグイン
- `composables/useEnvironment.ts` - 環境管理Composable
- `composables/useTenant.ts` - テナント管理Composable
- `middleware/tenant.global.ts` - テナント管理ミドルウェア
- `utils/environmentValidator.ts` - 環境設定バリデーター