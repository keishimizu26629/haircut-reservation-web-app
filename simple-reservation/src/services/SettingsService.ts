import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc,
  Timestamp
} from 'firebase-admin/firestore';

import { ReservationSettings } from '../types/reservation';

export class SettingsService {
  private db = getFirestore();
  private collectionName = 'settings';
  private documentId = 'reservation-settings';

  // 設定取得
  async getSettings(): Promise<ReservationSettings | null> {
    const docRef = doc(this.db, this.collectionName, this.documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ReservationSettings;
    }
    
    return null;
  }

  // 設定作成・更新
  async saveSettings(settings: Omit<ReservationSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(this.db, this.collectionName, this.documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // 更新
      await updateDoc(docRef, {
        ...settings,
        updatedAt: Timestamp.now()
      });
    } else {
      // 新規作成
      await setDoc(docRef, {
        ...settings,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
  }

  // デフォルト設定取得
  getDefaultSettings(): Omit<ReservationSettings, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      businessHours: {
        start: '09:00',
        end: '20:00'
      },
      timeSlotDuration: 30,
      maxAdvanceBookingDays: 30,
      categories: ['haircut', 'color', 'perm', 'treatment', 'other']
    };
  }

  // 初期設定セットアップ
  async initializeDefaultSettings(): Promise<void> {
    const existingSettings = await this.getSettings();
    
    if (!existingSettings) {
      await this.saveSettings(this.getDefaultSettings());
    }
  }
}