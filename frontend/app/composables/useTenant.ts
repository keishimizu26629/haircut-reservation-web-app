/**
 * マルチテナント管理 Composable
 * テナント切り替えとテナント固有設定を提供
 */

import type { TenantInfo } from '~/types/environment'

export const useTenant = () => {
  const { multiTenant, getCurrentTenant, switchTenant } = useEnvironment()

  // 現在のテナント情報
  const currentTenantId = ref(getCurrentTenant())
  
  // テナント情報を格納する状態
  const tenantInfo = ref<TenantInfo | null>(null)
  const tenantSettings = ref<Record<string, any>>({})

  // テナント一覧（実際のアプリケーションでは API から取得）
  const availableTenants = ref<TenantInfo[]>([
    {
      id: 'local-salon',
      name: 'ローカル開発サロン',
      settings: {
        theme: 'default',
        features: ['booking', 'staff-management'],
        branding: {
          logo: '/logos/local-salon.png',
          primaryColor: '#007bff'
        }
      }
    },
    {
      id: 'dev-salon',
      name: '開発環境サロン',
      settings: {
        theme: 'development',
        features: ['booking', 'staff-management', 'analytics'],
        branding: {
          logo: '/logos/dev-salon.png',
          primaryColor: '#28a745'
        }
      }
    },
    {
      id: 'prod-salon',
      name: '本番サロン',
      settings: {
        theme: 'professional',
        features: ['booking', 'staff-management', 'analytics', 'payments'],
        branding: {
          logo: '/logos/prod-salon.png',
          primaryColor: '#dc3545'
        }
      }
    }
  ])

  // テナント情報を取得
  const loadTenantInfo = async (tenantId: string) => {
    try {
      // 実際のアプリケーションでは API から取得
      const tenant = availableTenants.value.find(t => t.id === tenantId)
      
      if (tenant) {
        tenantInfo.value = tenant
        tenantSettings.value = tenant.settings
        
        // テナント固有のCSS変数を設定
        if (process.client && tenant.settings.branding) {
          document.documentElement.style.setProperty(
            '--tenant-primary-color',
            tenant.settings.branding.primaryColor
          )
        }
        
        return tenant
      } else {
        throw new Error(`Tenant not found: ${tenantId}`)
      }
    } catch (error) {
      console.error('Failed to load tenant info:', error)
      return null
    }
  }

  // テナント切り替え
  const changeTenant = async (tenantId: string) => {
    if (!multiTenant.value.enabled) {
      console.warn('Multi-tenant is not enabled')
      return false
    }

    try {
      // テナント情報を読み込み
      const tenant = await loadTenantInfo(tenantId)
      
      if (tenant) {
        // 環境設定でテナントを切り替え
        switchTenant(tenantId)
        currentTenantId.value = tenantId
        
        // テナント変更イベントを監聴
        if (process.client) {
          window.addEventListener('tenant-changed', (event: any) => {
            currentTenantId.value = event.detail.tenantId
          })
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to change tenant:', error)
      return false
    }
  }

  // テナント固有の機能が有効かチェック
  const hasFeature = (feature: string): boolean => {
    if (!tenantSettings.value.features) return false
    return tenantSettings.value.features.includes(feature)
  }

  // テナント固有のブランディング取得
  const getBranding = () => {
    return tenantSettings.value.branding || {}
  }

  // テナントのテーマ取得
  const getTheme = () => {
    return tenantSettings.value.theme || 'default'
  }

  // テナント固有のFirestoreパス生成
  const getTenantPath = (collection: string) => {
    if (!multiTenant.value.enabled) {
      return collection
    }
    return `tenants/${currentTenantId.value}/${collection}`
  }

  // 初期化処理
  const initializeTenant = async () => {
    if (multiTenant.value.enabled) {
      const tenantId = getCurrentTenant()
      await loadTenantInfo(tenantId)
      currentTenantId.value = tenantId
    }
  }

  // テナント設定の監視
  watch(currentTenantId, async (newTenantId) => {
    if (newTenantId) {
      await loadTenantInfo(newTenantId)
    }
  })

  // ライフサイクル
  onMounted(() => {
    initializeTenant()
  })

  return {
    // 状態
    currentTenantId: readonly(currentTenantId),
    tenantInfo: readonly(tenantInfo),
    tenantSettings: readonly(tenantSettings),
    availableTenants: readonly(availableTenants),
    multiTenantEnabled: readonly(multiTenant),

    // 機能
    loadTenantInfo,
    changeTenant,
    hasFeature,
    getBranding,
    getTheme,
    getTenantPath,
    initializeTenant
  }
}