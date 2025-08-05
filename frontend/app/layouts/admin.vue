<template>
  <div class="admin-layout">
    <!-- Admin Header -->
    <AdminHeader />

    <!-- Main Content Area -->
    <div class="admin-container">
      <!-- Sidebar Navigation -->
      <div class="admin-sidebar">
        <AdminSidebar :current-page="currentPage" />
      </div>

      <!-- Page Content -->
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 現在のページを判定
const currentPage = computed(() => {
  const path = route.path

  if (path.includes('/admin/reservations')) return 'reservations'
  if (path.includes('/admin/customers')) return 'customers'
  if (path.includes('/admin/services')) return 'services'
  if (path.includes('/admin/staff')) return 'staff'
  if (path.includes('/admin/settings')) return 'settings'
  if (path === '/admin') return 'dashboard'

  return 'dashboard'
})

// 管理者権限チェック
const { isAuthenticated, userRole } = useAuth()

// SEO設定
useHead({
  title: computed(() => `管理画面 - ${currentPage.value}`),
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.admin-container {
  display: flex;
  min-height: calc(100vh - 60px); /* Header height考慮 */
}

.admin-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #dee2e6;
}

.admin-main {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-container {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #dee2e6;
  }

  .admin-main {
    padding: 1rem;
  }
}
</style>
