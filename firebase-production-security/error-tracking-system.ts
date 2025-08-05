/**
 * エラートラッキング・アラートシステム
 * Enterprise Grade Error Monitoring & Alert System
 */

import { getAnalytics, logEvent } from 'firebase/analytics';
import { getApp } from 'firebase/app';

// =====================================
// エラートラッキング設定
// =====================================

export interface ErrorTrackingConfig {
  // 基本設定
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  
  // 収集設定
  collectUserInteractions: boolean;
  collectNetworkErrors: boolean;
  collectJavaScriptErrors: boolean;
  collectPerformanceErrors: boolean;
  
  // フィルタリング
  ignoreLocalStorageErrors: boolean;
  ignoreExtensionErrors: boolean;
  ignoreCorsErrors: boolean;
  
  // アラート設定
  immediateAlertThreshold: number;    // 即座アラート（エラー率）
  hourlyAlertThreshold: number;       // 1時間アラート
  dailyAlertThreshold: number;        // 1日アラート
  
  // 外部サービス連携
  slackWebhookUrl?: string;
  emailAlerts: string[];
  sentryDsn?: string;
}

export const errorTrackingConfig: ErrorTrackingConfig = {
  // 本番環境では全て有効
  enabled: true,
  logLevel: 'warn',
  
  // 包括的エラー収集
  collectUserInteractions: true,
  collectNetworkErrors: true,
  collectJavaScriptErrors: true,
  collectPerformanceErrors: true,
  
  // ノイズフィルタリング
  ignoreLocalStorageErrors: true,
  ignoreExtensionErrors: true,
  ignoreCorsErrors: false,
  
  // アラート閾値（本番環境用）
  immediateAlertThreshold: 0.05,  // 5%以上で即座アラート
  hourlyAlertThreshold: 0.02,     // 2%以上で1時間後アラート
  dailyAlertThreshold: 0.01,      // 1%以上で日次アラート
  
  // 通知設定
  emailAlerts: [
    'admin@your-domain.com',
    'tech-lead@your-domain.com'
  ]
};

// =====================================
// エラー分類システム
// =====================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  USER_INTERFACE = 'user_interface',
  BUSINESS_LOGIC = 'business_logic'
}

export interface ErrorEvent {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  url: string;
  userId?: string;
  tenantId?: string;
  userAgent: string;
  sessionId: string;
  context: Record<string, any>;
  resolved: boolean;
}

// =====================================
// エラートラッキングマネージャー
// =====================================

