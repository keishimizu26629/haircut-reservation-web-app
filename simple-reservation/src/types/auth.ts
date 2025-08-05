import { Timestamp } from 'firebase-admin/firestore';

// スタッフユーザーの基本情報
export interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

// 認証トークンのカスタムクレーム
export interface CustomClaims {
  staff: boolean;
  admin?: boolean;
  staffId: string;
}

// 認証用のスタッフ登録データ
export interface StaffRegistrationData {
  email: string;
  password: string;
  displayName: string;
  role: StaffUser['role'];
}

// 認証結果
export interface AuthResult {
  success: boolean;
  user?: StaffUser;
  error?: string;
}

// ログイン用データ
export interface LoginData {
  email: string;
  password: string;
}