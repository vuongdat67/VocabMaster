/**
 * Phased Batch Flow Engine
 *
 * Words are learned in batches. Each batch goes through a fixed sequence of
 * phases (preview → flashcard → fill → audio → retry → matching → synonym).
 *
 * Batch size adapts to the learner:
 *   - Starts at 5
 *   - >80% accuracy → increase (max 8)
 *   - <60% accuracy → decrease (min 3)
 *
 * Wrong answers enter a retry queue. Retries are interleaved with preview
 * words from the NEXT batch (to dilute memory), and each retry uses a
 * DIFFERENT exercise mode than the one the learner failed at.
 */

import type { Word } from '@/types/word'
import type { LearningMode } from '@/types/learning'

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

export type SessionPhase =
  | 'word_preview'
  | 'flashcard'
  | 'fill_challenge'
  | 'audio_challenge'
  | 'retry_loop'
  | 'matching'
  | 'synonym_match'
  | 'batch_complete'
  | 'complete'

export interface RetryItem {
  wordId: string
  retriesLeft: number
  failedModes: LearningMode[]
  lastFailedMode: LearningMode
}

export interface PhaseQueueItem {
  wordId: string
  mode: LearningMode
}

export interface LearningWord {
  word: Word
  timesCorrect: number
  timesWrong: number
  closeCalls: number
  totalResponses: number
  averageResponseTime: number
  correctStreak: number
  lastMode: LearningMode | null
  attemptedModes: LearningMode[]
  wrongModes: LearningMode[]
  priority: number
}

export interface SessionEngine {
  /** All words in the session (full list). */
  words: Word[]
  /** Words not yet assigned to any batch. */
  newWords: Word[]
  /** Active learning words in the current batch. */
  learningWords: LearningWord[]
  /** Words that have been mastered (correctStreak >= 3). */
  reviewWords: Word[]
  /** Current phase of the session. */
  phase: SessionPhase
  /** Current item to display. */
  currentItem: { word: Word; mode: LearningMode } | null

  // ── Phased Batch Flow fields ──
  /** Index of the current batch (0-based). */
  batchIndex: number
  /** Words in the current batch. */
  batchWords: Word[]
  /** All words completed so far in the entire session. */
  completedInSession: Word[]
  /** Queue of words that need to be retried. */
  retryQueue: RetryItem[]
  /** The ordered queue of items for the current phase. */
  phaseQueue: PhaseQueueItem[]
  /** Current index within phaseQueue. */
  phaseQueueIndex: number
  /** Current batch size (adaptive). */
  currentBatchSize: number
  /** Accuracy of each completed batch. */
  batchAccuracyHistory: number[]
  /** Correct count within current batch (for accuracy calc). */
  batchCorrectCount: number
  /** Total attempts within current batch. */
  batchTotalCount: number
}

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const PHASE_ORDER: SessionPhase[] = [
  'word_preview',
  'flashcard',
  'fill_challenge',
  'audio_challenge',
  'retry_loop',
  'matching',
  'synonym_match',
  'batch_complete',
]

const FILL_MODES: LearningMode[] = ['typing_challenge', 'fill_blank']
const AUDIO_MODES: LearningMode[] = ['audio_challenge', 'text_challenge']

const LEVEL_NAMES: Record<LearningMode, string> = {
  flashcard: 'Flashcard',
  audio_challenge: 'Nghe chọn',
  text_challenge: 'Chọn nghĩa',
  typing_challenge: 'Gõ từ',
  fill_blank: 'Điền khuyết',
  matching: 'Ghép cặp',
  synonym_match: 'Đồng nghĩa',
}

/** All exercise modes available for retry rotation. */
const RETRY_MODES: LearningMode[] = [
  'typing_challenge',
  'fill_blank',
  'audio_challenge',
  'text_challenge',
  'flashcard',
]

const DEFAULT_BATCH_SIZE = 5
const MIN_BATCH_SIZE = 3
const MAX_BATCH_SIZE = 8