export class ErrorTrackingManager {
  private static instance: ErrorTrackingManager;
  private analytics: any;
  private errorQueue: ErrorEvent[] = [];
  private errorCounts: Map<string, number> = new Map();
  private sessionId: string;
  
  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorTracking();
  }
  
  static getInstance(): ErrorTrackingManager {
    if (!ErrorTrackingManager.instance) {
      ErrorTrackingManager.instance = new ErrorTrackingManager();
    }
    return ErrorTrackingManager.instance;
  }
  
  private initializeErrorTracking(): void {
    try {
      const app = getApp();
      this.analytics = getAnalytics(app);
      
      // グローバルエラーハンドラー設定
      this.setupGlobalErrorHandlers();
      
      // 定期的なエラー送信
      this.startErrorReporting();
      
      console.log('✅ Error tracking system initialized');
    } catch (error) {
      console.error('❌ Error tracking initialization failed:', error);
    }
  }
  
  private setupGlobalErrorHandlers(): void {
    // JavaScript エラー
    window.addEventListener('error', (event) => {
      this.captureError({
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SYSTEM,
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        context: {
          lineno: event.lineno,
          colno: event.colno,
          source: 'global_error_handler'
        }
      });
    });
    
    // Promise リジェクション
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SYSTEM,
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        context: {
          reason: event.reason,
          source: 'unhandled_rejection'
        }
      });
    });
    
    // ネットワークエラー
    this.setupNetworkErrorTracking();
  }
  
  private setupNetworkErrorTracking(): void {
    // Fetch API インターセプト
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.captureError({
            severity: this.getNetworkErrorSeverity(response.status),
            category: ErrorCategory.NETWORK,
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: typeof args[0] === 'string' ? args[0] : args[0].url,
            context: {
              status: response.status,
              statusText: response.statusText,
              method: typeof args[1] === 'object' ? args[1]?.method || 'GET' : 'GET',
              source: 'fetch_api'
            }
          });
        }
        
        return response;
      } catch (error) {
        this.captureError({
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.NETWORK,
          message: `Network Error: ${error instanceof Error ? error.message : String(error)}`,
          stack: error instanceof Error ? error.stack : undefined,
          url: typeof args[0] === 'string' ? args[0] : args[0].url,
          context: {
            source: 'fetch_api',
            error: error
          }
        });
        throw error;
      }
    };
  }
  
  private getNetworkErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.HIGH;
    if (status >= 300) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }
  
  // エラーキャプチャー（メイン機能）
  captureError(errorData: Partial<ErrorEvent>): void {
    if (!errorTrackingConfig.enabled) return;
    
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      severity: errorData.severity || ErrorSeverity.MEDIUM,
      category: errorData.category || ErrorCategory.SYSTEM,
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      url: errorData.url || window.location.href,
      userId: errorData.userId,
      tenantId: errorData.tenantId,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      context: errorData.context || {},
      resolved: false
    };
    
    // フィルタリング
    if (this.shouldIgnoreError(errorEvent)) {
      return;
    }
    
    // エラーキューに追加
    this.errorQueue.push(errorEvent);
    
    // エラーカウント更新
    const errorKey = `${errorEvent.category}:${errorEvent.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // 即座アラートチェック
    this.checkImmediateAlert(errorEvent);
    
    // Analytics送信
    this.logErrorToAnalytics(errorEvent);
    
    console.error(`🚨 Error captured [${errorEvent.severity}]:`, errorEvent);
  }
  
  private shouldIgnoreError(errorEvent: ErrorEvent): boolean {
    const message = errorEvent.message.toLowerCase();
    
    // LocalStorage エラー除外
    if (errorTrackingConfig.ignoreLocalStorageErrors && 
        message.includes('localstorage')) {
      return true;
    }
    
    // ブラウザ拡張エラー除外
    if (errorTrackingConfig.ignoreExtensionErrors && 
        (message.includes('extension') || errorEvent.url.includes('extension'))) {
      return true;
    }
    
    // CORS エラー除外
    if (errorTrackingConfig.ignoreCorsErrors && 
        message.includes('cors')) {
      return true;
    }
    
    return false;
  }
  
  private checkImmediateAlert(errorEvent: ErrorEvent): void {
    // クリティカルエラーは即座通知
    if (errorEvent.severity === ErrorSeverity.CRITICAL) {
      this.sendImmediateAlert(errorEvent);
      return;
    }
    
    // エラー率チェック
    const recentErrors = this.errorQueue.filter(
      err => err.timestamp > Date.now() - 5 * 60 * 1000 // 直近5分
    );
    
    const errorRate = recentErrors.length / 100; // 仮の計算
    if (errorRate > errorTrackingConfig.immediateAlertThreshold) {
      this.sendErrorRateAlert(errorRate);
    }
  }
  
  private sendImmediateAlert(errorEvent: ErrorEvent): void {
    const alertMessage = {
      text: `🚨 Critical Error Alert`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Critical Error Detected*\n\n*Message:* ${errorEvent.message}\n*Category:* ${errorEvent.category}\n*URL:* ${errorEvent.url}\n*Time:* ${new Date(errorEvent.timestamp).toISOString()}`
          }
        }
      ]
    };
    
    this.sendSlackAlert(alertMessage);
    this.sendEmailAlert('Critical Error Alert', errorEvent);
  }
  
  private sendErrorRateAlert(errorRate: number): void {
    const alertMessage = {
      text: `⚠️ High Error Rate Alert: ${(errorRate * 100).toFixed(2)}%`
    };
    
    this.sendSlackAlert(alertMessage);
  }
  
  private sendSlackAlert(message: any): void {
    if (!errorTrackingConfig.slackWebhookUrl) return;
    
    fetch(errorTrackingConfig.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    }).catch(error => {
      console.error('Failed to send Slack alert:', error);
    });
  }
  
  private sendEmailAlert(subject: string, errorEvent: ErrorEvent): void {
    // メール送信ロジック（実装は外部サービス依存）
    console.log(`📧 Email alert: ${subject}`, errorEvent);
  }
  
  private logErrorToAnalytics(errorEvent: ErrorEvent): void {
    if (!this.analytics) return;
    
    logEvent(this.analytics, 'error_occurred', {
      error_id: errorEvent.id,
      error_severity: errorEvent.severity,
      error_category: errorEvent.category,
      error_message: errorEvent.message.substring(0, 100), // 制限内
      page_url: errorEvent.url,
      user_id: errorEvent.userId,
      tenant_id: errorEvent.tenantId
    });
  }
  
  private startErrorReporting(): void {
    // 5分間隔でエラーレポート送信
    setInterval(() => {
      this.sendErrorReport();
    }, 5 * 60 * 1000);
  }
  
  private sendErrorReport(): void {
    if (this.errorQueue.length === 0) return;
    
    // バッチでエラー送信
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    console.log(`📊 Sending error report: ${errors.length} errors`);
    
    // 外部エラートラッキングサービス（Sentry等）に送信
    this.sendToExternalService(errors);
  }
  
  private sendToExternalService(errors: ErrorEvent[]): void {
    // Sentry、LogRocket、Bugsnag等への送信ロジック
    console.log('🔗 Sending to external error tracking service:', errors.length);
  }
  
  // ユーティリティメソッド
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 公開メソッド
  public getErrorStats() {
    return {
      totalErrors: this.errorQueue.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      sessionId: this.sessionId
    };
  }
  
  public markErrorResolved(errorId: string): void {
    const error = this.errorQueue.find(err => err.id === errorId);
    if (error) {
      error.resolved = true;
      console.log(`✅ Error marked as resolved: ${errorId}`);
    }
  }
}

