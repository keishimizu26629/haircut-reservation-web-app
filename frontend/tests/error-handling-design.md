# エラーケース・例外処理詳細設計

## 🎯 設計目標
**美容室の営業を中断させない堅牢な例外処理システムの構築**

## 🔄 同時編集競合時の処理フロー

### 1. 競合シナリオ分析

#### シナリオA: 同一予約の同時編集
```
状況: スタッフA・Bが同時に田中様10:00の予約を編集

Timeline:
T+0秒: スタッフA「田中様予約」編集開始
T+5秒: スタッフB「田中様予約」編集開始  
T+15秒: スタッフA 時間を10:30に変更・保存試行
T+20秒: スタッフB カテゴリーをカラーに変更・保存試行

競合発生: どちらの変更を採用するか？
```

#### 解決フロー設計
```javascript
// 楽観的ロック機能による競合検出・解決
class ConflictResolution {
  async handleEditConflict(reservationId, userChanges, currentVersion) {
    try {
      // 1. バージョンチェック
      const latestData = await this.getLatestReservation(reservationId);
      
      if (latestData.version !== currentVersion) {
        // 2. 競合検出 - 3Way Merge実行
        const resolution = await this.resolveConflict({
          base: this.originalData,      // 編集開始時の状態
          local: userChanges,           // 現在ユーザーの変更
          remote: latestData            // 他ユーザーの変更
        });
        
        return resolution;
      }
      
      // 3. 競合なし - 通常保存
      return await this.saveReservation(userChanges);
      
    } catch (error) {
      return this.handleSaveError(error);
    }
  }
  
  resolveConflict({ base, local, remote }) {
    const conflicts = this.detectConflicts(base, local, remote);
    
    if (conflicts.length === 0) {
      // 自動マージ可能
      return this.autoMerge(local, remote);
    }
    
    // 手動解決が必要
    return this.showConflictResolutionDialog(conflicts);
  }
}
```

### 2. 競合解決UI設計

#### 競合通知・解決ダイアログ
```vue
<template>
  <div class="conflict-resolution-modal">
    <div class="modal-header">
      <h3>⚠️ 予約編集の競合が発生しました</h3>
      <p>他のスタッフも同じ予約を編集しています</p>
    </div>
    
    <div class="conflict-comparison">
      <div class="change-column">
        <h4>あなたの変更</h4>
        <div class="change-item">
          <label>時間:</label>
          <span class="new-value">{{ localChanges.time }}</span>
          <span class="old-value">(元: {{ originalData.time }})</span>
        </div>
      </div>
      
      <div class="change-column">
        <h4>他スタッフの変更</h4>
        <div class="change-item">
          <label>カテゴリー:</label>
          <span class="new-value">{{ remoteChanges.category }}</span>
          <span class="old-value">(元: {{ originalData.category }})</span>
        </div>
      </div>
    </div>
    
    <div class="resolution-options">
      <button @click="acceptBoth()" class="btn-primary">
        両方の変更を適用
      </button>
      <button @click="acceptLocal()" class="btn-secondary">
        自分の変更を優先
      </button>
      <button @click="acceptRemote()" class="btn-secondary">
        他スタッフの変更を優先
      </button>
      <button @click="showDetails()" class="btn-outline">
        詳細を確認
      </button>
    </div>
  </div>
</template>
```

#### 自動マージルール定義
```javascript
// スマート自動マージ機能
class AutoMergeRules {
  canAutoMerge(localChanges, remoteChanges) {
    const rules = [
      // 異なるフィールドの変更は自動マージ可能
      this.isDifferentFields(localChanges, remoteChanges),
      
      // 非競合的変更（追加のみ）は自動マージ可能
      this.isNonConflictingChange(localChanges, remoteChanges),
      
      // 同じ値への変更は自動マージ可能
      this.isSameValueChange(localChanges, remoteChanges)
    ];
    
    return rules.some(rule => rule === true);
  }
  
  executeAutoMerge(local, remote) {
    return {
      ...remote,  // ベースは最新データ
      ...local,   // ローカル変更を上書き適用
      updatedAt: new Date(),
      updatedBy: [local.updatedBy, remote.updatedBy].filter(Boolean),
      version: remote.version + 1
    };
  }
}
```

## 📡 オフライン状態からの復帰処理

### 1. オフライン検出・対応