// ---------------------------------------------------------------------------
//  Public helpers
// ---------------------------------------------------------------------------

export function getLevelName(mode: LearningMode): string {
  return LEVEL_NAMES[mode]
}

// ---------------------------------------------------------------------------
//  Internal helpers
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  return shuffled
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function createLearningWord(word: Word): LearningWord {
  return {
    word,
    timesCorrect: 0,
    timesWrong: 0,
    closeCalls: 0,
    totalResponses: 0,
    averageResponseTime: 0,
    correctStreak: 0,
    lastMode: null,
    attemptedModes: [],
    wrongModes: [],
    priority: 0,
  }
}

/**
 * Calculate how many retries a word needs based on answer quality.
 */
function calculateRetryCount(
  isCorrect: boolean,
  responseTime: number,
  wasCloseCall: boolean,
): number {
  const isFast = responseTime < 3000
  const isSlow = responseTime > 8000

  if (isCorrect) {
    if (isSlow) return 1 // correct but slow → reinforce once
    return 0 // correct + fast/normal → no retry
  }

  // Wrong answers
  if (wasCloseCall) return 2 // almost got it
  if (isFast) return 4 // guessing wildly
  return 3 // genuinely doesn't know
}

/**
 * Pick a retry mode that differs from all previously failed modes.
 */
function pickRetryMode(failedModes: LearningMode[]): LearningMode {
  const available = RETRY_MODES.filter((m) => !failedModes.includes(m))
  if (available.length > 0) return pickRandom(available)
  // Exhausted all alternatives — cycle back
  return pickRandom(RETRY_MODES)
}

/**
 * Calculate adaptive batch size based on accuracy history.
 */
function adaptBatchSize(history: number[], current: number): number {
  if (history.length === 0) return current

  const lastAccuracy = history[history.length - 1]!
  if (lastAccuracy > 0.8) {
    return Math.min(MAX_BATCH_SIZE, current + 1)
  } else if (lastAccuracy < 0.6) {
    return Math.max(MIN_BATCH_SIZE, current - 1)
  }
  return current
}

/**
 * Build the phaseQueue for a given phase.
 */
function buildPhaseQueue(
  phase: SessionPhase,
  batchWords: Word[],
  retryQueue: RetryItem[],
  engine: SessionEngine,
): PhaseQueueItem[] {
  switch (phase) {
    case 'flashcard': {
      // Sequential flashcard for each word in batch order
      return batchWords.map((w) => ({ wordId: w.id, mode: 'flashcard' as LearningMode }))
    }

    case 'fill_challenge': {
      // Shuffle words, randomly assign typing_challenge or fill_blank
      return shuffleArray(batchWords).map((w) => ({
        wordId: w.id,
        mode: pickRandom(FILL_MODES),
      }))
    }

    case 'audio_challenge': {
      // Shuffle words, randomly assign audio_challenge or text_challenge
      return shuffleArray(batchWords).map((w) => ({
        wordId: w.id,
        mode: pickRandom(AUDIO_MODES),
      }))
    }

    case 'retry_loop': {
      if (retryQueue.length === 0) return []

      const queue: PhaseQueueItem[] = []
      // Preview words from next batch for interleaving
      const peekWords = engine.newWords.slice(0, retryQueue.length * 2)
      let peekIdx = 0

      for (const retry of retryQueue) {
        // Interleave 2 preview words before each retry
        for (let i = 0; i < 2 && peekIdx < peekWords.length; i++) {
          queue.push({
            wordId: peekWords[peekIdx]!.id,
            mode: 'flashcard',
          })
          peekIdx++
        }
        // Retry item with different mode
        queue.push({
          wordId: retry.wordId,
          mode: pickRetryMode(retry.failedModes),
        })
      }
      return queue
    }

    case 'matching': {
      // Use completed-in-session words, need at least 4
      const pool = engine.completedInSession
      if (pool.length < 4) return []
      const matchWords = shuffleArray(pool).slice(0, 7)
      // Matching is a single "round" with one item — the first word triggers the component
      return [{ wordId: matchWords[0]!.id, mode: 'matching' as LearningMode }]
    }

    case 'synonym_match': {
      const withSynonyms = engine.completedInSession.filter(
        (w) => w.synonyms && w.synonyms.length > 0,
      )
      if (withSynonyms.length < 3) return []
      return [{ wordId: withSynonyms[0]!.id, mode: 'synonym_match' as LearningMode }]
    }

    default:
      return []
  }
}

