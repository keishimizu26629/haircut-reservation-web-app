<template>
  <div class="admin-sidebar">
    <div class="sidebar-content">
      <!-- Main Navigation -->
      <nav class="nav nav-pills flex-column">
        <h6 class="sidebar-heading text-muted fw-bold text-uppercase mt-3 mb-2">
          メイン
        </h6>
        
        <NuxtLink
          to="/admin"
          class="nav-link"
          :class="{ active: currentPage === 'dashboard' }"
        >
          <i class="bi bi-speedometer2 me-2"></i>
          ダッシュボード
        </NuxtLink>
        
        <NuxtLink
          to="/admin/reservations"
          class="nav-link"
          :class="{ active: currentPage === 'reservations' }"
        >
          <i class="bi bi-calendar-check me-2"></i>
          予約管理
          <span v-if="pendingReservations > 0" class="badge bg-warning ms-auto">
            {{ pendingReservations }}
          </span>
        </NuxtLink>
        
        <NuxtLink
          to="/admin/customers"
          class="nav-link"
          :class="{ active: currentPage === 'customers' }"
        >
          <i class="bi bi-people me-2"></i>
          顧客管理
        </NuxtLink>
        
        <NuxtLink
          to="/admin/calendar"
          class="nav-link"
          :class="{ active: currentPage === 'calendar' }"
        >
          <i class="bi bi-calendar3 me-2"></i>
          スケジュール
        </NuxtLink>

        <!-- Staff Management (STAFF+ access) -->
        <template v-if="hasStaffAccess">
          <h6 class="sidebar-heading text-muted fw-bold text-uppercase mt-4 mb-2">
            スタッフ
          </h6>
          
          <NuxtLink
            to="/admin/staff"
            class="nav-link"
            :class="{ active: currentPage === 'staff' }"
          >
            <i class="bi bi-person-badge me-2"></i>
            スタッフ管理
          </NuxtLink>
          
          <NuxtLink
            to="/admin/services"
            class="nav-link"
            :class="{ active: currentPage === 'services' }"
          >
            <i class="bi bi-list-check me-2"></i>
            サービス管理
          </NuxtLink>
          
          <NuxtLink
            to="/admin/reports"
            class="nav-link"
            :class="{ active: currentPage === 'reports' }"
          >
            <i class="bi bi-graph-up me-2"></i>
            レポート
          </NuxtLink>
        </template>

        <!-- Admin Only (OWNER/ADMIN access) -->
        <template v-if="hasAdminAccess">
          <h6 class="sidebar-heading text-muted fw-bold text-uppercase mt-4 mb-2">
            システム管理
          </h6>
          
          <NuxtLink
            to="/admin/users"
            class="nav-link"
            :class="{ active: currentPage === 'users' }"
          >
            <i class="bi bi-person-lines-fill me-2"></i>
            ユーザー管理
          </NuxtLink>
          
          <NuxtLink
            to="/admin/roles"
            class="nav-link"
            :class="{ active: currentPage === 'roles' }"
          >
            <i class="bi bi-shield-check me-2"></i>
            権限管理
          </NuxtLink>
          
          <NuxtLink
            to="/admin/settings"
            class="nav-link"
            :class="{ active: currentPage === 'settings' }"
          >
            <i class="bi bi-sliders me-2"></i>
            システム設定
          </NuxtLink>
          
          <NuxtLink
            to="/admin/audit"
            class="nav-link"
            :class="{ active: currentPage === 'audit' }"
          >
            <i class="bi bi-file-text me-2"></i>
            監査ログ
          </NuxtLink>
        </template>

        <!-- Support Tools -->
        <h6 class="sidebar-heading text-muted fw-bold text-uppercase mt-4 mb-2">
          サポート
        </h6>
        
        <NuxtLink
          to="/admin/help"
          class="nav-link"
          :class="{ active: currentPage === 'help' }"
        >
          <i class="bi bi-question-circle me-2"></i>
          ヘルプ
        </NuxtLink>
        
        <button
          @click="toggleTheme"
          class="nav-link btn btn-link text-start w-100 border-0"
          type="button"
        >
          <i :class="themeIcon" class="me-2"></i>
          {{ themeText }}
        </button>
      </nav>

      <!-- System Status -->
      <div class="system-status mt-4 p-3 bg-light rounded">
        <h6 class="text-muted fw-bold text-uppercase mb-2">
          <i class="bi bi-info-circle me-1"></i>
          システム状態
        </h6>
        <div class="status-items">
          <div class="status-item d-flex justify-content-between align-items-center mb-1">
            <small>データベース</small>
            <span :class="getStatusClass(systemStatus.database)">
              <i :class="getStatusIcon(systemStatus.database)" class="me-1"></i>
              {{ getStatusText(systemStatus.database) }}
            </span>
          </div>
          <div class="status-item d-flex justify-content-between align-items-center mb-1">
            <small>認証</small>
            <span :class="getStatusClass(systemStatus.auth)">
              <i :class="getStatusIcon(systemStatus.auth)" class="me-1"></i>
              {{ getStatusText(systemStatus.auth) }}
            </span>
          </div>
          <div class="status-item d-flex justify-content-between align-items-center">
            <small>ストレージ</small>
            <span :class="getStatusClass(systemStatus.storage)">
              <i :class="getStatusIcon(systemStatus.storage)" class="me-1"></i>
              {{ getStatusText(systemStatus.storage) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Version Info -->
      <div class="version-info mt-3 text-center text-muted">
        <small>
          Version {{ appVersion }}<br>
          Build {{ buildNumber }}
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import { useSystemStatus } from '@/composables/useSystemStatus'

interface Props {
  currentPage: string
}

const props = defineProps<Props>()

// Composables
const { userRole, hasStaffAccess, hasAdminAccess } = useAuth()
const { theme, toggleTheme } = useTheme()
const { systemStatus, loadSystemStatus } = useSystemStatus()

// Reactive data
const pendingReservations = ref(0)
const appVersion = ref('2.0.0')
const buildNumber = ref('20250125')

// Computed
const themeIcon = computed(() => 
  theme.value === 'dark' ? 'bi bi-sun' : 'bi bi-moon'
)

const themeText = computed(() => 
  theme.value === 'dark' ? 'ライトモード' : 'ダークモード'
)

// Methods
const loadPendingReservations = async () => {
  try {
    // 承認待ちの予約数を取得
    const { getReservationStats } = await import('@/composables/useReservations')
    const stats = await getReservationStats()
    pendingReservations.value = stats.pending || 0
  } catch (error) {
    console.error('承認待ち予約数の取得に失敗:', error)
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'text-success'
    case 'warning':
      return 'text-warning'
    case 'error':
      return 'text-danger'
    default:
      return 'text-secondary'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bi bi-check-circle-fill'
    case 'warning':
      return 'bi bi-exclamation-triangle-fill'
    case 'error':
      return 'bi bi-x-circle-fill'
    default:
      return 'bi bi-question-circle'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'healthy':
      return '正常'
    case 'warning':
      return '警告'
    case 'error':
      return 'エラー'
    default:
      return '不明'
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadPendingReservations(),
    loadSystemStatus()
  ])
})

