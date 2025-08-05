/**
 * アクセシビリティバリデーター
 * WCAG 2.1準拠のアクセシビリティチェック・改善提案
 */

interface AccessibilityCheckResult {
  passed: boolean
  level: 'A' | 'AA' | 'AAA'
  guideline: string
  message: string
  elements?: Element[]
  recommendation?: string
}

interface AccessibilityReport {
  overall: 'compliant' | 'partial' | 'non-compliant'
  score: number
  checks: AccessibilityCheckResult[]
  summary: {
    total: number
    passed: number
    failed: number
    levelA: number
    levelAA: number
    levelAAA: number
  }
}

export class AccessibilityValidator {
  /**
   * セマンティックHTML構造チェック
   */
  static validateSemanticStructure(): AccessibilityCheckResult[] {
    const checks: AccessibilityCheckResult[] = []

    if (!process.client) return checks

    // ヘッダー構造チェック (WCAG 2.1 - 1.3.1)
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    const hasH1 = headings.some(h => h.tagName === 'H1')
    
    checks.push({
      passed: hasH1,
      level: 'A',
      guideline: 'WCAG 2.1 - 1.3.1 Info and Relationships',
      message: hasH1 ? 'Page has proper heading structure' : 'Page missing H1 heading',
      elements: hasH1 ? [] : [document.body],
      recommendation: hasH1 ? undefined : 'Add H1 heading to establish page hierarchy'
    })

    // ランドマーク要素チェック (WCAG 2.1 - 2.4.1)
    const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section[aria-label], section[aria-labelledby]')
    checks.push({
      passed: landmarks.length > 0,
      level: 'A',
      guideline: 'WCAG 2.1 - 2.4.1 Bypass Blocks',
      message: landmarks.length > 0 ? 'Page has landmark elements' : 'Page lacks landmark elements',
      elements: landmarks.length > 0 ? Array.from(landmarks) : [document.body],
      recommendation: landmarks.length > 0 ? undefined : 'Add landmark elements (main, nav, header, footer)'
    })

    // リスト構造チェック (WCAG 2.1 - 1.3.1)
    const improperLists = Array.from(document.querySelectorAll('div')).filter(div => {
      const text = div.textContent || ''
      return /^[\d\w]\.\s|^[-•*]\s/.test(text.trim())
    })

    if (improperLists.length > 0) {
      checks.push({
        passed: false,
        level: 'A',
        guideline: 'WCAG 2.1 - 1.3.1 Info and Relationships',
        message: 'Potential list content not properly marked up',
        elements: improperLists,
        recommendation: 'Use proper list elements (ul, ol, li) for list content'
      })
    }

    return checks
  }

  /**
   * キーボードアクセシビリティチェック
   */
  static validateKeyboardAccessibility(): AccessibilityCheckResult[] {
    const checks: AccessibilityCheckResult[] = []

    if (!process.client) return checks

    // フォーカス可能な要素チェック (WCAG 2.1 - 2.1.1)
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const visibleFocusableElements = Array.from(focusableElements).filter(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })

    checks.push({
      passed: visibleFocusableElements.length > 0,
      level: 'A',
      guideline: 'WCAG 2.1 - 2.1.1 Keyboard',
      message: `Found ${visibleFocusableElements.length} keyboard accessible elements`,
      elements: visibleFocusableElements,
      recommendation: visibleFocusableElements.length === 0 ? 'Ensure interactive elements are keyboard accessible' : undefined
    })

    // タブオーダーチェック (WCAG 2.1 - 2.4.3)
    const elementsWithTabindex = Array.from(document.querySelectorAll('[tabindex]'))
    const highTabindexElements = elementsWithTabindex.filter(el => {
      const tabindex = parseInt(el.getAttribute('tabindex') || '0')
      return tabindex > 0
    })

    checks.push({
      passed: highTabindexElements.length === 0,
      level: 'A',
      guideline: 'WCAG 2.1 - 2.4.3 Focus Order',
      message: highTabindexElements.length === 0 ? 'Natural tab order maintained' : 'Custom tab order may confuse users',
      elements: highTabindexElements,
      recommendation: highTabindexElements.length > 0 ? 'Use natural tab order instead of positive tabindex values' : undefined
    })

    // スキップリンクチェック (WCAG 2.1 - 2.4.1)
    const skipLinks = document.querySelectorAll('a[href^="#"]:first-child, .skip-link')
    checks.push({
      passed: skipLinks.length > 0,
      level: 'A',
      guideline: 'WCAG 2.1 - 2.4.1 Bypass Blocks',
      message: skipLinks.length > 0 ? 'Skip navigation links present' : 'No skip navigation links found',
      elements: Array.from(skipLinks),
      recommendation: skipLinks.length === 0 ? 'Add skip navigation links for keyboard users' : undefined
    })

