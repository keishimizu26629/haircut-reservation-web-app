/**
 * テナント管理グローバルミドルウェア
 * 全ページでテナント設定を適用
 */
import { useEnvironment } from '../composables/useEnvironment'

export default defineNuxtRouteMiddleware((to) => {
  // クライアントサイドでのみ実行
  if (process.client) {
    const { multiTenant } = useEnvironment()
    
    // マルチテナントが有効な場合のみ処理
    if (multiTenant.value.enabled) {
      // URLからテナントIDを取得（オプション）
      const tenantFromUrl = to.query.tenant as string
      
      // セッションストレージからテナントIDを取得
      const currentTenant = sessionStorage.getItem('tenantId')
      
      // URLパラメータでテナントが指定されている場合
      if (tenantFromUrl && tenantFromUrl !== currentTenant) {
        // テナント切り替え
        sessionStorage.setItem('tenantId', tenantFromUrl)
        
        // テナント変更イベントを発行
        window.dispatchEvent(new CustomEvent('tenant-changed', {
          detail: { tenantId: tenantFromUrl }
        }))
        
        console.log('🏢 Tenant switched via URL:', tenantFromUrl)
      }
      
      // デフォルトテナントの設定（初回アクセス時）
      if (!currentTenant) {
        const defaultTenant = multiTenant.value.defaultTenantId
        sessionStorage.setItem('tenantId', defaultTenant)
        console.log('🏢 Default tenant set:', defaultTenant)
      }
    }
  }
})