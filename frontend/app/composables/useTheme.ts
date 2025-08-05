import { ref, computed, watch } from 'vue'

type Theme = 'light' | 'dark' | 'auto'

export const useTheme = () => {
  // ローカルストレージから初期値を取得
  const getInitialTheme = (): Theme => {
    if (process.client) {
      const saved = localStorage.getItem('theme') as Theme
      if (saved && ['light', 'dark', 'auto'].includes(saved)) {
        return saved
      }
    }
    return 'auto'
  }

  const currentTheme = ref<Theme>(getInitialTheme())

  // システムのダークモード設定を監視
  const systemDarkMode = ref(false)

  if (process.client) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDarkMode.value = mediaQuery.matches

    mediaQuery.addEventListener('change', (e) => {
      systemDarkMode.value = e.matches
    })
  }

  // 実際に適用されるテーマ
  const appliedTheme = computed(() => {
    if (currentTheme.value === 'auto') {
      return systemDarkMode.value ? 'dark' : 'light'
    }
    return currentTheme.value
  })

  // ダークモードかどうか
  const isDark = computed(() => appliedTheme.value === 'dark')

  // テーマを変更
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme

    if (process.client) {
      localStorage.setItem('theme', theme)
    }
  }

  // ダークモードを切り替え
  const toggleDarkMode = () => {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  // テーマの適用
  const applyTheme = () => {
    if (process.client) {
      const root = document.documentElement

      if (isDark.value) {
        root.classList.add('dark')
        root.setAttribute('data-bs-theme', 'dark')
      } else {
        root.classList.remove('dark')
        root.setAttribute('data-bs-theme', 'light')
      }
    }
  }

  // テーマが変更されたときに適用
  watch(appliedTheme, applyTheme, { immediate: true })

  // テーマ名の表示用
  const themeDisplayName = computed(() => {
    switch (currentTheme.value) {
      case 'light':
        return 'ライトモード'
      case 'dark':
        return 'ダークモード'
      case 'auto':
        return 'システム設定'
      default:
        return 'システム設定'
    }
  })

  // 利用可能なテーマ一覧
  const availableThemes = [
    { value: 'light', label: 'ライトモード', icon: '☀️' },
    { value: 'dark', label: 'ダークモード', icon: '🌙' },
    { value: 'auto', label: 'システム設定', icon: '💻' }
  ] as const

  return {
    // State
    currentTheme: readonly(currentTheme),
    appliedTheme,
    isDark,
    systemDarkMode: readonly(systemDarkMode),

    // Computed
    themeDisplayName,
    availableThemes,

    // Actions
    setTheme,
    toggleDarkMode,
    applyTheme
  }
}
