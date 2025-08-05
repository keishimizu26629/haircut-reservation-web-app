/**
 * Firebase Performance Monitoring 本番環境設定
 * Enterprise Grade Performance Monitoring System
 */

import { getPerformance, trace, Trace } from 'firebase/performance';
import { getApp } from 'firebase/app';

// =====================================
// パフォーマンス監視設定
// =====================================

export interface PerformanceConfig {
  // 基本設定
  enabled: boolean;
  dataCollectionEnabled: boolean;
  instrumentationEnabled: boolean;
  
  // 詳細設定
  httpMetricsEnabled: boolean;
  screenTracingEnabled: boolean;
  automaticTracingEnabled: boolean;
  
  // カスタムメトリクス
  customMetricsEnabled: boolean;
  maxCustomMetrics: number;
  
  // サンプリング設定
  traceSamplingRate: number;
  networkRequestSamplingRate: number;
  
  // アラート設定
  slowResponseThreshold: number;
  errorRateThreshold: number;
  memoryUsageThreshold: number;
}

export const performanceConfig: PerformanceConfig = {
  // 本番環境では全て有効
  enabled: true,
  dataCollectionEnabled: true,
  instrumentationEnabled: true,
  
  // HTTP・画面トレース有効
  httpMetricsEnabled: true,
  screenTracingEnabled: true,
  automaticTracingEnabled: true,
  
  // カスタムメトリクス有効
  customMetricsEnabled: true,
  maxCustomMetrics: 100,
  
  // 本番環境サンプリング（高品質監視）
  traceSamplingRate: 1.0,      // 100%サンプリング
  networkRequestSamplingRate: 1.0, // 100%サンプリング
  
  // パフォーマンスアラート閾値
  slowResponseThreshold: 3000,  // 3秒
  errorRateThreshold: 0.01,     // 1%
  memoryUsageThreshold: 80,     // 80%
};

// =====================================
// Performance Monitoring初期化
// =====================================

let performanceInstance: any = null;
let isInitialized = false;

export function initializePerformanceMonitoring(): void {
  if (isInitialized) {
    console.log('🔥 Performance Monitoring already initialized');
    return;
  }
  
  try {
    const app = getApp();
    performanceInstance = getPerformance(app);
    
    // データ収集有効化
    if (performanceConfig.dataCollectionEnabled) {
      // Performance monitoring automatic data collection
      console.log('📊 Performance data collection enabled');
    }
    
    isInitialized = true;
    console.log('✅ Firebase Performance Monitoring initialized successfully');
    
  } catch (error) {
    console.error('❌ Performance Monitoring initialization failed:', error);
    throw new Error(`Performance Monitoring setup failed: ${error}`);
  }
}

// =====================================
// カスタムトレース機能
// =====================================

export class CustomTrace {
  private trace: Trace;
  private startTime: number;
  private metrics: Map<string, number> = new Map();
  
  constructor(traceName: string) {
    if (!performanceInstance) {
      throw new Error('Performance monitoring not initialized');
    }
    
    this.trace = trace(performanceInstance, traceName);
    this.startTime = Date.now();
    this.trace.start();
    
    console.log(`🔍 Custom trace started: ${traceName}`);
  }
  
  // カスタムメトリクス追加
  putMetric(metricName: string, value: number): void {
    this.trace.putMetric(metricName, value);
    this.metrics.set(metricName, value);
    console.log(`📈 Custom metric: ${metricName} = ${value}`);
  }
  
  // 属性追加
  putAttribute(attributeName: string, attributeValue: string): void {
    this.trace.putAttribute(attributeName, attributeValue);
    console.log(`🏷️ Trace attribute: ${attributeName} = ${attributeValue}`);
  }
  
  // トレース終了
  stop(): void {
    const duration = Date.now() - this.startTime;
    this.trace.putMetric('duration_ms', duration);
    this.trace.stop();
    
    console.log(`✅ Custom trace completed in ${duration}ms`);
    
    // パフォーマンス警告チェック
    if (duration > performanceConfig.slowResponseThreshold) {
      console.warn(`⚠️ Slow performance detected: ${duration}ms > ${performanceConfig.slowResponseThreshold}ms`);
      this.reportSlowPerformance(duration);
    }
  }
  
  private reportSlowPerformance(duration: number): void {
    // Slack通知やアラート送信のロジック
    console.warn(`🚨 Performance Alert: Slow operation detected (${duration}ms)`);
  }
}

