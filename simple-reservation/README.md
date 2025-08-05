# シンプル予約管理アプリ - バックエンド

紙の予約表をデジタル化した、店舗スタッフ用の手動入力予約管理システムのFirebaseバックエンドです。

## 🎯 特徴

- **シンプルなデータ構造**: date, timeSlot, content, category, status の5つのフィールド
- **リアルタイム同期**: 複数スタッフの同時利用に対応
- **競合解決システム**: 同時編集時の自動競合解決
- **基本認証**: スタッフ認証とロール管理

## 📁 プロジェクト構成

```
simple-reservation/
├── src/
│   ├── types/
│   │   ├── reservation.ts    # 予約データ型定義
│   │   └── auth.ts          # 認証データ型定義
│   ├── services/
│   │   ├── ReservationService.ts    # 予約データ操作
│   │   ├── SettingsService.ts       # 設定管理
│   │   ├── AuthService.ts           # 認証管理
│   │   └── RealtimeSyncService.ts   # リアルタイム同期
│   ├── utils/
│   │   └── ConflictResolver.ts      # 競合解決
│   └── config/
│       └── firebase-admin.ts        # Firebase Admin SDK設定
├── scripts/
│   └── init-sample-data.js          # サンプルデータ初期化
├── firebase.json                    # Firebase設定
├── firestore.rules                  # Firestore セキュリティルール
└── firestore.indexes.json          # Firestore インデックス
```

## 🚀 セットアップ

### 1. 依存関係インストール
```bash
npm install
```

### 2. 環境変数設定
```bash
cp .env.example .env
# .envファイルを編集してFirebase認証情報を設定
```

### 3. Firebase Emulator起動
```bash
npm run start:dev
```

### 4. サンプルデータ初期化
```bash
npm run init-data
```

## 📊 データ構造

### 予約データ (reservations コレクション)
```typescript
interface Reservation {
  id: string;
  date: Timestamp;           // 予約日
  timeSlot: string;         // 時間スロット "09:00", "10:30" etc.
  content: string;          // 予約内容・メモ
  category: string;         // "haircut", "color", "perm", "treatment", "other"
  status: string;           // "available", "booked", "blocked"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastEditBy?: string;      // 最後に編集したスタッフID
}
```

### 設定データ (settings コレクション)
```typescript
interface ReservationSettings {
  businessHours: {
    start: string;          // "09:00"
    end: string;           // "20:00"
  };
  timeSlotDuration: number; // 時間スロット間隔（分）
  maxAdvanceBookingDays: number;
  categories: string[];
}
```

### スタッフデータ (staff コレクション)
```typescript
interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

## 🔧 主要機能

### ReservationService
- 予約の作成・読取・更新・削除
- 日付範囲・ステータス別の予約取得
- リアルタイム監視機能

### RealtimeSyncService
- リアルタイム同期管理
- 同時編集対応・競合解決
- バッチ更新機能

### AuthService
- スタッフ登録・認証
- カスタムクレーム管理
- 権限チェック

### ConflictResolver
- 競合検出・自動解決
- 戦略的マージ機能
- 手動解決サポート

## 🔒 セキュリティルール

### 基本原則
- スタッフ認証が必要
- 予約データの読取・書込はスタッフのみ
- 設定変更は管理者のみ

### カスタムクレーム
```javascript
{
  staff: true,           // スタッフ権限
  admin: true,           // 管理者権限（任意）
  staffId: "user-id"     // スタッフID
}
```

## 🧪 テスト

### サンプルスタッフアカウント
- 管理者: `admin@example.com` / `password123`
- スタッフ1: `staff1@example.com` / `password123`
- スタッフ2: `staff2@example.com` / `password123`

### Firebase Emulator UI
- アクセス: http://localhost:4000
- Firestore: http://localhost:4000/firestore
- Authentication: http://localhost:4000/auth

## 📝 使用例

### 予約作成
```typescript
import { ReservationService } from './src/services/ReservationService';

const service = new ReservationService();

await service.createReservation({
  date: Timestamp.fromDate(new Date('2024-01-15')),
  timeSlot: '10:30',
  content: 'お客様A - カット',
  category: 'haircut',
  status: 'booked'
});
```

### リアルタイム監視
```typescript
import { realtimeSyncService } from './src/services/RealtimeSyncService';

const today = Timestamp.fromDate(new Date());

realtimeSyncService.startDateSync(
  today,
  (reservations) => {
    console.log('更新された予約一覧:', reservations);
  },
  'calendar-view'
);
```

### 競合解決
```typescript
import { ConflictResolver } from './src/utils/ConflictResolver';

const resolver = new ConflictResolver();
const conflictInfo = resolver.detectConflicts(localReservation, remoteReservation);

if (conflictInfo) {
  const mergeResult = resolver.autoMerge(conflictInfo);
  console.log('マージ結果:', mergeResult);
}
```

## 🚀 本番環境デプロイ

### Firebase プロジェクト設定
1. Firebase Console でプロジェクト作成
2. サービスアカウントキー生成
3. 環境変数設定

### デプロイ実行
```bash
npm run deploy
```

## 📚 関連ドキュメント

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)