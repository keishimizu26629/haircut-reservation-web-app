# アクセシビリティ要件実装指針

## 🎯 アクセシビリティ目標
**年齢・能力・技術レベルに関わらず、全ての美容室スタッフが快適に使用できるインクルーシブ設計**

## 🌐 WCAG 2.1 AA準拠実装

### 1. 知覚可能性 (Perceivable)

#### 1.1 代替テキスト・情報提供

##### アイコン・画像の代替テキスト
```vue
<template>
  <!-- カテゴリーアイコンの適切な代替テキスト -->
  <div class="category-item" @click="selectCategory('cut')">
    <i 
      class="bi bi-scissors" 
      aria-label="カット - ヘアカット・スタイリング"
      role="img"
    ></i>
    <span>カット</span>
  </div>
  
  <!-- ステータスアイコンの代替テキスト -->
  <div class="reservation-status">
    <i 
      class="bi bi-check-circle-fill"
      aria-label="来店完了 - 施術が完了しました"
      :class="statusClass"
    ></i>
    <span class="sr-only">{{ getStatusDescription(status) }}</span>
  </div>
  
  <!-- 操作ボタンの明確な説明 -->
  <button 
    class="btn-edit"
    :aria-label="`${reservation.customerName}様の${reservation.time}の予約を編集`"
    @click="editReservation(reservation)"
  >
    <i class="bi bi-pencil" aria-hidden="true"></i>
    編集
  </button>
</template>
```

##### 色覚異常対応
```css
/* 色だけに依存しない情報伝達 */
.reservation-card {
  /* 基本色分け */
  &.category-cut { 
    background-color: #FFE4E1; 
    border-left: 4px solid #FF69B4; /* 形状でも区別 */
  }
  &.category-color { 
    background-color: #E0E4FF; 
    border-left: 4px solid #4169E1;
  }
  &.category-perm { 
    background-color: #E4FFE0; 
    border-left: 4px solid #32CD32;
  }
  
  /* 高コントラストモード対応 */
  @media (prefers-contrast: high) {
    &.category-cut { 
      background-color: #FFB6C1; 
      color: #8B0000;
    }
    &.category-color { 
      background-color: #B0C4DE; 
      color: #000080;
    }
  }
}

/* パターン・テクスチャでも区別 */
.category-cut::before { 
  content: "✂️"; 
  margin-right: 4px;
}
.category-color::before { 
  content: "🎨"; 
  margin-right: 4px;
}
.category-perm::before { 
  content: "〰️"; 
  margin-right: 4px;
}
```

#### 1.2 視覚的情報の強化

##### フォントサイズ・コントラスト最適化
```css
/* 高齢者対応 - 大きめフォントサイズ */
.accessibility-large-text {
  --base-font-size: 18px;      /* 標準より2px大きく */
  --heading-font-size: 24px;   /* 見出しはより大きく */
  --button-font-size: 16px;    /* ボタン文字も大きめ */
}

/* 高コントラスト対応 */
.high-contrast-theme {
  --text-color: #000000;
  --background-color: #FFFFFF;
  --border-color: #000000;
  --focus-color: #FF0000;      /* 強い赤でフォーカス表示 */
  
  /* コントラスト比4.5:1以上を保証 */
  --primary-color: #0056B3;    /* WCAG AA準拠 */
  --secondary-color: #6C757D;
  --success-color: #0A5C2B;
  --danger-color: #8B0000;
}

/* 動きを減らすオプション */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. 操作可能性 (Operable)

#### 2.1 キーボードナビゲーション完全対応

##### フォーカス管理システム
```javascript
// フォーカス管理クラス
class FocusManager {
  constructor() {
    this.focusHistory = [];
    this.trapElements = [];
  }
  
  // モーダル内でのフォーカストラップ
  trapFocus(modalElement) {
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modalElement.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
      
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
    
    // 初期フォーカス設定
    firstElement.focus();
  }
  
  // フォーカス復帰システム
  saveFocus() {
    this.focusHistory.push(document.activeElement);
  }
  
