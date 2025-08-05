<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <AdminHeader />

    <!-- Main Dashboard -->
    <div class="container-fluid py-4">
      <div class="row">
        <!-- Sidebar -->
        <div class="col-md-3 col-lg-2">
          <AdminSidebar :current-page="'dashboard'" />
        </div>

        <!-- Main Content -->
        <div class="col-md-9 col-lg-10">
          <!-- Welcome Section -->
          <div class="row mb-4">
            <div class="col-12">
              <div class="card bg-primary text-white">
                <div class="card-body">
                  <h2 class="card-title mb-1">
                    <i class="bi bi-speedometer2 me-2"></i>
                    管理ダッシュボード
                  </h2>
                  <p class="card-text mb-0">
                    {{ currentUser?.displayName }}さん、おかえりなさい
                  </p>
                  <small class="opacity-75">
                    最終ログイン: {{ formatDate(currentUser?.metadata?.lastSignInTime) }}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="row mb-4">
            <div class="col-md-3 mb-3">
              <StatsCard
                title="今日の予約"
                :value="stats.todayReservations"
                icon="calendar-check"
                color="success"
                :loading="statsLoading"
              />
            </div>
            <div class="col-md-3 mb-3">
              <StatsCard
                title="今月の予約"
                :value="stats.monthReservations"
                icon="calendar3"
                color="info"
                :loading="statsLoading"
              />
            </div>
            <div class="col-md-3 mb-3">
              <StatsCard
                title="総顧客数"
                :value="stats.totalCustomers"
                icon="people"
                color="warning"
                :loading="statsLoading"
              />
            </div>
            <div class="col-md-3 mb-3">
              <StatsCard
                title="今月の売上"
                :value="formatCurrency(stats.monthRevenue)"
                icon="currency-yen"
                color="primary"
                :loading="statsLoading"
              />
            </div>
          </div>

          <!-- Charts Row -->
          <div class="row mb-4">
            <div class="col-lg-8 mb-3">
              <div class="card">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-graph-up me-2"></i>
                    予約数推移 (7日間)
                  </h5>
                </div>
                <div class="card-body">
                  <ReservationChart :data="chartData.reservations" :loading="chartLoading" />
                </div>
              </div>
            </div>
            <div class="col-lg-4 mb-3">
              <div class="card">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-pie-chart me-2"></i>
                    サービス別予約
                  </h5>
                </div>
                <div class="card-body">
                  <ServicePieChart :data="chartData.services" :loading="chartLoading" />
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="row mb-4">
            <div class="col-lg-8 mb-3">
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-clock-history me-2"></i>
                    最近の予約
                  </h5>
                  <NuxtLink to="/admin/reservations" class="btn btn-sm btn-outline-primary">
                    全て見る
                  </NuxtLink>
                </div>
                <div class="card-body p-0">
                  <RecentReservations :reservations="recentReservations" :loading="dataLoading" />
                </div>
              </div>
            </div>
            <div class="col-lg-4 mb-3">
              <div class="card">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    通知・アラート
                  </h5>
                </div>
                <div class="card-body">
                  <AlertsList :alerts="alerts" :loading="dataLoading" />
                </div>
              </div>
            </div>
          </div>

          <!-- Firebase Environment Switcher -->
          <div class="row mb-4">
            <div class="col-lg-6 mb-3">
              <div class="card">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-server me-2"></i>
                    Firebase環境設定
                  </h5>
                </div>
                <div class="card-body">
                  <AdminEnvironmentSwitcher />
                </div>
              </div>
            </div>
            <div class="col-lg-6 mb-3">
              <div class="card">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-shield-check me-2"></i>
                    システム状態
                  </h5>
                </div>
                <div class="card-body">
                  <SystemStatus :status="systemStatus" :loading="systemLoading" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useReservations } from '../../composables/useReservations'
import { useCustomers } from '../../composables/useCustomers'
import { useAnalytics } from '../../composables/useAnalytics'
import dayjs from 'dayjs'

// Meta
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin-only']
})

// Composables
const { currentUser } = useAuth()
const { getReservationStats, getRecentReservations } = useReservations()
const { getCustomerStats } = useCustomers()
const { getReservationChart, getServiceChart } = useAnalytics()

