<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
    <div class="container-fluid">
      <!-- Brand -->
      <NuxtLink to="/admin" class="navbar-brand d-flex align-items-center">
        <i class="bi bi-scissors me-2"></i>
        <span class="fw-bold">美容院管理システム</span>
      </NuxtLink>

      <!-- Mobile toggle -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#adminNavbar"
        aria-controls="adminNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Navigation -->
      <div class="collapse navbar-collapse" id="adminNavbar">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <NuxtLink to="/admin" class="nav-link">
              <i class="bi bi-speedometer2 me-1"></i>
              ダッシュボード
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/admin/reservations" class="nav-link">
              <i class="bi bi-calendar-check me-1"></i>
              予約管理
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/admin/customers" class="nav-link">
              <i class="bi bi-people me-1"></i>
              顧客管理
            </NuxtLink>
          </li>
          <li class="nav-item dropdown" v-if="hasAdminAccess">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-gear me-1"></i>
              システム
            </a>
            <ul class="dropdown-menu">
              <li>
                <NuxtLink to="/admin/staff" class="dropdown-item">
                  <i class="bi bi-person-badge me-2"></i>
                  スタッフ管理
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/admin/services" class="dropdown-item">
                  <i class="bi bi-list-check me-2"></i>
                  サービス管理
                </NuxtLink>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <NuxtLink to="/admin/settings" class="dropdown-item">
                  <i class="bi bi-sliders me-2"></i>
                  設定
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>

        <!-- Right side -->
        <ul class="navbar-nav">
          <!-- Notifications -->
          <li class="nav-item dropdown">
            <a
              class="nav-link position-relative"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-bell"></i>
              <span
                v-if="unreadNotifications > 0"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              >
                {{ unreadNotifications }}
              </span>
            </a>
            <div class="dropdown-menu dropdown-menu-end notification-dropdown">
              <div class="dropdown-header d-flex justify-content-between align-items-center">
                <span>通知</span>
                <button
                  v-if="unreadNotifications > 0"
                  @click="markAllAsRead"
                  class="btn btn-sm btn-link p-0 text-primary"
                >
                  全て既読
                </button>
              </div>
              <div class="notification-list">
                <div
                  v-for="notification in notifications"
                  :key="notification.id"
                  class="dropdown-item notification-item"
                  :class="{ 'unread': !notification.read }"
                  @click="markAsRead(notification.id)"
                >
                  <div class="d-flex">
                    <div class="notification-icon me-2">
                      <i :class="getNotificationIcon(notification.type)"></i>
                    </div>
                    <div class="notification-content flex-grow-1">
                      <div class="notification-title">{{ notification.title }}</div>
                      <div class="notification-message">{{ notification.message }}</div>
                      <small class="text-muted">{{ formatTime(notification.createdAt) }}</small>
                    </div>
                  </div>
                </div>
                <div v-if="notifications.length === 0" class="dropdown-item text-center text-muted">
                  新しい通知はありません
                </div>
              </div>
            </div>
          </li>

          <!-- User menu -->
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                :src="currentUser?.photoURL || '/default-avatar.png'"
                :alt="currentUser?.displayName"
                class="rounded-circle me-2"
                width="32"
                height="32"
              >
              <span class="d-none d-md-inline">{{ currentUser?.displayName }}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <div class="dropdown-header">
                  <div class="fw-bold">{{ currentUser?.displayName }}</div>
                  <small class="text-muted">{{ currentUser?.email }}</small>
                  <small class="badge bg-primary">{{ userRole }}</small>
                </div>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <NuxtLink to="/admin/profile" class="dropdown-item">
                  <i class="bi bi-person me-2"></i>
                  プロフィール
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/admin/settings" class="dropdown-item">
                  <i class="bi bi-gear me-2"></i>
                  設定
                </NuxtLink>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <button @click="logout" class="dropdown-item text-danger">
                  <i class="bi bi-box-arrow-right me-2"></i>
                  ログアウト
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useNotifications } from '@/composables/useNotifications'
import dayjs from 'dayjs'

// Composables
const { currentUser, logout: authLogout, userRole, hasAdminAccess } = useAuth()
const { 
  notifications, 
  unreadCount: unreadNotifications, 
  markAsRead, 
  markAllAsRead,
  loadNotifications 
} = useNotifications()

// Methods
const logout = async () => {
  try {
    await authLogout()
    await navigateTo('/auth/login')
  } catch (error) {
    console.error('ログアウトエラー:', error)
  }
}

const getNotificationIcon = (type: string) => {
  const icons = {
    info: 'bi bi-info-circle text-info',
    warning: 'bi bi-exclamation-triangle text-warning',
    error: 'bi bi-x-circle text-danger',
    success: 'bi bi-check-circle text-success',
    reservation: 'bi bi-calendar-check text-primary'
  }
  return icons[type] || 'bi bi-info-circle text-info'
}

const formatTime = (date: string | Date) => {
  return dayjs(date).fromNow()
}

// Lifecycle
onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.navbar-brand {
  font-size: 1.25rem;
}

.notification-dropdown {
  width: 350px;
  max-height: 400px;
  overflow-y: auto;
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.notification-icon {
  width: 24px;
  text-align: center;
}

.notification-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.dropdown-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
}

@media (max-width: 768px) {
  .notification-dropdown {
    width: 300px;
  }
  
  .d-none.d-md-inline {
    display: none !important;
  }
}
</style>