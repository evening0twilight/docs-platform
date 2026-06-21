import { ref } from 'vue'

const THEME_KEY = 'app-theme'
const isDark = ref(false)

function apply(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  // 同步切换 Arco Design 暗色主题(MainLayout 等使用 Arco 的 --color-* 变量)
  document.body.setAttribute('arco-theme', dark ? 'dark' : 'light')
}

/**
 * 暗色/亮色主题:持久化到 localStorage,首次按系统偏好。
 */
export function useTheme() {
  function init() {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) {
      apply(saved === 'dark')
    } else {
      const prefersDark = window.matchMedia?.(
        '(prefers-color-scheme: dark)'
      ).matches
      apply(!!prefersDark)
    }
  }

  function toggle() {
    const next = !isDark.value
    apply(next)
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
  }

  return { isDark, init, toggle }
}
