import { useCallback, useRef } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

export function useAudio() {
  const { settings } = useSettingsStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(
    (url: string) => {
      if (!settings.soundEnabled) return
      try {
        if (audioRef.current) {
          audioRef.current.pause()
        }
        const audio = new Audio(url)
        audio.volume = settings.soundVolume
        audioRef.current = audio
        audio.play().catch(() => {
          // Autoplay blocked, ignore
        })
      } catch {
        // Audio error, ignore
      }
    },
    [settings.soundEnabled, settings.soundVolume]
  )

  const speak = useCallback(
    (text: string) => {
      if (!settings.soundEnabled || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.volume = settings.soundVolume
      window.speechSynthesis.speak(utterance)
    },
    [settings.soundEnabled, settings.soundVolume]
  )

  return { play, speak }
}
