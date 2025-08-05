<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="loading-button"
    :class="[
      variant,
      size,
      {
        'loading': loading,
        'disabled': disabled,
        'full-width': fullWidth
      }
    ]"
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- ローディング中 -->
    <template v-if="loading">
      <div class="spinner-container">
        <svg 
          class="spinner" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle 
            class="spinner-track" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="2"
          />
          <path 
            class="spinner-fill" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            fill="currentColor"
          />
        </svg>
      </div>
      <span v-if="loadingText" class="button-text">{{ loadingText }}</span>
      <span v-else class="button-text">読み込み中...</span>
    </template>

    <!-- 通常状態 -->
    <template v-else>
      <span class="button-content">
        <slot />
      </span>
    </template>
  </button>
</template>

<script setup lang="ts">
// =====================================
// Props & Emits
// =====================================

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  loadingText?: string
  fullWidth?: boolean
}

interface Emits {
  (event: 'click', payload: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  loadingText: '',
  fullWidth: false
})

const emit = defineEmits<Emits>()

// =====================================
// Event Handlers
// =====================================

const handleClick = (event: MouseEvent) => {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.loading-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  outline: none;
  white-space: nowrap;
  user-select: none;
  min-height: 2.75rem;
}

.loading-button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Variants */
.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.primary:hover:not(:disabled):not(.loading) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
}

.primary:active:not(:disabled):not(.loading) {
  transform: translateY(0);
}

.secondary {
  background-color: #6b7280;
  color: white;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.secondary:hover:not(:disabled):not(.loading) {
  background-color: #4b5563;
  transform: translateY(-1px);
}

.outline {
  background-color: transparent;
  border-color: #d1d5db;
  color: #374151;
}

.outline:hover:not(:disabled):not(.loading) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.ghost {
  background-color: transparent;
  color: #3b82f6;
}

.ghost:hover:not(:disabled):not(.loading) {
  background-color: #f3f4f6;
}

.danger {
  background-color: #dc2626;
  color: white;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.danger:hover:not(:disabled):not(.loading) {
  background-color: #b91c1c;
  transform: translateY(-1px);
}

/* Sizes */
.sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 2.25rem;
}

.md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  min-height: 2.75rem;
}

.lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-height: 3.25rem;
}

.xl {
  padding: 1.25rem 2.5rem;
  font-size: 1.25rem;
  min-height: 3.75rem;
}

/* States */
.loading {
  cursor: not-allowed;
  opacity: 0.8;
}

.loading:hover {
  transform: none !important;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.full-width {
  width: 100%;
}

/* Spinner */
.spinner-container {
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  animation: spin 1s linear infinite;
}

.sm .spinner {
  width: 1rem;
  height: 1rem;
}

.lg .spinner,
.xl .spinner {
  width: 1.5rem;
  height: 1.5rem;
}

.spinner-track {
  opacity: 0.25;
}

.spinner-fill {
  opacity: 0.75;
}

.button-text {
  display: flex;
  align-items: center;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* アニメーション */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* レスポンシブ */
@media (max-width: 480px) {
  .loading-button {
    min-height: 3rem;
  }
  
  .sm {
    min-height: 2.5rem;
  }
  
  .lg,
  .xl {
    min-height: 3.5rem;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .outline {
    border-color: #4b5563;
    color: #e5e7eb;
  }
  
  .outline:hover:not(:disabled):not(.loading) {
    background-color: #1f2937;
    border-color: #6b7280;
  }
  
  .ghost {
    color: #60a5fa;
  }
  
  .ghost:hover:not(:disabled):not(.loading) {
    background-color: #1f2937;
  }
}

/* アクセシビリティ */
@media (prefers-reduced-motion: reduce) {
  .loading-button {
    transition: none;
  }
  
  .primary:hover:not(:disabled):not(.loading),
  .secondary:hover:not(:disabled):not(.loading),
  .danger:hover:not(:disabled):not(.loading) {
    transform: none;
  }
  
  .spinner {
    animation: none;
  }
}

/* ハイコントラストモード */
@media (prefers-contrast: high) {
  .loading-button {
    border-width: 2px;
  }
  
  .primary {
    border-color: #1e40af;
  }
  
  .secondary {
    border-color: #374151;
  }
  
  .danger {
    border-color: #991b1b;
  }
}
</style>