    return checks
  }

  /**
   * 色・コントラストチェック
   */
  static validateColorContrast(): AccessibilityCheckResult[] {
    const checks: AccessibilityCheckResult[] = []

    if (!process.client) return checks

    // テキスト要素のコントラスト比計算
    const textElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label'))
      .filter(el => {
        const text = el.textContent?.trim()
        return text && text.length > 0
      })

    let lowContrastElements: Element[] = []

    textElements.forEach(element => {
      const style = window.getComputedStyle(element)
      const color = style.color
      const backgroundColor = style.backgroundColor

      // 簡易的なコントラスト比チェック（実際の実装ではより精密な計算が必要）
      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const colorLuminance = this.calculateLuminance(color)
        const bgLuminance = this.calculateLuminance(backgroundColor)
        const contrastRatio = this.calculateContrastRatio(colorLuminance, bgLuminance)

        if (contrastRatio < 4.5) { // WCAG AA level
          lowContrastElements.push(element)
        }
      }
    })

    checks.push({
      passed: lowContrastElements.length === 0,
      level: 'AA',
      guideline: 'WCAG 2.1 - 1.4.3 Contrast (Minimum)',
      message: lowContrastElements.length === 0 ? 
        'All text meets minimum contrast requirements' : 
        `${lowContrastElements.length} elements may have insufficient contrast`,
      elements: lowContrastElements,
      recommendation: lowContrastElements.length > 0 ? 'Ensure text has at least 4.5:1 contrast ratio' : undefined
    })

    // 色だけに依存した情報伝達チェック (WCAG 2.1 - 1.4.1)
    const colorOnlyElements = Array.from(document.querySelectorAll('[style*="color"], .text-danger, .text-success, .text-warning'))
      .filter(el => {
        const text = el.textContent?.trim()
        return text && !text.includes('✓') && !text.includes('✗') && !text.includes('!') && !text.includes('警告') && !text.includes('エラー')
      })

    if (colorOnlyElements.length > 0) {
      checks.push({
        passed: false,
        level: 'A',
        guideline: 'WCAG 2.1 - 1.4.1 Use of Color',
        message: 'Some elements may rely solely on color to convey information',
        elements: colorOnlyElements,
        recommendation: 'Add icons, text, or other visual indicators alongside color'
      })
    }

    return checks
  }

  /**
   * フォームアクセシビリティチェック
   */
  static validateFormAccessibility(): AccessibilityCheckResult[] {
    const checks: AccessibilityCheckResult[] = []

    if (!process.client) return checks

    // ラベル関連付けチェック (WCAG 2.1 - 1.3.1, 3.3.2)
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
    const unlabeledInputs = inputs.filter(input => {
      const id = input.getAttribute('id')
      const hasLabel = id && document.querySelector(`label[for="${id}"]`)
      const hasAriaLabel = input.getAttribute('aria-label')
      const hasAriaLabelledby = input.getAttribute('aria-labelledby')
      
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledby
    })

    checks.push({
      passed: unlabeledInputs.length === 0,
      level: 'A',
      guideline: 'WCAG 2.1 - 1.3.1 Info and Relationships',
      message: unlabeledInputs.length === 0 ? 
        'All form controls have proper labels' : 
        `${unlabeledInputs.length} form controls lack proper labels`,
      elements: unlabeledInputs,
      recommendation: unlabeledInputs.length > 0 ? 'Associate labels with form controls using for/id or aria-label' : undefined
    })

    // 必須フィールド表示チェック (WCAG 2.1 - 3.3.2)
    const requiredInputs = Array.from(document.querySelectorAll('input[required], select[required], textarea[required]'))
    const requiredWithoutIndication = requiredInputs.filter(input => {
      const hasAriaRequired = input.getAttribute('aria-required') === 'true'
      const hasRequiredInLabel = input.labels?.[0]?.textContent?.includes('*') || 
                                 input.labels?.[0]?.textContent?.includes('必須')
      
      return !hasAriaRequired && !hasRequiredInLabel
    })

    if (requiredWithoutIndication.length > 0) {
      checks.push({
        passed: false,
        level: 'A',
        guideline: 'WCAG 2.1 - 3.3.2 Labels or Instructions',
        message: `${requiredWithoutIndication.length} required fields lack proper indication`,
        elements: requiredWithoutIndication,
        recommendation: 'Clearly indicate required fields with aria-required or visual indicators'
      })
    }

    // エラーメッセージチェック (WCAG 2.1 - 3.3.1, 3.3.3)
    const errorElements = document.querySelectorAll('.error, .invalid, [aria-invalid="true"]')
    const errorElementsWithoutDescription = Array.from(errorElements).filter(el => {
      const hasAriaDescribedby = el.getAttribute('aria-describedby')
      const hasErrorMessage = hasAriaDescribedby && document.getElementById(hasAriaDescribedby)
      
      return !hasErrorMessage
    })

    if (errorElementsWithoutDescription.length > 0) {
      checks.push({
        passed: false,
        level: 'A',
        guideline: 'WCAG 2.1 - 3.3.1 Error Identification',
        message: `${errorElementsWithoutDescription.length} error states lack proper descriptions`,
        elements: errorElementsWithoutDescription,
        recommendation: 'Associate error messages with form controls using aria-describedby'
      })
    }

    return checks
  }

  /**
   * 画像アクセシビリティチェック
   */
  static validateImageAccessibility(): AccessibilityCheckResult[] {
    const checks: AccessibilityCheckResult[] = []

    if (!process.client) return checks

    // alt属性チェック (WCAG 2.1 - 1.1.1)
    const images = Array.from(document.querySelectorAll('img'))
    const imagesWithoutAlt = images.filter(img => {
      const alt = img.getAttribute('alt')
      const hasAriaLabel = img.getAttribute('aria-label')
      const isDecorative = img.getAttribute('role') === 'presentation' || 
                          img.getAttribute('aria-hidden') === 'true'
      
      return alt === null && !hasAriaLabel && !isDecorative
    })

    checks.push({
      passed: imagesWithoutAlt.length === 0,
      level: 'A',
      guideline: 'WCAG 2.1 - 1.1.1 Non-text Content',
      message: imagesWithoutAlt.length === 0 ? 
        'All images have appropriate alternative text' : 
        `${imagesWithoutAlt.length} images lack alt attributes`,
      elements: imagesWithoutAlt,
      recommendation: imagesWithoutAlt.length > 0 ? 'Add descriptive alt text or mark decorative images appropriately' : undefined
    })

    // 複雑な画像チェック (WCAG 2.1 - 1.1.1)
    const complexImages = images.filter(img => {
      const alt = img.getAttribute('alt') || ''
      const src = img.getAttribute('src') || ''
      
      return (src.includes('chart') || src.includes('graph') || alt.includes('chart') || alt.includes('graph')) &&
             !img.getAttribute('longdesc') && !img.getAttribute('aria-describedby')
    })

    if (complexImages.length > 0) {
      checks.push({
        passed: false,
        level: 'A',
        guideline: 'WCAG 2.1 - 1.1.1 Non-text Content',
        message: `${complexImages.length} complex images may need detailed descriptions`,
        elements: complexImages,
        recommendation: 'Provide detailed descriptions for charts, graphs, and complex images'
      })
    }

    return checks
  }

  /**
   * ARIAアクセシビリティチェック
   */
  static validateARIA(): AccessibilityCheckResult[] {
    const checks: AccessibilityCheckResult[] = []

    if (!process.client) return checks

    // 無効なARIA属性チェック
    const validAriaAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 'aria-expanded',
      'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-selected', 'aria-checked',
      'aria-pressed', 'aria-invalid', 'aria-required', 'aria-disabled', 'aria-readonly',
      'aria-multiline', 'aria-autocomplete', 'aria-multiselectable', 'aria-orientation',
      'aria-sort', 'aria-level', 'aria-posinset', 'aria-setsize', 'aria-live', 'aria-relevant',
      'aria-atomic', 'aria-busy', 'aria-dropeffect', 'aria-grabbed', 'role'
    ]

    const elementsWithAria = Array.from(document.querySelectorAll('[aria-*], [role]'))
    const invalidAriaElements = elementsWithAria.filter(el => {
      const attributes = Array.from(el.attributes)
      return attributes.some(attr => 
        attr.name.startsWith('aria-') && !validAriaAttributes.includes(attr.name)
      )
    })

    if (invalidAriaElements.length > 0) {
      checks.push({
        passed: false,
        level: 'A',
        guideline: 'WCAG 2.1 - 4.1.2 Name, Role, Value',
        message: `${invalidAriaElements.length} elements have invalid ARIA attributes`,
        elements: invalidAriaElements,
        recommendation: 'Use only valid ARIA attributes and roles'
      })
    }

    // ARIA参照の整合性チェック
    const ariaReferences = Array.from(document.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls], [aria-owns]'))
    const brokenReferences = ariaReferences.filter(el => {
      const labelledby = el.getAttribute('aria-labelledby')?.split(' ') || []
      const describedby = el.getAttribute('aria-describedby')?.split(' ') || []
      const controls = el.getAttribute('aria-controls')?.split(' ') || []
      const owns = el.getAttribute('aria-owns')?.split(' ') || []
      
      const allRefs = [...labelledby, ...describedby, ...controls, ...owns].filter(Boolean)
      
      return allRefs.some(id => !document.getElementById(id))
    })

    if (brokenReferences.length > 0) {
      checks.push({
        passed: false,
        level: 'A',
        guideline: 'WCAG 2.1 - 4.1.2 Name, Role, Value',
        message: `${brokenReferences.length} elements have broken ARIA references`,
        elements: brokenReferences,
        recommendation: 'Ensure all ARIA references point to existing elements'
      })
    }

    return checks
  }

  /**
   * 総合アクセシビリティ評価
   */
  static performAccessibilityAudit(): AccessibilityReport {
    const allChecks: AccessibilityCheckResult[] = []
    
    // 各種アクセシビリティチェック実行
    allChecks.push(...this.validateSemanticStructure())
    allChecks.push(...this.validateKeyboardAccessibility())
    allChecks.push(...this.validateColorContrast())
    allChecks.push(...this.validateFormAccessibility())
    allChecks.push(...this.validateImageAccessibility())
    allChecks.push(...this.validateARIA())

    // 統計計算
    const total = allChecks.length
    const passed = allChecks.filter(check => check.passed).length
    const failed = total - passed
    
    const levelA = allChecks.filter(check => check.level === 'A').length
    const levelAA = allChecks.filter(check => check.level === 'AA').length
    const levelAAA = allChecks.filter(check => check.level === 'AAA').length

    // スコア計算
    const score = total > 0 ? Math.round((passed / total) * 100) : 100

    // 総合評価判定
    let overall: AccessibilityReport['overall']
    if (score >= 90) {
      overall = 'compliant'
    } else if (score >= 70) {
      overall = 'partial'
    } else {
      overall = 'non-compliant'
    }

    return {
      overall,
      score,
      checks: allChecks,
      summary: {
        total,
        passed,
        failed,
        levelA,
        levelAA,
        levelAAA
      }
    }
  }

  /**
   * ヘルパーメソッド: 輝度計算
   */
  private static calculateLuminance(color: string): number {
    // 簡易的な輝度計算（実際の実装ではより精密な計算が必要）
    const rgb = color.match(/\d+/g)
    if (!rgb || rgb.length < 3) return 0

    const [r, g, b] = rgb.map(Number)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }

  /**
   * ヘルパーメソッド: コントラスト比計算
   */
  private static calculateContrastRatio(lum1: number, lum2: number): number {
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  }

  /**
   * アクセシビリティレポート生成
   */
  static generateAccessibilityReport(): string {
    const audit = this.performAccessibilityAudit()
    
    const reportLines = [
      '# アクセシビリティ監査レポート',
      '',
      `## 総合評価: ${audit.overall.toUpperCase()}`,
      `## アクセシビリティスコア: ${audit.score}/100`,
      '',
      '## 統計:',
      `- 総チェック数: ${audit.summary.total}`,
      `- 合格: ${audit.summary.passed}`,
      `- 不合格: ${audit.summary.failed}`,
      `- レベルA: ${audit.summary.levelA}`,
      `- レベルAA: ${audit.summary.levelAA}`,
      `- レベルAAA: ${audit.summary.levelAAA}`,
      '',
      '## 検査結果詳細:',
      ''
    ]

    audit.checks.forEach((check, index) => {
      const status = check.passed ? '✅ PASS' : '❌ FAIL'
      const level = `[${check.level}]`
      reportLines.push(`${index + 1}. ${status} ${level}: ${check.message}`)
      reportLines.push(`   📋 ガイドライン: ${check.guideline}`)
      
      if (check.elements && check.elements.length > 0) {
        reportLines.push(`   🎯 対象要素: ${check.elements.length}個`)
      }
      
      if (check.recommendation) {
        reportLines.push(`   💡 推奨: ${check.recommendation}`)
      }
      reportLines.push('')
    })

    reportLines.push(`## 生成日時: ${new Date().toISOString()}`)

    return reportLines.join('\n')
  }
}