/**
 * Advance to the next phase in the batch sequence.
 * Skips phases with empty queues (e.g., retry_loop when no retries, matching when < 4 words).
 */
function moveToNextPhase(engine: SessionEngine): SessionEngine {
  const currentPhaseIdx = PHASE_ORDER.indexOf(engine.phase)
  let nextIdx = currentPhaseIdx + 1

  while (nextIdx < PHASE_ORDER.length) {
    const nextPhase = PHASE_ORDER[nextIdx]!

    if (nextPhase === 'batch_complete') {
      return handleBatchComplete(engine)
    }

    const queue = buildPhaseQueue(nextPhase, engine.batchWords, engine.retryQueue, engine)

    if (queue.length > 0) {
      const firstItem = queue[0]!
      const word = engine.words.find((w) => w.id === firstItem.wordId)
        ?? engine.batchWords.find((w) => w.id === firstItem.wordId)
        ?? engine.newWords.find((w) => w.id === firstItem.wordId)

      return {
        ...engine,
        phase: nextPhase,
        phaseQueue: queue,
        phaseQueueIndex: 0,
        currentItem: word ? { word, mode: firstItem.mode } : null,
      }
    }

    // This phase has nothing to do, skip it
    nextIdx++
  }

  // All phases exhausted — complete batch
  return handleBatchComplete(engine)
}

/**
 * Handle batch completion — load next batch or end session.
 */
function handleBatchComplete(engine: SessionEngine): SessionEngine {
  // Record batch accuracy
  const batchAccuracy = engine.batchTotalCount > 0
    ? engine.batchCorrectCount / engine.batchTotalCount
    : 1

  const newHistory = [...engine.batchAccuracyHistory, batchAccuracy]

  // Add current batch words to completedInSession
  const newCompleted = [
    ...engine.completedInSession,
    ...engine.batchWords.filter(
      (w) => !engine.completedInSession.some((c) => c.id === w.id),
    ),
  ]

  // Adapt batch size for next batch
  const newBatchSize = adaptBatchSize(newHistory, engine.currentBatchSize)

  if (engine.newWords.length === 0) {
    // No more words — session complete
    return {
      ...engine,
      phase: 'complete',
      currentItem: null,
      completedInSession: newCompleted,
      batchAccuracyHistory: newHistory,
      retryQueue: [],
    }
  }

  // Load next batch
  const nextBatchWords = engine.newWords.slice(0, newBatchSize)
  const remainingNew = engine.newWords.slice(newBatchSize)

  return {
    ...engine,
    phase: 'word_preview',
    batchIndex: engine.batchIndex + 1,
    batchWords: nextBatchWords,
    newWords: remainingNew,
    learningWords: nextBatchWords.map(createLearningWord),
    completedInSession: newCompleted,
    retryQueue: [],
    phaseQueue: [],
    phaseQueueIndex: 0,
    currentItem: null,
    currentBatchSize: newBatchSize,
    batchAccuracyHistory: newHistory,
    batchCorrectCount: 0,
    batchTotalCount: 0,
  }
}

/**
 * Advance to the next item within the current phase queue.
 */
function advanceWithinPhase(engine: SessionEngine): SessionEngine {
  const nextIdx = engine.phaseQueueIndex + 1

  if (nextIdx >= engine.phaseQueue.length) {
    // Phase complete — move to next phase
    return moveToNextPhase(engine)
  }

  const nextItem = engine.phaseQueue[nextIdx]!
  const word = engine.words.find((w) => w.id === nextItem.wordId)
    ?? engine.batchWords.find((w) => w.id === nextItem.wordId)
    ?? engine.newWords.find((w) => w.id === nextItem.wordId)

  return {
    ...engine,
    phaseQueueIndex: nextIdx,
    currentItem: word ? { word, mode: nextItem.mode } : null,
  }
}