// Reactive data
const statsLoading = ref(true)
const chartLoading = ref(true)
const dataLoading = ref(true)
const systemLoading = ref(true)

const stats = ref({
  todayReservations: 0,
  monthReservations: 0,
  totalCustomers: 0,
  monthRevenue: 0
})

const chartData = ref({
  reservations: [],
  services: []
})

const recentReservations = ref([])
const alerts = ref([])
const systemStatus = ref({
  database: 'healthy',
  auth: 'healthy',
  functions: 'healthy',
  storage: 'healthy'
})

// Nuxtアプリインスタンスを取得（オプショナルチェーンで安全に）
const nuxtApp = useNuxtApp()
const $trackError = nuxtApp?.$trackError
const $trackPageView = nuxtApp?.$trackPageView

// Methods
const loadStats = async () => {
  try {
    statsLoading.value = true
    const [reservationStats, customerStats] = await Promise.all([
      getReservationStats(),
      getCustomerStats()
    ])

    stats.value = {
      todayReservations: reservationStats.today,
      monthReservations: reservationStats.month,
      totalCustomers: customerStats.total,
      monthRevenue: reservationStats.monthRevenue
    }
  } catch (error) {
    console.error('統計データの読み込みエラー:', error)
    // トラック分析エラー
    if ($trackError) {
      $trackError(error, 'admin_dashboard_stats')
    }
  } finally {
    statsLoading.value = false
  }
}

const loadChartData = async () => {
  try {
    chartLoading.value = true
    const [reservationChart, serviceChart] = await Promise.all([
      getReservationChart(7), // 7日間
      getServiceChart()
    ])

    chartData.value = {
      reservations: reservationChart,
      services: serviceChart
    }
  } catch (error) {
    console.error('チャートデータの読み込みエラー:', error)
    if ($trackError) {
      $trackError(error, 'admin_dashboard_charts')
    }
  } finally {
    chartLoading.value = false
  }
}

const loadRecentData = async () => {
  try {
    dataLoading.value = true
    const [recent, systemAlerts] = await Promise.all([
      getRecentReservations(5),
      getSystemAlerts()
    ])

    recentReservations.value = recent
    alerts.value = systemAlerts
  } catch (error) {
    console.error('最近のデータの読み込みエラー:', error)
    if ($trackError) {
      $trackError(error, 'admin_dashboard_recent')
    }
  } finally {
    dataLoading.value = false
  }
}

const loadSystemStatus = async () => {
  try {
    systemLoading.value = true
    const status = await getSystemStatus()
    systemStatus.value = status
  } catch (error) {
    console.error('システム状態の読み込みエラー:', error)
    if ($trackError) {
      $trackError(error, 'admin_dashboard_system')
    }
  } finally {
    systemLoading.value = false
  }
}

const getSystemAlerts = async () => {
  // システムアラートの取得ロジック
  return [
    {
      id: 1,
      type: 'warning',
      message: 'データベース接続が一時的に遅延しています',
      timestamp: new Date()
    }
  ]
}

const getSystemStatus = async () => {
  // システム状態チェックロジック
  return {
    database: 'healthy',
    auth: 'healthy',
    functions: 'healthy',
    storage: 'healthy'
  }
}

// Utility functions
const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  return dayjs(date).format('YYYY/MM/DD HH:mm')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

// Lifecycle
onMounted(async () => {
  // 並列でデータを読み込み
  await Promise.all([
    loadStats(),
    loadChartData(),
    loadRecentData(),
    loadSystemStatus()
  ])

  // ページビューの追跡
  if ($trackPageView) {
    $trackPageView('admin_dashboard')
  }
})

// Auto-refresh setup (client-side only)
let intervalId: NodeJS.Timeout | null = null

const setupAutoRefresh = () => {
  if (process.client) {
    intervalId = setInterval(() => {
      loadStats()
      loadRecentData()
      loadSystemStatus()
    }, 5 * 60 * 1000)
  }
}

onMounted(() => {
  setupAutoRefresh()
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: box-shadow 0.15s ease-in-out;
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-header {
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
}

@media (max-width: 768px) {
  .col-md-3 {
    margin-bottom: 1rem;
  }

  .card-body {
    padding: 1rem;
  }
}
</style>
