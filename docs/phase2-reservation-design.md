# Phase 2 設計書：予約システム機能

## 概要
美容院予約システムの予約関連機能（フォーム、カレンダー、確認画面）の詳細設計

## 1. 予約フォーム (`/app/pages/booking.vue`)

### 機能要件
- **サービス選択**: カット、カラー、パーマ等
- **スタイリスト選択**: 指名or任意
- **日時選択**: カレンダー + 時間スロット
- **顧客情報**: 名前、電話番号、要望
- **確認・送信**: 予約内容の最終確認

### UI設計
```vue
<template>
  <div class="booking-page">
    <!-- プログレスステップ -->
    <BookingProgress :current-step="currentStep" />
    
    <!-- ステップ1: サービス選択 -->
    <ServiceSelection 
      v-if="currentStep === 1"
      v-model="bookingData.services"
      @next="goToStep(2)"
    />
    
    <!-- ステップ2: スタイリスト選択 -->
    <StylistSelection
      v-if="currentStep === 2"
      v-model="bookingData.stylist"
      @next="goToStep(3)"
      @back="goToStep(1)"
    />
    
    <!-- ステップ3: 日時選択 -->
    <DateTimeSelection
      v-if="currentStep === 3"
      v-model:date="bookingData.date"
      v-model:time="bookingData.time"
      :service-duration="serviceDuration"
      @next="goToStep(4)"
      @back="goToStep(2)"
    />
    
    <!-- ステップ4: 確認・送信 -->
    <BookingConfirmation
      v-if="currentStep === 4"
      :booking-data="bookingData"
      @submit="submitBooking"
      @back="goToStep(3)"
    />
  </div>
</template>
```

### データ構造
```typescript
interface BookingData {
  services: Service[]
  stylist: Stylist | null
  date: string
  time: string
  customerNotes: string
  estimatedDuration: number
  totalPrice: number
}

interface Service {
  id: string
  name: string
  duration: number // 分
  price: number
  description: string
}

interface Stylist {
  id: string
  name: string
  avatar: string
  specialties: string[]
  rating: number
}
```

## 2. カレンダー表示コンポーネント (`/app/components/BookingCalendar.vue`)

### 機能要件
- **月表示**: 現在月の空き状況表示
- **日選択**: 利用可能日のみ選択可能
- **空き状況表示**: 色分けで視覚的に表示
- **レスポンシブ**: モバイル対応

### カレンダー設計
```vue
<template>
  <div class="booking-calendar">
    <!-- ヘッダー -->
    <div class="calendar-header">
      <button @click="previousMonth" class="btn btn-outline-primary">
        <i class="bi bi-chevron-left"></i>
      </button>
      <h3>{{ currentMonthYear }}</h3>
      <button @click="nextMonth" class="btn btn-outline-primary">
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
    
    <!-- 曜日ヘッダー -->
    <div class="calendar-weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday">
        {{ day }}
      </div>
    </div>
    
    <!-- 日付グリッド -->
    <div class="calendar-grid">
      <div
        v-for="date in calendarDates"
        :key="date.dateString"
        class="calendar-date"
        :class="getDateClass(date)"
        @click="selectDate(date)"
      >
        <span class="date-number">{{ date.day }}</span>
        <div class="availability-indicator">
          <span v-if="date.availableSlots > 0" class="available-count">
            {{ date.availableSlots }}枠
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
```

### スタイル設計
```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #dee2e6;
}

.calendar-date {
  background: white;
  min-height: 80px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-date.available {
  background: #f8f9fa;
  border-left: 3px solid #28a745;
}

.calendar-date.limited {
  background: #fff3cd;
  border-left: 3px solid #ffc107;
}

.calendar-date.full {
  background: #f8d7da;
  color: #6c757d;
  cursor: not-allowed;
}
```

## 3. 時間スロット選択 (`/app/components/TimeSlotPicker.vue`)

### 機能要件
- **時間表示**: 30分間隔での予約枠
- **空き状況**: リアルタイム空き状況表示
- **所要時間考慮**: 選択サービスの時間を考慮

### 設計
```vue
<template>
  <div class="time-slot-picker">
    <h5>時間を選択してください</h5>
    <div class="time-slots-grid">
      <button
        v-for="slot in availableSlots"
        :key="slot.time"
        class="btn time-slot"
        :class="getSlotClass(slot)"
        :disabled="!slot.available"
        @click="selectTime(slot.time)"
      >
        {{ slot.time }}
        <small v-if="slot.available" class="d-block">
          〜{{ slot.endTime }}
        </small>
      </button>
    </div>
  </div>
</template>
```

## 4. API連携設計

### エンドポイント
```typescript
// 空き状況取得
GET /api/availability?date=2024-01-15&stylist_id=123

// 予約作成
POST /api/bookings
{
  customerId: string
  services: string[]
  stylistId: string
  date: string
  time: string
  notes: string
}

// 予約確認
GET /api/bookings/:id
```

### Composable設計
```typescript
// composables/useBooking.ts
export const useBooking = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const getAvailability = async (date: string, stylistId?: string) => {
    // API呼び出し
  }
  
  const createBooking = async (bookingData: BookingData) => {
    // 予約作成API呼び出し
  }
  
  return {
    loading,
    error,
    getAvailability,
    createBooking
  }
}
```

## 5. Phase 2実装順序

### Week 3-4 実装計画
1. **Day 1**: 基本予約フォーム画面作成
2. **Day 2**: サービス選択コンポーネント
3. **Day 3**: カレンダー表示コンポーネント
4. **Day 4**: 時間スロット選択機能
5. **Day 5**: API連携・データ取得
6. **Day 6**: 予約確認画面
7. **Day 7-8**: テスト・調整・統合

## 6. レスポンシブ対応

### モバイル表示
- カレンダー: 縦スクロール表示
- 時間選択: 2列グリッド表示
- フォーム: 1列レイアウト

### タブレット表示
- カレンダー: 標準7列表示
- サイドバー: 詳細情報表示

## 7. アクセシビリティ対応

- **キーボードナビゲーション**: Tab順序の適切な設定
- **スクリーンリーダー**: 適切なaria-label設定
- **色覚対応**: 色だけでない状態表示

## 次のアクション
dev2のAPI仕様確認後、実装開始準備完了。
Firebase連携完了次第、即座にPhase 2開始可能。