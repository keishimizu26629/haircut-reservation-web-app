<template>
  <div class="stats-card">
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex align-items-center">
          <div class="flex-shrink-0">
            <div class="stats-icon" :class="`bg-${color}`">
              <i :class="`bi bi-${icon} text-white`"></i>
            </div>
          </div>
          <div class="flex-grow-1 ms-3">
            <div class="text-xs font-weight-bold text-uppercase mb-1" :class="`text-${color}`">
              {{ title }}
            </div>
            <div class="h5 mb-0 font-weight-bold text-gray-800">
              <div v-if="loading" class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">読み込み中...</span>
              </div>
              <span v-else>{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  icon: string
  color: 'primary' | 'success' | 'info' | 'warning' | 'danger'
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})
</script>

<style scoped>
.stats-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-xs {
  font-size: 0.75rem;
}

.card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease-in-out;
}
</style>
