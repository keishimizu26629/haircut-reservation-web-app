/**
 * 生成されるFirebase設定ファイルの型定義
 * ビルド時に生成されるため、型チェック時には存在しない可能性がある
 */

declare module '~/app/config/firebase-generated' {
  export interface GeneratedFirebaseConfig {
    projectId: string
    apiKey: string
    authDomain: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }

  export const FIREBASE_CONFIG: GeneratedFirebaseConfig
  export const ENVIRONMENT: string
  export const NODE_ENV: string
  export const IS_PRODUCTION: boolean
  export const FALLBACK_CONFIG: Record<string, Record<string, unknown>>
}

// デフォルトエクスポートも定義（存在しない場合に備えて）
declare module '~/app/config/firebase-generated' {
  const config: {
    FIREBASE_CONFIG?: GeneratedFirebaseConfig
    ENVIRONMENT?: string
    NODE_ENV?: string
    IS_PRODUCTION?: boolean
    FALLBACK_CONFIG?: Record<string, Record<string, unknown>>
  }
  export = config
}
