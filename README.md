# 美容室予約システム

**サーバーレス構成：Nuxt 3 + Firebase 直接接続**

## 🏗️ アーキテクチャ概要

このプロジェクトは**サーバーレス構成**で構築されています：

```
┌─────────────────┐    直接接続    ┌─────────────────┐
│   Nuxt 3        │ ──────────────▶ │   Firebase      │
│   Frontend      │                │   Backend       │
│                 │                │                 │
│ • Vue 3         │                │ • Authentication│
│ • Composition   │                │ • Firestore DB  │
│ • TypeScript    │                │ • Storage       │
│ • Tailwind CSS  │                │ • Functions     │
└─────────────────┘                └─────────────────┘
```

### 🚫 **重要：Backend サーバーは存在しません**

- ✅ **Nuxt 3 Frontend** → **Firebase** 直接接続
- ❌ ~~Backend API サーバー~~ （存在しない）
- ✅ **Firebase Functions** でサーバーサイド処理
- ✅ **Firestore** でデータベース
- ✅ **Firebase Auth** で認証

## 🌍 環境構成

| 環境            | Frontend | Firebase                   | 備考           |
| --------------- | -------- | -------------------------- | -------------- |
| **Local**       | Nuxt 3   | Firebase Emulator          | 開発・テスト用 |
| **Development** | Nuxt 3   | Firebase Project (dev)     | リモート開発用 |
| **Staging**     | Nuxt 3   | Firebase Project (staging) | 本番前テスト   |
| **Production**  | Nuxt 3   | Firebase Project (prod)    | 本番環境       |

## 🚀 クイックスタート

### ローカル環境（Firebase Emulator）

```bash
# 一発起動
npm run dev

# 確認
curl http://localhost:3000        # Nuxt Frontend
curl http://localhost:4000        # Firebase Emulator UI
```

### リモート環境（実 Firebase）

```bash
# 開発環境
npm run dev:remote

# 本番環境
npm run prod
```

## 📁 プロジェクト構造

```
haircut-reservation/
├── frontend/                 # Nuxt 3 アプリケーション
│   ├── app/
│   │   ├── components/      # Vue コンポーネント
│   │   ├── composables/     # Firebase接続ロジック
│   │   ├── pages/           # ページ
│   │   └── types/           # TypeScript型定義
│   ├── nuxt.config.ts       # Nuxt設定
│   └── package.json
├── firebase/                 # Firebase設定
│   ├── firebase.json        # Firebase プロジェクト設定
│   ├── firestore.rules      # Firestoreセキュリティルール
│   └── storage.rules        # Storageセキュリティルール
├── docker-compose.yml        # Docker設定（開発用）
└── scripts/                  # 自動化スクリプト
    ├── setup-firebase-projects.sh
    ├── deploy.sh
    └── test-firebase-connection.js
```

## 🔥 Firebase サービス利用

### 認証 (Firebase Auth)

- Google 認証
- メール/パスワード認証
- 電話番号認証

### データベース (Firestore)

- 予約データ
- ユーザー情報
- 美容師情報
- メニュー情報

### ストレージ (Firebase Storage)

- プロフィール画像
- 美容師ポートフォリオ
- メニュー画像

### 関数 (Firebase Functions)

- 予約確認メール送信
- 決済処理
- データ検証・変換

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

## 🔧 環境設定

### 環境変数ファイル

```bash
.env.local      # ローカル環境（Emulator）
.env.dev        # 開発環境設定
.env.prod       # 本番環境設定
```

### Firebase 設定例

```bash
# .env.dev
FIREBASE_PROJECT_ID=haircut-reservation-dev
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=haircut-reservation-dev.firebaseapp.com
```

## 📚 技術スタック

### Frontend

- **Nuxt 3** - Vue.js フレームワーク
- **Vue 3** - リアクティブ UI
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Pinia** - 状態管理

### Backend (Firebase)

- **Firebase Auth** - 認証
- **Firestore** - NoSQL データベース
- **Firebase Storage** - ファイルストレージ
- **Firebase Functions** - サーバーレス関数
- **Firebase Hosting** - 静的サイトホスティング

### 開発・運用

- **Docker** - 開発環境
- **Firebase Emulator** - ローカル開発
- **GitHub Actions** - CI/CD
- **Prometheus + Grafana** - 監視

## 🔐 セキュリティ

### Firestore セキュリティルール

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 予約データは認証済みユーザーのみ
    match /reservations/{reservationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Firebase Storage ルール

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📈 監視・分析

### Firebase Analytics

- ユーザー行動分析
- 予約コンバージョン追跡
- パフォーマンス監視

### カスタム監視

- Prometheus メトリクス収集
- Grafana ダッシュボード
- アラート設定

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

## 📞 サポート

### トラブルシューティング

1. Firebase 接続エラー → `npm run test:firebase:local`
2. 権限エラー → Firestore/Storage ルール確認
3. 認証エラー → Firebase Auth 設定確認

### 参考資料

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vue 3 Documentation](https://vuejs.org/guide/)

---

**🎉 サーバーレス美容室予約システム**
**Nuxt 3 + Firebase で高速・スケーラブルな予約体験を提供**