// =====================================
// 予約システム固有のトレース
// =====================================

export class ReservationPerformanceTracker {
  
  // 予約作成パフォーマンス追跡
  static async trackReservationCreation<T>(
    tenantId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const trace = new CustomTrace('reservation_creation');
    trace.putAttribute('tenant_id', tenantId);
    trace.putAttribute('operation_type', 'create');
    
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;
      
      trace.putMetric('operation_duration', duration);
      trace.putMetric('success_flag', 1);
      
      return result;
    } catch (error) {
      trace.putMetric('error_flag', 1);
      trace.putAttribute('error_type', error instanceof Error ? error.name : 'Unknown');
      throw error;
    } finally {
      trace.stop();
    }
  }
  
  // 予約検索パフォーマンス追跡
  static async trackReservationSearch<T>(
    tenantId: string,
    searchParams: Record<string, any>,
    operation: () => Promise<T>
  ): Promise<T> {
    const trace = new CustomTrace('reservation_search');
    trace.putAttribute('tenant_id', tenantId);
    trace.putAttribute('search_type', JSON.stringify(searchParams));
    
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;
      
      trace.putMetric('search_duration', duration);
      trace.putMetric('results_count', Array.isArray(result) ? result.length : 1);
      
      return result;
    } catch (error) {
      trace.putMetric('search_error', 1);
      throw error;
    } finally {
      trace.stop();
    }
  }
}

// =====================================
// ネットワークパフォーマンス監視
// =====================================

export class NetworkPerformanceMonitor {
  
  // HTTP リクエスト監視
  static monitorHttpRequest(url: string, method: string): {
    start: () => void;
    success: (responseSize: number) => void;
    error: (errorCode: string) => void;
  } {
    const trace = new CustomTrace(`http_${method.toLowerCase()}_request`);
    trace.putAttribute('url', url);
    trace.putAttribute('method', method);
    
    const startTime = Date.now();
    
    return {
      start: () => {
        trace.putAttribute('request_start', new Date().toISOString());
      },
      
      success: (responseSize: number) => {
        const duration = Date.now() - startTime;
        trace.putMetric('request_duration', duration);
        trace.putMetric('response_size', responseSize);
        trace.putMetric('success_flag', 1);
        trace.stop();
      },
      
      error: (errorCode: string) => {
        const duration = Date.now() - startTime;
        trace.putMetric('request_duration', duration);
        trace.putMetric('error_flag', 1);
        trace.putAttribute('error_code', errorCode);
        trace.stop();
      }
    };
  }
}

// =====================================
// メモリ使用量監視
// =====================================

export class MemoryMonitor {
  private static monitoringInterval: NodeJS.Timeout | null = null;
  
  static startMemoryMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('📊 Memory monitoring already running');
      return;
    }
    
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // 30秒間隔
    
    console.log('🧠 Memory monitoring started');
  }
  
  static stopMemoryMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🧠 Memory monitoring stopped');
    }
  }
  
  private static checkMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.totalJSHeapSize;
      const usagePercent = (usedMemory / totalMemory) * 100;
      
      // カスタムメトリクスとして送信
      const trace = new CustomTrace('memory_usage_check');
      trace.putMetric('used_memory_bytes', usedMemory);
      trace.putMetric('total_memory_bytes', totalMemory);
      trace.putMetric('usage_percent', usagePercent);
      trace.stop();
      
      // 閾値チェック
      if (usagePercent > performanceConfig.memoryUsageThreshold) {
        console.warn(`⚠️ High memory usage detected: ${usagePercent.toFixed(2)}%`);
        this.reportHighMemoryUsage(usagePercent);
      }
    }
  }
  
  private static reportHighMemoryUsage(usagePercent: number): void {
    console.warn(`🚨 Memory Alert: High memory usage (${usagePercent.toFixed(2)}%)`);
    // アラート送信ロジック
  }
}

// =====================================
// エクスポート用ユーティリティ
// =====================================

export {
  initializePerformanceMonitoring,
  CustomTrace,
  ReservationPerformanceTracker,
  NetworkPerformanceMonitor,
  MemoryMonitor
};

// 本番環境での自動初期化
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // DOMContentLoaded後に初期化
  document.addEventListener('DOMContentLoaded', () => {
    initializePerformanceMonitoring();
    MemoryMonitor.startMemoryMonitoring();
  });
}