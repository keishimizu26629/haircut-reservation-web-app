<template>
  <div class="reservation-chart">
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
    </div>
    <div v-else>
      <!-- シンプルなSVGチャート -->
      <svg width="100%" height="300" viewBox="0 0 800 300" class="chart-svg">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#0d6efd;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#0d6efd;stop-opacity:0" />
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        <g class="grid">
          <line v-for="i in 5" :key="`h-${i}`"
                :x1="60" :y1="i * 50 + 20"
                :x2="760" :y2="i * 50 + 20"
                stroke="#e9ecef" stroke-width="1"/>
          <line v-for="i in 7" :key="`v-${i}`"
                :x1="i * 100 + 60" :y1="20"
                :x2="i * 100 + 60" :y2="270"
                stroke="#e9ecef" stroke-width="1"/>
        </g>

        <!-- Chart line -->
        <polyline
          :points="chartPoints"
          fill="url(#chartGradient)"
          stroke="#0d6efd"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Data points -->
        <circle v-for="(point, index) in dataPoints" :key="index"
                :cx="point.x" :cy="point.y" r="4"
                fill="#0d6efd" stroke="#fff" stroke-width="2"/>

        <!-- Labels -->
        <g class="labels">
          <text v-for="(label, index) in chartLabels" :key="index"
                :x="index * 100 + 110" :y="290"
                text-anchor="middle" class="chart-label">
            {{ label }}
          </text>
        </g>
      </svg>

      <!-- Legend -->
      <div class="chart-legend mt-3">
        <small class="text-muted">
          <i class="bi bi-circle-fill text-primary me-1"></i>
          予約数（直近7日間）
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: Array<{ date: string; count: number }>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// チャートの座標を計算
const maxValue = computed(() => {
  if (!props.data.length) return 100
  return Math.max(...props.data.map(d => d.count))
})

const dataPoints = computed(() => {
  if (!props.data.length) return []

  return props.data.map((item, index) => ({
    x: index * 100 + 110,
    y: 270 - (item.count / maxValue.value) * 200
  }))
})

const chartPoints = computed(() => {
  if (!dataPoints.value.length) return ''

  const points = dataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
  const firstPoint = dataPoints.value[0]
  const lastPoint = dataPoints.value[dataPoints.value.length - 1]

  return `${firstPoint.x},270 ${points} ${lastPoint.x},270`
})

const chartLabels = computed(() => {
  if (!props.data.length) {
    return ['月', '火', '水', '木', '金', '土', '日']
  }

  return props.data.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  })
})
</script>

<style scoped>
.chart-svg {
  border-radius: 0.5rem;
}

.chart-label {
  font-size: 12px;
  fill: #6c757d;
}

.chart-legend {
  text-align: center;
}
</style>
