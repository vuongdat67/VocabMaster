import { useEffect, useRef, type ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { getPreset, THEME_PRESETS } from '@/data/themes'

const ACCENT_MAP: Record<string, Record<string, string>> = {
  indigo: {
    '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc',
    '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca',
    '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b',
  },
  blue: {
    '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd',
    '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8',
    '800': '#1e40af', '900': '#1e3a8a', '950': '#172554',
  },
  green: {
    '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7',
    '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857',
    '800': '#065f46', '900': '#064e3b', '950': '#022c22',
  },
  rose: {
    '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af',
    '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c',
    '800': '#9f1239', '900': '#881337', '950': '#4c0519',
  },
  amber: {
    '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d',
    '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309',
    '800': '#92400e', '900': '#78350f', '950': '#451a03',
  },
}

/** Apply a set of CSS variable key/value pairs to documentElement */
function applyTokens(tokens: Record<string, string>) {
  const root = document.documentElement
  for (const [key, val] of Object.entries(tokens)) {
    root.style.setProperty(key, val)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettingsStore()
  const preset = getPreset(settings.themePreset)
  const accent = ACCENT_MAP[settings.themeColor] ?? ACCENT_MAP.indigo!

  // Apply CSS variables immediately on mount to prevent flash
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    // Apply accent scale
    const root = document.documentElement
    for (const [shade, hex] of Object.entries(accent)) {
      root.style.setProperty(`--accent-${shade}`, hex)
    }
  }, [])

  // Handle dark/light mode
  useEffect(() => {
    const applyTheme = () => {
      const shouldBeDark =
        settings.theme === 'dark'
          ? true
          : settings.theme === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : false
      document.documentElement.classList.toggle('dark', shouldBeDark)
    }

    applyTheme()

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme()
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings.theme])

  // Apply preset + accent tokens whenever any setting changes
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    const presetTokens = isDark ? preset.dark : preset.light
    applyTokens(presetTokens)

    // Also redeclare accent overrides for light + dark
    const root = document.documentElement
    for (const [shade, hex] of Object.entries(accent)) {
      root.style.setProperty(`--accent-${shade}`, hex)
    }

    // Set data attributes for CSS targeting
    root.setAttribute('data-theme-color', settings.themeColor)
    root.setAttribute('data-theme-preset', settings.themePreset)
  }, [settings.themeColor, settings.themePreset, settings.theme])

  // Re-observe dark class changes to flip preset
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      const currentPreset = getPreset(settings.themePreset)
      const tokens = isDark ? currentPreset.dark : currentPreset.light
      applyTokens(tokens)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [settings.themePreset])

  return <>{children}</>
}
