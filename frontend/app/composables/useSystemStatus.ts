import { ref, computed, readonly } from 'vue'

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error'
  firebase: 'healthy' | 'warning' | 'error'
  api: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
}

interface SystemMetrics {
  uptime: number
  responseTime: number
  errorRate: number
  activeUsers: number
  memoryUsage: number
  cpuUsage: number
}

export const useSystemStatus = () => {
  const health = ref<SystemHealth>({
    database: 'healthy',
    firebase: 'healthy',
    api: 'healthy',
    storage: 'healthy'
  })

  const metrics = ref<SystemMetrics>({
    uptime: 0,
    responseTime: 0,
    errorRate: 0,
    activeUsers: 0,
    memoryUsage: 0,
    cpuUsage: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 全体的なシステム状態
  const overallStatus = computed(() => {
    const statuses = Object.values(health.value)

    if (statuses.includes('error')) return 'error'
    if (statuses.includes('warning')) return 'warning'
    return 'healthy'
  })

  // ステータスの色
  const statusColor = computed(() => {
    switch (overallStatus.value) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'danger'
      default: return 'secondary'
    }
  })

  // ステータスのアイコン
  const statusIcon = computed(() => {
    switch (overallStatus.value) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '❓'
    }
  })

  // システム状態を取得
  const fetchSystemStatus = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/system/health')

      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 500)) // 遅延をシミュレート

      health.value = {
        database: 'healthy',
        firebase: 'healthy',
        api: 'healthy',
        storage: 'warning' // 例：ストレージに軽微な問題
      }

      metrics.value = {
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1,
        activeUsers: 42,
        memoryUsage: 65.5,
        cpuUsage: 23.8
      }

      lastUpdated.value = new Date()
    } catch (err: any) {
      error.value = err.message || 'システム状態の取得に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // システムメトリクスを取得
  const fetchMetrics = async () => {
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/system/metrics')

      // モックデータ（リアルタイム更新をシミュレート）
      metrics.value = {
        uptime: 99.9,
        responseTime: Math.floor(Math.random() * 50) + 100, // 100-150ms
        errorRate: Math.random() * 0.5, // 0-0.5%
        activeUsers: Math.floor(Math.random() * 20) + 30, // 30-50人
        memoryUsage: Math.random() * 20 + 60, // 60-80%
        cpuUsage: Math.random() * 30 + 15 // 15-45%
      }
    } catch (err: any) {
      console.error('メトリクス取得エラー:', err)
    }
  }

  // システムの再起動
  const restartSystem = async (service?: keyof SystemHealth) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // await $fetch('/api/system/restart', {
      //   method: 'POST',
      //   body: { service }
      // })

      console.log(`システム再起動: ${service || 'all'}`)

      // 再起動後は状態を再取得
      await fetchSystemStatus()
    } catch (err: any) {
      error.value = err.message || 'システム再起動に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // アラートの確認
  const acknowledgeAlert = async (alertId: string) => {
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // await $fetch(`/api/system/alerts/${alertId}/acknowledge`, {
      //   method: 'POST'
      // })

      console.log(`アラート確認: ${alertId}`)
    } catch (err: any) {
      error.value = err.message || 'アラート確認に失敗しました'
    }
  }

  // システムログの取得
  const getSystemLogs = async (level: 'info' | 'warn' | 'error' = 'info', limit = 100) => {
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch(`/api/system/logs?level=${level}&limit=${limit}`)

      // モックデータ
      return [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'システム正常稼働中',
          service: 'api'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          level: 'warn',
          message: 'ストレージ使用量が80%を超えました',
          service: 'storage'
        }
      ]
    } catch (err: any) {
      error.value = err.message || 'システムログの取得に失敗しました'
      return []
    }
  }

  // 定期的な状態更新
  const startMonitoring = (intervalMs = 30000) => {
    fetchSystemStatus()

    const interval = setInterval(() => {
      fetchMetrics()
    }, intervalMs)

    return () => clearInterval(interval)
  }

  return {
    // State
    health: readonly(health),
    metrics: readonly(metrics),
    loading: readonly(loading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),

    // Computed
    overallStatus,
    statusColor,
    statusIcon,

    // Actions
    fetchSystemStatus,
    fetchMetrics,
    restartSystem,
    acknowledgeAlert,
    getSystemLogs,
    startMonitoring
  }
}
