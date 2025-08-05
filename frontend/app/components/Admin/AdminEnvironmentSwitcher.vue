<template>
  <div>
    <!-- 管理画面用のEnvironmentSwitcherコンポーネント -->
    <div class="environment-switcher">
      <div class="environment-status mb-3">
        <div class="d-flex align-items-center justify-content-between">
          <div class="environment-info">
            <span class="badge fs-6 me-2 bg-primary">
              <i class="bi bi-server me-1"></i>
              DEVELOPMENT
            </span>
            <span class="badge bg-success">
              <i class="bi bi-check-circle me-1"></i>
              接続済み
            </span>
          </div>
          <button class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      <div class="environment-controls">
        <h6 class="mb-3">
          <i class="bi bi-gear me-2"></i>
          Firebase環境設定
        </h6>

        <!-- 環境選択 -->
        <div class="mb-3">
          <label class="form-label">実行環境</label>
          <div class="btn-group w-100" role="group">
            <input id="env-dev" type="radio" value="development" class="btn-check" checked>
            <label class="btn btn-outline-primary" for="env-dev">
              <i class="bi bi-code-slash me-1"></i>
              Development
            </label>

            <input id="env-staging" type="radio" value="staging" class="btn-check">
            <label class="btn btn-outline-warning" for="env-staging">
              <i class="bi bi-cloud-check me-1"></i>
              Staging
            </label>

            <input id="env-prod" type="radio" value="production" class="btn-check">
            <label class="btn btn-outline-danger" for="env-prod">
              <i class="bi bi-cloud me-1"></i>
              Production
            </label>
          </div>
        </div>

        <!-- エミュレーター設定 -->
        <div class="mb-3">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="useEmulator" checked>
            <label class="form-check-label" for="useEmulator">
              <i class="bi bi-terminal me-1"></i>
              エミュレーター使用
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 簡易版のEnvironmentSwitcherコンポーネント
</script>

<style scoped>
.environment-switcher {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.environment-status {
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 1rem;
}
</style>
