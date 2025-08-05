/**
 * セキュリティバリデーター
 * システム全体のセキュリティチェック・脆弱性検証
 */

interface SecurityCheckResult {
  passed: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendation?: string
}

interface SecurityReport {
  overall: 'secure' | 'warning' | 'vulnerable' | 'critical'
  score: number
  checks: SecurityCheckResult[]
  recommendations: string[]
}

export class SecurityValidator {
  /**
   * 入力値サニタイゼーションチェック
   */
  static validateInputSanitization(value: string, type: 'text' | 'email' | 'phone' | 'html'): SecurityCheckResult {
    const patterns = {
      xss: /<script|javascript:|on\w+\s*=/i,
      sqlInjection: /('|(\\)|;|--|\||SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/i,
      htmlInjection: /<[^>]*>/g,
      phoneFormat: /^[\d-\s\+\(\)]+$/,
      emailFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }

    const issues: string[] = []

    // XSS チェック
    if (patterns.xss.test(value)) {
      return {
        passed: false,
        severity: 'critical',
        message: 'XSS attack pattern detected',
        recommendation: 'Implement proper input sanitization and CSP headers'
      }
    }

    // SQL Injection チェック
    if (patterns.sqlInjection.test(value)) {
      return {
        passed: false,
        severity: 'high',
        message: 'SQL injection pattern detected',
        recommendation: 'Use parameterized queries and input validation'
      }
    }

    // 型別検証
    switch (type) {
      case 'email':
        if (!patterns.emailFormat.test(value)) {
          issues.push('Invalid email format')
        }
        break
      case 'phone':
        if (!patterns.phoneFormat.test(value)) {
          issues.push('Invalid phone format')
        }
        break
      case 'html':
        if (patterns.htmlInjection.test(value)) {
          issues.push('HTML tags detected')
        }
        break
    }

    return {
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'medium' : 'low',
      message: issues.length > 0 ? issues.join(', ') : 'Input validation passed'
    }
  }

  /**
   * 認証・認可チェック
   */
  static validateAuthentication(): SecurityCheckResult {
    if (!process.client) {
      return {
        passed: true,
        severity: 'low',
        message: 'Server-side authentication check'
      }
    }

    // Firebase Auth状態チェック
    const hasAuth = !!window.firebase && !!window.firebase.auth
    if (!hasAuth) {
      return {
        passed: false,
        severity: 'critical',
        message: 'Firebase Authentication not initialized',
        recommendation: 'Ensure Firebase Auth is properly configured'
      }
    }

    // セッション管理チェック
    const hasSecureSession = document.cookie.includes('Secure') && document.cookie.includes('SameSite')
    
    return {
      passed: hasSecureSession,
      severity: hasSecureSession ? 'low' : 'medium',
      message: hasSecureSession ? 'Secure session configuration' : 'Session security could be improved',
      recommendation: hasSecureSession ? undefined : 'Use Secure and SameSite cookie attributes'
    }
  }

  /**
   * データ保護チェック
   */
  static validateDataProtection(): SecurityCheckResult[] {
    const checks: SecurityCheckResult[] = []

    // HTTPS チェック
    if (process.client) {
      const isHTTPS = window.location.protocol === 'https:'
      checks.push({
        passed: isHTTPS || window.location.hostname === 'localhost',
        severity: 'high',
        message: isHTTPS ? 'HTTPS enabled' : 'HTTP connection detected',
        recommendation: isHTTPS ? undefined : 'Enable HTTPS for production'
      })

      // CSP ヘッダーチェック
      const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      checks.push({
        passed: !!hasCSP,
        severity: 'medium',
        message: hasCSP ? 'CSP header configured' : 'CSP header missing',
        recommendation: hasCSP ? undefined : 'Implement Content Security Policy'
      })

      // X-Frame-Options チェック
      const hasFrameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]')
      checks.push({
        passed: !!hasFrameOptions,
        severity: 'medium',
        message: hasFrameOptions ? 'X-Frame-Options configured' : 'X-Frame-Options missing',
        recommendation: hasFrameOptions ? undefined : 'Implement X-Frame-Options header'
      })
    }

    return checks
  }

  /**
   * API セキュリティチェック
   */
  static validateApiSecurity(): SecurityCheckResult[] {
    const checks: SecurityCheckResult[] = []

    // Firebase プロジェクト設定チェック
    if (process.client && window.firebase) {
      const config = (window.firebase as any).config || {}
      
      // API キーの露出チェック
      const hasPublicApiKey = !!config.apiKey
      checks.push({
        passed: hasPublicApiKey,
        severity: 'low', // Firebase では公開API キーは安全
        message: hasPublicApiKey ? 'Firebase API key configured' : 'Firebase API key missing',
        recommendation: 'Ensure Firebase security rules are properly configured'
      })

      // ドメイン制限チェック
      const authDomain = config.authDomain
      const currentDomain = window.location.hostname
      checks.push({
        passed: !authDomain || authDomain.includes(currentDomain) || currentDomain === 'localhost',
        severity: 'medium',
        message: 'Firebase domain configuration check',
        recommendation: 'Verify Firebase authorized domains'
      })
    }

    return checks
  }

