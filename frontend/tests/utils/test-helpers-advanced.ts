// 高度なテストヘルパー関数群 - E2Eテスト用の拡張ユーティリティ

import { mount, MountingOptions, VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'
import { createPinia } from 'pinia'

// === 拡張マウントオプション ===

/**
 * E2Eテスト用の拡張マウントオプション
 */
export const createAdvancedMountOptions = (overrides: Partial<MountingOptions<any>> = {}): MountingOptions<any> => {
  return {
    global: {
      plugins: [createPinia()],
      mocks: {
        $router: {
          push: vi.fn(),
          replace: vi.fn(),
          go: vi.fn(),
          back: vi.fn(),
          forward: vi.fn(),
          currentRoute: { value: { path: '/', params: {}, query: {} } }
        },
        $route: {
          path: '/',
          params: {},
          query: {},
          hash: '',
          name: null,
          fullPath: '/',
          matched: []
        },
        $nuxt: {
          $fetch: vi.fn(),
          ssrContext: {},
          isHydrating: false,
          payload: {}
        },
        $i18n: {
          t: (key: string) => key,
          locale: 'ja',
          locales: ['ja', 'en']
        }
      },
      stubs: {
        NuxtLink: true,
        Icon: true,
        teleport: true,
        Transition: false,
        TransitionGroup: false,
        KeepAlive: false,
        Suspense: false
      },
      directives: {
        // カスタムディレクティブのモック
        'click-outside': vi.fn(),
        tooltip: vi.fn()
      }
    },
    attachTo: document.body, // E2Eテストでは実際のDOMに追加
    ...overrides
  }
}

// === パフォーマンステストヘルパー ===

/**
 * レンダリングパフォーマンス測定
 */
export const measureRenderPerformance = async (
  renderFn: () => Promise<VueWrapper<any>>,
  iterations: number = 10
) => {
  const times: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()
    const wrapper = await renderFn()
    const endTime = performance.now()
    
    times.push(endTime - startTime)
    wrapper.unmount()
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
    raw: times
  }
}

/**
 * メモリ使用量監視
 */
export const createMemoryMonitor = () => {
  const snapshots: Array<{ timestamp: number; memory: number }> = []
  
  const takeSnapshot = () => {
    const memory = (performance as any).memory?.usedJSHeapSize || 0
    snapshots.push({
      timestamp: Date.now(),
      memory
    })
  }
  
  const getReport = () => {
    if (snapshots.length === 0) return null
    
    const memories = snapshots.map(s => s.memory)
    return {
      initial: memories[0],
      final: memories[memories.length - 1],
      peak: Math.max(...memories),
      average: memories.reduce((a, b) => a + b, 0) / memories.length,
      growth: memories[memories.length - 1] - memories[0],
      snapshots: [...snapshots]
    }
  }
  
  return { takeSnapshot, getReport }
}

// === 複雑なフォーム操作ヘルパー ===

/**
 * 複数ステップフォームの完了
 */
export const completeMultiStepForm = async (
  wrapper: VueWrapper<any>,
  steps: Array<{
    fields: Record<string, string>
    nextButton?: string
    validation?: () => void
  }>
) => {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    
    // フィールド入力
    for (const [selector, value] of Object.entries(step.fields)) {
      const field = wrapper.find(selector)
      if (field.exists()) {
        await field.setValue(value)
        await field.trigger('input')
        await field.trigger('blur')
      }
    }
    
    await wrapper.vm.$nextTick()
    
    // バリデーション実行
    if (step.validation) {
      step.validation()
    }
    
    // 次のステップへ
    if (step.nextButton && i < steps.length - 1) {
      const nextBtn = wrapper.find(step.nextButton)
      if (nextBtn.exists()) {
        await nextBtn.trigger('click')
        await wrapper.vm.$nextTick()
      }
    }
  }
}

/**
 * 動的フォームフィールドの操作
 */
export const manageDynamicFields = {
  async addField(wrapper: VueWrapper<any>, addButtonSelector: string, fieldData: Record<string, string>) {
    const addButton = wrapper.find(addButtonSelector)
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // 最後に追加されたフィールドグループを取得
    const fieldGroups = wrapper.findAll('[data-testid*="field-group"]')
    const lastGroup = fieldGroups[fieldGroups.length - 1]
    
    // フィールドに値を入力
    for (const [fieldName, value] of Object.entries(fieldData)) {
      const field = lastGroup.find(`[name*="${fieldName}"]`)
      if (field.exists()) {
        await field.setValue(value)
      }
    }
  },
  
  async removeField(wrapper: VueWrapper<any>, index: number) {
    const removeButtons = wrapper.findAll('[data-testid*="remove-field-button"]')
    if (removeButtons[index]) {
      await removeButtons[index].trigger('click')
      await wrapper.vm.$nextTick()
    }
  }
}

// === 高度なDOM操作ヘルパー ===

/**
 * 仮想スクロールのテスト
 */