// =====================================
// 予約システム専用エラートラッキング
// =====================================

export class ReservationErrorTracker {
  private static errorTracker = ErrorTrackingManager.getInstance();
  
  // 予約作成エラー
  static captureReservationError(
    action: 'create' | 'update' | 'cancel' | 'search',
    error: Error,
    tenantId: string,
    userId?: string,
    context?: Record<string, any>
  ): void {
    this.errorTracker.captureError({
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.BUSINESS_LOGIC,
      message: `Reservation ${action} failed: ${error.message}`,
      stack: error.stack,
      tenantId,
      userId,
      context: {
        action,
        reservationSystem: true,
        ...context
      }
    });
  }
  
  // 認証エラー
  static captureAuthError(error: Error, context?: Record<string, any>): void {
    this.errorTracker.captureError({
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTHENTICATION,
      message: `Authentication failed: ${error.message}`,
      stack: error.stack,
      context: {
        authSystem: true,
        ...context
      }
    });
  }
  
  // データベースエラー
  static captureDatabaseError(
    operation: string,
    error: Error,
    tenantId: string,
    context?: Record<string, any>
  ): void {
    this.errorTracker.captureError({
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.DATABASE,
      message: `Database ${operation} failed: ${error.message}`,
      stack: error.stack,
      tenantId,
      context: {
        operation,
        database: 'firestore',
        ...context
      }
    });
  }
}

// 自動初期化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ErrorTrackingManager.getInstance();
  });
}