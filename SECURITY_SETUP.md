# セキュリティ設定ガイド

## 🔐 Firebase認証情報の安全な管理

このプロジェクトでは、Firebase認証情報を安全に管理するため、テンプレートベースの設定システムを採用しています。

## 📋 初回セットアップ手順

### 1. 環境変数ファイルの作成

```bash
# 開発環境用
cp frontend/.env.dev.template frontend/.env.dev

# 本番環境用（必要に応じて）
cp frontend/.env.prod.template frontend/.env.prod
```

### 2. Firebase設定ファイルの作成

```bash
# 開発環境用
cp firebase-dev-config.template.json firebase-dev-config.json

# 本番環境用（必要に応じて）
cp firebase-prod-config.template.json firebase-prod-config.json
```

### 3. 実際の認証情報を設定

各ファイル内の `[YOUR_*]` プレースホルダーを実際のFirebase認証情報に置換してください。

#### 必要な情報
- `FIREBASE_PROJECT_ID`: FirebaseプロジェクトID
- `FIREBASE_API_KEY`: Firebase APIキー
- `FIREBASE_AUTH_DOMAIN`: 認証ドメイン
- `FIREBASE_STORAGE_BUCKET`: Storageバケット名
- `FIREBASE_MESSAGING_SENDER_ID`: FCM送信者ID
- `FIREBASE_APP_ID`: Firebase アプリID

## ⚠️ セキュリティ注意事項

### ✅ 安全な管理方法
- 実際の認証情報ファイル（`.env.dev`, `firebase-dev-config.json` など）はGit管理対象外
- テンプレートファイルのみをGitで管理
- 認証情報は個人の開発環境でのみ保持

### ❌ 絶対に避けること
- 実際の認証情報をGitにコミット
- 認証情報をSlackやメールで共有
- 本番環境の認証情報を開発環境で使用

## 🔄 既存の開発環境への影響

このセキュリティ対応により：
- ✅ 既存の開発環境は継続して動作
- ✅ 認証情報ファイルはローカルに保持
- ✅ 新しい開発者は安全にセットアップ可能

## 📞 トラブルシューティング

### 認証エラーが発生した場合
1. `.env.dev` ファイルが存在するか確認
2. Firebase認証情報が正しく設定されているか確認
3. Firebase Emulatorを使用する場合は `npm run dev` を実行

### ファイルが見つからない場合
```bash
# テンプレートから作成
cp frontend/.env.dev.template frontend/.env.dev
cp firebase-dev-config.template.json firebase-dev-config.json
```

---

**🛡️ セキュリティ対応完了日**: 2025年1月30日
**📝 対応内容**: Firebase認証情報をGit管理から除外し、テンプレートベース管理に移行