// ---------------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------------

/** Create a fresh engine with all words in the unstudied pool. */
export function createEngine(words: Word[]): SessionEngine {
  const batchSize = DEFAULT_BATCH_SIZE
  const firstBatch = words.slice(0, batchSize)
  const remaining = words.slice(batchSize)

  return {
    words,
    newWords: remaining,
    learningWords: firstBatch.map(createLearningWord),
    reviewWords: [],
    phase: 'word_preview',
    currentItem: null,

    batchIndex: 0,
    batchWords: firstBatch,
    completedInSession: [],
    retryQueue: [],
    phaseQueue: [],
    phaseQueueIndex: 0,
    currentBatchSize: batchSize,
    batchAccuracyHistory: [],
    batchCorrectCount: 0,
    batchTotalCount: 0,
  }
}

/** Transition from word_preview into the flashcard phase. */
export function startLearning(engine: SessionEngine): SessionEngine {
  const queue = buildPhaseQueue('flashcard', engine.batchWords, engine.retryQueue, engine)
  const firstItem = queue[0]
  const word = firstItem ? engine.batchWords.find((w) => w.id === firstItem.wordId) : null

  return {
    ...engine,
    phase: 'flashcard',
    phaseQueue: queue,
    phaseQueueIndex: 0,
    currentItem: word && firstItem ? { word, mode: firstItem.mode } : null,
  }
}

/** Manually advance to the next phase (used by UI after word_preview). */
export function advancePhase(engine: SessionEngine): SessionEngine {
  if (engine.phase === 'word_preview') {
    return startLearning(engine)
  }
  return moveToNextPhase(engine)
}

/**
 * Record an answer for the current word and advance to the next item.
 *
 * Smart retry scoring:
 *   - Correct + Fast (<3s)  → retryCount = 0
 *   - Correct + Normal      → retryCount = 0
 *   - Correct + Slow (>8s)  → retryCount = 1
 *   - Wrong + Close call    → retryCount = 2
 *   - Wrong + Slow          → retryCount = 3
 *   - Wrong + Fast          → retryCount = 4
 */