#### ネットワーク状態監視
```javascript
// オフライン状態管理
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Firebase接続状態監視
    this.database.ref('.info/connected').on('value', (snapshot) => {
      const isConnected = snapshot.val();
      this.handleFirebaseConnection(isConnected);
    });
  }
  
  handleOffline() {
    console.warn('🔴 オフライン状態を検出');
    this.showOfflineNotification();
    this.enableOfflineMode();
  }
  
  handleOnline() {
    console.log('🟢 オンライン復帰を検出');
    this.hideOfflineNotification();
    this.syncPendingOperations();
  }
}
```

#### オフライン時のUI表示
```vue
<template>
  <div class="app-container">
    <!-- オフライン状態インジケーター -->
    <div v-if="!isOnline" class="offline-banner">
      <div class="offline-content">
        <i class="bi bi-wifi-off"></i>
        <span>オフライン状態です</span>
        <span class="pending-count" v-if="pendingOperations.length">
          {{ pendingOperations.length }}件の変更が保留中
        </span>
      </div>
      <button @click="retryConnection()" class="retry-btn">
        再接続を試す
      </button>
    </div>
    
    <!-- メインコンテンツ -->
    <div class="main-content" :class="{ 'offline-mode': !isOnline }">
      <!-- カレンダーやモーダルなど -->
    </div>
  </div>
</template>

<style scoped>
.offline-banner {
  background: linear-gradient(90deg, #ff6b6b, #ffa500);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.offline-mode {
  opacity: 0.8;
  pointer-events: auto; /* 操作は可能だが視覚的にオフライン感を演出 */
}

.pending-count {
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9em;
}
</style>
```

### 2. オフライン操作とデータ同期

#### ローカルストレージ活用
```javascript
// オフライン時のデータ管理
class OfflineDataManager {
  constructor() {
    this.localDB = this.initializeLocalDB();
  }
  
  // オフライン時の操作を一時保存
  async saveOfflineOperation(operation) {
    const offlineOp = {
      id: this.generateId(),
      type: operation.type, // 'create', 'update', 'delete'
      data: operation.data,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // IndexedDBに保存
    await this.localDB.offlineOperations.add(offlineOp);
    this.updatePendingCount();
  }
  
  // オンライン復帰時の同期処理
  async syncPendingOperations() {
    const pendingOps = await this.localDB.offlineOperations
      .where('status').equals('pending')
      .toArray();
    
    for (const op of pendingOps) {
      try {
        await this.executePendingOperation(op);
        
        // 成功したら削除
        await this.localDB.offlineOperations.delete(op.id);
      } catch (error) {
        // 失敗した場合は再試行マーク
        await this.markForRetry(op, error);
      }
    }
    
    this.showSyncResults(pendingOps);
  }
  
  async executePendingOperation(operation) {
    switch (operation.type) {
      case 'create':
        return await this.createReservation(operation.data);
      case 'update':
        return await this.updateReservation(operation.data);
      case 'delete':
        return await this.deleteReservation(operation.data.id);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
}
```

#### データ整合性確保
```javascript
// オフライン復帰時の整合性チェック
class DataIntegrityChecker {
  async validateOfflineChanges(pendingOperations) {
    const validationResults = [];
    
    for (const op of pendingOperations) {
      const validation = await this.validateOperation(op);
      validationResults.push(validation);
    }
    
    return this.resolveValidationConflicts(validationResults);
  }
  
  async validateOperation(operation) {
    // 1. データの存在確認
    const currentData = await this.getCurrentData(operation.data.id);
    
    // 2. タイムスタンプ比較
    if (currentData && currentData.updatedAt > operation.timestamp) {
      return {
        status: 'conflict',
        reason: 'newer_version_exists',
        operation,
        currentData
      };
    }
    
    // 3. ビジネスルール検証
    const businessValidation = await this.validateBusinessRules(operation.data);
    if (!businessValidation.isValid) {
      return {
        status: 'invalid',
        reason: businessValidation.errors,
        operation
      };
    }
    
    return { status: 'valid', operation };
  }
}
```

## ⚠️ 不正入力・データ整合性エラー対応

### 1. 入力値検証システム

