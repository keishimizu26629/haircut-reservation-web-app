import { ref, computed } from 'vue'
import type { Reservation } from '~/types/booking'

interface ReservationState {
  reservations: Ref<Reservation[]>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export const useReservations = () => {
  const reservations = ref<Reservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 今日の予約を取得
  const todayReservations = computed(() => {
    const today = new Date().toDateString()
    return reservations.value.filter(reservation =>
      new Date(reservation.dateTime).toDateString() === today
    )
  })

  // 今週の予約を取得
  const weekReservations = computed(() => {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6))

    return reservations.value.filter(reservation => {
      const reservationDate = new Date(reservation.dateTime)
      return reservationDate >= weekStart && reservationDate <= weekEnd
    })
  })

  // 予約一覧を取得
  const fetchReservations = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/reservations')

      // モックデータ
      reservations.value = [
        {
          id: '1',
          customerId: 'customer1',
          customerName: '田中太郎',
          customerEmail: 'tanaka@example.com',
          customerPhone: '090-1234-5678',
          dateTime: new Date().toISOString(),
          serviceId: 'cut',
          serviceName: 'カット',
          stylistId: 'stylist1',
          stylistName: '佐藤美容師',
          duration: 60,
          price: 3000,
          status: 'confirmed',
          notes: '特になし',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    } catch (err: any) {
      error.value = err.message || '予約の取得に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 予約を作成
  const createReservation = async (reservationData: Partial<Reservation>) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/reservations', {
      //   method: 'POST',
      //   body: reservationData
      // })

      console.log('Creating reservation:', reservationData)
      await fetchReservations() // 再取得
    } catch (err: any) {
      error.value = err.message || '予約の作成に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 予約を更新
  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch(`/api/reservations/${id}`, {
      //   method: 'PUT',
      //   body: updates
      // })

      console.log('Updating reservation:', id, updates)
      await fetchReservations() // 再取得
    } catch (err: any) {
      error.value = err.message || '予約の更新に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 予約を削除
  const deleteReservation = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // await $fetch(`/api/reservations/${id}`, {
      //   method: 'DELETE'
      // })

      console.log('Deleting reservation:', id)
      await fetchReservations() // 再取得
    } catch (err: any) {
      error.value = err.message || '予約の削除に失敗しました'
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    reservations: readonly(reservations),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    todayReservations,
    weekReservations,

    // Actions
    fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation,

    // 新規追加: 統計データ取得
    getReservationStats: async () => {
      try {
        // TODO: 実際のAPI呼び出しに置き換える
        return {
          today: todayReservations.value.length,
          month: reservations.value.filter(r => {
            const reservationDate = new Date(r.dateTime)
            const now = new Date()
            return reservationDate.getMonth() === now.getMonth() &&
                   reservationDate.getFullYear() === now.getFullYear()
          }).length,
          monthRevenue: reservations.value
            .filter(r => {
              const reservationDate = new Date(r.dateTime)
              const now = new Date()
              return reservationDate.getMonth() === now.getMonth() &&
                     reservationDate.getFullYear() === now.getFullYear()
            })
            .reduce((sum, r) => sum + r.price, 0),
          pending: reservations.value.filter(r => r.status === 'pending').length
        }
      } catch (error) {
        console.error('予約統計の取得エラー:', error)
        return { today: 0, month: 0, monthRevenue: 0, pending: 0 }
      }
    },

    // 新規追加: 最近の予約取得
    getRecentReservations: async (limit: number = 5) => {
      try {
        // TODO: 実際のAPI呼び出しに置き換える
        await fetchReservations()
        return reservations.value
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      } catch (error) {
        console.error('最近の予約取得エラー:', error)
        return []
      }
    }
  }
}