export const testVirtualScrolling = async (
  wrapper: VueWrapper<any>,
  scrollContainer: string,
  expectedItemCount: number
) => {
  const container = wrapper.find(scrollContainer)
  const initialItems = wrapper.findAll('[data-testid*="virtual-item"]')
  
  // 下スクロール
  await container.trigger('scroll', { target: { scrollTop: 1000 } })
  await wrapper.vm.$nextTick()
  
  const afterScrollItems = wrapper.findAll('[data-testid*="virtual-item"]')
  
  return {
    initialRendered: initialItems.length,
    afterScrollRendered: afterScrollItems.length,
    isVirtualized: afterScrollItems.length < expectedItemCount
  }
}

/**
 * ドラッグ&ドロップのシミュレート
 */
export const simulateDragAndDrop = async (
  wrapper: VueWrapper<any>,
  sourceSelector: string,
  targetSelector: string
) => {
  const source = wrapper.find(sourceSelector)
  const target = wrapper.find(targetSelector)
  
  // ドラッグ開始
  await source.trigger('dragstart', {
    dataTransfer: {
      setData: vi.fn(),
      getData: vi.fn(),
      dropEffect: 'move'
    }
  })
  
  // ドラッグオーバー
  await target.trigger('dragover', {
    dataTransfer: { dropEffect: 'move' },
    preventDefault: vi.fn()
  })
  
  // ドロップ
  await target.trigger('drop', {
    dataTransfer: {
      getData: vi.fn().mockReturnValue('dragged-data'),
      dropEffect: 'move'
    },
    preventDefault: vi.fn()
  })
  
  await wrapper.vm.$nextTick()
}

// === 非同期状態管理テストヘルパー ===

/**
 * 非同期状態の変更を監視
 */
export const createStateWatcher = <T>(
  getter: () => T,
  expectedValue: T,
  timeout: number = 5000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      const currentValue = getter()
      
      if (currentValue === expectedValue) {
        resolve(currentValue)
        return
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`State did not change to expected value within ${timeout}ms. Current: ${currentValue}, Expected: ${expectedValue}`))
        return
      }
      
      setTimeout(check, 50)
    }
    
    check()
  })
}

/**
 * 複数の非同期操作の並列実行テスト
 */
export const testConcurrentOperations = async (
  operations: Array<() => Promise<any>>,
  expectedResults?: any[]
) => {
  const startTime = performance.now()
  const results = await Promise.allSettled(operations.map(op => op()))
  const endTime = performance.now()
  
  const analysis = {
    totalTime: endTime - startTime,
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results: results.map((result, index) => ({
      index,
      status: result.status,
      value: result.status === 'fulfilled' ? result.value : undefined,
      error: result.status === 'rejected' ? result.reason : undefined,
      expectedMatch: expectedResults ? 
        (result.status === 'fulfilled' && result.value === expectedResults[index]) : 
        undefined
    }))
  }
  
  return analysis
}

// === ネットワーク状況シミュレーション ===

/**
 * ネットワーク条件をシミュレート
 */
export const createNetworkSimulator = () => {
  const conditions = {
    online: { delay: 50, errorRate: 0 },
    slow: { delay: 2000, errorRate: 0.1 },
    offline: { delay: 0, errorRate: 1 },
    unstable: { delay: 1000, errorRate: 0.3 }
  }
  
  let currentCondition = 'online'
  
  const mockFetch = vi.fn().mockImplementation(async (...args) => {
    const condition = conditions[currentCondition as keyof typeof conditions]
    
    // 遅延シミュレート
    if (condition.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, condition.delay))
    }
    
    // エラーシミュレート
    if (Math.random() < condition.errorRate) {
      throw new Error(`Network error (${currentCondition} condition)`)
    }
    
    return { ok: true, json: () => Promise.resolve({ success: true }) }
  })
  
  return {
    setCondition: (condition: keyof typeof conditions) => {
      currentCondition = condition
    },
    getCurrentCondition: () => currentCondition,
    mockFetch,
    simulate: async (condition: keyof typeof conditions, operation: () => Promise<any>) => {
      const original = currentCondition
      currentCondition = condition
      try {
        return await operation()
      } finally {
        currentCondition = original
      }
    }
  }
}

// === アクセシビリティテストヘルパー ===

/**
 * キーボードナビゲーションテスト
 */
export const testKeyboardNavigation = async (
  wrapper: VueWrapper<any>,
  focusableElements: string[],
  keySequence: string[] = ['Tab']
) => {
  const results: Array<{ element: string; focused: boolean }> = []
  
  // 最初の要素にフォーカス
  if (focusableElements.length > 0) {
    const firstElement = wrapper.find(focusableElements[0])
    if (firstElement.exists()) {
      firstElement.element.focus()
    }
  }
  
  for (let i = 0; i < focusableElements.length; i++) {
    const currentElement = wrapper.find(focusableElements[i])
    const isFocused = document.activeElement === currentElement.element
    
    results.push({
      element: focusableElements[i],
      focused: isFocused
    })
    
    // 次の要素へのナビゲーション
    if (i < focusableElements.length - 1) {
      for (const key of keySequence) {
        await currentElement.trigger('keydown', { key })
      }
      await wrapper.vm.$nextTick()
    }
  }
  
  return results
}

