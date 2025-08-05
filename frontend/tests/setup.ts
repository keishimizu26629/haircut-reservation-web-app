import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChanged: vi.fn()
}))

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $auth: {
      currentUser: null,
      onAuthStateChanged: vi.fn()
    }
  })),
  navigateTo: vi.fn(),
  useHead: vi.fn(),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      firebaseApiKey: 'test-api-key',
      firebaseAuthDomain: 'test-domain',
      firebaseProjectId: 'test-project',
      firebaseStorageBucket: 'test-bucket',
      firebaseMessagingSenderId: 'test-sender',
      firebaseAppId: 'test-app'
    }
  }))
}))

// Mock Pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  storeToRefs: vi.fn()
}))

// Global test setup
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})