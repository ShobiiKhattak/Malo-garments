export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'malo_theme'

// A user-picked theme overrides the automatic day/night theme (see dayPeriod.ts)
// until they clear it (not currently exposed in the UI, but easy to add later).
export function getStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

export function setStoredTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // localStorage unavailable (private mode, disabled storage) — theme just won't persist
  }
  document.documentElement.setAttribute('data-theme', mode)
}

export function getCurrentTheme(): ThemeMode {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}
