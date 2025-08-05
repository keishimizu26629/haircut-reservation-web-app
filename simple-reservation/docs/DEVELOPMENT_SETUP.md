# 開発環境セットアップ手順書

## 🎯 環境概要
シンプル予約管理アプリの開発環境を効率的にセットアップするための完全ガイド。

---

## 📋 前提条件

### 必要なソフトウェア
- **Node.js**: 18.x LTS以上 
- **npm**: 9.x以上
- **Git**: 最新版
- **Firebase CLI**: 12.x以上
- **VS Code**: 推奨エディタ（拡張機能含む）

### 推奨VS Code拡張機能
```json
{
  "recommendations": [
    "vue.volar",
    "vue.vscode-typescript-vue-plugin", 
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 🚀 セットアップ手順

### Step 1: リポジトリクローン・移動
```bash
cd /Users/keisukeshimizu/Development/DockerProject/haircut-reservation
git status  # 現在の状態確認
cd simple-reservation
```

### Step 2: 依存関係インストール
```bash
# バックエンド依存関係
npm install

# フロントエンド依存関係（別途作成予定）
cd ../frontend-simple
npm install
```

### Step 3: 環境変数設定
```bash
# .env設定
cp .env.example .env

# 環境変数編集（重要）
nano .env
```

**重要な環境変数:**
```bash
# Firebase プロジェクト設定
FIREBASE_PROJECT_ID=simple-reservation-dev
FIREBASE_CLIENT_EMAIL=your-service-account@simple-reservation-dev.iam.gserviceaccount.com  
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"

# 開発環境設定
NODE_ENV=development

# Firebase Emulator設定
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### Step 4: Firebase CLI設定
```bash
# Firebase CLI インストール（グローバル）
npm install -g firebase-tools

# Firebaseログイン
firebase login

# プロジェクト初期化（既存の場合はスキップ）
firebase init

# 使用機能選択:
# ✅ Firestore
# ✅ Authentication
# ✅ Hosting
# ✅ Emulators
```

### Step 5: Firebase Emulator起動
```bash
# 開発用エミュレーター起動
npm run start:dev

# または詳細指定
firebase emulators:start --only firestore,auth,ui

# 正常起動確認
# - Firestore UI: http://localhost:4000/firestore
# - Auth UI: http://localhost:4000/auth
# - Firebase UI: http://localhost:4000
```

### Step 6: サンプルデータ初期化
```bash
# サンプルデータ投入
npm run init-data

# 確認事項:
# - 管理者アカウント: admin@example.com / password123
# - スタッフアカウント: staff1@example.com / password123
# - 7日分の予約サンプルデータ
```

---

## 🔧 開発用スクリプト

### npm scripts一覧
```json
{
  "start": "firebase emulators:start",
  "start:dev": "firebase emulators:start --only firestore,auth,ui",
  "deploy": "firebase deploy",
  "build": "tsc",
  "test": "jest",
  "init-data": "node scripts/init-sample-data.js",
  "reset-emulator": "firebase emulators:exec --only firestore 'echo \"Emulator reset\"'"
}
```

### 便利な開発コマンド
```bash
# エミュレーターリセット
npm run reset-emulator

# TypeScriptビルド（監視モード）
npx tsc --watch

# サンプルデータ再投入
npm run init-data

# Firebase設定確認
firebase projects:list
firebase use --add  # プロジェクト切り替え
```

---

## 🐛 よくある問題と解決方法

### Firebase関連

#### 問題: Emulator が起動しない
```bash
# 解決策1: ポート確認・変更
lsof -ti:4000 | xargs kill -9  # ポート4000を解放
lsof -ti:8080 | xargs kill -9  # ポート8080を解放

# 解決策2: Firebase CLI更新
npm install -g firebase-tools@latest

# 解決策3: 設定ファイル確認
cat firebase.json  # 設定内容確認
```

#### 問題: 認証が失敗する
```bash
# 解決策: Firebase再ログイン
firebase logout
firebase login
firebase projects:list  # プロジェクト一覧確認
firebase use simple-reservation-dev  # プロジェクト選択
```

