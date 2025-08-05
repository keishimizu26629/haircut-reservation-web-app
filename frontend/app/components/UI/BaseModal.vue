<template>
  <Teleport to="body">
    <Transition
      name="modal"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="isVisible"
        class="modal-overlay"
        :class="overlayClass"
        @click="handleOverlayClick"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="contentId"
      >
        <div
          ref="modalContent"
          class="modal-container"
          :class="[sizeClass, modalClass]"
          @click.stop
        >
          <!-- Modal Header -->
          <header v-if="showHeader" class="modal-header" :class="headerClass">
            <div class="modal-title-section">
              <div v-if="icon" class="modal-icon" :class="iconClass">
                <i :class="icon" aria-hidden="true"></i>
              </div>
              <h2 :id="titleId" class="modal-title">
                <slot name="title">{{ title }}</slot>
              </h2>
            </div>
            
            <div class="modal-header-actions">
              <slot name="header-actions"></slot>
              
              <button
                v-if="showCloseButton"
                class="modal-close-btn"
                :class="closeButtonClass"
                type="button"
                @click="handleClose"
                :aria-label="closeButtonLabel"
              >
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
          </header>

          <!-- Modal Body -->
          <main :id="contentId" class="modal-body" :class="bodyClass">
            <slot></slot>
          </main>

          <!-- Modal Footer -->
          <footer v-if="showFooter" class="modal-footer" :class="footerClass">
            <slot name="footer">
              <div class="modal-actions">
                <button
                  v-if="showCancelButton"
                  class="btn btn-outline-secondary"
                  type="button"
                  @click="handleCancel"
                >
                  {{ cancelButtonText }}
                </button>
                <button
                  v-if="showConfirmButton"
                  class="btn"
                  :class="confirmButtonClass"
                  type="button"
                  @click="handleConfirm"
                  :disabled="confirmDisabled"
                >
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="sr-only">処理中...</span>
                  </span>
                  {{ confirmButtonText }}
                </button>
              </div>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

// Types
interface Props {
  modelValue: boolean
  title?: string
  icon?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info'
  showHeader?: boolean
  showFooter?: boolean
  showCloseButton?: boolean
  showCancelButton?: boolean
  showConfirmButton?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  confirmDisabled?: boolean
  isLoading?: boolean
  persistent?: boolean
  scrollable?: boolean
  centered?: boolean
  overlayClass?: string
  modalClass?: string
  headerClass?: string
  bodyClass?: string
  footerClass?: string
  closeButtonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'md',
  variant: 'default',
  showHeader: true,
  showFooter: false,
  showCloseButton: true,
  showCancelButton: true,
  showConfirmButton: true,
  cancelButtonText: 'キャンセル',
  confirmButtonText: '確定',
  confirmDisabled: false,
  isLoading: false,
  persistent: false,
  scrollable: true,
  centered: true,
  closeButtonLabel: 'モーダルを閉じる'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'cancel': []
  'confirm': []
  'opened': []
  'closed': []
}>()

