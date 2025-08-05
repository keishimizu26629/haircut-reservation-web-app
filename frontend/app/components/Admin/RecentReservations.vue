<template>
  <div class="recent-reservations">
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
    </div>
    <div v-else-if="!reservations.length" class="text-center p-4 text-muted">
      <i class="bi bi-calendar-x mb-3 d-block" style="font-size: 2rem;"></i>
      <p>最近の予約がありません</p>
    </div>
    <div v-else>
      <div class="list-group list-group-flush">
        <div v-for="reservation in reservations" :key="reservation.id"
             class="list-group-item px-3 py-3 border-0 border-bottom">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
              <div class="reservation-avatar">
                <i class="bi bi-person-circle text-primary" style="font-size: 2rem;"></i>
              </div>
            </div>
            <div class="flex-grow-1 ms-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="mb-1">{{ reservation.customerName }}</h6>
                  <p class="mb-1 text-muted small">{{ reservation.serviceName }}</p>
                  <small class="text-muted">
                    <i class="bi bi-clock me-1"></i>
                    {{ formatDateTime(reservation.dateTime) }}
                  </small>
                </div>
                <div class="text-end">
                  <span class="badge" :class="getStatusBadgeClass(reservation.status)">
                    {{ getStatusText(reservation.status) }}
                  </span>
                  <div class="text-muted small mt-1">
                    ¥{{ reservation.price.toLocaleString() }}
                  </div>
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
import dayjs from 'dayjs'

interface Reservation {
  id: string
  customerName: string
  serviceName: string
  dateTime: string
  status: string
  price: number
}

interface Props {
  reservations: Reservation[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const formatDateTime = (dateTime: string) => {
  return dayjs(dateTime).format('MM/DD HH:mm')
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'confirmed': '確定',
    'pending': '保留中',
    'cancelled': 'キャンセル',
    'completed': '完了'
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const classMap: Record<string, string> = {
    'confirmed': 'bg-success',
    'pending': 'bg-warning',
    'cancelled': 'bg-danger',
    'completed': 'bg-secondary'
  }
  return classMap[status] || 'bg-secondary'
}
</script>

<style scoped>
.reservation-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>
