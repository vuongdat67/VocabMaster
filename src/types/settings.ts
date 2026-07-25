export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeColor = 'indigo' | 'blue' | 'green' | 'rose' | 'amber'

export interface UserSettings {
  theme: ThemeMode
  themeColor: ThemeColor
  themePreset: string
  soundEnabled: boolean
  soundVolume: number
  mascotPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  mascotCustomPosition?: { x: number; y: number }
  mascotType: 'custom' | 'animal'
  mascotImageUrl?: string
  learningOrder: 'sequential' | 'random'
  newWordsPerSession: number
  maxReviewWords: number
  enableInterleaving: boolean
  reviewReminderHours: number
  autoPlayAudio: boolean
  showIpa: boolean
  fontSize: 'small' | 'medium' | 'large'
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  themeColor: 'indigo',
  themePreset: 'zinc',
  soundEnabled: true,
  soundVolume: 0.7,
  mascotPosition: 'bottom-right',
  mascotType: 'animal',
  learningOrder: 'random',
  newWordsPerSession: 10,
  maxReviewWords: 20,
  enableInterleaving: true,
  reviewReminderHours: 6,
  autoPlayAudio: true,
  showIpa: true,
  fontSize: 'medium',
}
