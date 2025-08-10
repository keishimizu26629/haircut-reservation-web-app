/**
 * 環境設定バリデーター
 * 環境設定の妥当性をチェック
 */

import type { EmulatorConfig, Environment, FirebaseConfig } from '../types/environment'

export class EnvironmentValidator {
  /**
   * Firebase設定の妥当性をチェック
   */
  static validateFirebaseConfig(config: FirebaseConfig): boolean {
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ]

    return requiredFields.every(field => {
      const value = config[field as keyof FirebaseConfig]
      return value && typeof value === 'string' && value.trim() !== ''
    })
  }

  /**
   * エミュレーター設定の妥当性をチェック
   */
  static validateEmulatorConfig(config: EmulatorConfig): boolean {
    const hostPattern = /^[a-zA-Z0-9.-]+:\d+$/

    // ホスト形式のチェック（設定されている場合のみ）
    const hosts = [
      config.authHost,
      config.firestoreHost,
      config.databaseHost,
      config.storageHost,
      config.functionsHost
    ].filter(Boolean)

    return hosts.every(host => hostPattern.test(host!))
  }

  /**
   * 環境の一貫性をチェック
   */
  static validateEnvironmentConsistency(
    nodeEnv: string,
    nuxtEnv: string,
    firebaseEnv: Environment
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []
    let valid = true

    // NODE_ENV と FIREBASE_ENV の一貫性チェック
    if (nodeEnv === 'production' && firebaseEnv !== 'production') {
      warnings.push('Production NODE_ENV but non-production Firebase environment')
      valid = false
    }

    // 開発環境でのセキュリティ警告
    if (firebaseEnv === 'local' && nodeEnv === 'production') {
      warnings.push('Local Firebase environment in production NODE_ENV')
      valid = false
    }

    // NUXT_ENV の妥当性チェック
    const validNuxtEnvs = ['local', 'development', 'production']
    if (!validNuxtEnvs.includes(nuxtEnv)) {
      warnings.push(`Invalid NUXT_ENV: ${nuxtEnv}`)
      valid = false
    }

    return { valid, warnings }
  }

  /**
   * エミュレーター接続性をチェック
   */
  static async checkEmulatorConnectivity(config: EmulatorConfig): Promise<{
    connected: boolean
    services: Record<string, boolean>
  }> {
    const services: Record<string, boolean> = {}

    const checkService = async (_name: string, host?: string): Promise<boolean> => {
      if (!host) return false

      try {
        const response = await fetch(`http://${host}`, {
          method: 'GET',
          timeout: 3000
        } as any)
        return response.status < 500
      } catch {
        return false
      }
    }

    // 各サービスの接続チェック
    services.auth = await checkService('auth', config.authHost)
    services.firestore = await checkService('firestore', config.firestoreHost)
    services.database = await checkService('database', config.databaseHost)
    services.storage = await checkService('storage', config.storageHost)
    services.functions = await checkService('functions', config.functionsHost)

    const connected = Object.values(services).some(Boolean)

    return { connected, services }
  }

  /**
   * 本番環境のセキュリティ設定をチェック
   */
  static validateProductionSecurity(
    environment: Environment,
    config: any
  ): {
    secure: boolean
    issues: string[]
  } {
    const issues: string[] = []
    let secure = true

    if (environment === 'production') {
      // HTTPS リダイレクトチェック
      if (!config.security?.httpsRedirect) {
        issues.push('HTTPS redirect not enabled in production')
        secure = false
      }

      // HSTS チェック
      if (!config.security?.hsts) {
        issues.push('HSTS not enabled in production')
        secure = false
      }

      // CSP チェック
      if (!config.security?.csp) {
        issues.push('Content Security Policy not enabled in production')
        secure = false
      }

      // デバッグモードチェック
      if (config.features?.debugMode) {
        issues.push('Debug mode enabled in production')
        secure = false
      }

      // モックデータチェック
      if (config.features?.mockData) {
        issues.push('Mock data enabled in production')
        secure = false
      }
    }

    return { secure, issues }
  }

  /**
   * 総合的な環境バリデーション
   */
  static async validateEnvironment(config: any): Promise<{
    valid: boolean
    warnings: string[]
    errors: string[]
    securityIssues: string[]
  }> {
    const warnings: string[] = []
    const errors: string[] = []
    const securityIssues: string[] = []

    try {
      // Firebase設定チェック
      if (!this.validateFirebaseConfig(config.firebaseConfig)) {
        errors.push('Invalid Firebase configuration')
      }

      // エミュレーター設定チェック（ローカル環境の場合）
      if (config.firebaseEnv === 'local') {
        if (!this.validateEmulatorConfig(config.firebaseEmulators)) {
          errors.push('Invalid emulator configuration')
        }
      }

      // 環境一貫性チェック
      const consistency = this.validateEnvironmentConsistency(
        config.nodeEnv,
        config.nuxtEnv,
        config.firebaseEnv
      )
      warnings.push(...consistency.warnings)

      // セキュリティチェック
      const security = this.validateProductionSecurity(config.firebaseEnv, config)
      securityIssues.push(...security.issues)

      // エミュレーター接続チェック（ローカル環境の場合）
      if (config.firebaseEnv === 'local' && process.client) {
        const connectivity = await this.checkEmulatorConnectivity(config.firebaseEmulators)
        if (!connectivity.connected) {
          warnings.push('Firebase emulators are not running')
        }
      }
    } catch (error) {
      errors.push(`Validation error: ${error}`)
    }

    const valid = errors.length === 0 && securityIssues.length === 0

    return {
      valid,
      warnings,
      errors,
      securityIssues
    }
  }
}
