/**
 * Audio utility helpers
 * Uses Web Audio API for generating simple sounds as feedback.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/** Play a single note with envelope */
function note(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.25,
) {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/** Bright, cheerful ascending 3-note chime for correct answers */
export function playCorrectSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  note(523, now, 0.15, 'sine', 0.28)       // C5
  note(659, now + 0.1, 0.18, 'sine', 0.28)  // E5
  note(784, now + 0.2, 0.25, 'triangle', 0.25) // G5
}

/** Short descending buzz for wrong answers — quick but noticeable */
export function playWrongSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // Two low notes with distortion-like triangle
  note(294, now, 0.12, 'triangle', 0.3)     // D4
  note(220, now + 0.1, 0.2, 'sawtooth', 0.2) // A3 rough
}

/** Celebration fanfare for perfect completions */
export function playCelebrationSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  note(523, now, 0.1, 'sine', 0.25)
  note(659, now + 0.08, 0.1, 'sine', 0.25)
  note(784, now + 0.16, 0.1, 'sine', 0.25)
  note(1047, now + 0.24, 0.35, 'triangle', 0.25)
}

/** Soft click for UI actions like "continue" */
export function playClickSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  note(880, now, 0.06, 'sine', 0.12)  // Quick A5 tap
}

/** Soft chime for ambient decoration */
export function playChime(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  note(660, now, 0.4, 'sine', 0.12)
}
