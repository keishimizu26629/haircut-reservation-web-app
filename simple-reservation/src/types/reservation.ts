import { Timestamp } from 'firebase-admin/firestore';

// 基本的な予約データ構造
export interface Reservation {
  id: string;
  date: Timestamp;
  timeSlot: string; // "09:00", "10:30" etc.
  content: string; // 予約内容・メモ
  category: 'haircut' | 'color' | 'perm' | 'treatment' | 'other'; // カテゴリ
  status: 'available' | 'booked' | 'blocked'; // 状態
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastEditBy?: string; // 最後に編集したスタッフID
}

// 新規予約作成用のデータ型
export interface CreateReservationData {
  date: Timestamp;
  timeSlot: string;
  content: string;
  category: Reservation['category'];
  status: Reservation['status'];
}

// 予約更新用のデータ型
export interface UpdateReservationData {
  content?: string;
  category?: Reservation['category'];
  status?: Reservation['status'];
  lastEditBy?: string;
}

// 時間スロット定義
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
] as const;

export type TimeSlot = typeof TIME_SLOTS[number];

// カテゴリ表示名マッピング
export const CATEGORY_LABELS: Record<Reservation['category'], string> = {
  haircut: 'カット',
  color: 'カラー',
  perm: 'パーマ',
  treatment: 'トリートメント', 
  other: 'その他'
};

// ステータス表示名マッピング
export const STATUS_LABELS: Record<Reservation['status'], string> = {
  available: '空き',
  booked: '予約済み',
  blocked: 'ブロック'
};

// 予約日の範囲設定
export interface ReservationSettings {
  id: string;
  businessHours: {
    start: string; // "09:00"
    end: string;   // "20:00" 
  };
  timeSlotDuration: number; // 分単位 (30分 = 30)
  maxAdvanceBookingDays: number; // 何日先まで予約可能か
  categories: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}