#### 多層バリデーション設計
```javascript
// 階層的バリデーションシステム
class ValidationSystem {
  async validateReservation(data, context) {
    const validationLayers = [
      // Layer 1: 基本型・形式チェック
      await this.basicValidation(data),
      
      // Layer 2: ビジネスルールチェック  
      await this.businessRuleValidation(data),
      
      // Layer 3: データ整合性チェック
      await this.dataIntegrityValidation(data, context),
      
      // Layer 4: セキュリティチェック
      await this.securityValidation(data, context)
    ];
    
    return this.aggregateValidationResults(validationLayers);
  }
  
  // Layer 1: 基本型・形式チェック
  basicValidation(data) {
    const errors = [];
    
    // 必須フィールドチェック
    if (!data.customerName?.trim()) {
      errors.push({
        field: 'customerName',
        code: 'REQUIRED',
        message: 'お客様のお名前を入力してください'
      });
    }
    
    // 日付形式チェック
    if (!this.isValidDate(data.date)) {
      errors.push({
        field: 'date',
        code: 'INVALID_FORMAT',
        message: '正しい日付形式で入力してください'
      });
    }
    
    // 時間形式チェック
    if (!this.isValidTime(data.time)) {
      errors.push({
        field: 'time',
        code: 'INVALID_FORMAT', 
        message: '正しい時間形式で入力してください (例: 10:00)'
      });
    }
    
    return { layer: 'basic', errors };
  }
  
  // Layer 2: ビジネスルールチェック
  businessRuleValidation(data) {
    const errors = [];
    
    // 営業時間チェック
    if (!this.isBusinessHours(data.time)) {
      errors.push({
        field: 'time',
        code: 'OUTSIDE_BUSINESS_HOURS',
        message: '営業時間外です (営業時間: 9:00-19:00)',
        suggestion: '営業時間内の時間を選択してください'
      });
    }
    
    // 過去日付チェック
    if (this.isPastDate(data.date)) {
      errors.push({
        field: 'date',
        code: 'PAST_DATE',
        message: '過去の日付には予約できません',
        suggestion: '今日以降の日付を選択してください'
      });
    }
    
    // カテゴリー妥当性チェック
    if (!this.isValidCategory(data.category)) {
      errors.push({
        field: 'category',
        code: 'INVALID_CATEGORY',
        message: '無効なカテゴリーが選択されています'
      });
    }
    
    return { layer: 'business', errors };
  }
  
  // Layer 3: データ整合性チェック
  async dataIntegrityValidation(data, context) {
    const errors = [];
    
    // 重複予約チェック
    const conflicts = await this.checkTimeConflicts(data);
    if (conflicts.length > 0) {
      errors.push({
        field: 'time',
        code: 'TIME_CONFLICT',
        message: `${conflicts[0].time}に他の予約があります`,
        suggestion: '別の時間を選択するか、既存予約を確認してください',
        conflictingReservations: conflicts
      });
    }
    
    // データベース整合性チェック
    if (context.isEdit) {
      const currentData = await this.getCurrentReservation(data.id);
      if (!currentData) {
        errors.push({
          field: 'id',
          code: 'RESERVATION_NOT_FOUND',
          message: '編集対象の予約が見つかりません'
        });
      }
    }
    
    return { layer: 'integrity', errors };
  }
}
```

### 2. エラー表示・回復システム

#### ユーザーフレンドリーエラー表示
```vue
<template>
  <div class="validation-errors" v-if="errors.length > 0">
    <div class="error-summary">
      <i class="bi bi-exclamation-triangle"></i>
      <span>入力内容を確認してください ({{ errors.length }}件)</span>
    </div>
    
    <div class="error-details">
      <div 
        v-for="error in errors" 
        :key="error.field + error.code"
        class="error-item"
        :class="`error-${error.severity || 'error'}`"
      >
        <div class="error-header">
          <strong>{{ getFieldLabel(error.field) }}</strong>
          <span class="error-code">{{ error.code }}</span>
        </div>
        
        <div class="error-message">{{ error.message }}</div>
        
        <div v-if="error.suggestion" class="error-suggestion">
          <i class="bi bi-lightbulb"></i>
          <span>{{ error.suggestion }}</span>
          <button v-if="error.autoFix" @click="applyAutoFix(error)" class="auto-fix-btn">
            自動修正
          </button>
        </div>
        
        <!-- 競合データがある場合の詳細表示 -->
        <div v-if="error.conflictingReservations" class="conflict-details">
          <details>
            <summary>競合する予約を確認</summary>
            <div v-for="conflict in error.conflictingReservations" class="conflict-item">
              {{ conflict.time }} - {{ conflict.customerName }} ({{ conflict.category }})
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.validation-errors {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.error-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c53030;
  font-weight: 600;
  margin-bottom: 12px;
}

.error-item {
  background: white;
  border-left: 4px solid #e53e3e;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 0 4px 4px 0;
}

.error-warning {
  border-left-color: #d69e2e;
}

.error-suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px;
  background: #f7fafc;
  border-radius: 4px;
  font-size: 0.9em;
}

.auto-fix-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
}
</style>
```