export function processAnswer(
  engine: SessionEngine,
  wordId: string,
  isCorrect: boolean,
  responseTime: number,
  wasCloseCall: boolean,
): SessionEngine {
  // Update learning word stats
  const lwIdx = engine.learningWords.findIndex((lw) => lw.word.id === wordId)
  let updatedLearningWords = [...engine.learningWords]

  if (lwIdx >= 0) {
    const lw = { ...updatedLearningWords[lwIdx]! }
    const mode = engine.currentItem?.mode ?? null

    if (mode) {
      lw.lastMode = mode
      if (!lw.attemptedModes.includes(mode)) {
        lw.attemptedModes = [...lw.attemptedModes, mode]
      }
      if (!isCorrect && !lw.wrongModes.includes(mode)) {
        lw.wrongModes = [...lw.wrongModes, mode]
      }
    }

    lw.totalResponses++
    if (isCorrect) {
      lw.timesCorrect++
      lw.correctStreak++
    } else {
      lw.timesWrong++
      lw.correctStreak = 0
      if (wasCloseCall) lw.closeCalls++
    }

    lw.averageResponseTime = lw.averageResponseTime
      ? (lw.averageResponseTime + responseTime) / 2
      : responseTime

    // SRS priority delta (kept for review scheduling)
    const isFast = responseTime < 3000
    const isSlow = responseTime > 8000
    if (isCorrect) {
      if (isFast) lw.priority = Math.max(0, lw.priority - 30)
      else if (isSlow) lw.priority += 10
      else lw.priority = Math.max(0, lw.priority - 10)
    } else {
      if (wasCloseCall) lw.priority += 15
      else if (isFast) lw.priority += 50
      else lw.priority += 30
    }
    lw.priority = Math.max(0, Math.min(1000, lw.priority))

    // Check mastery
    let newReviewWords = [...engine.reviewWords]
    if (lw.correctStreak >= 3) {
      newReviewWords.push(lw.word)
      updatedLearningWords = updatedLearningWords.filter((x) => x.word.id !== wordId)
    } else {
      updatedLearningWords[lwIdx] = lw
    }

    engine = {
      ...engine,
      learningWords: updatedLearningWords,
      reviewWords: newReviewWords,
    }
  }

  // Update batch accuracy tracking
  const newBatchCorrect = engine.batchCorrectCount + (isCorrect ? 1 : 0)
  const newBatchTotal = engine.batchTotalCount + 1

  // Handle retry queue for wrong answers (or slow correct)
  const retryCount = calculateRetryCount(isCorrect, responseTime, wasCloseCall)
  let newRetryQueue = [...engine.retryQueue]

  if (retryCount > 0) {
    const currentMode = engine.currentItem?.mode ?? 'flashcard'
    const existingRetry = newRetryQueue.find((r) => r.wordId === wordId)
    if (existingRetry) {
      // Update existing retry
      existingRetry.retriesLeft = Math.max(existingRetry.retriesLeft, retryCount)
      if (!existingRetry.failedModes.includes(currentMode)) {
        existingRetry.failedModes.push(currentMode)
      }
      existingRetry.lastFailedMode = currentMode
    } else {
      newRetryQueue.push({
        wordId,
        retriesLeft: retryCount,
        failedModes: [currentMode],
        lastFailedMode: currentMode,
      })
    }
  } else {
    // Correct and confident — reduce retry count if in queue
    newRetryQueue = newRetryQueue
      .map((r) => {
        if (r.wordId === wordId) {
          return { ...r, retriesLeft: r.retriesLeft - 1 }
        }
        return r
      })
      .filter((r) => r.retriesLeft > 0)
  }

  engine = {
    ...engine,
    batchCorrectCount: newBatchCorrect,
    batchTotalCount: newBatchTotal,
    retryQueue: newRetryQueue,
  }

  // Advance to next item
  return advanceWithinPhase(engine)
}

/** Return the current word/mode pair, or null if the session is complete. */
export function getCurrentItem(
  engine: SessionEngine,
): { word: Word; mode: LearningMode } | null {
  return engine.currentItem
}

/** Override the mode for the current word. */
export function setCurrentMode(
  engine: SessionEngine,
  wordId: string,
  mode: LearningMode,
): SessionEngine {
  if (engine.currentItem?.word.id === wordId) {
    return { ...engine, currentItem: { ...engine.currentItem, mode } }
  }
  return engine
}

/** Get the words in the current batch (for WordPreviewStep). */
export function getBatchWords(engine: SessionEngine): Word[] {
  return engine.batchWords
}

/** Get overall session progress info. */
export function getSessionProgress(engine: SessionEngine): {
  batchIndex: number
  totalBatches: number
  phaseIndex: number
  phaseName: string
  wordsCompleted: number
  totalWords: number
} {
  const totalBatches = Math.ceil(engine.words.length / engine.currentBatchSize)
  const phaseIndex = PHASE_ORDER.indexOf(engine.phase)

  const phaseNames: Record<SessionPhase, string> = {
    word_preview: 'Xem từ mới',
    flashcard: 'Flashcard',
    fill_challenge: 'Điền từ',
    audio_challenge: 'Nghe chọn',
    retry_loop: 'Ôn lại',
    matching: 'Ghép cặp',
    synonym_match: 'Đồng nghĩa',
    batch_complete: 'Hoàn thành',
    complete: 'Hoàn thành',
  }

  return {
    batchIndex: engine.batchIndex,
    totalBatches,
    phaseIndex,
    phaseName: phaseNames[engine.phase],
    wordsCompleted: engine.completedInSession.length,
    totalWords: engine.words.length,
  }
}
