import type { SRSData } from '@/types/learning'
import { updateMemoryStrength, REVIEW_THRESHOLD } from './forgetting-curve'

export interface AnswerInput {
  isCorrect: boolean
  responseTime: number
  wasCloseCall: boolean
}

/**
 * Custom SRS algorithm that considers:
 * - Correct + fast  → decrease repetition count (mastered quickly)
 * - Correct + slow  → increase (hesitant, needs practice)
 * - Wrong + fast    → increase significantly (careless / guessing)
 * - Wrong + slow    → moderate increase (genuinely didn't know)
 * - Wrong + close   → decrease penalty (partial knowledge)
 */
export function calculateNextReview(
  current: SRSData,
  answer: AnswerInput
): Partial<SRSData> {
  const { isCorrect, responseTime, wasCloseCall } = answer
  const { interval, easeFactor, repetitions } = current

  const isFast = responseTime < 3000
  const isSlow = responseTime > 10000

  let newEaseFactor = easeFactor
  let newRepetitions = repetitions
  let newTimesCorrect = current.timesCorrect
  let newTimesWrong = current.timesWrong
  let newCloseCalls = current.closeCalls

  if (isCorrect) {
    newTimesCorrect++

    if (isFast) {
      // Correct + fast → mastered quickly, decrease reps
      newRepetitions = Math.max(0, repetitions - 1)
      newEaseFactor = Math.min(3.0, easeFactor + 0.15)
    } else if (isSlow) {
      // Correct + slow → hesitant, needs more practice
      newRepetitions = repetitions + 1
      newEaseFactor = Math.max(1.3, easeFactor - 0.05)
    } else {
      // Correct + normal speed
      newRepetitions = repetitions + 1
      newEaseFactor = Math.min(3.0, easeFactor + 0.1)
    }
  } else {
    newTimesWrong++

    if (wasCloseCall) {
      newCloseCalls++
      // Close to correct → partial knowledge, small penalty
      newRepetitions = Math.max(0, repetitions - 1)
      newEaseFactor = Math.max(1.3, easeFactor - 0.1)
    } else if (isFast) {
      // Wrong + fast → careless guessing, big penalty
      newRepetitions = repetitions + 3
      newEaseFactor = Math.max(1.3, easeFactor - 0.3)
    } else {
      // Wrong + slow → genuinely didn't know
      newRepetitions = Math.max(1, repetitions + 1)
      newEaseFactor = Math.max(1.3, easeFactor - 0.2)
    }
  }

  // Compute new memory strength via the forgetting-curve model and derive interval
  const newStrength = updateMemoryStrength(current, isCorrect, wasCloseCall)
  const newInterval = Math.round(-newStrength * Math.log(REVIEW_THRESHOLD) * 100) / 100

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReviewAt: Date.now() + newInterval * 86_400_000,
    averageResponseTime: current.averageResponseTime
      ? (current.averageResponseTime + responseTime) / 2
      : responseTime,
    lastResponseTime: responseTime,
    timesCorrect: newTimesCorrect,
    timesWrong: newTimesWrong,
    closeCalls: newCloseCalls,
  }
}

export function createInitialSRSData(wordId: string): SRSData {
  const now = Date.now()
  return {
    wordId,
    interval: 0.02, // 30 minutes initial
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: now + 0.02 * 86_400_000,
    averageResponseTime: 0,
    lastResponseTime: 0,
    timesCorrect: 0,
    timesWrong: 0,
    closeCalls: 0,
    studiedInSessions: 0,
    lastStudiedAt: now,
    modeHistory: [],
    wrongModes: [],
    createdAt: now,
    updatedAt: now,
  }
}