// Auto-refresh pending reservations every 30 seconds
setInterval(loadPendingReservations, 30000)
</script>

<style scoped>
.admin-sidebar {
  background-color: #fff;
  border-right: 1px solid #dee2e6;
  height: calc(100vh - 56px); /* Navbar height */
  position: sticky;
  top: 56px;
  overflow-y: auto;
}

.sidebar-content {
  padding: 1rem;
}

.sidebar-heading {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}

.nav-link {
  color: #6c757d;
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  position: relative;
}

.nav-link:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.nav-link.active {
  color: #fff;
  background-color: #0d6efd;
}

.nav-link.active:hover {
  background-color: #0b5ed7;
}

.system-status {
  border: 1px solid #dee2e6;
}

.status-item small {
  font-size: 0.75rem;
}

.status-item span {
  font-size: 0.7rem;
  font-weight: 600;
}

.version-info {
  border-top: 1px solid #dee2e6;
  padding-top: 0.75rem;
}

.badge {
  font-size: 0.65rem;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .admin-sidebar[data-theme="dark"] {
    background-color: #212529;
    border-right-color: #495057;
  }
  
  .admin-sidebar[data-theme="dark"] .nav-link {
    color: #adb5bd;
  }
  
  .admin-sidebar[data-theme="dark"] .nav-link:hover {
    color: #fff;
    background-color: #495057;
  }
  
  .admin-sidebar[data-theme="dark"] .system-status {
    background-color: #495057 !important;
    border-color: #6c757d;
    color: #adb5bd;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    top: 56px;
    left: -100%;
    width: 280px;
    z-index: 1040;
    transition: left 0.3s ease-in-out;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
  
  .admin-sidebar.show {
    left: 0;
    box-shadow: 0.5rem 0 1rem rgba(0, 0, 0, 0.15);
  }
  
  .sidebar-content {
    padding: 0.75rem;
  }
}
</style>