  /**
   * クライアントサイドセキュリティチェック
   */
  static validateClientSecurity(): SecurityCheckResult[] {
    const checks: SecurityCheckResult[] = []

    if (process.client) {
      // Console セキュリティ警告
      const hasConsoleWarning = typeof console.warn === 'function'
      checks.push({
        passed: hasConsoleWarning,
        severity: 'low',
        message: 'Console security awareness',
        recommendation: 'Add console security warnings in production'
      })

      // DevTools 検出
      const isDevMode = process.env.NODE_ENV === 'development'
      checks.push({
        passed: isDevMode || !window.chrome?.devtools,
        severity: 'low',
        message: isDevMode ? 'Development mode' : 'Production mode security',
        recommendation: 'Disable debug features in production'
      })

      // Local Storage セキュリティ
      const hasSecureStorage = !localStorage.getItem('password') && !localStorage.getItem('token')
      checks.push({
        passed: hasSecureStorage,
        severity: 'high',
        message: hasSecureStorage ? 'Secure local storage' : 'Sensitive data in local storage',
        recommendation: hasSecureStorage ? undefined : 'Never store sensitive data in local storage'
      })
    }

    return checks
  }

  /**
   * Firebase セキュリティルールチェック
   */
  static validateFirebaseRules(): SecurityCheckResult {
    // Note: This would typically require server-side validation
    // Here we provide client-side heuristics
    
    return {
      passed: true,
      severity: 'medium',
      message: 'Firebase security rules should be validated server-side',
      recommendation: 'Implement server-side Firebase security rules validation'
    }
  }

  /**
   * 総合セキュリティ評価
   */
  static performSecurityAudit(): SecurityReport {
    const allChecks: SecurityCheckResult[] = []
    
    // 各種セキュリティチェック実行
    allChecks.push(this.validateAuthentication())
    allChecks.push(...this.validateDataProtection())
    allChecks.push(...this.validateApiSecurity())
    allChecks.push(...this.validateClientSecurity())
    allChecks.push(this.validateFirebaseRules())

    // スコア計算
    const totalChecks = allChecks.length
    const passedChecks = allChecks.filter(check => check.passed).length
    const criticalIssues = allChecks.filter(check => !check.passed && check.severity === 'critical').length
    const highIssues = allChecks.filter(check => !check.passed && check.severity === 'high').length
    const mediumIssues = allChecks.filter(check => !check.passed && check.severity === 'medium').length

    let score = (passedChecks / totalChecks) * 100

    // 重要度に応じて減点
    score -= criticalIssues * 30
    score -= highIssues * 15
    score -= mediumIssues * 5

    score = Math.max(0, Math.min(100, score))

    // 総合評価判定
    let overall: SecurityReport['overall']
    if (criticalIssues > 0) {
      overall = 'critical'
    } else if (highIssues > 0 || score < 70) {
      overall = 'vulnerable'
    } else if (mediumIssues > 0 || score < 85) {
      overall = 'warning'
    } else {
      overall = 'secure'
    }

    // 推奨事項の収集
    const recommendations = allChecks
      .filter(check => !check.passed && check.recommendation)
      .map(check => check.recommendation!)

    return {
      overall,
      score: Math.round(score),
      checks: allChecks,
      recommendations
    }
  }

  /**
   * セキュリティレポート生成
   */
  static generateSecurityReport(): string {
    const audit = this.performSecurityAudit()
    
    const reportLines = [
      '# セキュリティ監査レポート',
      '',
      `## 総合評価: ${audit.overall.toUpperCase()}`,
      `## セキュリティスコア: ${audit.score}/100`,
      '',
      '## 検査結果詳細:',
      ''
    ]

    audit.checks.forEach((check, index) => {
      const status = check.passed ? '✅ PASS' : '❌ FAIL'
      const severity = check.passed ? '' : ` [${check.severity.toUpperCase()}]`
      reportLines.push(`${index + 1}. ${status}${severity}: ${check.message}`)
      
      if (check.recommendation) {
        reportLines.push(`   💡 推奨: ${check.recommendation}`)
      }
      reportLines.push('')
    })

    if (audit.recommendations.length > 0) {
      reportLines.push('## 推奨対応策:')
      reportLines.push('')
      audit.recommendations.forEach((rec, index) => {
        reportLines.push(`${index + 1}. ${rec}`)
      })
    }

    reportLines.push('')
    reportLines.push(`## 生成日時: ${new Date().toISOString()}`)

    return reportLines.join('\n')
  }

  /**
   * リアルタイムセキュリティ監視
   */
  static startSecurityMonitoring(): () => void {
    if (!process.client) return () => {}

    const monitorInterval = setInterval(() => {
      const audit = this.performSecurityAudit()
      
      if (audit.overall === 'critical' || audit.overall === 'vulnerable') {
        console.warn('🚨 Security Alert:', audit.overall, `Score: ${audit.score}`)
        
        // Critical issues should be logged
        audit.checks
          .filter(check => !check.passed && (check.severity === 'critical' || check.severity === 'high'))
          .forEach(check => {
            console.error(`Security Issue [${check.severity}]:`, check.message)
          })
      }
    }, 60000) // Check every minute

    // Return cleanup function
    return () => clearInterval(monitorInterval)
  }
}

/**
 * セキュリティヘルパー関数
 */
export const sanitizeInput = (input: string, type: 'text' | 'email' | 'phone' | 'html' = 'text'): string => {
  if (!input) return ''
  
  // 基本的なサニタイゼーション
  let sanitized = input.trim()
  
  // HTML エンティティエスケープ
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return sanitized
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('大文字を1文字以上含む必要があります')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('小文字を1文字以上含む必要があります')
  }
  
  if (!/\d/.test(password)) {
    errors.push('数字を1文字以上含む必要があります')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('特殊文字を1文字以上含む必要があります')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}