<template>
  <div class="auth-layout">
    <div class="auth-background"></div>
    <div class="auth-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* =====================================
   認証レイアウト - モダンデザイン
   ===================================== */

.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.auth-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: -1;
}

.auth-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
}

.auth-content {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-4);
}

/* グローバル認証ページスタイル（ページ内で上書き可能） */
:global(.auth-layout) {
  font-family: var(--font-family-primary);
}

/* スクロールバーのスタイリング */
.auth-layout::-webkit-scrollbar {
  width: 8px;
}

.auth-layout::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.auth-layout::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.auth-layout::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* モバイル対応 */
@media (max-width: 576px) {
  .auth-content {
    padding: var(--space-2);
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .auth-background {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }

  .auth-background::before {
    background:
      radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  }
}

/* アクセシビリティ */
@media (prefers-reduced-motion: reduce) {
  .auth-background::before {
    animation: none;
  }
}
</style>
