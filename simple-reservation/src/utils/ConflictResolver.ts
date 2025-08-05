import { Reservation, UpdateReservationData } from '../types/reservation';

// 競合解決戦略
export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last-write-wins',
  MANUAL_MERGE = 'manual-merge',
  PRIORITY_BASED = 'priority-based'
}

// 競合情報
export interface ConflictInfo {
  localReservation: Reservation;
  remoteReservation: Reservation;
  conflictFields: string[];
  lastEditByLocal: string;
  lastEditByRemote: string;
}

// マージ結果
export interface MergeResult {
  merged: UpdateReservationData;
  requiresManualReview: boolean;
  conflictDetails: string[];
}

export class ConflictResolver {
  
  // 競合検出
  detectConflicts(
    localReservation: Reservation,
    remoteReservation: Reservation
  ): ConflictInfo | null {
    
    if (localReservation.updatedAt.toMillis() === remoteReservation.updatedAt.toMillis()) {
      return null; // 競合なし
    }

    const conflictFields: string[] = [];

    // フィールド別競合チェック
    if (localReservation.content !== remoteReservation.content) {
      conflictFields.push('content');
    }
    if (localReservation.category !== remoteReservation.category) {
      conflictFields.push('category');
    }
    if (localReservation.status !== remoteReservation.status) {
      conflictFields.push('status');
    }

    if (conflictFields.length === 0) {
      return null; // 実質的な競合なし
    }

    return {
      localReservation,
      remoteReservation,
      conflictFields,
      lastEditByLocal: localReservation.lastEditBy || 'unknown',
      lastEditByRemote: remoteReservation.lastEditBy || 'unknown'
    };
  }

  // 自動マージ実行
  autoMerge(
    conflictInfo: ConflictInfo,
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.LAST_WRITE_WINS
  ): MergeResult {
    
    switch (strategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        return this.lastWriteWinsMerge(conflictInfo);
      
      case ConflictResolutionStrategy.PRIORITY_BASED:
        return this.priorityBasedMerge(conflictInfo);
      
      case ConflictResolutionStrategy.MANUAL_MERGE:
      default:
        return this.manualMergeRequired(conflictInfo);
    }
  }

  // 最後の書き込みが勝利する戦略
  private lastWriteWinsMerge(conflictInfo: ConflictInfo): MergeResult {
    const { localReservation, remoteReservation } = conflictInfo;
    
    const useRemote = remoteReservation.updatedAt.toMillis() > localReservation.updatedAt.toMillis();
    const winner = useRemote ? remoteReservation : localReservation;
    
    return {
      merged: {
        content: winner.content,
        category: winner.category,
        status: winner.status,
        lastEditBy: winner.lastEditBy
      },
      requiresManualReview: false,
      conflictDetails: [
        `${useRemote ? 'リモート' : 'ローカル'}の変更を採用しました (最終更新: ${winner.updatedAt.toDate().toLocaleString()})`
      ]
    };
  }

  // 重要度ベースのマージ戦略  
  private priorityBasedMerge(conflictInfo: ConflictInfo): MergeResult {
    const { localReservation, remoteReservation, conflictFields } = conflictInfo;
    const merged: UpdateReservationData = {};
    const conflictDetails: string[] = [];

    conflictFields.forEach(field => {
      switch (field) {
        case 'status':
          // ステータスは常にリモートを優先（最新の予約状況が重要）
          merged.status = remoteReservation.status;
          conflictDetails.push(`ステータス: リモートの値 "${remoteReservation.status}" を採用`);
          break;
          
        case 'content':
          // コンテンツは長い方を優先（詳細情報が重要）
          const useRemoteContent = remoteReservation.content.length >= localReservation.content.length;
          merged.content = useRemoteContent ? remoteReservation.content : localReservation.content;
          conflictDetails.push(`コンテンツ: ${useRemoteContent ? 'リモート' : 'ローカル'}の値を採用 (詳細度が高いため)`);
          break;
          
        case 'category':
          // カテゴリは最新の更新を優先
          const useRemoteCategory = remoteReservation.updatedAt.toMillis() > localReservation.updatedAt.toMillis();
          merged.category = useRemoteCategory ? remoteReservation.category : localReservation.category;
          conflictDetails.push(`カテゴリ: ${useRemoteCategory ? 'リモート' : 'ローカル'}の値を採用 (最新更新)`);
          break;
      }
    });

    // 最後の編集者情報も更新
    merged.lastEditBy = remoteReservation.updatedAt.toMillis() > localReservation.updatedAt.toMillis() 
      ? remoteReservation.lastEditBy 
      : localReservation.lastEditBy;

    return {
      merged,
      requiresManualReview: conflictFields.length > 2, // 3つ以上の競合は手動確認
      conflictDetails
    };
  }

  // 手動マージが必要な場合
  private manualMergeRequired(conflictInfo: ConflictInfo): MergeResult {
    const { conflictFields } = conflictInfo;
    
    return {
      merged: {}, // 空のマージ結果
      requiresManualReview: true,
      conflictDetails: [
        `手動マージが必要です。競合フィールド: ${conflictFields.join(', ')}`,
        '両方の変更内容を確認して手動で解決してください。'
      ]
    };
  }

  // 競合情報を人間が読みやすい形式で生成
  generateConflictSummary(conflictInfo: ConflictInfo): string {
    const { localReservation, remoteReservation, conflictFields } = conflictInfo;
    
    let summary = `競合が検出されました:\n\n`;
    
    conflictFields.forEach(field => {
      const localValue = (localReservation as any)[field];
      const remoteValue = (remoteReservation as any)[field];
      summary += `【${field}】\n`;
      summary += `  あなたの変更: ${localValue}\n`;
      summary += `  他の変更: ${remoteValue}\n`;
      summary += `  編集者: ${remoteReservation.lastEditBy || 'unknown'}\n\n`;
    });
    
    summary += `最終更新時刻:\n`;
    summary += `  あなた: ${localReservation.updatedAt.toDate().toLocaleString()}\n`;
    summary += `  他の人: ${remoteReservation.updatedAt.toDate().toLocaleString()}`;
    
    return summary;
  }
}