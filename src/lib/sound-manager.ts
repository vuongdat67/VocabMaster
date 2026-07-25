/**
 * Sound manager using Web Audio API for generating
 * wind chime and ambient sounds procedurally.
 * No external audio files required.
 *
 * All sounds are intentionally subtle — barely audible background hints,
 * like wind chimes from across the room.
 */

let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

// ─── Wind Chime ────────────────────────────────────────────────
// Generate gentle wind chime tones using sine waves with harmonics

const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66] // C5-D5-E5-G5-A5-C6-D6

export function playWindChime(intensity: number = 0.5): void {
  const ctx = getContext()
  if (!ctx) return

  const now = ctx.currentTime
  const noteCount = Math.max(3, Math.floor(intensity * 5))

  for (let i = 0; i < noteCount; i++) {
    const freq = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)]!
    const startDelay = Math.random() * 0.25 + i * 0.04

    // Main tone — louder, longer decay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now + startDelay)
    gain.gain.linearRampToValueAtTime(0.15 * intensity, now + startDelay + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 1.2 + Math.random() * 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + startDelay)
    osc.stop(now + startDelay + 2)

    // Harmonic overtone — more noticeable
    if (Math.random() > 0.3) {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.value = freq * 2
      gain2.gain.setValueAtTime(0, now + startDelay)
      gain2.gain.linearRampToValueAtTime(0.04 * intensity, now + startDelay + 0.03)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 0.6)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + startDelay)
      osc2.stop(now + startDelay + 0.8)
    }
  }
}

// ─── Wind Ambient ──────────────────────────────────────────────
// Very soft wind-like noise — nearly silent, barely there

let windNode: { stop: () => void } | null = null

export function startWindAmbient(intensity: number = 0.3): void {
  const ctx = getContext()
  if (!ctx) return

  stopWindAmbient()

  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 + Math.sin(i / 200)) * 0.4
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 200 * intensity + 50
  filter.Q.value = 0.5

  const gain = ctx.createGain()
  gain.gain.value = 0.06 * intensity

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()

  windNode = {
    stop: () => {
      try { source.stop() } catch { /* ignore */ }
      windNode = null
    },
  }
}

export function stopWindAmbient(): void {
  windNode?.stop()
}

// ─── Paper Rustle ──────────────────────────────────────────────
// Very subtle rustling sound for UI interactions

export function playRustle(): void {
  const ctx = getContext()
  if (!ctx) return

  const bufferSize = ctx.sampleRate * 0.12
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = 0.015
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

// ─── Celebration Bell ──────────────────────────────────────────
// Soft, elegant triangle-wave melody

export function playCelebrationBells(): void {
  const ctx = getContext()
  if (!ctx) return

  const melody = [523, 659, 784, 1047]
  melody.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.8)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + i * 0.12)
    osc.stop(ctx.currentTime + i * 0.12 + 1.0)
  })
}

// ─── Word Whoosh (barely audible) ──────────────────────────────

export function playWhoosh(): void {
  const ctx = getContext()
  if (!ctx) return

  const bufferSize = ctx.sampleRate * 0.25
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.12
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 600
  filter.Q.value = 0.5

  const gain = ctx.createGain()
  gain.gain.value = 0.008

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}
