// テスト用ヘルパー関数とモックデータ

import type { BookingData, Service, Stylist, TimeSlot } from '~/types/booking'

// モックデータ生成

export const createMockService = (overrides: Partial<Service> = {}): Service => {
  return {
    id: 'test-service-1',
    name: 'テストカット',
    description: 'テスト用のカットサービス',
    duration: 60,
    price: 4000,
    category: {
      id: 'cut',
      name: 'カット',
      icon: 'bi-scissors',
      order: 1
    },
    isActive: true,
    ...overrides
  }
}

export const createMockStylist = (overrides: Partial<Stylist> = {}): Stylist => {
  return {
    id: 'test-stylist-1',
    name: 'test_stylist',
    displayName: 'テストスタイリスト',
    specialties: ['カット', 'カラー'],
    experience: 5,
    rating: 4.5,
    isActive: true,
    workingHours: {
      monday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
      wednesday: { isWorking: false, startTime: '', endTime: '' },
      thursday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
      friday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
      saturday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
      sunday: { isWorking: false, startTime: '', endTime: '' }
    },
    ...overrides
  }
}

export const createMockTimeSlot = (overrides: Partial<TimeSlot> = {}): TimeSlot => {
  return {
    time: '14:00',
    endTime: '15:00',
    isAvailable: true,
    stylistId: 'test-stylist-1',
    duration: 60,
    ...overrides
  }
}

export const createMockBookingData = (overrides: Partial<BookingData> = {}): BookingData => {
  return {
    services: [createMockService()],
    totalDuration: 60,
    totalPrice: 4000,
    stylist: createMockStylist(),
    isAnyStylietOk: false,
    date: '2024-01-15',
    timeSlot: createMockTimeSlot(),
    customerInfo: {
      name: 'テスト顧客',
      email: 'test@example.com',
      phone: '090-1234-5678',
      isNewCustomer: true
    },
    specialRequests: 'テスト用の特別要望',
    status: 'draft' as any,
    ...overrides
  }
}

// APIモック関数

export const mockApiSuccess = <T>(data: T) => {
  return Promise.resolve({
    success: true,
    data,
    error: null
  })
}

export const mockApiError = (message: string = 'テストエラー') => {
  return Promise.reject({
    message,
    response: {
      status: 500,
      data: { message }
    }
  })
}

// DOM テストヘルパー

export const queryByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`)
}

export const queryAllByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelectorAll(`[data-testid="${testId}"]`)
}

// 時間関連ヘルパー

export const createDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const createTimeString = (hour: number, minute: number = 0): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

// Firebase モック

export const mockFirebaseAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'テストユーザー',
    getIdToken: vi.fn().mockResolvedValue('mock-token')
  },
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn((callback) => {
    callback(mockFirebaseAuth.currentUser)
    return () => {} // unsubscribe function
  })
}

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn()
}

// Vue Test Utils ヘルパー

export const createMountOptions = (options: any = {}) => {
  return {
    global: {
      plugins: [
        // Pinia や他のプラグインをここに追加
      ],
      mocks: {
        $fetch: vi.fn(),
        $router: {
          push: vi.fn(),
          replace: vi.fn(),
          back: vi.fn()
        },
        $route: {
          path: '/',
          query: {},
          params: {}
        }
      },
      stubs: {
        // 必要に応じてスタブを追加
        'nuxt-link': true,
        'client-only': true
      }
    },
    ...options
  }
}

// アサーションヘルパー

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toBeTruthy()
  expect(element!.textContent).toContain(text)
}

export const expectElementToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toBeTruthy()
  expect(element!.classList).toContain(className)
}

export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeTruthy()
  expect(element!.style.display).not.toBe('none')
  expect(element!.hidden).toBeFalsy()
}

// 非同期テストヘルパー

export const waitForElement = async (
  container: HTMLElement,
  selector: string,
  timeout: number = 1000
): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`))
    }, timeout)

    const checkForElement = () => {
      const element = container.querySelector(selector) as HTMLElement
      if (element) {
        clearTimeout(timeoutId)
        resolve(element)
      } else {
        setTimeout(checkForElement, 10)
      }
    }

    checkForElement()
  })
}

export const waitForAsyncOperation = async (operation: () => Promise<any>, timeout: number = 5000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
  )

  return Promise.race([operation(), timeoutPromise])
}

// ローディング状態テストヘルパー

export const expectLoadingState = (container: HTMLElement, isLoading: boolean = true) => {
  const loadingElement = container.querySelector('[data-testid="loading"]')
  if (isLoading) {
    expect(loadingElement).toBeTruthy()
  } else {
    expect(loadingElement).toBeFalsy()
  }
}

// フォームテストヘルパー

export const fillFormField = async (input: HTMLInputElement, value: string) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise(resolve => setTimeout(resolve, 0)) // nextTick equivalent
}

export const submitForm = async (form: HTMLFormElement) => {
  form.dispatchEvent(new Event('submit', { bubbles: true }))
  await new Promise(resolve => setTimeout(resolve, 0))
}

// エラーハンドリングテストヘルパー

export const expectErrorMessage = (container: HTMLElement, message: string) => {
  const errorElement = container.querySelector('[data-testid="error"]')
  expectElementToHaveText(errorElement, message)
}

export const expectSuccessMessage = (container: HTMLElement, message: string) => {
  const successElement = container.querySelector('[data-testid="success"]')
  expectElementToHaveText(successElement, message)
}