  restoreFocus() {
    const lastFocused = this.focusHistory.pop();
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }
}
```

##### キーボードショートカット実装
```vue
<template>
  <div class="calendar-app" @keydown="handleGlobalKeydown" tabindex="0">
    <!-- グローバルキーボードショートカット案内 -->
    <div class="keyboard-shortcuts-info" v-if="showShortcuts">
      <h3>キーボードショートカット</h3>
      <ul>
        <li><kbd>N</kbd> - 新規予約作成</li>
        <li><kbd>E</kbd> - 選択中の予約を編集</li>
        <li><kbd>Delete</kbd> - 選択中の予約を削除</li>
        <li><kbd>←/→</kbd> - 日付移動</li>
        <li><kbd>↑/↓</kbd> - 時間移動</li>
        <li><kbd>Escape</kbd> - キャンセル・閉じる</li>
        <li><kbd>F1</kbd> - ヘルプ表示</li>
      </ul>
    </div>
    
    <!-- カレンダーグリッド -->
    <div class="calendar-grid" role="grid" aria-label="予約カレンダー">
      <div 
        v-for="(timeSlot, index) in timeSlots"
        :key="timeSlot.id"
        class="time-slot"
        role="gridcell"
        :tabindex="selectedTimeSlot === index ? 0 : -1"
        :aria-selected="selectedTimeSlot === index"
        @keydown="handleCellKeydown($event, index)"
        @click="selectTimeSlot(index)"
      >
        <!-- 予約カード -->
        <div v-if="timeSlot.reservation" class="reservation-card">
          {{ timeSlot.reservation.customerName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// キーボード操作ハンドラー
const handleGlobalKeydown = (event) => {
  // Ctrl + Alt + 組み合わせでアクセシビリティ機能切り替え
  if (event.ctrlKey && event.altKey) {
    switch (event.key) {
      case 'h': // High Contrast
        toggleHighContrast();
        break;
      case 'l': // Large Text
        toggleLargeText();
        break;
      case 's': // Screen Reader Mode
        toggleScreenReaderMode();
        break;
    }
    return;
  }
  
  // 通常のショートカット
  if (!event.ctrlKey && !event.altKey) {
    switch (event.key) {
      case 'n':
      case 'N':
        createNewReservation();
        break;
      case 'e':
      case 'E':
        if (selectedReservation.value) {
          editReservation(selectedReservation.value);
        }
        break;
      case 'Delete':
        if (selectedReservation.value) {
          deleteReservation(selectedReservation.value);
        }
        break;
      case 'ArrowLeft':
        navigateDate(-1);
        break;
      case 'ArrowRight':
        navigateDate(1);
        break;
      case 'F1':
        showHelp();
        break;
    }
  }
};
</script>
```

#### 2.2 タッチ・ジェスチャー最適化

##### 高齢者対応タッチ設計
```css
/* 大きなタッチターゲット */
.touch-target {
  min-width: 44px;    /* WCAG推奨最小サイズ */
  min-height: 44px;
  padding: 12px;      /* 十分な余白 */
  margin: 4px;        /* 隣接要素との間隔 */
}

/* タッチフィードバック強化 */
.touch-feedback {
  transition: all 0.15s ease;
  
  &:hover, &:focus {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  
  &:active {
    transform: scale(0.98);
    background-color: var(--primary-color);
  }
}

/* 誤操作防止 */
.dangerous-action {
  /* 削除ボタンなどは2段階確認 */
  position: relative;
  
  &::before {
    content: "長押しして削除";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover::before {
    opacity: 1;
  }
}
```

### 3. 理解可能性 (Understandable)

#### 3.1 明確で一貫した情報設計

##### 分かりやすい表記・説明
```vue
<template>
  <!-- 明確なフォームラベル -->
  <div class="form-group">
    <label for="customer-name" class="required-field">
      お客様のお名前
      <span class="required-indicator" aria-label="必須項目">*</span>
    </label>
    <input
      id="customer-name"
      v-model="customerName"
      type="text"
      class="form-control"
      aria-required="true"
      aria-describedby="customer-name-help customer-name-error"
      :aria-invalid="hasError('customerName')"
    />
    <div id="customer-name-help" class="form-help">
      予約を取られたお客様の姓名を入力してください
    </div>
    <div 
      v-if="errors.customerName" 
      id="customer-name-error" 
      class="form-error"
      role="alert"
      aria-live="polite"
    >
      {{ errors.customerName }}
    </div>
  </div>
  
  <!-- 状況説明の充実 -->
  <div class="status-explanation">
    <h3>予約ステータスの説明</h3>
    <dl>
      <dt class="status-pending">
        <i class="bi bi-clock" aria-hidden="true"></i>
        予約済み
      </dt>
      <dd>
        お客様からの予約を受け付けた状態です。
        来店をお待ちしています。
      </dd>
      
      <dt class="status-confirmed">
        <i class="bi bi-check-circle" aria-hidden="true"></i>
        確認済み
      </dt>
      <dd>
        予約内容を確認し、準備が整った状態です。
        お客様にご連絡済みです。
      </dd>
      
      <dt class="status-completed">
        <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
        来店完了
      </dt>
      <dd>
        お客様が来店され、施術が完了した状態です。
        お疲れ様でした。
      </dd>
    </dl>
  </div>
</template>
```

#### 3.2 エラーメッセージの改善

##### 理解しやすいエラー表示
```javascript
// 分かりやすいエラーメッセージ生成
class AccessibleErrorMessages {
  generateErrorMessage(errorCode, context) {
    const messages = {
      'REQUIRED_FIELD': {
        message: `${context.fieldName}を入力してください`,
        suggestion: `${context.fieldName}は必須項目です。例: ${context.example}`,
        severity: 'error'
      },
      
      'PAST_DATE': {
        message: '過去の日付は選択できません',
        suggestion: '今日以降の日付を選択してください。今日は' + new Date().toLocaleDateString('ja-JP') + 'です。',
        autoFix: '明日の日付に変更しますか？'
      },
      
      'TIME_CONFLICT': {
        message: `${context.time}は他の予約と重複しています`,
        suggestion: `${context.alternativeTime}はいかがですか？`,
        details: `重複している予約: ${context.conflictingReservation.customerName}様`
      }
    };
    
    return messages[errorCode] || {
      message: '入力内容を確認してください',
      suggestion: 'サポートが必要な場合は、スタッフにお声がけください'
    };
  }
  
  // 音声読み上げ用のテキスト生成
  generateSpeechText(error) {
    return `エラーが発生しました。${error.message}。${error.suggestion}`;
  }
}
```

### 4. 堅牢性 (Robust) - 支援技術対応

#### 4.1 スクリーンリーダー完全対応

##### ARIA属性の適切な使用
```vue
<template>
  <!-- カレンダーグリッドのARIA構造 -->
  <div 
    class="calendar-container"
    role="application"
    aria-label="予約カレンダー"
    aria-describedby="calendar-instructions"
  >
    <div id="calendar-instructions" class="sr-only">
      矢印キーで日付を移動、Enterで予約詳細を確認、Nキーで新規予約作成
    </div>
    
    <table role="grid" aria-label="週間予約表">
      <thead>
        <tr>
          <th scope="col">時間</th>
          <th v-for="day in weekDays" :key="day" scope="col">
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="timeSlot in timeSlots" :key="timeSlot.time">
          <th scope="row">{{ timeSlot.time }}</th>
          <td 
            v-for="day in weekDays" 
            :key="`${timeSlot.time}-${day}`"
            role="gridcell"
            :aria-selected="isSelected(timeSlot.time, day)"
            :aria-describedby="getReservationDescription(timeSlot.time, day)"
          >
            <div 
              v-if="getReservation(timeSlot.time, day)"
              class="reservation-card"
              :aria-label="getReservationAriaLabel(timeSlot.time, day)"
              tabindex="0"
              role="button"
              @click="openReservation(timeSlot.time, day)"
              @keydown.enter="openReservation(timeSlot.time, day)"
            >
              {{ getReservation(timeSlot.time, day).customerName }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- ライブリージョン - 動的な変更を通知 -->
  <div 
    aria-live="polite" 
    aria-atomic="true" 
    class="sr-only"
  >
    {{ liveAnnouncement }}
  </div>
  
  <!-- より重要な通知用 -->
  <div 
    aria-live="assertive" 
    aria-atomic="true" 
    class="sr-only"
  >
    {{ urgentAnnouncement }}
  </div>
</template>

<script setup>
// スクリーンリーダー用のアナウンスメント管理
const liveAnnouncement = ref('');
const urgentAnnouncement = ref('');

const announceReservationCreated = (reservation) => {
  liveAnnouncement.value = `新しい予約が作成されました。${reservation.customerName}様、${reservation.date}の${reservation.time}、${reservation.category}`;
};

const announceReservationUpdated = (reservation) => {
  liveAnnouncement.value = `予約が更新されました。${reservation.customerName}様の予約内容が変更されました`;
};

const announceError = (error) => {
  urgentAnnouncement.value = `エラー: ${error.message}`;
};
</script>
```

#### 4.2 音声操作・読み上げ機能

##### Web Speech API統合
```javascript
// 音声操作システム
class VoiceAccessibility {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    
    this.initializeSpeechRecognition();
  }
  
  // 音声読み上げ機能
  speak(text, options = {}) {
    if (!this.synthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = options.rate || 0.9;  // 少しゆっくり
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;
    
    this.synthesis.speak(utterance);
  }
  
  // 予約情報の読み上げ
  readReservation(reservation) {
    const text = `${reservation.customerName}様の予約です。
                  日時は${reservation.date}の${reservation.time}、
                  ${this.getCategoryJapanese(reservation.category)}の予定です。
                  ${reservation.details ? 'メモ: ' + reservation.details : ''}`;
    
    this.speak(text);
  }
  
  // 操作説明の読み上げ
  readInstructions() {
    const instructions = `
      予約管理画面です。
      新しい予約を作成するにはNキーを押してください。
      予約を選択して編集するにはEキーを押してください。
      日付を移動するには左右の矢印キーを使用してください。
      ヘルプを表示するにはF1キーを押してください。
    `;
    
    this.speak(instructions);
  }
  
  // 音声コマンド認識
  initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) return;
    
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'ja-JP';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    
    this.recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      this.processVoiceCommand(command);
    };
  }
  
  processVoiceCommand(command) {
    const commands = {
      '新規予約': () => this.createNewReservation(),
      '予約作成': () => this.createNewReservation(),
      '今日の予約': () => this.showTodayReservations(),
      '明日の予約': () => this.showTomorrowReservations(),
      '予約確認': () => this.readAllReservations(),
      'ヘルプ': () => this.readInstructions()
    };
    
    const matchedCommand = Object.keys(commands).find(cmd => 
      command.includes(cmd)
    );
    
    if (matchedCommand) {
      commands[matchedCommand]();
      this.speak(`${matchedCommand}を実行します`);
    } else {
      this.speak('コマンドが認識できませんでした。もう一度お試しください。');
    }
  }
}
```

### 5. 設定・カスタマイズ機能

#### 5.1 ユーザー設定システム

##### アクセシビリティ設定画面
```vue
<template>
  <div class="accessibility-settings">
    <h2>アクセシビリティ設定</h2>
    
    <div class="settings-group">
      <h3>表示設定</h3>
      
      <div class="setting-item">
        <label>
          <input 
            v-model="settings.largeText" 
            type="checkbox"
            @change="applySettings"
          />
          大きな文字で表示
        </label>
        <p class="setting-description">
          文字サイズを20%大きく表示します
        </p>
      </div>
      
      <div class="setting-item">
        <label>
          <input 
            v-model="settings.highContrast" 
            type="checkbox"
            @change="applySettings"
          />
          高コントラスト表示
        </label>
        <p class="setting-description">
          背景と文字のコントラストを強くします
        </p>
      </div>
      
      <div class="setting-item">
        <label>
          <input 
            v-model="settings.reducedMotion" 
            type="checkbox"
            @change="applySettings"
          />
          アニメーションを減らす
        </label>
        <p class="setting-description">
          画面の動きを最小限に抑えます
        </p>
      </div>
    </div>
    
    <div class="settings-group">
      <h3>音声設定</h3>
      
      <div class="setting-item">
        <label>
          <input 
            v-model="settings.screenReader" 
            type="checkbox"
            @change="applySettings"
          />
          スクリーンリーダー対応モード
        </label>
        <p class="setting-description">
          音声読み上げソフトウェア用に最適化します
        </p>
      </div>
      
      <div class="setting-item">
        <label for="speech-rate">読み上げ速度</label>
        <input
          id="speech-rate"
          v-model="settings.speechRate"
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          @input="applySettings"
        />
        <span>{{ settings.speechRate }}倍速</span>
      </div>
    </div>
    
    <div class="settings-group">
      <h3>操作設定</h3>
      
      <div class="setting-item">
        <label>
          <input 
            v-model="settings.keyboardNavigation" 
            type="checkbox"
            @change="applySettings"
          />
          キーボードナビゲーション強化
        </label>
        <p class="setting-description">
          キーボードのみで全機能を操作できます
        </p>
      </div>
      
      <div class="setting-item">
        <label>
          <input 
            v-model="settings.voiceCommands" 
            type="checkbox"
            @change="applySettings"
          />
          音声コマンド機能
        </label>
        <p class="setting-description">
          音声での操作が可能になります
        </p>
      </div>
    </div>
    
    <div class="settings-actions">
      <button @click="resetToDefaults" class="btn-secondary">
        デフォルトに戻す
      </button>
      <button @click="saveSettings" class="btn-primary">
        設定を保存
      </button>
    </div>
  </div>
</template>
```

#### 5.2 設定の永続化・同期

```javascript
// アクセシビリティ設定管理
class AccessibilitySettings {
  constructor() {
    this.settings = this.loadSettings();
    this.applySettings();
  }
  
  loadSettings() {
    const defaults = {
      largeText: false,
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      speechRate: 1.0,
      keyboardNavigation: true,
      voiceCommands: false
    };
    
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  }
  
  saveSettings() {
    localStorage.setItem(
      'accessibility-settings', 
      JSON.stringify(this.settings)
    );
  }
  
  applySettings() {
    const root = document.documentElement;
    
    // CSS カスタムプロパティで設定を適用
    if (this.settings.largeText) {
      root.classList.add('large-text-mode');
    } else {
      root.classList.remove('large-text-mode');
    }
    
    if (this.settings.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
    
    if (this.settings.reducedMotion) {
      root.classList.add('reduced-motion-mode');
    } else {
      root.classList.remove('reduced-motion-mode');
    }
    
    // メタタグでプリファレンス設定
    this.updateMetaPreferences();
  }
  
  updateMetaPreferences() {
    const meta = document.querySelector('meta[name="color-scheme"]') || 
                 document.createElement('meta');
    meta.name = 'color-scheme';
    meta.content = this.settings.highContrast ? 'light dark' : 'light';
    document.head.appendChild(meta);
  }
}
```

## 🎯 アクセシビリティ品質基準

### S級アクセシビリティ (目標レベル)
- **WCAG 2.1 AA準拠**: 100%
- **キーボード操作**: 全機能対応
- **スクリーンリーダー**: 完全対応
- **色覚異常対応**: パターン・形状併用
- **高齢者対応**: 大きな文字・タッチターゲット

### A級アクセシビリティ (最低基準)
- **WCAG 2.1 AA準拠**: 95%以上
- **キーボード操作**: 主要機能対応
- **コントラスト比**: 4.5:1以上
- **フォーカス表示**: 明確な視覚的表示
- **エラーメッセージ**: 理解しやすい表現

### 継続改善・テスト計画
- **自動テスト**: axe-core使用
- **手動テスト**: スクリーンリーダー実機テスト
- **ユーザーテスト**: 実際の視覚障害者による評価
- **定期監査**: 月次アクセシビリティチェック

---

**♿ この包括的アクセシビリティ実装により、年齢・能力・技術レベルに関わらず、全ての美容室スタッフが快適に使用できるインクルーシブなアプリケーションを実現します。**