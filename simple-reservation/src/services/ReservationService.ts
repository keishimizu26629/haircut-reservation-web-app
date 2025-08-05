import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase-admin/firestore';

import { 
  Reservation, 
  CreateReservationData, 
  UpdateReservationData 
} from '../types/reservation';

export class ReservationService {
  private db = getFirestore();
  private collectionName = 'reservations';

  // 予約作成
  async createReservation(data: CreateReservationData): Promise<string> {
    const reservationData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(
      collection(this.db, this.collectionName), 
      reservationData
    );
    
    return docRef.id;
  }

  // 予約更新
  async updateReservation(id: string, data: UpdateReservationData): Promise<void> {
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    };

    await updateDoc(
      doc(this.db, this.collectionName, id), 
      updateData
    );
  }

  // 予約削除
  async deleteReservation(id: string): Promise<void> {
    await deleteDoc(doc(this.db, this.collectionName, id));
  }

  // 単一予約取得
  async getReservation(id: string): Promise<Reservation | null> {
    const docRef = doc(this.db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Reservation;
    }
    
    return null;
  }

  // 日付範囲での予約取得
  async getReservationsByDateRange(
    startDate: Timestamp, 
    endDate: Timestamp
  ): Promise<Reservation[]> {
    const q = query(
      collection(this.db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('timeSlot', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reservation));
  }

  // 特定日の予約取得
  async getReservationsByDate(date: Timestamp): Promise<Reservation[]> {
    // 日付の開始と終了を計算
    const startOfDay = new Date(date.toDate());
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date.toDate());
    endOfDay.setHours(23, 59, 59, 999);

    return this.getReservationsByDateRange(
      Timestamp.fromDate(startOfDay),
      Timestamp.fromDate(endOfDay)
    );
  }

  // ステータス別予約取得
  async getReservationsByStatus(status: Reservation['status']): Promise<Reservation[]> {
    const q = query(
      collection(this.db, this.collectionName),
      where('status', '==', status),
      orderBy('date', 'asc'),
      orderBy('timeSlot', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reservation));
  }

  // リアルタイム監視 - 日付範囲
  onReservationsByDateRange(
    startDate: Timestamp,
    endDate: Timestamp,
    callback: (reservations: Reservation[]) => void
  ) {
    const q = query(
      collection(this.db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('timeSlot', 'asc')
    );

    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const reservations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
      
      callback(reservations);
    });
  }

  // リアルタイム監視 - 特定日
  onReservationsByDate(
    date: Timestamp,
    callback: (reservations: Reservation[]) => void
  ) {
    const startOfDay = new Date(date.toDate());
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date.toDate());
    endOfDay.setHours(23, 59, 59, 999);

    return this.onReservationsByDateRange(
      Timestamp.fromDate(startOfDay),
      Timestamp.fromDate(endOfDay),
      callback
    );
  }

  // 同時編集対応 - 楽観的ロック
  async updateReservationWithOptimisticLock(
    id: string, 
    data: UpdateReservationData,
    expectedUpdatedAt: Timestamp
  ): Promise<boolean> {
    const docRef = doc(this.db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Reservation not found');
    }
    
    const currentReservation = docSnap.data() as Reservation;
    
    // タイムスタンプをチェックして競合検出
    if (currentReservation.updatedAt.toMillis() !== expectedUpdatedAt.toMillis()) {
      return false; // 競合が発生
    }
    
    // 更新実行
    await this.updateReservation(id, data);
    return true;
  }
}