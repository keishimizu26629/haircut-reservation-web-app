<template>
  <div class="form-field">
    <!-- ラベル -->
    <label 
      :for="id" 
      class="form-label"
      :class="{ 'error': error, 'required': required }"
    >
      <i v-if="icon" :class="icon" class="label-icon" aria-hidden="true"></i>
      {{ label }}
      <span v-if="required" class="required-mark" aria-label="必須">*</span>
    </label>

    <!-- 入力フィールド -->
    <div class="input-container">
      <input
        :id="id"
        v-model="localValue"
        :type="type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :minlength="minlength"
        :required="required"
        class="form-input"
        :class="{
          'error': error,
          'success': !error && localValue && showValidation,
          'has-icon': icon,
          'has-action': showPasswordToggle || showClearButton
        }"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      >

      <!-- アイコン -->
      <i 
        v-if="icon" 
        :class="[icon, { 'error': error, 'success': !error && localValue && showValidation }]"
        class="input-icon" 
        aria-hidden="true"
      ></i>

      <!-- パスワード表示切り替えボタン -->
      <button
        v-if="showPasswordToggle"
        type="button"
        class="action-button password-toggle"
        :aria-label="passwordVisible ? 'パスワードを隠す' : 'パスワードを表示'"
        @click="$emit('togglePassword')"
      >
        <i 
          :class="passwordVisible ? 'bi-eye-slash' : 'bi-eye'"
          aria-hidden="true"
        ></i>
      </button>

      <!-- クリアボタン -->
      <button
        v-if="showClearButton && localValue"
        type="button"
        class="action-button clear-button"
        aria-label="入力をクリア"
        @click="handleClear"
      >
        <i class="bi-x" aria-hidden="true"></i>
      </button>

      <!-- バリデーション状態アイコン -->
      <div v-if="showValidation" class="validation-icon">
        <i 
          v-if="error"
          class="bi-exclamation-circle text-red-500" 
          aria-hidden="true"
        ></i>
        <i 
          v-else-if="localValue && !error"
          class="bi-check-circle text-green-500" 
          aria-hidden="true"
        ></i>
      </div>
    </div>

    <!-- エラーメッセージ -->
    <transition name="error-slide">
      <div 
        v-if="error" 
        :id="`${id}-error`"
        class="error-message"
        role="alert"
        aria-live="polite"
      >
        <i class="bi-exclamation-triangle" aria-hidden="true"></i>
        {{ error }}
      </div>
    </transition>

    <!-- ヘルプテキスト -->
    <div v-if="helpText && !error" class="help-text">
      {{ helpText }}
    </div>

    <!-- 文字数カウンター -->
    <div 
      v-if="maxlength && showCharCount" 
      class="char-count"
      :class="{ 'near-limit': charCountNearLimit }"
    >
      {{ localValue.length }} / {{ maxlength }}
    </div>
  </div>
</template>

<script setup lang="ts">
// =====================================
// Props & Emits
// =====================================

interface Props {
  id: string
  modelValue: string
  type?: string
  label: string
  placeholder?: string
  icon?: string
  error?: string
  helpText?: string
  autocomplete?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  maxlength?: number
  minlength?: number
  showValidation?: boolean
  showPasswordToggle?: boolean
  passwordVisible?: boolean
  showClearButton?: boolean
  showCharCount?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: string): void
  (event: 'input', value: string): void
  (event: 'blur', event: FocusEvent): void
  (event: 'focus', event: FocusEvent): void
  (event: 'keydown', event: KeyboardEvent): void
  (event: 'togglePassword'): void
  (event: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  icon: '',
  error: '',
  helpText: '',
  autocomplete: 'off',
  disabled: false,
  readonly: false,
  required: false,
  maxlength: 0,
  minlength: 0,
  showValidation: true,
  showPasswordToggle: false,
  passwordVisible: false,
  showClearButton: false,
  showCharCount: false
})

const emit = defineEmits<Emits>()

// =====================================
// State
// =====================================

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

const isFocused = ref(false)

// =====================================
// Computed
// =====================================

const charCountNearLimit = computed(() => {
  if (!props.maxlength) return false
  return localValue.value.length > props.maxlength * 0.8
})

// =====================================
// Event Handlers
// =====================================

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('input', target.value)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleClear = () => {
  localValue.value = ''
  emit('clear')
  
  // フォーカスを戻す
  nextTick(() => {
    const input = document.getElementById(props.id) as HTMLInputElement
    if (input) {
      input.focus()
    }
  })
}
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  transition: color 0.2s ease;
}

.form-label.error {
  color: #dc2626;
}

.form-label.required .required-mark {
  color: #dc2626;
  margin-left: 0.25rem;
}

.label-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #111827;
  background-color: #ffffff;
  transition: all 0.2s ease;
  outline: none;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:hover:not(:disabled):not(:focus) {
  border-color: #9ca3af;
}

.form-input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-input:readonly {
  background-color: #f3f4f6;
  cursor: default;
}

.form-input.error {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.form-input.error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-input.success {
  border-color: #059669;
  background-color: #f0fdf4;
}

.form-input.has-icon {
  padding-left: 3rem;
}

.form-input.has-action {
  padding-right: 3rem;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 1.125rem;
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-icon.error {
  color: #dc2626;
}

.input-icon.success {
  color: #059669;
}

.action-button {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.action-button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.validation-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #dc2626;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
}

.help-text {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.4;
}

.char-count {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: right;
  transition: color 0.2s ease;
}

.char-count.near-limit {
  color: #f59e0b;
}

/* アニメーション */
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.error-slide-enter-to,
.error-slide-leave-from {
  max-height: 100px;
}

/* レスポンシブ */
@media (max-width: 480px) {
  .form-input {
    font-size: 0.875rem;
  }
  
  .form-label {
    font-size: 0.8125rem;
  }
}

/* ダークモード対応（将来用） */
@media (prefers-color-scheme: dark) {
  .form-label {
    color: #e5e7eb;
  }
  
  .form-input {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .form-input:focus {
    border-color: #60a5fa;
  }
  
  .input-icon {
    color: #9ca3af;
  }
  
  .help-text {
    color: #9ca3af;
  }
}
</style>