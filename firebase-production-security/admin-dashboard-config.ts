/**
 * 管理者ダッシュボード設定
 * Enterprise Admin Dashboard Configuration
 */

export interface DashboardConfig {
  // 基本設定
  title: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  
  // アクセス制御
  accessControl: {
    requiredRole: string[];
    sessionTimeout: number;
    maxConcurrentSessions: number;
  };
  
  // ダッシュボードレイアウト
  layout: {
    theme: 'light' | 'dark' | 'auto';
    sidebar: boolean;
    compactMode: boolean;
    refreshInterval: number;
  };
  
  // ウィジェット設定
  widgets: DashboardWidget[];
  
  // 通知設定
  notifications: {
    enabled: boolean;
    types: string[];
    channels: string[];
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'log' | 'status';
  title: string;
  position: { row: number; col: number; width: number; height: number };
  config: Record<string, any>;
  permissions: string[];
  refreshInterval?: number;
}

// =====================================
// 本番環境ダッシュボード設定
// =====================================

export const productionDashboardConfig: DashboardConfig = {
  title: '美容室予約システム - 管理ダッシュボード',
  version: '1.0.0',
  environment: 'production',
  
  accessControl: {
    requiredRole: ['admin', 'manager'],
    sessionTimeout: 3600, // 1時間
    maxConcurrentSessions: 3
  },
  
  layout: {
    theme: 'light',
    sidebar: true,
    compactMode: false,
    refreshInterval: 30 // 30秒
  },
  
  widgets: [
    // システム概要（上部）
    {
      id: 'system-overview',
      type: 'status',
      title: 'システム稼働状況',
      position: { row: 1, col: 1, width: 12, height: 2 },
      config: {
        services: [
          { name: 'Firestore', endpoint: '/api/health/firestore' },
          { name: 'Authentication', endpoint: '/api/health/auth' },
          { name: 'Storage', endpoint: '/api/health/storage' },
          { name: 'Functions', endpoint: '/api/health/functions' },
          { name: 'Hosting', endpoint: '/api/health/hosting' }
        ],
        alertThreshold: 99.0
      },
      permissions: ['admin', 'manager']
    },
    
    // リアルタイム指標（第2行）
    {
      id: 'active-users',
      type: 'metric',
      title: 'アクティブユーザー数',
      position: { row: 2, col: 1, width: 3, height: 2 },
      config: {
        source: 'analytics',
        metric: 'active_users',
        timeRange: '1h',
        threshold: { warning: 100, critical: 500 }
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 30
    },
    
    {
      id: 'concurrent-sessions',
      type: 'metric',
      title: '同時接続数',
      position: { row: 2, col: 4, width: 3, height: 2 },
      config: {
        source: 'realtime',
        metric: 'concurrent_sessions',
        threshold: { warning: 50, critical: 100 }
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 10
    },
    
    {
      id: 'api-requests',
      type: 'metric',
      title: 'API リクエスト/分',
      position: { row: 2, col: 7, width: 3, height: 2 },
      config: {
        source: 'functions',
        metric: 'requests_per_minute',
        threshold: { warning: 1000, critical: 2000 }
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 30
    },
    
    {
      id: 'error-rate',
      type: 'metric',
      title: 'エラー率',
      position: { row: 2, col: 10, width: 3, height: 2 },
      config: {
        source: 'monitoring',
        metric: 'error_rate',
        format: 'percentage',
        threshold: { warning: 1, critical: 5 }
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 30
    },
    
    // パフォーマンスチャート（第3行）
    {
      id: 'response-time-chart',
      type: 'chart',
      title: 'レスポンス時間推移',
      position: { row: 3, col: 1, width: 6, height: 4 },
      config: {
        chartType: 'line',
        timeRange: '24h',
        metrics: [
          { name: 'API応答時間', source: 'functions.response_time', color: '#4A90E2' },
          { name: 'DB応答時間', source: 'firestore.response_time', color: '#50C878' },
          { name: 'Storage応答時間', source: 'storage.response_time', color: '#FFB347' }
        ],
        yAxis: { label: 'ミリ秒', max: 5000 }
      },
      permissions: ['admin', 'manager']
    },
    
    {
      id: 'traffic-chart',
      type: 'chart',
      title: 'トラフィック推移',
      position: { row: 3, col: 7, width: 6, height: 4 },
      config: {
        chartType: 'area',
        timeRange: '24h',
        metrics: [
          { name: 'ページビュー', source: 'analytics.page_views', color: '#4A90E2' },
          { name: 'APIコール', source: 'functions.invocations', color: '#50C878' },
          { name: 'DB操作', source: 'firestore.operations', color: '#FFB347' }
        ],
        yAxis: { label: '回数/時間' }
      },
      permissions: ['admin', 'manager']
    },
    
    // 予約システム固有指標（第4行）
    {
      id: 'reservation-metrics',
      type: 'metric',
      title: '今日の予約数',
      position: { row: 4, col: 1, width: 3, height: 2 },
      config: {
        source: 'business',
        metric: 'reservations_today',
        comparison: 'yesterday',
        format: 'number'
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 300
    },
    
    {
      id: 'revenue-metrics',
      type: 'metric',
      title: '今日の売上',
      position: { row: 4, col: 4, width: 3, height: 2 },
      config: {
        source: 'business',
        metric: 'revenue_today',
        comparison: 'yesterday',
        format: 'currency',
        currency: 'JPY'
      },
      permissions: ['admin'],
      refreshInterval: 300
    },
    
    {
      id: 'customer-satisfaction',
      type: 'metric',
      title: '顧客満足度',
      position: { row: 4, col: 7, width: 3, height: 2 },
      config: {
        source: 'feedback',
        metric: 'average_rating',
        timeRange: '7d',
        format: 'rating',
        maxRating: 5
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 3600
    },
    
    {
      id: 'no-show-rate',
      type: 'metric',
      title: 'ノーショー率',
      position: { row: 4, col: 10, width: 3, height: 2 },
      config: {
        source: 'business',
        metric: 'no_show_rate',
        timeRange: '7d',
        format: 'percentage',
        threshold: { warning: 10, critical: 20 }
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 3600
    },
    
    // アラート・ログ（第5行）
    {
      id: 'recent-alerts',
      type: 'alert',
      title: '最新アラート',
      position: { row: 5, col: 1, width: 6, height: 4 },
      config: {
        maxItems: 10,
        severity: ['critical', 'warning'],
        timeRange: '24h',
        autoRefresh: true
      },
      permissions: ['admin', 'manager'],
      refreshInterval: 60
    },
    
    {
      id: 'error-logs',
      type: 'log',
      title: 'エラーログ',
      position: { row: 5, col: 7, width: 6, height: 4 },
      config: {
        source: 'logging',
        logLevel: ['ERROR', 'FATAL'],
        maxItems: 20,
        timeRange: '1h',
        searchable: true
      },
      permissions: ['admin'],
      refreshInterval: 30
    },
    
    // リソース使用量（第6行）
    {
      id: 'firestore-usage',
      type: 'chart',
      title: 'Firestore使用量',
      position: { row: 6, col: 1, width: 4, height: 3 },
      config: {
        chartType: 'bar',
        timeRange: '7d',
        metrics: [
          { name: '読み取り', source: 'firestore.reads', color: '#4A90E2' },
          { name: '書き込み', source: 'firestore.writes', color: '#50C878' },
          { name: '削除', source: 'firestore.deletes', color: '#FF6B6B' }
        ],
        quotaLines: {
          reads: 50000,
          writes: 20000,
          deletes: 20000
        }
      },
      permissions: ['admin']
    },
    
    {
      id: 'storage-usage',
      type: 'chart',
      title: 'Storage使用量',
      position: { row: 6, col: 5, width: 4, height: 3 },
      config: {
        chartType: 'pie',
        metrics: [
          { name: 'プロフィール画像', source: 'storage.profiles', color: '#4A90E2' },
          { name: 'スタッフ画像', source: 'storage.staff', color: '#50C878' },
          { name: 'サービス画像', source: 'storage.services', color: '#FFB347' },
          { name: 'ギャラリー', source: 'storage.gallery', color: '#FF6B6B' }
        ]
      },
      permissions: ['admin']
    },
    
    {
      id: 'cost-monitoring',
      type: 'metric',
      title: '今月のコスト',
      position: { row: 6, col: 9, width: 4, height: 3 },
      config: {
        source: 'billing',
        metric: 'current_month_cost',
        budget: 100,
        currency: 'USD',
        format: 'currency',
        threshold: { warning: 80, critical: 95 }
      },
      permissions: ['admin'],
      refreshInterval: 3600
    }
  ],
  
  notifications: {
    enabled: true,
    types: ['alert', 'warning', 'info'],
    channels: ['in_app', 'email', 'slack']
  }
};

// =====================================
// ダッシュボードウィジェット実装
// =====================================

export class DashboardManager {
  private config: DashboardConfig;
  private widgets: Map<string, any> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(config: DashboardConfig) {
    this.config = config;
    this.initializeWidgets();
  }
  
  private initializeWidgets(): void {
    this.config.widgets.forEach(widget => {
      this.createWidget(widget);
      
      // 自動更新設定
      if (widget.refreshInterval) {
        const interval = setInterval(() => {
          this.refreshWidget(widget.id);
        }, widget.refreshInterval * 1000);
        
        this.refreshIntervals.set(widget.id, interval);
      }
    });
  }
  
  private createWidget(config: DashboardWidget): void {
    const widget = {
      id: config.id,
      type: config.type,
      title: config.title,
      position: config.position,
      data: null,
      lastUpdated: null,
      status: 'loading'
    };
    
    this.widgets.set(config.id, widget);
    this.refreshWidget(config.id);
  }
  
  private async refreshWidget(widgetId: string): Promise<void> {
    const widget = this.widgets.get(widgetId);
    const config = this.config.widgets.find(w => w.id === widgetId);
    
    if (!widget || !config) return;
    
    try {
      widget.status = 'loading';
      const data = await this.fetchWidgetData(config);
      
      widget.data = data;
      widget.lastUpdated = new Date();
      widget.status = 'loaded';
      
      // ウィジェット更新イベント発火
      this.emitWidgetUpdate(widgetId, widget);
      
    } catch (error) {
      console.error(`Widget ${widgetId} refresh failed:`, error);
      widget.status = 'error';
      widget.error = error instanceof Error ? error.message : String(error);
    }
  }
  
  private async fetchWidgetData(config: DashboardWidget): Promise<any> {
    // ウィジェットタイプ別のデータ取得
    switch (config.type) {
      case 'metric':
        return await this.fetchMetricData(config);
      case 'chart':
        return await this.fetchChartData(config);
      case 'table':
        return await this.fetchTableData(config);
      case 'alert':
        return await this.fetchAlertData(config);
      case 'log':
        return await this.fetchLogData(config);
      case 'status':
        return await this.fetchStatusData(config);
      default:
        throw new Error(`Unsupported widget type: ${config.type}`);
    }
  }
  
  private async fetchMetricData(config: DashboardWidget): Promise<any> {
    const { source, metric, timeRange, threshold } = config.config;
    
    // Firebase Analytics、Functions、Firestore等からメトリクス取得
    const response = await fetch(`/api/metrics/${source}/${metric}?timeRange=${timeRange}`);
    const data = await response.json();
    
    return {
      value: data.current,
      previous: data.previous,
      change: data.change,
      trend: data.trend,
      threshold: threshold,
      unit: data.unit
    };
  }
  
  private async fetchChartData(config: DashboardWidget): Promise<any> {
    const { timeRange, metrics } = config.config;
    
    const chartData = await Promise.all(
      metrics.map(async (metric: any) => {
        const response = await fetch(`/api/metrics/${metric.source}?timeRange=${timeRange}`);
        const data = await response.json();
        
        return {
          name: metric.name,
          data: data.points,
          color: metric.color
        };
      })
    );
    
    return { series: chartData };
  }
  
  private async fetchAlertData(config: DashboardWidget): Promise<any> {
    const { maxItems, severity, timeRange } = config.config;
    
    const response = await fetch(`/api/alerts?severity=${severity.join(',')}&timeRange=${timeRange}&limit=${maxItems}`);
    const alerts = await response.json();
    
    return { alerts };
  }
  
  private async fetchLogData(config: DashboardWidget): Promise<any> {
    const { logLevel, maxItems, timeRange } = config.config;
    
    const response = await fetch(`/api/logs?level=${logLevel.join(',')}&timeRange=${timeRange}&limit=${maxItems}`);
    const logs = await response.json();
    
    return { logs };
  }
  
  private async fetchStatusData(config: DashboardWidget): Promise<any> {
    const { services } = config.config;
    
    const statusChecks = await Promise.all(
      services.map(async (service: any) => {
        try {
          const response = await fetch(service.endpoint, { timeout: 5000 });
          return {
            name: service.name,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - Date.now() // 実際の計測が必要
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );
    
    return { services: statusChecks };
  }
  
  private emitWidgetUpdate(widgetId: string, widget: any): void {
    // カスタムイベント発火（フロントエンド連携用）
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('widgetUpdate', {
        detail: { widgetId, widget }
      }));
    }
  }
  
  // 公開メソッド
  public getWidget(widgetId: string): any {
    return this.widgets.get(widgetId);
  }
  
  public getAllWidgets(): any[] {
    return Array.from(this.widgets.values());
  }
  
  public forceRefresh(widgetId?: string): void {
    if (widgetId) {
      this.refreshWidget(widgetId);
    } else {
      this.widgets.forEach((_, id) => this.refreshWidget(id));
    }
  }
  
  public destroy(): void {
    // 全ての自動更新を停止
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    this.refreshIntervals.clear();
    this.widgets.clear();
  }
}

// 自動初期化（本番環境）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboardManager = new DashboardManager(productionDashboardConfig);
    (window as any).dashboardManager = dashboardManager;
  });
}