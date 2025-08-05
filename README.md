# シンプル予約管理アプリ

**店舗スタッフ用の手動入力予約管理システム：Nuxt 3 + Firebase**

## 🎯 プロジェクト概要

紙の予約表をデジタル化した、美容室スタッフが手動で予約を記入・管理するシンプルなWebアプリケーションです。

### 主要機能
- 📝 **手動予約入力**: 電話・インスタグラムからの予約を手動で記入
- 🎨 **色分け表示**: カット・カラー・パーマ等をパステルカラーで視覚的に管理
- ⏰ **30分単位枠**: 9:00-19:00の営業時間に対応（時間外入力も可能）
- 🔄 **リアルタイム同期**: 複数端末で同時編集・更新が可能
- 📱 **マルチデバイス**: PC・タブレット・スマートフォンに対応

## 🏗️ アーキテクチャ概要

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  スタッフ端末1   │  │  スタッフ端末2   │  │  スタッフ端末3   │
│  (Web Browser)  │  │  (Web Browser)  │  │  (Web Browser)  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                       ┌──────┴──────┐
                       │  Firebase   │
                       │  Hosting    │
                       │ (Nuxt SPA)  │
                       └──────┬──────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
               ┌────┴────┐        ┌────┴────┐
               │Firestore│        │  Auth   │
               │(NoSQL)  │        │(Simple) │
               └─────────┘        └─────────┘
```

### 🔑 設計思想
- ✅ **シンプルさ重視**: 必要最小限の機能のみ実装
- ✅ **直感的操作**: 紙の予約表と同じ感覚で使用可能
- ✅ **リアルタイム**: 複数スタッフの同時利用に対応
- ❌ **不要機能の排除**: オンライン予約・顧客管理・メニュー分けは実装しない

## 🌍 環境構成

| 環境            | Frontend | Firebase                   | 備考           |
| --------------- | -------- | -------------------------- | -------------- |
| **Local**       | Nuxt 3   | Firebase Emulator          | 開発・テスト用 |
| **Development** | Nuxt 3   | Firebase Project (dev)     | リモート開発用 |
| **Staging**     | Nuxt 3   | Firebase Project (staging) | 本番前テスト   |
| **Production**  | Nuxt 3   | Firebase Project (prod)    | 本番環境       |

## 🚀 クイックスタート

### 🏃‍♂️ 最速起動（推奨）

```bash
# 1. プロジェクトクローン
git clone <repository-url>
cd haircut-reservation

# 2. ローカル環境起動（Firebase Emulator使用）
npm run dev

# 3. アクセス確認
curl http://localhost:3000        # Nuxt Frontend
curl http://localhost:4000        # Firebase Emulator UI
```

**⚠️ 注意:** `docker compose up -d` は動作しません。必ず `npm run dev` を使用してください。

### 🔧 環境別起動方法

```bash
# ローカル環境（Firebase Emulator）- 環境変数不要
npm run dev

# 開発環境（実Firebase）- .env.dev が必要
npm run dev:remote

# 本番環境（実Firebase）- .env.prod が必要
npm run prod
```

### 📋 初回セットアップが必要な場合

```bash
# 🚀 ワンコマンドセットアップ（推奨）
npm run setup:quick

# 個別に環境変数ファイル作成
npm run setup:env:local  # ローカル環境用
npm run setup:env:dev    # 開発環境用（要編集）
npm run setup:env:prod   # 本番環境用（要編集）

