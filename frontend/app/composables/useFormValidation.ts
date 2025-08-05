/**
 * フォームバリデーション Composable
 * 再利用可能なフォームバリデーション機能を提供
 */

import type { Ref, ComputedRef } from 'vue'

// =====================================
// Types
// =====================================

export interface ValidationRule {
  validator: (value: any) => boolean | Promise<boolean>
  message: string
  trigger?: 'input' | 'blur' | 'change'
}

export interface ValidationSchema {
  [key: string]: ValidationRule[]
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export interface FormValidationReturn {
  errors: Ref<Record<string, string>>
  isValid: ComputedRef<boolean>
  isValidating: Ref<boolean>
  validate: (field?: string) => Promise<boolean>
  validateAll: () => Promise<boolean>
  clearError: (field: string) => void
  clearAllErrors: () => void
  reset: () => void
}

// =====================================
// Built-in Validators
// =====================================

export const validators = {
  required: (message = '必須項目です'): ValidationRule => ({
    validator: (value: any) => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return value != null && value !== ''
    },
    message
  }),

  email: (message = '有効なメールアドレスを入力してください'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true // allow empty, use required separately
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      return value.length >= min
    },
    message: message || `${min}文字以上で入力してください`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      return value.length <= max
    },
    message: message || `${max}文字以下で入力してください`
  }),

  pattern: (regex: RegExp, message = '正しい形式で入力してください'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      return regex.test(value)
    },
    message
  }),

  numeric: (message = '数値を入力してください'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      return !isNaN(Number(value))
    },
    message
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validator: (value: string | number) => {
      if (!value) return true
      const num = typeof value === 'string' ? Number(value) : value
      return !isNaN(num) && num >= min
    },
    message: message || `${min}以上の値を入力してください`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validator: (value: string | number) => {
      if (!value) return true
      const num = typeof value === 'string' ? Number(value) : value
      return !isNaN(num) && num <= max
    },
    message: message || `${max}以下の値を入力してください`
  }),

  phoneNumber: (message = '有効な電話番号を入力してください'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      const phoneRegex = /^[0-9-]{10,15}$/
      return phoneRegex.test(value.replace(/[^\d-]/g, ''))
    },
    message
  }),

  url: (message = '有効なURLを入力してください'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message
  }),

  strongPassword: (message = 'パスワードは8文字以上で、大文字・小文字・数字を含む必要があります'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      const hasUpperCase = /[A-Z]/.test(value)
      const hasLowerCase = /[a-z]/.test(value)
      const hasNumbers = /\d/.test(value)
      const hasMinLength = value.length >= 8
      return hasUpperCase && hasLowerCase && hasNumbers && hasMinLength
    },
    message
  }),

  custom: (validator: (value: any) => boolean | Promise<boolean>, message: string): ValidationRule => ({
    validator,
    message
  })
}

// =====================================
// useFormValidation Composable
// =====================================

export function useFormValidation(
  formData: Ref<Record<string, any>>,
  schema: ValidationSchema
): FormValidationReturn {

  const errors = ref<Record<string, string>>({})
  const isValidating = ref(false)

  // フォームが全体的に有効かどうか
  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0 &&
           Object.keys(schema).every(field =>
             formData.value[field] !== undefined &&
             formData.value[field] !== null &&
             formData.value[field] !== ''
           )
  })

  // 特定のフィールドをバリデーション
  const validate = async (field: string): Promise<boolean> => {
    if (!schema[field]) return true

    const rules = schema[field]
    const value = formData.value[field]

    // エラーをクリア
    clearError(field)

    for (const rule of rules) {
      try {
        const isValid = await rule.validator(value)
        if (!isValid) {
          errors.value[field] = rule.message
          return false
        }
      } catch (error) {
        console.error(`Validation error for field ${field}:`, error)
        errors.value[field] = 'バリデーションエラーが発生しました'
        return false
      }
    }

    return true
  }

  // 全フィールドをバリデーション
  const validateAll = async (): Promise<boolean> => {
    isValidating.value = true

    try {
      const validationPromises = Object.keys(schema).map(field => validate(field))
      const results = await Promise.all(validationPromises)

      return results.every(result => result)
    } finally {
      isValidating.value = false
    }
  }

  // 特定フィールドのエラーをクリア
  const clearError = (field: string) => {
    if (errors.value[field]) {
      delete errors.value[field]
    }
  }

  // 全エラーをクリア
  const clearAllErrors = () => {
    errors.value = {}
  }

  // フォームをリセット
  const reset = () => {
    clearAllErrors()
    // フォームデータもリセット（オプション）
    Object.keys(formData.value).forEach(key => {
      if (typeof formData.value[key] === 'string') {
        formData.value[key] = ''
      } else if (typeof formData.value[key] === 'boolean') {
        formData.value[key] = false
      } else if (Array.isArray(formData.value[key])) {
        formData.value[key] = []
      } else {
        formData.value[key] = null
      }
    })
  }

  return {
    errors: readonly(errors) as Ref<Record<string, string>>,
    isValid,
    isValidating: readonly(isValidating) as Ref<boolean>,
    validate,
    validateAll,
    clearError,
    clearAllErrors,
    reset
  }
}

