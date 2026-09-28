import { getStoredTheme } from './theme'

export type DayPeriod = 'day' | 'night'

// Night window: 7pm–6am. Drives the site's automatic light/dark theme,
// unless the user has picked a theme manually (see ThemeToggle / theme.ts).
export function getCurrentDayPeriod(date: Date = new Date()): DayPeriod {
  const hour = date.getHours()
  return hour >= 19 || hour < 6 ? 'night' : 'day'
}

export function applyDayPeriodTheme() {
  if (getStoredTheme()) return
  document.documentElement.setAttribute('data-theme', getCurrentDayPeriod() === 'night' ? 'dark' : 'light')
}
