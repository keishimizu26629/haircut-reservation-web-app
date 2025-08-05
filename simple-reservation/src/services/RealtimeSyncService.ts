import { Timestamp } from 'firebase-admin/firestore';
import { ReservationService } from './ReservationService';
import { Reservation, UpdateReservationData } from '../types/reservation';

// リアルタイム同期管理
export class RealtimeSyncService {
  private reservationService: ReservationService;
  private activeListeners: Map<string, () => void> = new Map();
  private conflictCallbacks: Map<string, (reservation: Reservation) => void> = new Map();

  constructor() {
    this.reservationService = new ReservationService();
  }

  // 日付範囲のリアルタイム監視開始
  startDateRangeSync(
    startDate: Timestamp,
    endDate: Timestamp,
    callback: (reservations: Reservation[]) => void,
    listenerId: string
  ): void {
    // 既存のリスナーを停止
    this.stopSync(listenerId);

    const unsubscribe = this.reservationService.onReservationsByDateRange(
      startDate,
      endDate,
      callback
    );

    this.activeListeners.set(listenerId, unsubscribe);
  }

  // 特定日のリアルタイム監視開始
  startDateSync(
    date: Timestamp,
    callback: (reservations: Reservation[]) => void,
    listenerId: string
  ): void {
    // 既存のリスナーを停止
    this.stopSync(listenerId);

    const unsubscribe = this.reservationService.onReservationsByDate(
      date,
      callback
    );

    this.activeListeners.set(listenerId, unsubscribe);
  }

  // 同期停止
  stopSync(listenerId: string): void {
    const unsubscribe = this.activeListeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    }
  }

  // 全ての同期停止
  stopAllSync(): void {
    this.activeListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeListeners.clear();
  }

  // 競合解決付き更新
  async updateWithConflictResolution(
    reservationId: string,
    data: UpdateReservationData,
    expectedUpdatedAt: Timestamp,
    staffId: string
  ): Promise<UpdateResult> {
    try {
      const success = await this.reservationService.updateReservationWithOptimisticLock(
        reservationId,
        { ...data, lastEditBy: staffId },
        expectedUpdatedAt
      );

      if (success) {
        return {
          success: true,
          message: '更新完了'
        };
      } else {
        // 競合発生 - 最新データを取得
        const latestReservation = await this.reservationService.getReservation(reservationId);
        
        if (latestReservation) {
          return {
            success: false,
            message: '他のユーザーが同時に編集しています',
            conflictData: latestReservation
          };
        } else {
          return {
            success: false,
            message: '予約が見つかりません'
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `更新エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  }

  // 競合通知コールバック登録
  registerConflictCallback(
    reservationId: string,
    callback: (reservation: Reservation) => void
  ): void {
    this.conflictCallbacks.set(reservationId, callback);
  }

  // 競合通知コールバック削除
  unregisterConflictCallback(reservationId: string): void {
    this.conflictCallbacks.delete(reservationId);
  }

  // バッチ更新（複数予約の一括更新）
  async batchUpdate(
    updates: Array<{
      id: string;
      data: UpdateReservationData;
      expectedUpdatedAt: Timestamp;
    }>,
    staffId: string
  ): Promise<BatchUpdateResult> {
    const results: Array<{ id: string; result: UpdateResult }> = [];
    let successCount = 0;
    let conflictCount = 0;

    for (const update of updates) {
      const result = await this.updateWithConflictResolution(
        update.id,
        update.data,
        update.expectedUpdatedAt,
        staffId
      );

      results.push({ id: update.id, result });

      if (result.success) {
        successCount++;
      } else if (result.conflictData) {
        conflictCount++;
      }
    }

    return {
      totalCount: updates.length,
      successCount,
      conflictCount,
      errorCount: updates.length - successCount - conflictCount,
      results
    };
  }

  // 接続状態監視
  getActiveListenerCount(): number {
    return this.activeListeners.size;
  }

  // アクティブなリスナーID一覧取得
  getActiveListenerIds(): string[] {
    return Array.from(this.activeListeners.keys());
  }
}

// 更新結果の型定義
export interface UpdateResult {
  success: boolean;
  message: string;
  conflictData?: Reservation;
}

// バッチ更新結果の型定義
export interface BatchUpdateResult {
  totalCount: number;
  successCount: number;
  conflictCount: number;
  errorCount: number;
  results: Array<{ id: string; result: UpdateResult }>;
}

// シングルトンインスタンス
export const realtimeSyncService = new RealtimeSyncService();