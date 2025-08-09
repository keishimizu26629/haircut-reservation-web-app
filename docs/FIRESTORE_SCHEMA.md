# Firestore データ構造スキーマ

## 概要

美容室予約システムの Firestore データベース構造を定義しています。

## コレクション構造

```
haircut-reservation-dev/
├── users/                    # ユーザー情報
│   └── {userId}/
│       ├── displayName: string
│       ├── email: string
│       ├── role: 'admin' | 'staff' | 'customer'
│       └── createdAt: Timestamp
│
├── reservations/             # 予約データ（メインコレクション）
│   └── {reservationId}/
│       ├── customerName: string     # 顧客名（例: "田中太郎"）
│       ├── notes: string            # 備考（例: "カット＆カラー、ロング"）
│       ├── date: string             # 予約日（YYYY-MM-DD形式）
│       ├── timeSlot: string         # 時間枠（"09:00", "09:30"形式）
│       ├── category: string         # カテゴリ（'cut' | 'color' | 'perm' | 'straight' | 'mesh' | 'other'）
│       ├── status: string           # ステータス（'active' | 'completed' | 'cancelled'）
│       ├── createdAt: Timestamp     # 作成日時
│       ├── updatedAt: Timestamp     # 更新日時
│       └── createdBy: string        # 作成者UID
│
└── settings/                 # システム設定（将来拡張用）
    └── {settingKey}/
        └── value: any
```

## データ型定義

### SimpleReservation

```typescript
interface SimpleReservation {
  id?: string // Firestore自動生成ID
  customerName: string // 顧客名
  notes?: string // 備考（オプション）
  date: string // 予約日（YYYY-MM-DD）
  timeSlot: string // 時間枠（HH:MM）
  category: ReservationCategory // カテゴリ
  status: ReservationStatus // ステータス
  createdAt?: Timestamp // 作成日時
  updatedAt?: Timestamp // 更新日時
  createdBy?: string // 作成者UID
}

type ReservationCategory = 'cut' | 'color' | 'perm' | 'straight' | 'mesh' | 'other'
type ReservationStatus = 'active' | 'completed' | 'cancelled'
```

### User

```typescript
interface User {
  displayName: string // 表示名
  email: string // メールアドレス
  role: 'admin' | 'staff' | 'customer' // ユーザー役割
  createdAt: Timestamp // 作成日時
}
```

## インデックス設定

### 複合インデックス

1. **reservations**: `date (ASC)` + `timeSlot (ASC)`

   - 用途: 日付・時間順での予約取得
   - クエリ: `orderBy('date', 'asc'), orderBy('timeSlot', 'asc')`

2. **reservations**: `date (ASC)` + `status (ASC)`

   - 用途: 特定日のステータス別予約取得
   - クエリ: `where('date', '==', date), where('status', '==', status)`

3. **reservations**: `createdBy (ASC)` + `date (ASC)`
   - 用途: スタッフ別の予約管理
   - クエリ: `where('createdBy', '==', userId), orderBy('date', 'asc')`

## セキュリティルール

### 認証要件

- 全てのデータアクセスには認証が必要
- MVP では認証済みユーザーに読み書き権限を付与

### ルール概要

```javascript
// users コレクション
- 読み取り: 認証済みユーザー
- 書き込み: 本人のみ（userId == request.auth.uid）

// reservations コレクション
- 読み取り: 認証済みユーザー
- 書き込み: 認証済みユーザー（MVPでは制限なし）
```

## カテゴリ別色分け

| カテゴリ | 英語名   | 色（CSS）                       | 説明       |
| -------- | -------- | ------------------------------- | ---------- |
| カット   | cut      | `bg-pink-100 text-pink-700`     | 基本カット |
| カラー   | color    | `bg-blue-100 text-blue-700`     | ヘアカラー |
| パーマ   | perm     | `bg-green-100 text-green-700`   | パーマ施術 |
| 縮毛矯正 | straight | `bg-orange-100 text-orange-700` | ストレート |
| メッシュ | mesh     | `bg-yellow-100 text-yellow-700` | メッシュ   |
| その他   | other    | `bg-purple-100 text-purple-700` | その他施術 |

## 時間枠設定

- **営業時間**: 09:00 - 19:00
- **時間枠**: 30 分単位（09:00, 09:30, 10:00...）
- **時間外**: 08:00-09:00, 19:00-20:00（グレーアウト表示）

## データ投入例

### サンプル予約データ

```javascript
{
  customerName: "田中太郎",
  notes: "カット＆カラー、ロング",
  date: "2024-01-15",
  timeSlot: "10:00",
  category: "color",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "user123"
}
```

## 初期データ投入

```bash
# Firestoreインデックスをデプロイ
cd firebase-dev
firebase deploy --only firestore:indexes --project haircut-reservation-dev

# サンプルデータ投入スクリプト実行
node scripts/init-sample-data.js
```

## トラブルシューティング

### よくあるエラー

1. **インデックスエラー**

   ```
   The query requires an index. You can create it here: https://console.firebase.google.com/...
   ```

   - 解決: `firebase deploy --only firestore:indexes`

2. **権限エラー**

   ```
   Missing or insufficient permissions
   ```

   - 解決: セキュリティルールとユーザー認証状態を確認

3. **データ取得失敗**
   ```
   Firestore listener error
   ```
   - 解決: ネットワーク接続と Firebase 設定を確認
