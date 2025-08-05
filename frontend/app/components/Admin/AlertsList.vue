<template>
  <div class="alerts-list">
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
    </div>
    <div v-else-if="!alerts.length" class="text-center p-4 text-muted">
      <i class="bi bi-check-circle mb-3 d-block text-success" style="font-size: 2rem;"></i>
      <p>新しいアラートはありません</p>
    </div>
    <div v-else>
      <div class="list-group list-group-flush">
        <div v-for="alert in alerts" :key="alert.id"
             class="list-group-item px-0 py-3 border-0 border-bottom">
          <div class="d-flex align-items-start">
            <div class="flex-shrink-0 me-3">
              <i :class="getAlertIcon(alert.type)" :style="{ color: getAlertColor(alert.type) }"></i>
            </div>
            <div class="flex-grow-1">
              <div class="alert-message mb-1">{{ alert.message }}</div>
              <small class="text-muted">
                <i class="bi bi-clock me-1"></i>
                {{ formatTime(alert.timestamp) }}
              </small>
            </div>
            <div class="flex-shrink-0">
              <button class="btn btn-sm btn-outline-secondary" @click="dismissAlert(alert.id)">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

interface Alert {
  id: string | number
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: Date | string
}

interface Props {
  alerts: Alert[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  dismiss: [id: string | number]
}>()

const getAlertIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'info': 'bi bi-info-circle-fill',
    'warning': 'bi bi-exclamation-triangle-fill',
    'error': 'bi bi-x-circle-fill',
    'success': 'bi bi-check-circle-fill'
  }
  return iconMap[type] || 'bi bi-info-circle-fill'
}

const getAlertColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'info': '#0dcaf0',
    'warning': '#ffc107',
    'error': '#dc3545',
    'success': '#198754'
  }
  return colorMap[type] || '#6c757d'
}

const formatTime = (timestamp: Date | string) => {
  return dayjs(timestamp).format('HH:mm')
}

const dismissAlert = (id: string | number) => {
  emit('dismiss', id)
}
</script>

<style scoped>
.alert-message {
  font-size: 0.875rem;
  line-height: 1.4;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>