/**
 * ARIA属性の包括的チェック
 */
export const validateAriaAttributes = (wrapper: VueWrapper<any>) => {
  const issues: Array<{ element: string; issue: string }> = []
  
  // aria-label が必要な要素のチェック
  const buttonsWithoutLabel = wrapper.findAll('button').filter(btn => 
    !btn.attributes('aria-label') && !btn.text().trim()
  )
  
  buttonsWithoutLabel.forEach((btn, index) => {
    issues.push({
      element: `button[${index}]`,
      issue: 'Button without accessible text or aria-label'
    })
  })
  
  // form要素のラベル関連付けチェック
  const inputsWithoutLabel = wrapper.findAll('input[type!="hidden"]').filter(input => {
    const id = input.attributes('id')
    const hasLabel = id && wrapper.find(`label[for="${id}"]`).exists()
    const hasAriaLabel = input.attributes('aria-label') || input.attributes('aria-labelledby')
    return !hasLabel && !hasAriaLabel
  })
  
  inputsWithoutLabel.forEach((input, index) => {
    issues.push({
      element: `input[${index}]`,
      issue: 'Input without associated label or aria-label'
    })
  })
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

// === レスポンシブデザインテストヘルパー ===

/**
 * ブレークポイントテスト
 */
export const testResponsiveBreakpoints = async (
  renderFn: () => Promise<VueWrapper<any>>,
  breakpoints: Array<{ name: string; width: number; height: number }>
) => {
  const results: Array<{
    breakpoint: string
    width: number
    height: number
    elements: Record<string, boolean>
  }> = []
  
  for (const bp of breakpoints) {
    // ビューポートサイズ設定
    Object.defineProperty(window, 'innerWidth', { value: bp.width, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: bp.height, configurable: true })
    window.dispatchEvent(new Event('resize'))
    
    const wrapper = await renderFn()
    
    // レスポンシブ要素の表示状態チェック
    const mobileMenu = wrapper.find('[data-testid="mobile-menu"]')
    const desktopMenu = wrapper.find('[data-testid="desktop-menu"]')
    const sidebar = wrapper.find('[data-testid="sidebar"]')
    
    results.push({
      breakpoint: bp.name,
      width: bp.width,
      height: bp.height,
      elements: {
        mobileMenu: mobileMenu.exists() && mobileMenu.isVisible(),
        desktopMenu: desktopMenu.exists() && desktopMenu.isVisible(),
        sidebar: sidebar.exists() && sidebar.isVisible()
      }
    })
    
    wrapper.unmount()
  }
  
  return results
}

// === セキュリティテストヘルパー ===

/**
 * XSS脆弱性のテスト
 */
export const testXSSPrevention = async (
  wrapper: VueWrapper<any>,
  inputSelector: string,
  maliciousInputs: string[]
) => {
  const results: Array<{
    input: string
    sanitized: boolean
    outputContent: string
  }> = []
  
  for (const maliciousInput of maliciousInputs) {
    const input = wrapper.find(inputSelector)
    await input.setValue(maliciousInput)
    await input.trigger('input')
    await wrapper.vm.$nextTick()
    
    // 出力内容を確認
    const outputElement = wrapper.find('[data-testid="user-input-display"]')
    const outputContent = outputElement.exists() ? outputElement.html() : ''
    
    // スクリプトタグが実際に実行されていないかチェック
    const containsUnsafeScript = outputContent.includes('<script') && 
                                !outputContent.includes('&lt;script')
    
    results.push({
      input: maliciousInput,
      sanitized: !containsUnsafeScript,
      outputContent
    })
  }
  
  return results
}

// === カスタムアサーション ===

/**
 * 複雑な状態のアサーション
 */
export const expectComplexState = {
  toHaveLoadingSequence: (wrapper: VueWrapper<any>, sequence: string[]) => {
    sequence.forEach(testId => {
      const element = wrapper.find(`[data-testid="${testId}"]`)
      expect(element.exists()).toBe(true)
    })
  },
  
  toHaveValidFormState: (wrapper: VueWrapper<any>) => {
    const form = wrapper.find('form')
    const requiredFields = form.findAll('input[required], select[required], textarea[required]')
    
    requiredFields.forEach(field => {
      const value = (field.element as HTMLInputElement).value
      expect(value.length).toBeGreaterThan(0)
    })
  },
  
  toRenderWithinTimeLimit: async (renderFn: () => Promise<VueWrapper<any>>, maxTime: number) => {
    const startTime = performance.now()
    const wrapper = await renderFn()
    const renderTime = performance.now() - startTime
    
    expect(renderTime).toBeLessThan(maxTime)
    return wrapper
  }
}

export { measureRenderTime, getMemoryUsage, simulateMemoryLeak, createLargeDataset } from './test-helpers'