// =====================================
// useLoginValidation - 専用バリデーション
// =====================================

export function useLoginValidation() {
  const formData = ref({
    email: '',
    password: '',
    remember: false
  })

  const schema: ValidationSchema = {
    email: [
      validators.required('メールアドレスは必須です'),
      validators.email()
    ],
    password: [
      validators.required('パスワードは必須です'),
      validators.minLength(6, 'パスワードは6文字以上で入力してください')
    ]
  }

  const validation = useFormValidation(formData, schema)

  return {
    formData,
    ...validation
  }
}

// =====================================
// useRegistrationValidation - 専用バリデーション
// =====================================

export function useRegistrationValidation() {
  const formData = ref({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',

    terms: false
  })

  const schema: ValidationSchema = {
    email: [
      validators.required('メールアドレスは必須です'),
      validators.email()
    ],
    password: [
      validators.required('パスワードは必須です'),
      validators.minLength(8, 'パスワードは8文字以上で入力してください'),
      validators.strongPassword()
    ],
    confirmPassword: [
      validators.required('パスワード確認は必須です'),
      validators.custom(
        (value: string) => value === formData.value.password,
        'パスワードが一致しません'
      )
    ],
    displayName: [
      validators.required('表示名は必須です'),
      validators.minLength(2, '表示名は2文字以上で入力してください'),
      validators.maxLength(50, '表示名は50文字以下で入力してください')
    ],

    terms: [
      validators.custom(
        (value: boolean) => value === true,
        '利用規約への同意が必要です'
      )
    ]
  }

  const validation = useFormValidation(formData, schema)

  return {
    formData,
    ...validation
  }
}

// =====================================
// useAsyncValidation - 非同期バリデーション
// =====================================

export function useAsyncValidation() {
  // メールアドレスの重複チェック（例）
  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      // 実際のAPI呼び出し
      const response = await $fetch('/api/auth/check-email', {
        method: 'POST',
        body: { email }
      })
      return !response.exists
    } catch (error) {
      console.error('Email availability check failed:', error)
      return true // エラー時は通す
    }
  }

  // ユーザー名の重複チェック（例）
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const response = await $fetch('/api/auth/check-username', {
        method: 'POST',
        body: { username }
      })
      return !response.exists
    } catch (error) {
      console.error('Username availability check failed:', error)
      return true
    }
  }

  return {
    checkEmailAvailability,
    checkUsernameAvailability
  }
}

// =====================================
// useFormSubmission - フォーム送信管理
// =====================================

export function useFormSubmission() {
  const isSubmitting = ref(false)
  const submitError = ref('')

  const handleSubmit = async (
    submitFn: () => Promise<void>,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    if (isSubmitting.value) return

    isSubmitting.value = true
    submitError.value = ''

    try {
      await submitFn()
      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '送信中にエラーが発生しました'
      submitError.value = errorMessage
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      isSubmitting.value = false
    }
  }

  const reset = () => {
    isSubmitting.value = false
    submitError.value = ''
  }

  return {
    isSubmitting: readonly(isSubmitting),
    submitError: readonly(submitError),
    handleSubmit,
    reset
  }
}
