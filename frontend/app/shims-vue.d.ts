// Vue 3 + TypeScript型定義
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Nuxt 3グローバル型定義
declare global {
  // Nuxt Auto Import
  const useHead: typeof import('#app')['useHead']
  const useRoute: typeof import('#app')['useRoute']
  const useRouter: typeof import('#app')['useRouter']
  const navigateTo: typeof import('#app')['navigateTo']
  const useState: typeof import('#app')['useState']
  const useCookie: typeof import('#app')['useCookie']
  const useRuntimeConfig: typeof import('#app')['useRuntimeConfig']

  // Vue Auto Import
  const ref: typeof import('vue')['ref']
  const reactive: typeof import('vue')['reactive']
  const computed: typeof import('vue')['computed']
  const watch: typeof import('vue')['watch']
  const onMounted: typeof import('vue')['onMounted']
  const onUnmounted: typeof import('vue')['onUnmounted']
  const nextTick: typeof import('vue')['nextTick']

  // Pinia Auto Import
  const defineStore: typeof import('pinia')['defineStore']
  const storeToRefs: typeof import('pinia')['storeToRefs']

  // プロセス環境変数
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production'
    FIREBASE_ENV: 'local' | 'dev' | 'prod'
    FIREBASE_PROJECT_ID?: string
    FIREBASE_API_KEY?: string
    FIREBASE_AUTH_DOMAIN?: string
    FIREBASE_STORAGE_BUCKET?: string
    FIREBASE_MESSAGING_SENDER_ID?: string
    FIREBASE_APP_ID?: string
    FIREBASE_AUTH_EMULATOR_HOST?: string
    FIREBASE_FIRESTORE_EMULATOR_HOST?: string
  }
}

export {}