#### 自動修正・提案機能
```javascript
// インテリジェント自動修正システム
class AutoFixSuggestions {
  generateAutoFixes(errors) {
    return errors.map(error => {
      switch (error.code) {
        case 'TIME_CONFLICT':
          return this.suggestAlternativeTime(error);
        case 'OUTSIDE_BUSINESS_HOURS':
          return this.suggestBusinessHours(error);
        case 'PAST_DATE':
          return this.suggestFutureDate(error);
        default:
          return error;
      }
    });
  }
  
  suggestAlternativeTime(error) {
    const alternatives = this.findAvailableTimeSlots(
      error.data.date,
      error.data.duration || 60
    );
    
    return {
      ...error,
      autoFix: true,
      alternatives: alternatives.slice(0, 3), // 上位3候補
      fixAction: 'selectAlternativeTime'
    };
  }
  
  suggestBusinessHours(error) {
    const suggestedTime = this.adjustToBusinessHours(error.data.time);
    
    return {
      ...error,
      autoFix: true,
      suggestion: `営業時間内の近い時間: ${suggestedTime}`,
      fixAction: 'adjustTime',
      fixValue: suggestedTime
    };
  }
  
  // 自動修正の実行
  async applyAutoFix(error, formData) {
    switch (error.fixAction) {
      case 'adjustTime':
        formData.time = error.fixValue;
        break;
      case 'selectAlternativeTime':
        // ユーザーに選択肢を提示
        const selected = await this.showTimeSelection(error.alternatives);
        if (selected) formData.time = selected;
        break;
    }
    
    // 修正後に再バリデーション
    return await this.revalidate(formData);
  }
}
```

### 3. システム復旧・継続運用

#### 致命的エラーからの復旧
```javascript
// システム復旧機能
class SystemRecovery {
  async handleCriticalError(error, context) {
    // 1. エラーレベル判定
    const severity = this.assessErrorSeverity(error);
    
    switch (severity) {
      case 'CRITICAL':
        return await this.handleCriticalError(error, context);
      case 'SEVERE':  
        return await this.handleSevereError(error, context);
      case 'MODERATE':
        return await this.handleModerateError(error, context);
      default:
        return await this.handleMinorError(error, context);
    }
  }
  
  async handleCriticalError(error, context) {
    // データ保護・緊急バックアップ
    await this.emergencyDataBackup(context.unsavedData);
    
    // ユーザーに緊急メッセージ表示
    this.showEmergencyMessage({
      title: 'システムエラーが発生しました',
      message: '入力中のデータは保護されました。画面を再読み込みしてください。',
      actions: [
        { label: '再読み込み', action: 'reload' },
        { label: 'サポートに連絡', action: 'contact' }
      ]
    });
    
    // 管理者に自動通知
    await this.notifyAdministrator(error, context);
  }
  
  // 段階的復旧手順
  async executeRecoveryProcedure() {
    const steps = [
      () => this.clearCorruptedCache(),
      () => this.resetUserSession(), 
      () => this.reestablishFirebaseConnection(),
      () => this.validateDataIntegrity(),
      () => this.restoreUserInterface()
    ];
    
    for (const [index, step] of steps.entries()) {
      try {
        await step();
        this.updateRecoveryProgress((index + 1) / steps.length * 100);
      } catch (stepError) {
        console.error(`Recovery step ${index + 1} failed:`, stepError);
        // 可能な限り継続
      }
    }
  }
}
```

## 🎯 エラー対応品質基準

### S級エラーハンドリング (目標レベル)
- **競合解決成功率**: 95%以上
- **オフライン復帰成功率**: 100%
- **データ損失率**: 0%
- **ユーザー理解度**: エラーメッセージ理解率90%以上

### A級エラーハンドリング (最低基準)  
- **競合解決成功率**: 90%以上
- **オフライン復帰成功率**: 95%以上
- **データ損失率**: < 0.1%
- **復旧時間**: 平均30秒以内

### エラーログ・監視要件
- **重要エラー**: 即座アラート通知
- **復旧プロセス**: 全手順ログ記録
- **ユーザー影響**: 業務停止時間0分目標
- **学習機能**: エラーパターン学習・予防改善

---

**⚡ この包括的エラーハンドリング設計により、美容室の営業を中断させることなく、どんな例外状況でも安定して動作するシステムを実現します。**