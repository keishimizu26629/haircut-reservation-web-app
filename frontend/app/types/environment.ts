/**
 * 環境設定関連の型定義
 */

export type Environment = 'local' | 'development' | 'production'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export interface EmulatorConfig {
  authHost?: string
  firestoreHost?: string
  databaseHost?: string
  storageHost?: string
  functionsHost?: string
}

export interface FeatureFlags {
  debugMode: boolean
  devtools: boolean
  mockData: boolean
  analytics: boolean
  errorReporting: boolean
  performanceMonitoring: boolean
}

export interface SecurityConfig {
  csp: boolean
  httpsRedirect: boolean
  hsts: boolean
}

export interface MultiTenantConfig {
  enabled: boolean
  defaultTenantId: string
}

export interface EnvironmentInfo {
  node: string
  nuxt: string
  firebase: Environment
  isLocal: boolean
  isDevelopment: boolean
  isProduction: boolean
}

export interface RuntimeConfiguration {
  nodeEnv: string
  nuxtEnv: string
  firebaseEnv: Environment
  firebaseConfig: FirebaseConfig
  firebaseEmulators: EmulatorConfig
  apiUrl: string
  multiTenant: MultiTenantConfig
  features: FeatureFlags
  security: SecurityConfig
  logging: {
    level: string
  }
}

export interface TenantInfo {
  id: string
  name: string
  settings: Record<string, any>
}

export interface EnvironmentSwitchEvent {
  from: Environment
  to: Environment
  timestamp: Date
}

export interface TenantSwitchEvent {
  from: string
  to: string
  timestamp: Date
}