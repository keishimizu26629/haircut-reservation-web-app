import { ref, computed } from 'vue'

interface AnalyticsData {
  totalRevenue: number
  totalBookings: number
  totalCustomers: number
  averageBookingValue: number
  monthlyRevenue: number[]
  monthlyBookings: number[]
  popularServices: Array<{
    name: string
    count: number
    revenue: number
  }>
  peakHours: Array<{
    hour: number
    bookings: number
  }>
}

export const useAnalytics = () => {
  const analytics = ref<AnalyticsData>({
    totalRevenue: 0,
    totalBookings: 0,
    totalCustomers: 0,
    averageBookingValue: 0,
    monthlyRevenue: [],
    monthlyBookings: [],
    popularServices: [],
    peakHours: []
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // 今月の統計
  const thisMonthStats = computed(() => {
    const currentMonth = new Date().getMonth()
    return {
      revenue: analytics.value.monthlyRevenue[currentMonth] || 0,
      bookings: analytics.value.monthlyBookings[currentMonth] || 0
    }
  })

  // 前月比成長率
  const growthRate = computed(() => {
    const currentMonth = new Date().getMonth()
    const thisMonth = analytics.value.monthlyRevenue[currentMonth] || 0
    const lastMonth = analytics.value.monthlyRevenue[currentMonth - 1] || 1

    return ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)
  })

  // 人気サービストップ3
  const topServices = computed(() => {
    return analytics.value.popularServices
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  })

  // 分析データを取得
  const fetchAnalytics = async (period: 'week' | 'month' | 'year' = 'month') => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch(`/api/analytics?period=${period}`)

      // モックデータ
      analytics.value = {
        totalRevenue: 1250000,
        totalBookings: 342,
        totalCustomers: 156,
        averageBookingValue: 3650,
        monthlyRevenue: [
          980000, 1050000, 1120000, 1180000, 1220000, 1250000,
          1300000, 1280000, 1350000, 1400000, 1380000, 1450000
        ],
        monthlyBookings: [
          28, 32, 35, 38, 34, 42,
          45, 41, 48, 52, 49, 55
        ],
        popularServices: [
          { name: 'カット', count: 120, revenue: 360000 },
          { name: 'カラー', count: 85, revenue: 425000 },
          { name: 'パーマ', count: 45, revenue: 315000 },
          { name: 'トリートメント', count: 60, revenue: 180000 },
          { name: 'ヘッドスパ', count: 32, revenue: 128000 }
        ],
        peakHours: [
          { hour: 9, bookings: 5 },
          { hour: 10, bookings: 12 },
          { hour: 11, bookings: 18 },
          { hour: 12, bookings: 15 },
          { hour: 13, bookings: 20 },
          { hour: 14, bookings: 25 },
          { hour: 15, bookings: 22 },
          { hour: 16, bookings: 18 },
          { hour: 17, bookings: 15 },
          { hour: 18, bookings: 12 },
          { hour: 19, bookings: 8 },
          { hour: 20, bookings: 3 }
        ]
      }
    } catch (err: any) {
      error.value = err.message || '分析データの取得に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 売上レポートを生成
  const generateSalesReport = async (startDate: Date, endDate: Date) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/analytics/sales-report', {
      //   method: 'POST',
      //   body: { startDate, endDate }
      // })

      console.log('Generating sales report:', { startDate, endDate })

      return {
        totalSales: 450000,
        totalBookings: 125,
        averageTicket: 3600,
        topServices: [
          { name: 'カット', sales: 180000 },
          { name: 'カラー', sales: 150000 }
        ]
      }
    } catch (err: any) {
      error.value = err.message || 'レポート生成に失敗しました'
      return null
    } finally {
      loading.value = false
    }
  }

  // 顧客分析を取得
  const getCustomerAnalytics = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/analytics/customers')

      return {
        newCustomers: 25,
        returningCustomers: 131,
        retentionRate: 84.5,
        averageVisitsPerCustomer: 2.2
      }
    } catch (err: any) {
      error.value = err.message || '顧客分析の取得に失敗しました'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    analytics: readonly(analytics),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    thisMonthStats,
    growthRate,
    topServices,

    // Actions
    fetchAnalytics,
    generateSalesReport,
    getCustomerAnalytics,

    // 新規追加: チャートデータ取得
    getReservationChart: async (days: number = 7) => {
      try {
        // TODO: 実際のAPI呼び出しに置き換える
        const data = []
        const today = new Date()

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          data.push({
            date: date.toISOString(),
            count: Math.floor(Math.random() * 20) + 5 // ランダムデータ
          })
        }

        return data
      } catch (error) {
        console.error('予約チャートデータの取得エラー:', error)
        return []
      }
    },

    // 新規追加: サービス別チャートデータ取得
    getServiceChart: async () => {
      try {
        // TODO: 実際のAPI呼び出しに置き換える
        return [
          { name: 'カット', count: 45 },
          { name: 'カラー', count: 30 },
          { name: 'パーマ', count: 20 },
          { name: 'トリートメント', count: 15 },
          { name: 'ヘッドスパ', count: 10 }
        ]
      } catch (error) {
        console.error('サービスチャートデータの取得エラー:', error)
        return []
      }
    }
  }
}
