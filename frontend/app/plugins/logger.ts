/**
 * 統合ログシステム
 * 商用運用品質保証のための統一ログ管理
 */

interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface LogEntry {
  level: keyof LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  source?: string
  userId?: string
  sessionId?: string
}

class Logger {
  private isDevelopment: boolean
  private sessionId: string
  private userId?: string

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    context?: Record<string, any>,
    source?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      source,
      userId: this.userId,
      sessionId: this.sessionId
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''
    const sourceStr = entry.source ? ` | Source: ${entry.source}` : ''
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${sourceStr}${contextStr}`
  }

  private shouldLog(level: keyof LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // Production: only log warnings and errors
    return level === 'ERROR' || level === 'WARN'
  }

  public setUserId(userId: string): void {
    this.userId = userId
  }

  public error(message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog('ERROR')) return
    
    const entry = this.createLogEntry('ERROR', message, context, source)
    console.error(this.formatLogMessage(entry))
    
    // Send to error tracking service in production
    if (!this.isDevelopment && typeof window !== 'undefined') {
      this.sendToErrorTracking(entry)
    }
  }

  public warn(message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog('WARN')) return
    
    const entry = this.createLogEntry('WARN', message, context, source)
    console.warn(this.formatLogMessage(entry))
  }

  public info(message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog('INFO')) return
    
    const entry = this.createLogEntry('INFO', message, context, source)
    console.info(this.formatLogMessage(entry))
  }

  public debug(message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog('DEBUG')) return
    
    const entry = this.createLogEntry('DEBUG', message, context, source)
    console.debug(this.formatLogMessage(entry))
  }

  // Firebase specific logging
  public firebaseOperation(
    operation: string,
    success: boolean,
    duration?: number,
    context?: Record<string, any>
  ): void {
    const message = `Firebase ${operation} ${success ? 'succeeded' : 'failed'}`
    const logContext = {
      ...context,
      operation,
      success,
      duration: duration ? `${Math.round(duration)}ms` : undefined
    }

    if (success) {
      this.info(message, logContext, 'Firebase')
    } else {
      this.error(message, logContext, 'Firebase')
    }
  }

  // User action logging
  public userAction(action: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, context, 'UserAction')
  }

  // Performance logging
  public performance(metric: string, value: number, context?: Record<string, any>): void {
    const message = `Performance metric: ${metric} = ${value}ms`
    const logContext = { ...context, metric, value, unit: 'ms' }
    
    if (value > 1000) { // Log slow operations as warnings
      this.warn(message, logContext, 'Performance')
    } else {
      this.debug(message, logContext, 'Performance')
    }
  }

  private sendToErrorTracking(entry: LogEntry): void {
    // Placeholder for error tracking service integration
    // Replace with your preferred service (Sentry, LogRocket, etc.)
    try {
      // Example: Send to external logging service
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(() => {
        // Silently fail - don't break the app for logging issues
      })
    } catch {
      // Silently fail
    }
  }
}

export default defineNuxtPlugin(() => {
  const logger = new Logger()

  // Override console methods in production to use our logger
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      log: console.log
    }

    console.error = (message: any, ...args: any[]) => {
      logger.error(String(message), { args })
      originalConsole.error(message, ...args)
    }

    console.warn = (message: any, ...args: any[]) => {
      logger.warn(String(message), { args })
      originalConsole.warn(message, ...args)
    }

    // Suppress info and log in production
    console.info = () => {}
    console.log = () => {}
  }

  // Track unhandled errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logger.error('Unhandled JavaScript error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, 'GlobalErrorHandler')
    })

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled Promise rejection', {
        reason: event.reason,
        promise: String(event.promise)
      }, 'GlobalErrorHandler')
    })
  }

  return {
    provide: {
      logger
    }
  }
})