# 手動作成する場合
touch .env.local .env.dev .env.prod
```

**💡 ヒント:** `npm run setup:quick` でセットアップ後、すぐに `npm run dev` で起動できます！

## 📁 プロジェクト構造

```
haircut-reservation/
├── components/              # Vue コンポーネント
│   ├── calendar/           # カレンダーグリッド関連
│   ├── modals/             # 予約入力モーダル
│   └── common/             # 共通コンポーネント
├── composables/            # Firebase接続・状態管理
├── pages/                  # ページ（メイン画面・ログイン画面）
├── stores/                 # Pinia ストア
└── types/                  # TypeScript型定義
├── firebase/                 # Firebase設定
│   ├── firebase.json        # Firebase プロジェクト設定
│   └── firestore.rules      # Firestoreセキュリティルール
├── .ai/                      # プロジェクト仕様・計画書
│   └── plan/                # 要件定義・実装計画
└── nuxt.config.ts           # Nuxt設定
```

## 🔥 Firebase サービス利用

### 認証 (Firebase Auth)

- シンプルなEmail/パスワード認証（管理者用）
- 共有アカウントでの複数端末アクセス

### データベース (Firestore)

- 予約データ（日付・時間・内容・カテゴリー・ステータス）
- 設定データ（営業時間・カテゴリー色設定）

### ストレージ（使用しない）

- ファイルアップロード機能は不要

### 関数（使用しない）

- サーバーレス関数は不要（シンプル構成）

## 🛠️ 開発コマンド

### 環境起動

```bash
npm run dev           # ローカル環境（Emulator）
npm run dev:remote    # リモート開発環境
npm run prod          # 本番環境
npm run dev:down      # 停止
```

### テスト・確認

```bash
npm run test:firebase:local   # Firebase接続テスト
npm run status               # サービス状態確認
npm run logs:frontend        # フロントエンドログ
npm run logs:firebase        # Firebase Emulatorログ
```

### デプロイ

```bash
npm run deploy:dev      # 開発環境デプロイ
npm run deploy:staging  # ステージング環境デプロイ
npm run deploy:prod     # 本番環境デプロイ
```

## 🐳 Docker Compose セットアップ

### 前提条件

```bash
# 必要なソフトウェア
Docker Engine 20.0+
Docker Compose 2.0+
Node.js 18.0+ (環境変数テンプレート作成用)
```

### 初回セットアップ手順

#### 1. 環境変数ファイルの作成

```bash
# ローカル環境用（Firebase Emulator使用）
touch .env.local

# 開発環境用（実Firebase接続）
touch .env.dev

# 本番環境用（実Firebase接続）
touch .env.prod
```

#### 2. 環境変数の設定

**ローカル環境（`.env.local`）**

```bash
# Firebase Emulator用 - そのまま使用可能
NODE_ENV=development
FIREBASE_ENV=local
FIREBASE_PROJECT_ID=demo-project
FIREBASE_API_KEY=demo-api-key
FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:demo123
```

**開発環境（`.env.dev`）**

```bash
# 実Firebase接続用 - 要設定
NODE_ENV=development
FIREBASE_ENV=dev
FIREBASE_PROJECT_ID=your-dev-project-id
FIREBASE_API_KEY=your-dev-api-key
FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-dev-app-id
```

**本番環境（`.env.prod`）**

```bash
# 実Firebase接続用 - 要設定
NODE_ENV=production
FIREBASE_ENV=prod
BUILD_TARGET=production
FIREBASE_PROJECT_ID=your-prod-project-id
FIREBASE_API_KEY=your-prod-api-key
FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-prod-app-id
```

#### 3. Docker Compose 起動

```bash
# ローカル環境（Firebase Emulator使用）
npm run dev
# または
docker compose --profile local up -d

# 開発環境（実Firebase接続）
npm run dev:remote
# または
docker compose --env-file .env.dev --profile dev up -d

# 本番環境（実Firebase接続）
npm run prod
# または
docker compose --env-file .env.prod --profile prod up -d
```

### ⚠️ 重要な注意点

1. **プロファイル指定は必須**

   ```bash
   # ❌ これは動作しません
   docker compose up -d

   # ✅ プロファイルを指定してください
   docker compose --profile local up -d
   ```

2. **環境変数ファイルが必要**

   - 開発・本番環境では対応する`.env`ファイルが必要
   - ファイルが存在しない場合は起動に失敗します

3. **ポート競合の確認**
   ```bash
   # 使用ポートの確認
   lsof -i :3000  # フロントエンド
   lsof -i :4000  # Firebase Emulator UI
   lsof -i :8080  # Firestore Emulator
   ```

## 🔧 環境設定詳細

### サービス構成

| 環境     | プロファイル | サービス                                | ポート                 | Firebase 接続     |
| -------- | ------------ | --------------------------------------- | ---------------------- | ----------------- |
| ローカル | `local`      | `frontend-local`<br>`firebase-emulator` | 3000, 4000, 8080, 9099 | Emulator          |
| 開発     | `dev`        | `frontend`                              | 3000                   | 実 Firebase(dev)  |
| 本番     | `prod`       | `frontend`                              | 3000                   | 実 Firebase(prod) |

## 📚 技術スタック

### Frontend

- **Nuxt 3** - Vue.js フレームワーク（SPA モード）
- **Vue 3** - リアクティブ UI
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング・カスタムカラーパレット
- **Pinia** - 状態管理
- **VueFire** - Firebase統合

### Backend (Firebase - 最小構成)

- **Firebase Auth** - シンプル認証
- **Firestore** - NoSQL データベース（リアルタイム同期）
- **Firebase Hosting** - 静的サイトホスティング

### 開発・運用

- **Firebase Emulator** - ローカル開発
- **Firebase Console** - 本番監視

## 🔐 セキュリティ

### Firestore セキュリティルール

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 予約データは認証済みユーザーのみ
    match /reservations/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // 設定データは読み取り専用
    match /settings/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // 管理者のみコンソールから変更
    }
  }
}
```

