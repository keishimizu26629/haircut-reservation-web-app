# 削除対象機能・ファイル特定チェックリスト

## 🎯 削除方針
シンプル予約管理アプリへの転用において、**オンライン予約特化**・**美容院業界特化**・**過度な最適化機能**を削除し、**手動入力予約管理の本質**に集中する。

---

## 📁 削除対象ファイル一覧

### 【優先度：HIGH】即座削除対象

#### オンライン予約システム特化コンポーネント
```
❌ app/components/BookingCalendar.vue - 美容院用複雑予約カレンダー
❌ app/components/StylistSelection.vue - スタイリスト選択機能  
❌ app/components/ServiceSelection.vue - 美容院サービス選択
❌ app/components/BookingProgress.vue - 予約進捗管理
❌ app/components/BookingComplete.vue - 予約完了画面
❌ app/components/BookingConfirmation.vue - 予約確認画面
❌ app/components/DateTimeSelection.vue - 複雑な日時選択
❌ app/components/EmailNotificationStatus.vue - メール通知状況

削除理由: 顧客が直接操作するオンライン予約機能で、スタッフ手動入力には不要
```

#### 美容院業界特化機能
```
❌ composables/useBookingApi.ts - 美容院特化API
❌ composables/useEmailNotification.ts - メール通知システム
❌ composables/useRealTimeAvailability.ts - リアルタイム空き状況
❌ app/usecases/EmailNotificationUseCase.ts - メール通知ユースケース
❌ app/types/booking.ts - 美容院予約特化型定義

削除理由: 美容院特有のビジネスロジック（サービス種別、スタイリスト等）を含む
```

#### 管理画面の過剰機能  
```
❌ components/Admin/ReservationChart.vue - 高度な予約統計グラフ
❌ components/Admin/ServicePieChart.vue - サービス別売上円グラフ
❌ components/Admin/AlertsList.vue - アラート管理システム
❌ components/Admin/SystemStatus.vue - システム監視機能
❌ components/Admin/RecentReservations.vue - 最近の予約一覧
❌ composables/useAnalytics.ts - 高度な分析機能
❌ composables/useSystemStatus.ts - システム監視機能

削除理由: 小規模店舗には過剰な分析・監視機能
```

### 【優先度：MEDIUM】段階的削除対象

#### パフォーマンス最適化（過剰）
```
⚠️ composables/useOptimizedFirestore.ts - 高度なFirestore最適化
⚠️ composables/useCalendarPerformance.ts - カレンダーパフォーマンス最適化
⚠️ composables/useOptimizedReservations.ts - 予約最適化
⚠️ composables/usePerformanceMonitor.ts - パフォーマンス監視
⚠️ plugins/performance-monitor.client.ts - クライアント監視

削除理由: 小規模データでは不要な最適化、保守コスト増大要因
```

#### 複雑な認証・権限管理
```
⚠️ middleware/admin-only.ts - 管理者限定機能（一部簡素化）
⚠️ composables/useAuthAwareCalendar.ts - 認証連携カレンダー
⚠️ middleware/rbac.ts (backend) - 複雑な権限管理

削除理由: スタッフと管理者の2つの権限で十分
```

### 【優先度：LOW】検討・部分利用

#### UIフレームワーク重複
```
📋 Bootstrap 5 関連 - TailwindCSS統一により段階的削除
📋 assets/css/design-system.css - 一部機能は残しデザインシステム簡素化
📋 assets/scss/design-system.scss - SCSS不要の場合削除

削除理由: TailwindCSS一本化によるシンプル化
```

---

## 🔍 機能削除の詳細判定

### 美容院特化機能の削除根拠

| 機能 | 削除理由 | 代替手段 |
|------|----------|----------|
| スタイリスト選択 | 小規模店舗では不要 | 予約コメント欄に記載 |
| サービス種別管理 | 複雑化要因 | カテゴリ5種（cut/color/perm/straight/other）で十分 |
| 料金計算 | 予約管理の本質ではない | 手動計算・別システム利用 |
| メール通知 | 手動管理では不要 | 電話・直接連絡 |
| 顧客データベース | オンライン予約用 | 予約コメント欄で対応 |

### パフォーマンス最適化の削除根拠

| 最適化機能 | 削除理由 | 小規模での影響 |
|------------|----------|----------------|
| Firestore最適化 | 月間数百件程度では効果微小 | 体感差なし |
| キャッシュシステム | メモリ使用量増大 | むしろマイナス |
| 仮想スクロール | 1日分表示では不要 | 画面がシンプル |
| リアルタイム最適化 | 同時接続数少 | 基本機能で十分 |

---

## 📊 削除による効果予測

### ファイル削減効果
- **削除前:** 74ファイル（Vue + TS + CSS）
- **削除後:** 約35ファイル
- **削減率:** 53%

### 依存関係削減
- **削除前:** 15の主要依存関係
- **削除後:** 8の依存関係  
- **削減率:** 47%

### コード行数削減
- **削除前:** 約15,000行（推定）
- **削除後:** 約6,000行（推定）
- **削減率:** 60%

### バンドルサイズ削減
- **CSS削減:** Bootstrap削除で約200KB削減
- **JavaScript削減:** 不要機能削除で約300KB削減
- **総削減効果:** 約500KB（約40%削減）

---

## ⚡ 段階的削除実行計画

### Phase 1: 美容院特化機能削除（即座実行）
1. `app/components/` 内のBooking系コンポーネント全削除
2. `app/composables/` 内の業界特化Composables削除
3. `app/types/` 内の美容院特化型定義削除

### Phase 2: 管理画面簡素化（1-2日後）
1. `components/Admin/` 内の分析系コンポーネント削除
2. 管理画面をシンプルな予約一覧＋入力画面に変更
3. 不要なAPIエンドポイント削除

### Phase 3: UIフレームワーク統一（2-3日後）
1. Bootstrap 5の段階的削除
2. TailwindCSSへの統一
3. design-system簡素化

### Phase 4: 最適化機能削除（最終段階）
1. パフォーマンス監視機能削除
2. 複雑な最適化ロジック削除
3. 最終的な動作確認・テスト

---

## ✅ 削除前チェックリスト

### 事前確認事項
- [ ] 現在の動作環境のバックアップ取得
- [ ] 削除対象コンポーネントの依存関係調査完了
- [ ] 転用可能機能の抽出・保存完了
- [ ] テスト環境での削除テスト実施準備

### 削除実行時の注意事項
- [ ] Git のブランチ分けで安全な削除
- [ ] 段階的削除で各段階での動作確認
- [ ] 依存関係エラーの即座修正
- [ ] 削除ログの記録・管理

この削除チェックリストに従い、シンプル予約管理アプリに必要な機能のみに絞り込んだ効率的なシステム構築を実現します。