#### 問題: Firestore接続エラー
```bash
# 解決策1: 環境変数確認
echo $FIRESTORE_EMULATOR_HOST
echo $FIREBASE_AUTH_EMULATOR_HOST

# 解決策2: エミュレーター再起動
pkill -f firebase
npm run start:dev
```

### Node.js関連

#### 問題: 依存関係インストールエラー
```bash
# 解決策1: キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 解決策2: Node.jsバージョン確認
node --version  # 18.x以上必要
npm --version   # 9.x以上必要
```

#### 問題: TypeScriptコンパイルエラー
```bash
# 解決策1: 型定義更新
npm install --save-dev @types/node@latest

# 解決策2: tsconfig.json確認
npx tsc --noEmit  # コンパイルチェックのみ
```

---

## 📱 フロントエンド開発環境（Nuxt 3）

### 追加セットアップ（フロントエンド用）
```bash
# 新しいNuxt 3プロジェクト作成
cd ..
npx nuxi@latest init frontend-simple
cd frontend-simple

# 必要依存関係追加
npm install @nuxtjs/tailwindcss
npm install vuefire nuxt-vuefire
npm install @pinia/nuxt pinia
npm install @vueuse/nuxt @vueuse/core

# 開発サーバー起動
npm run dev  # http://localhost:3000
```

### Nuxt 3 設定例
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-vuefire',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  vuefire: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    },
    auth: {
      enabled: true
    }
  },
  css: ['~/assets/css/main.css']
})
```

---

## 🧪 開発ワークフロー

### 日常的な開発フロー
```bash
# 1. エミュレーター起動
cd simple-reservation
npm run start:dev

# 2. 別ターミナルでフロントエンド起動  
cd ../frontend-simple
npm run dev

# 3. 開発作業...

# 4. 動作確認
# - バックエンド: http://localhost:4000（Firebase UI）
# - フロントエンド: http://localhost:3000（Nuxt dev server）

# 5. データリセット（必要時）
npm run init-data
```

### Git ワークフロー
```bash
# feature ブランチ作成
git checkout -b feature/simple-reservation-setup

# 変更をコミット
git add .
git commit -m "feat: シンプル予約管理アプリの初期セットアップ"

# リモートにプッシュ
git push origin feature/simple-reservation-setup
```

---

## 📊 パフォーマンス監視

### 開発時のパフォーマンス確認
```bash
# Firestore使用量確認
# Firebase UI → Usage タブで確認

# メモリ使用量監視
top -pid $(pgrep -f firebase)

# ネットワーク使用量
netstat -an | grep :8080  # Firestore
netstat -an | grep :9099  # Auth
```

### ログ確認
```bash
# Firebase エミュレーターログ
tail -f ~/.cache/firebase/emulators/firebase-debug.log

# アプリケーションログ
console.log() → ブラウザ Developer Tools
```

---

## 🔒 セキュリティ考慮事項

### 開発環境での注意点
1. **環境変数管理**: `.env` ファイルを.gitignoreに追加
2. **エミュレーター使用**: 本番Firebaseに接続しない
3. **テストデータ**: 実データを開発環境で使用しない
4. **ポート管理**: 開発サーバーを外部公開しない

### 推奨設定
```bash
# .gitignore に追加
.env
.env.local
.env.development
*.log
node_modules/
.firebase/
```

---

## ✅ セットアップ確認チェックリスト

### バックエンド確認
- [ ] Firebase エミュレーター起動（http://localhost:4000）
- [ ] Firestore UI アクセス可能
- [ ] Auth UI アクセス可能
- [ ] サンプルデータ投入成功
- [ ] 管理者ログイン成功（admin@example.com）

### フロントエンド確認（予定）
- [ ] Nuxt 3 開発サーバー起動（http://localhost:3000）
- [ ] TailwindCSS 適用確認
- [ ] Firebase接続確認
- [ ] 認証機能動作確認

### システム統合確認
- [ ] フロントエンド ⟷ バックエンド 通信成功
- [ ] リアルタイム同期動作確認
- [ ] CRUD操作成功
- [ ] エラーハンドリング動作確認

この手順書に従うことで、シンプル予約管理アプリの開発環境が効率的にセットアップできます。