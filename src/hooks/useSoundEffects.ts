import { useCallback, useRef } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

export function useSoundEffects() {
  const { sfxEnabled, soundVolume } = useSettingsStore(state => state.settings)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const initSound = useCallback(() => {
    if (!sfxEnabled) return
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
  }, [sfxEnabled])

  const getContext = useCallback(() => {
    if (!sfxEnabled) return null
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [sfxEnabled])

  const playCorrect = useCallback(() => {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    
    // Arpeggio up
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.setValueAtTime(554.37, now + 0.1)
    osc.frequency.setValueAtTime(659.25, now + 0.2)
    
    gain.gain.setValueAtTime(soundVolume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.4)
  }, [getContext, soundVolume])

  const playWrong = useCallback(() => {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, now)
    gain.gain.setValueAtTime(soundVolume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }, [getContext, soundVolume])

  const playPop = useCallback(() => {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1)
    gain.gain.setValueAtTime(soundVolume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  }, [getContext, soundVolume])

  return { playCorrect, playWrong, playPop, initSound }
}