// Reactive State
const modalContent = ref<HTMLElement>()
const previousActiveElement = ref<HTMLElement>()
const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`
const contentId = `modal-content-${Math.random().toString(36).substr(2, 9)}`

// Computed Properties
const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const sizeClass = computed(() => `modal-${props.size}`)

const iconClass = computed(() => {
  const variantIconClasses = {
    danger: 'text-danger',
    warning: 'text-warning',
    success: 'text-success',
    info: 'text-info',
    default: 'text-primary'
  }
  return variantIconClasses[props.variant]
})

const confirmButtonClass = computed(() => {
  const variantButtonClasses = {
    danger: 'btn-danger',
    warning: 'btn-warning',
    success: 'btn-success',
    info: 'btn-info',
    default: 'btn-primary'
  }
  return variantButtonClasses[props.variant]
})

const closeButtonClass = computed(() => {
  return props.variant === 'danger' ? 'btn-close-danger' : ''
})

// Methods
const handleClose = () => {
  if (!props.persistent) {
    isVisible.value = false
    emit('close')
  }
}

const handleCancel = () => {
  if (!props.persistent) {
    isVisible.value = false
    emit('cancel')
  }
}

const handleConfirm = () => {
  if (!props.confirmDisabled && !props.isLoading) {
    emit('confirm')
  }
}

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isVisible.value) {
    handleClose()
  }
}

const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)
  
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

const onEnter = (element: Element) => {
  // Store currently focused element
  previousActiveElement.value = document.activeElement as HTMLElement
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden'
  
  // Add keyboard listeners
  document.addEventListener('keydown', handleEscapeKey)
}

const onAfterEnter = async () => {
  await nextTick()
  
  if (modalContent.value) {
    // Setup focus trap
    const releaseFocusTrap = trapFocus(modalContent.value)
    
    // Focus first focusable element or modal container
    const firstFocusable = modalContent.value.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      modalContent.value.focus()
    }
    
    // Store cleanup function
    modalContent.value.setAttribute('data-focus-trap', 'true')
    ;(modalContent.value as any).__releaseFocusTrap = releaseFocusTrap
  }
  
  emit('opened')
}

const onLeave = () => {
  // Remove keyboard listeners
  document.removeEventListener('keydown', handleEscapeKey)
  
  // Release focus trap
  if (modalContent.value && (modalContent.value as any).__releaseFocusTrap) {
    ;(modalContent.value as any).__releaseFocusTrap()
  }
}

const onAfterLeave = () => {
  // Restore body scroll
  document.body.style.overflow = ''
  
  // Restore focus to previously active element
  if (previousActiveElement.value) {
    previousActiveElement.value.focus()
    previousActiveElement.value = undefined
  }
  
  emit('closed')
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Additional setup when modal opens
  }
})

// Lifecycle
onMounted(() => {
  // Setup any initial state if needed
})

onUnmounted(() => {
  // Cleanup
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.style.overflow = ''
})
</script>

<script lang="ts">
export default {
  name: 'BaseModal'
}
</script>

<style scoped>
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  min-height: 100vh;
  padding: var(--space-4);
  position: fixed;
  top: 0;
  width: 100vw;
  z-index: var(--z-modal-backdrop);
}

.modal-container {
  background: var(--neutral-0);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  position: relative;
  width: 100%;
  z-index: var(--z-modal);
}

/* Size Variants */
.modal-sm {
  max-width: 400px;
}

.modal-md {
  max-width: 600px;
}

.modal-lg {
  max-width: 800px;
}

.modal-xl {
  max-width: 1200px;
}

.modal-fullscreen {
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
}

/* Modal Header */
.modal-header {
  align-items: center;
  border-bottom: 1px solid var(--neutral-200);
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding: var(--space-6);
}

.modal-title-section {
  align-items: center;
  display: flex;
  gap: var(--space-3);
}

.modal-icon {
  font-size: var(--font-size-xl);
}

.modal-title {
  color: var(--neutral-800);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  margin: 0;
}

.modal-header-actions {
  align-items: center;
  display: flex;
  gap: var(--space-2);
}

.modal-close-btn {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--neutral-500);
  cursor: pointer;
  display: flex;
  font-size: var(--font-size-lg);
  height: 32px;
  justify-content: center;
  transition: all var(--transition-fast);
  width: 32px;
}

.modal-close-btn:hover {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

.modal-close-btn:focus {
  box-shadow: 0 0 0 2px var(--primary-200);
  outline: none;
}

.btn-close-danger:hover {
  background: var(--error-100);
  color: var(--error-600);
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: var(--neutral-100);
  border-radius: var(--radius-full);
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--neutral-300);
  border-radius: var(--radius-full);
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-400);
}

/* Modal Footer */
.modal-footer {
  border-top: 1px solid var(--neutral-200);
  flex-shrink: 0;
  padding: var(--space-6);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* Transitions */
.modal-enter-active {
  transition: all var(--transition-base);
}

.modal-leave-active {
  transition: all var(--transition-base);
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  
  .modal-container {
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    max-height: 90vh;
    max-width: 100vw;
    width: 100%;
  }
  
  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl,
  .modal-fullscreen {
    max-width: 100vw;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--space-4);
  }
  
  .modal-title {
    font-size: var(--font-size-lg);
  }
  
  .modal-actions {
    flex-direction: column-reverse;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
  
  /* Mobile slide-up animation */
  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: translateY(100%);
  }
}

@media (max-width: 576px) {
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .modal-header-actions {
    align-self: flex-end;
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
  }
  
  .modal-title-section {
    width: 100%;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .modal-overlay {
    background: rgba(0, 0, 0, 0.7);
  }
  
  .modal-container {
    background: var(--neutral-900);
  }
  
  .modal-header {
    border-bottom-color: var(--neutral-700);
  }
  
  .modal-footer {
    border-top-color: var(--neutral-700);
  }
  
  .modal-close-btn {
    color: var(--neutral-400);
  }
  
  .modal-close-btn:hover {
    background: var(--neutral-800);
    color: var(--neutral-200);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .modal-container {
    border: 2px solid var(--neutral-800);
  }
  
  .modal-header {
    border-bottom-width: 2px;
  }
  
  .modal-footer {
    border-top-width: 2px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity var(--transition-fast);
  }
  
  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: none;
  }
}

/* Print Styles */
@media print {
  .modal-overlay {
    position: static;
    background: transparent;
    backdrop-filter: none;
  }
  
  .modal-container {
    box-shadow: none;
    max-height: none;
    max-width: none;
  }
  
  .modal-header-actions,
  .modal-footer {
    display: none;
  }
}
</style>