/**
 * Multi-theme presets — inspired by daisyUI themes.
 * Each preset defines a complete palette:
 *   surface / surface-secondary / text-primary / text-secondary /
 *   border-default / accent-500 / ... and dark-mode variants.
 *
 * Add new presets freely!
 */

export interface ThemePreset {
  id: string
  name: string
  icon: string
  /** Subdued background/shade used for the picker swatch */
  swatchLight: string
  swatchDark: string
  light: Record<string, string>
  dark: Record<string, string>
}

export const THEME_PRESETS: ThemePreset[] = [
  // ── Zinc (default) ──────────────────────────────
  {
    id: 'zinc',
    name: 'Zinc',
    icon: '⚪',
    swatchLight: '#f4f4f5',
    swatchDark: '#18181b',
    light: {
      '--surface': '#ffffff',
      '--surface-secondary': '#f9fafb',
      '--surface-tertiary': '#f3f4f6',
      '--surface-card': '#ffffff',
      '--text-primary': '#111827',
      '--text-secondary': '#374151',
      '--text-tertiary': '#6b7280',
      '--border-default': '#d1d5db',
      '--accent-500': '#6366f1',
    },
    dark: {
      '--surface': '#111113',
      '--surface-secondary': '#09090b',
      '--surface-tertiary': '#18181b',
      '--surface-card': '#111113',
      '--text-primary': '#fafafa',
      '--text-secondary': '#c0c0c8',
      '--text-tertiary': '#71717a',
      '--border-default': '#27272a',
      '--accent-500': '#60a5fa',
    },
  },

  // ── Emerald ─────────────────────────────────────
  {
    id: 'emerald',
    name: 'Emerald',
    icon: '🌿',
    swatchLight: '#ecfdf5',
    swatchDark: '#022c22',
    light: {
      '--surface': '#fafdf6',
      '--surface-secondary': '#f0fdf4',
      '--surface-tertiary': '#dcfce7',
      '--surface-card': '#ffffff',
      '--text-primary': '#052e16',
      '--text-secondary': '#166534',
      '--text-tertiary': '#4ade80',
      '--border-default': '#bbf7d0',
      '--accent-500': '#10b981',
    },
    dark: {
      '--surface': '#022c22',
      '--surface-secondary': '#052e16',
      '--surface-tertiary': '#064e3b',
      '--surface-card': '#064e3b',
      '--text-primary': '#ecfdf5',
      '--text-secondary': '#a7f3d0',
      '--text-tertiary': '#34d399',
      '--border-default': '#065f46',
      '--accent-500': '#34d399',
    },
  },

  // ── Retro ───────────────────────────────────────
  {
    id: 'retro',
    name: 'Retro',
    icon: '📻',
    swatchLight: '#fef9ec',
    swatchDark: '#2d2b1e',
    light: {
      '--surface': '#fef9ec',
      '--surface-secondary': '#fff9e6',
      '--surface-tertiary': '#ffefc0',
      '--surface-card': '#fffff0',
      '--text-primary': '#3b2208',
      '--text-secondary': '#7c5c30',
      '--text-tertiary': '#b39264',
      '--border-default': '#e2c792',
      '--accent-500': '#d97706',
    },
    dark: {
      '--surface': '#2d2b1e',
      '--surface-secondary': '#1f1e14',
      '--surface-tertiary': '#3b3928',
      '--surface-card': '#363424',
      '--text-primary': '#fef9ec',
      '--text-secondary': '#d4c091',
      '--text-tertiary': '#a08850',
      '--border-default': '#5a5238',
      '--accent-500': '#f59e0b',
    },
  },

  // ── Cyberpunk ───────────────────────────────────
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: '⚡',
    swatchLight: '#fdf4ff',
    swatchDark: '#0d0221',
    light: {
      '--surface': '#f5f0ff',
      '--surface-secondary': '#ede9fe',
      '--surface-tertiary': '#ddd6fe',
      '--surface-card': '#ffffff',
      '--text-primary': '#1e0033',
      '--text-secondary': '#6b21a8',
      '--text-tertiary': '#a855f7',
      '--border-default': '#d8b4fe',
      '--accent-500': '#9333ea',
    },
    dark: {
      '--surface': '#0d0221',
      '--surface-secondary': '#0f002b',
      '--surface-tertiary': '#1a0040',
      '--surface-card': '#160033',
      '--text-primary': '#faf5ff',
      '--text-secondary': '#c084fc',
      '--text-tertiary': '#9333ea',
      '--border-default': '#3b0764',
      '--accent-500': '#a855f7',
    },
  },

  // ── Forest ──────────────────────────────────────
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    swatchLight: '#f0fdf4',
    swatchDark: '#0a1f0e',
    light: {
      '--surface': '#f6fdf8',
      '--surface-secondary': '#eefcf1',
      '--surface-tertiary': '#d9f99d',
      '--surface-card': '#ffffff',
      '--text-primary': '#0a2a12',
      '--text-secondary': '#166534',
      '--text-tertiary': '#4ade80',
      '--border-default': '#bbf7d0',
      '--accent-500': '#22c55e',
    },
    dark: {
      '--surface': '#0a1f0e',
      '--surface-secondary': '#07140a',
      '--surface-tertiary': '#0f2e16',
      '--surface-card': '#0f2e16',
      '--text-primary': '#f0fdf4',
      '--text-secondary': '#86efac',
      '--text-tertiary': '#22c55e',
      '--border-default': '#166534',
      '--accent-500': '#4ade80',
    },
  },

  // ── Luxury ──────────────────────────────────────
  {
    id: 'luxury',
    name: 'Luxury',
    icon: '✨',
    swatchLight: '#fefce8',
    swatchDark: '#0a0a0a',
    light: {
      '--surface': '#fefce8',
      '--surface-secondary': '#fef9c3',
      '--surface-tertiary': '#fde68a',
      '--surface-card': '#ffffff',
      '--text-primary': '#1a120b',
      '--text-secondary': '#92400e',
      '--text-tertiary': '#d97706',
      '--border-default': '#fcd34d',
      '--accent-500': '#b45309',
    },
    dark: {
      '--surface': '#0a0a0a',
      '--surface-secondary': '#141414',
      '--surface-tertiary': '#1f1f1f',
      '--surface-card': '#141414',
      '--text-primary': '#fefce8',
      '--text-secondary': '#fcd34d',
      '--text-tertiary': '#b45309',
      '--border-default': '#292524',
      '--accent-500': '#f59e0b',
    },
  },

  // ── Ocean ───────────────────────────────────────
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    swatchLight: '#f0f9ff',
    swatchDark: '#0c1222',
    light: {
      '--surface': '#f0f9ff',
      '--surface-secondary': '#e0f2fe',
      '--surface-tertiary': '#bae6fd',
      '--surface-card': '#ffffff',
      '--text-primary': '#082f49',
      '--text-secondary': '#0369a1',
      '--text-tertiary': '#0ea5e9',
      '--border-default': '#bae6fd',
      '--accent-500': '#0ea5e9',
    },
    dark: {
      '--surface': '#0c1222',
      '--surface-secondary': '#0a1a30',
      '--surface-tertiary': '#0f2847',
      '--surface-card': '#11223a',
      '--text-primary': '#f0f9ff',
      '--text-secondary': '#7dd3fc',
      '--text-tertiary': '#38bdf8',
      '--border-default': '#1e3a5f',
      '--accent-500': '#38bdf8',
    },
  },

  // ── Dracula ─────────────────────────────────────
  {
    id: 'dracula',
    name: 'Dracula',
    icon: '🧛',
    swatchLight: '#fdf2f8',
    swatchDark: '#1a1b26',
    light: {
      '--surface': '#fdf2f8',
      '--surface-secondary': '#fce7f3',
      '--surface-tertiary': '#fbcfe8',
      '--surface-card': '#ffffff',
      '--text-primary': '#220a1f',
      '--text-secondary': '#9d174d',
      '--text-tertiary': '#db2777',
      '--border-default': '#f9a8d4',
      '--accent-500': '#db2777',
    },
    dark: {
      '--surface': '#1a1b26',
      '--surface-secondary': '#24253a',
      '--surface-tertiary': '#2d2e45',
      '--surface-card': '#24253a',
      '--text-primary': '#f5f5f5',
      '--text-secondary': '#c084fc',
      '--text-tertiary': '#a78bfa',
      '--border-default': '#374151',
      '--accent-500': '#bd93f9',
    },
  },

  // ── Nord ────────────────────────────────────────
  {
    id: 'nord',
    name: 'Nord',
    icon: '❄️',
    swatchLight: '#ecedee',
    swatchDark: '#2e3440',
    light: {
      '--surface': '#ecedee',
      '--surface-secondary': '#e5e9f0',
      '--surface-tertiary': '#d8dee9',
      '--surface-card': '#ffffff',
      '--text-primary': '#2e3440',
      '--text-secondary': '#4c566a',
      '--text-tertiary': '#81a1c1',
      '--border-default': '#d8dee9',
      '--accent-500': '#5e81ac',
    },
    dark: {
      '--surface': '#2e3440',
      '--surface-secondary': '#3b4252',
      '--surface-tertiary': '#434c5e',
      '--surface-card': '#3b4252',
      '--text-primary': '#eceff4',
      '--text-secondary': '#d8dee9',
      '--text-tertiary': '#81a1c1',
      '--border-default': '#4c566a',
      '--accent-500': '#88c0d0',
    },
  },

  // ── Sunset ──────────────────────────────────────
  {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    swatchLight: '#fff7ed',
    swatchDark: '#1c1311',
    light: {
      '--surface': '#fff7ed',
      '--surface-secondary': '#ffedd5',
      '--surface-tertiary': '#fed7aa',
      '--surface-card': '#ffffff',
      '--text-primary': '#2d1b0e',
      '--text-secondary': '#9a3412',
      '--text-tertiary': '#ea580c',
      '--border-default': '#fed7aa',
      '--accent-500': '#f97316',
    },
    dark: {
      '--surface': '#1c1311',
      '--surface-secondary': '#2a1b16',
      '--surface-tertiary': '#3d251e',
      '--surface-card': '#2a1b16',
      '--text-primary': '#fff7ed',
      '--text-secondary': '#fdba74',
      '--text-tertiary': '#ea580c',
      '--border-default': '#7c2d12',
      '--accent-500': '#fb923c',
    },
  },
]

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0]!
}
