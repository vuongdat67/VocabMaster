import type { SRSData } from '@/types/learning'

// ---- Exported constants (testable) ----

/** Initial memory strength for a brand-new word, in days (~30 min). */
export const INITIAL_STRENGTH_DAYS = 0.02

/** Maximum possible memory strength, in days. */
export const MAX_STRENGTH_DAYS = 365

/** Multiplier applied to memory strength after a correct answer. */
export const EACH_SUCCESS_MULTIPLIER = 1.8

/** Multiplier applied to memory strength after a close-call (near-miss) answer. */
export const CLOSE_CALL_PENALTY = 0.8

/** Divisor applied to memory strength after a plain wrong answer. */
export const EACH_FAILURE_DIVISOR = 0.5

/** Probability threshold at which a word is considered "due" for review. */
export const REVIEW_THRESHOLD = 0.7

const MS_PER_DAY = 86_400_000

// ---- Internal helpers ----

/**
 * Derive current memory strength `s` (in days) from the SRSData interval.
 *
 * The forgetting curve is:  P(recall) = exp(-t / s)
 * At the review threshold we have:  t = interval, P = REVIEW_THRESHOLD
 * Therefore:  s = -interval / ln(REVIEW_THRESHOLD)
 */
function getCurrentStrength(srs: SRSData): number {
  const s = -srs.interval / Math.log(REVIEW_THRESHOLD)
  return Math.max(INITIAL_STRENGTH_DAYS, s)
}

// ---- Exported API ----

/**
 * Return the new memory strength `s` (in days) after the learner answers.
 *
 * - Correct    → s *= EACH_SUCCESS_MULTIPLIER (1.8),   capped at MAX_STRENGTH_DAYS
 * - Close call → s *= CLOSE_CALL_PENALTY (0.8),        floored at INITIAL_STRENGTH_DAYS
 * - Wrong      → s *= EACH_FAILURE_DIVISOR (0.5),       floored at INITIAL_STRENGTH_DAYS
 */
export function updateMemoryStrength(
  srs: SRSData,
  isCorrect: boolean,
  wasCloseCall: boolean,
): number {
  let s = getCurrentStrength(srs)

  if (isCorrect) {
    s = Math.min(MAX_STRENGTH_DAYS, s * EACH_SUCCESS_MULTIPLIER)
  } else if (wasCloseCall) {
    s = Math.max(INITIAL_STRENGTH_DAYS, s * CLOSE_CALL_PENALTY)
  } else {
    s = Math.max(INITIAL_STRENGTH_DAYS, s * EACH_FAILURE_DIVISOR)
  }

  return s
}

/**
 * Compute the optimal next-review timestamp (epoch ms) using the forgetting curve.
 *
 *   interval (days) = -s * ln(REVIEW_THRESHOLD)
 *   nextReviewAt    = Date.now() + interval
 */
export function calculateOptimalReview(srs: SRSData): number {
  const s = getCurrentStrength(srs)
  const intervalDays = -s * Math.log(REVIEW_THRESHOLD)
  return Date.now() + intervalDays * MS_PER_DAY
}

/**
 * Return 10 interpolated points along the forgetting curve starting from now
 * out to 2× the current review interval, for charting / visualisation.
 *
 * Each point: { days: number, recallProbability: number }
 */
export function getForgettingCurveData(
  srs: SRSData,
): { days: number; recallProbability: number }[] {
  const s = getCurrentStrength(srs)
  const intervalDays = -s * Math.log(REVIEW_THRESHOLD)
  const endDays = intervalDays * 2

  const points: { days: number; recallProbability: number }[] = []
  for (let i = 0; i < 10; i++) {
    const t = (i / 9) * endDays
    const p = Math.exp(-t / s)
    points.push({
      days: Math.round(t * 100) / 100,
      recallProbability: Math.round(p * 100) / 100,
    })
  }
  return points
}
