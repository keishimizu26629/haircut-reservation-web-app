<template>
  <div class="system-status">
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
    </div>
    <div v-else>
      <div class="status-grid">
        <div v-for="(statusValue, service) in status" :key="service"
             class="status-item d-flex justify-content-between align-items-center py-2">
          <div class="d-flex align-items-center">
            <i :class="getStatusIcon(statusValue)" :style="{ color: getStatusColor(statusValue) }" class="me-2"></i>
            <span class="service-name">{{ getServiceName(service) }}</span>
          </div>
          <div>
            <span class="badge" :class="getStatusBadgeClass(statusValue)">
              {{ getStatusText(statusValue) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Overall status -->
      <div class="overall-status mt-3 pt-3 border-top">
        <div class="d-flex justify-content-between align-items-center">
          <strong>全体の状態</strong>
          <span class="badge" :class="getOverallStatusClass()">
            {{ getOverallStatusText() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: Record<string, string>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const getServiceName = (service: string) => {
  const nameMap: Record<string, string> = {
    'database': 'データベース',
    'auth': '認証',
    'functions': 'Functions',
    'storage': 'ストレージ',
    'firestore': 'Firestore',
    'hosting': 'ホスティング'
  }
  return nameMap[service] || service
}

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    'healthy': 'bi bi-check-circle-fill',
    'warning': 'bi bi-exclamation-triangle-fill',
    'error': 'bi bi-x-circle-fill',
    'maintenance': 'bi bi-gear-fill'
  }
  return iconMap[status] || 'bi bi-question-circle'
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'healthy': '#198754',
    'warning': '#ffc107',
    'error': '#dc3545',
    'maintenance': '#6c757d'
  }
  return colorMap[status] || '#6c757d'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'healthy': '正常',
    'warning': '警告',
    'error': 'エラー',
    'maintenance': 'メンテナンス中'
  }
  return textMap[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const classMap: Record<string, string> = {
    'healthy': 'bg-success',
    'warning': 'bg-warning',
    'error': 'bg-danger',
    'maintenance': 'bg-secondary'
  }
  return classMap[status] || 'bg-secondary'
}

const overallStatus = computed(() => {
  const statuses = Object.values(props.status)

  if (statuses.includes('error')) return 'error'
  if (statuses.includes('warning')) return 'warning'
  if (statuses.includes('maintenance')) return 'maintenance'
  if (statuses.every(s => s === 'healthy')) return 'healthy'

  return 'unknown'
})

const getOverallStatusClass = () => {
  return getStatusBadgeClass(overallStatus.value)
}

const getOverallStatusText = () => {
  return getStatusText(overallStatus.value)
}
</script>

<style scoped>
.status-item {
  border-bottom: 1px solid #f1f3f4;
}

.status-item:last-child {
  border-bottom: none;
}

.service-name {
  font-size: 0.875rem;
}

.overall-status {
  background-color: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
}
</style>
