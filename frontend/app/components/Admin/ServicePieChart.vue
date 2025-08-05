<template>
  <div class="service-pie-chart">
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
    </div>
    <div v-else class="text-center">
      <!-- Simple pie chart using CSS -->
      <div class="pie-chart-container">
        <div class="pie-chart" :style="pieChartStyle"></div>
      </div>

      <!-- Legend -->
      <div class="pie-legend mt-3">
        <div v-for="(item, index) in chartData" :key="index"
             class="legend-item d-flex align-items-center justify-content-between mb-2">
          <div class="d-flex align-items-center">
            <div class="legend-color me-2" :style="{ backgroundColor: colors[index] }"></div>
            <small>{{ item.name }}</small>
          </div>
          <small class="text-muted">{{ item.count }}件</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: Array<{ name: string; count: number }>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1']

const chartData = computed(() => {
  if (!props.data.length) {
    return [
      { name: 'カット', count: 45 },
      { name: 'カラー', count: 30 },
      { name: 'パーマ', count: 15 },
      { name: 'その他', count: 10 }
    ]
  }
  return props.data.slice(0, 5) // 最大5つまで表示
})

const total = computed(() =>
  chartData.value.reduce((sum, item) => sum + item.count, 0)
)

const pieChartStyle = computed(() => {
  if (!chartData.value.length) return {}

  let cumulativePercent = 0
  const gradientStops = chartData.value.map((item, index) => {
    const percent = (item.count / total.value) * 100
    const start = cumulativePercent
    const end = cumulativePercent + percent
    cumulativePercent = end

    return `${colors[index]} ${start}% ${end}%`
  }).join(', ')

  return {
    background: `conic-gradient(${gradientStops})`
  }
})
</script>

<style scoped>
.pie-chart-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.pie-chart {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  position: relative;
}

.pie-legend {
  max-width: 200px;
  margin: 0 auto;
}

.legend-item {
  padding: 0.25rem 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>