## 📈 監視・分析

### Firebase Console

- リアルタイムデータベース監視
- 認証ユーザー管理  
- パフォーマンス監視

### 使用量管理

- Firestore無料枠での運用
- 使用量アラート設定

## 🚀 デプロイメント

### Firebase Hosting

```bash
# ビルド & デプロイ
npm run build
firebase deploy --only hosting

# 環境別デプロイ
firebase use dev && firebase deploy
firebase use prod && firebase deploy
```

## 🎯 プロジェクト仕様書

### 要件定義・設計ドキュメント

プロジェクトの詳細な仕様は以下のドキュメントを参照してください：

📋 **要件定義**: [requirements-simple-reservation.md](.ai/plan/requirements-simple-reservation.md)
🚀 **実装計画**: [implementation-plan-simple-reservation.md](.ai/plan/implementation-plan-simple-reservation.md)  
🔧 **技術スタック**: [technical-stack-simple-reservation.md](.ai/plan/technical-stack-simple-reservation.md)

#### 主要要件

- **手動予約入力**: 文字数制限なし、ダブルブッキング可能
- **30分単位の時間枠**: 9:00-19:00（時間外入力も可能）
- **色分け機能**: パステルカラーでカテゴリー別表示
- **リアルタイム同期**: 複数端末での同時編集
- **シンプルUI**: 紙の予約表をデジタル化した直感的な操作

## 📞 サポート

### トラブルシューティング

#### Docker Compose 関連

**問題: `docker compose up -d` が動作しない**

```bash
# 解決策: プロファイルを指定する
docker compose --profile local up -d
```

**問題: 環境変数ファイル読み込みエラー**

```bash
# 解決策: ファイルが存在するか確認
ls -la .env.*

# 不足している場合は作成
touch .env.local .env.dev .env.prod
```

**問題: ポート競合エラー**

```bash
# 使用中のポートを確認
lsof -i :3000 :4000 :8080 :9099

# 競合している場合はプロセスを停止
sudo lsof -ti:3000 | xargs kill -9
```

**問題: Docker ビルドエラー**

```bash
# キャッシュクリアして再ビルド
npm run dev:fresh
# または
docker compose build --no-cache
```

#### Firebase 関連

**問題: Firebase Emulator 起動失敗**

```bash
# Javaインストール確認
java --version

# Firebase CLI インストール確認
npm install -g firebase-tools
```

**問題: Firebase 接続エラー**

```bash
# 接続テスト実行
npm run test:firebase:local   # ローカル環境
npm run test:firebase:dev     # 開発環境
```

**問題: 認証エラー**

```bash
# Firebase ログイン状態確認
firebase login

# プロジェクト設定確認
firebase projects:list
```

#### 一般的な問題

**問題: フロントエンドにアクセスできない**

```bash
# サービス状態確認
npm run status

# ログ確認
npm run logs:frontend

# ヘルスチェック
npm run health:local  # ローカル環境
npm run health:remote # リモート環境
```

**問題: 変更が反映されない**

```bash
# 開発環境再起動
npm run dev:down
npm run dev

# 完全リフレッシュ
npm run dev:fresh
```

#### ログ確認方法

```bash
# 全サービスのログ
npm run logs

# 特定サービスのログ
npm run logs:frontend
npm run logs:firebase

# リアルタイムログ監視
npm run dev:logs
```

#### 完全リセット方法

```bash
# 全コンテナ・ボリューム削除
npm run clean

# イメージも含めて完全削除
docker compose down -v --rmi all
docker system prune -a -f
```

### 参考資料

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vue 3 Documentation](https://vuejs.org/guide/)

---

**🎉 シンプル予約管理アプリ**
**紙の予約表をデジタル化 - 複数端末でリアルタイム同期**
