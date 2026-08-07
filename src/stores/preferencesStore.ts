import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'optcg-theme-mode'

export const usePreferencesStore = defineStore('preferences', () => {
  const themeMode = ref<ThemeMode>('system')

  const isDark = computed(() => {
    if (themeMode.value === 'dark') {
      return true
    }

    if (themeMode.value === 'light') {
      return false
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  function applyTheme(): void {
    if (typeof document === 'undefined') {
      return
    }

    const dark = isDark.value

    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.body.classList.toggle('theme-dark', dark)
    document.body.classList.toggle('theme-light', !dark)
  }

  function persistTheme(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, themeMode.value)
  }

  function initialize(): void {
    if (typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null

    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      themeMode.value = storedTheme
    }

    applyTheme()

    if (typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handlePreferenceChange = (): void => {
        if (themeMode.value === 'system') {
          applyTheme()
        }
      }

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handlePreferenceChange)
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handlePreferenceChange)
      }
    }
  }

  function setThemeMode(mode: ThemeMode): void {
    themeMode.value = mode
    persistTheme()
    applyTheme()
  }

  watch(themeMode, () => {
    persistTheme()
    applyTheme()
  })

  return {
    themeMode,
    isDark,
    initialize,
    setThemeMode,
  }
})
