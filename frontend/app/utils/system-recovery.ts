/**
 * システム復旧ユーティリティ
 * Firebase重複初期化エラーの自動検出・復旧・予防システム
 */

import { deleteApp, getApps } from 'firebase/app'

// 型定義の拡張
interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface WindowWithDevtools extends Window {
  __VUE_DEVTOOLS_GLOBAL_HOOK__?: {
    emit: (event: string) => void
  }
  gc?: () => void
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory
}

interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'recovering'
  timestamp: string
  issues: string[]
  metrics: {
    firebaseApps: number
    memoryUsage: number
    errorCount: number
    responseTime: number
  }
}

interface RecoveryAction {
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  execute: () => Promise<boolean>
}

export class SystemRecoveryManager {
  private static instance: SystemRecoveryManager
  private healthHistory: SystemHealthStatus[] = []
  private errorLog: Array<{ timestamp: string; error: string; context?: unknown }> = []
  private recoveryInProgress = false
  private monitoringInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): SystemRecoveryManager {
    if (!SystemRecoveryManager.instance) {
      SystemRecoveryManager.instance = new SystemRecoveryManager()
    }
    return SystemRecoveryManager.instance
  }

  /**
   * システムヘルスチェック
   */
  async performHealthCheck(): Promise<SystemHealthStatus> {
    const startTime = performance.now()
    const issues: string[] = []

    // Firebase Apps チェック
    const firebaseApps = getApps()
    if (firebaseApps.length === 0) {
      issues.push('No Firebase apps initialized')
    } else if (firebaseApps.length > 1) {
      issues.push(`Multiple Firebase apps detected: ${firebaseApps.length}`)
    }

    // メモリ使用量チェック
    let memoryUsage = 0
    if (import.meta.client && (performance as PerformanceWithMemory).memory) {
      memoryUsage = (performance as PerformanceWithMemory).memory!.usedJSHeapSize
      if (memoryUsage > 100 * 1024 * 1024) {
        // 100MB
        issues.push('High memory usage detected')
      }
    }

    // DOM状態チェック
    if (import.meta.client) {
      const errorElements = document.querySelectorAll('.error, [data-error]')
      if (errorElements.length > 0) {
        issues.push(`${errorElements.length} error elements found in DOM`)
      }

      // Firebase重複初期化エラーチェック
      const firebaseErrors = this.errorLog.filter(
        log =>
          log.error.includes('Firebase') &&
          (log.error.includes('already initialized') || log.error.includes('duplicate'))
      ).length

      if (firebaseErrors > 0) {
        issues.push('Firebase initialization conflicts detected')
      }
    }

    const responseTime = performance.now() - startTime

    // ステータス判定
    let status: SystemHealthStatus['status'] = 'healthy'
    if (this.recoveryInProgress) {
      status = 'recovering'
    } else if (issues.some(issue => issue.includes('critical') || issue.includes('Firebase'))) {
      status = 'critical'
    } else if (issues.length > 2) {
      status = 'warning'
    }

    const healthStatus: SystemHealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      issues,
      metrics: {
        firebaseApps: firebaseApps.length,
        memoryUsage,
        errorCount: this.errorLog.length,
        responseTime
      }
    }

    // 履歴に保存（最新50件まで）
    this.healthHistory.push(healthStatus)
    if (this.healthHistory.length > 50) {
      this.healthHistory = this.healthHistory.slice(-50)
    }

    return healthStatus
  }

  /**
   * Firebase重複初期化の検出・修正
   */
  async detectAndFixFirebaseDuplication(): Promise<boolean> {
    try {
      const apps = getApps()

      if (apps.length <= 1) {
        return true // 問題なし
      }

      console.warn(`🚨 Multiple Firebase apps detected: ${apps.length}`)

      // 重複アプリの削除（デフォルト以外）
      for (let i = 1; i < apps.length; i++) {
        const app = apps[i]
        if (!app) continue
        try {
          await deleteApp(app)
          console.log(`✅ Removed duplicate Firebase app: ${app.name}`)
        } catch (error) {
          console.error(`❌ Failed to remove Firebase app ${app.name}:`, error)
        }
      }

      // 削除後の確認
      const remainingApps = getApps()
      const success = remainingApps.length === 1

      if (success) {
        console.log('✅ Firebase duplication resolved')
      } else {
        console.error('❌ Firebase duplication partially resolved')
      }

      return success
    } catch (error) {
      console.error('❌ Firebase duplication fix failed:', error)
      this.logError('Firebase duplication fix failed', error)
      return false
    }
  }

  /**
   * メモリリーク検出・クリーンアップ
   */
  async detectAndFixMemoryLeaks(): Promise<boolean> {
    if (!import.meta.client || !(performance as PerformanceWithMemory).memory) {
      return true
    }

    try {
      const memoryInfo = (performance as PerformanceWithMemory).memory!
      const memoryUsage = memoryInfo.usedJSHeapSize
      const memoryLimit = memoryInfo.jsHeapSizeLimit
      const memoryRatio = memoryUsage / memoryLimit

      if (memoryRatio > 0.8) {
        console.warn('🚨 High memory usage detected, attempting cleanup...')

        // キャッシュクリア
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
        }

        // 不要なイベントリスナー削除
        const elements = document.querySelectorAll('[data-cleanup]')
        elements.forEach(el => {
          el.removeAttribute('data-cleanup')
        })

        // Vue/Nuxtコンポーネントの強制ガベージコレクション
        const devtools = (window as WindowWithDevtools).__VUE_DEVTOOLS_GLOBAL_HOOK__
        if (devtools) {
          devtools.emit('flush')
        }

        // 強制ガベージコレクション（開発環境のみ）
        const gc = (window as WindowWithDevtools).gc
        if (gc) {
          gc()
        }

        console.log('✅ Memory cleanup completed')
        return true
      }

      return true
    } catch (error) {
      console.error('❌ Memory leak fix failed:', error)
      this.logError('Memory leak fix failed', error)
      return false
    }
  }

  /**
   * DOM状態の修正
   */
  async fixDOMIssues(): Promise<boolean> {
    if (!import.meta.client) return true

    try {
      // エラー要素の除去
      const errorElements = document.querySelectorAll('.error:not(.permanent)')
      errorElements.forEach(el => el.remove())

      // 重複ID要素の修正
      const allElements = document.querySelectorAll('[id]')
      const idCounts = new Map<string, number>()

      allElements.forEach(el => {
        const id = el.id
        idCounts.set(id, (idCounts.get(id) || 0) + 1)

        if (idCounts.get(id)! > 1) {
          el.id = `${id}-${idCounts.get(id)}`
        }
      })

      // 孤立したモーダルの除去
      const orphanedModals = document.querySelectorAll('.modal-backdrop:not([data-active])')
      orphanedModals.forEach(modal => modal.remove())

      console.log('✅ DOM issues resolved')
      return true
    } catch (error) {
      console.error('❌ DOM fix failed:', error)
      this.logError('DOM fix failed', error)
      return false
    }
  }

  /**
   * 自動復旧の実行
   */
  async performAutoRecovery(): Promise<boolean> {
    if (this.recoveryInProgress) {
      console.log('🔄 Recovery already in progress')
      return false
    }

    this.recoveryInProgress = true
    console.log('🚀 Starting system auto-recovery...')

    const recoveryActions: RecoveryAction[] = [
      {
        name: 'Firebase Duplication Fix',
        description: 'Resolve Firebase app duplication',
        severity: 'critical',
        execute: () => this.detectAndFixFirebaseDuplication()
      },
      {
        name: 'DOM Issues Fix',
        description: 'Clean up DOM inconsistencies',
        severity: 'medium',
        execute: () => this.fixDOMIssues()
      },
      {
        name: 'Memory Cleanup',
        description: 'Free up memory and clear caches',
        severity: 'high',
        execute: () => this.detectAndFixMemoryLeaks()
      }
    ]

    const results: { action: string; success: boolean }[] = []

    for (const action of recoveryActions) {
      try {
        console.log(`🔧 Executing: ${action.name}`)
        const success = await action.execute()
        results.push({ action: action.name, success })

        if (success) {
          console.log(`✅ ${action.name} completed successfully`)
        } else {
          console.warn(`⚠️ ${action.name} completed with issues`)
        }
      } catch (error) {
        console.error(`❌ ${action.name} failed:`, error)
        results.push({ action: action.name, success: false })
        this.logError(`Recovery action failed: ${action.name}`, error)
      }
    }

    this.recoveryInProgress = false

    const successCount = results.filter(r => r.success).length
    const totalActions = results.length

    console.log(`🎯 Recovery completed: ${successCount}/${totalActions} actions successful`)

    return successCount === totalActions
  }

  /**
   * 継続的な監視の開始
   */
  startContinuousMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(async () => {
      const health = await this.performHealthCheck()

      if (health.status === 'critical') {
        console.warn('🚨 Critical system issues detected, attempting auto-recovery...')
        await this.performAutoRecovery()
      } else if (health.status === 'warning') {
        console.warn('⚠️ System warnings detected:', health.issues)
      }
    }, intervalMs)

    console.log(`📊 Continuous monitoring started (interval: ${intervalMs}ms)`)
  }

  /**
   * 監視の停止
   */
  stopContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('📊 Continuous monitoring stopped')
    }
  }

  /**
   * エラーログの記録
   */
  logError(error: string, context?: unknown): void {
    this.errorLog.push({
      timestamp: new Date().toISOString(),
      error,
      context
    })

    // ログサイズ制限（最新100件まで）
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }
  }

  /**
   * システム状態の取得
   */
  getSystemState(): {
    health: SystemHealthStatus | undefined
    errors: Array<{ timestamp: string; error: string; context?: unknown }>
    recoveryInProgress: boolean
    monitoring: boolean
  } {
    return {
      health: this.healthHistory.slice(-1)[0],
      errors: this.errorLog.slice(-10), // 最新10件
      recoveryInProgress: this.recoveryInProgress,
      monitoring: !!this.monitoringInterval
    }
  }

  /**
   * 緊急シャットダウン
   */
  async emergencyShutdown(): Promise<void> {
    console.warn('🚨 Performing emergency system shutdown...')

    try {
      // 監視停止
      this.stopContinuousMonitoring()

      // Firebase Apps削除
      const apps = getApps()
      await Promise.all(apps.map(app => deleteApp(app).catch(() => {})))

      // キャッシュクリア
      if (import.meta.client && 'caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }

      console.log('✅ Emergency shutdown completed')
    } catch (error) {
      console.error('❌ Emergency shutdown failed:', error)
    }
  }
}

// グローバルインスタンス
export const systemRecovery = SystemRecoveryManager.getInstance()

// 自動初期化（クライアント側のみ）
if (import.meta.client) {
  // 開発環境では継続監視を有効化
  if (import.meta.env.NODE_ENV === 'development') {
    systemRecovery.startContinuousMonitoring(30000) // 30秒間隔
  }

  // 重要なエラーをキャッチ
  window.addEventListener('error', event => {
    systemRecovery.logError(`Global error: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  window.addEventListener('unhandledrejection', event => {
    systemRecovery.logError(`Unhandled promise rejection: ${event.reason}`)
  })
}
