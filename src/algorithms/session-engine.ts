/**
 * Learning Wheel Engine — dynamic queue-based engine that cycles words through
 * randomized learning modes instead of fixed linear levels.
 *
 * Queues:
 *   newWords      — words never studied (diluted in via interleaving)
 *   learningWords — words in active rotation, each with per-word SRS stats
 *   reviewWords   — words marked mastered (correctStreak >= 3)
 *
 * Mode selection is randomized:
 *   - First encounter → flashcard
 *   - Subsequent → random from all 7 modes
 *     * Wrong modes have lower chance
 *     * Untried modes have higher chance
 *     * audio_challenge & typing_challenge must appear at least once
 *
 * Word selection:
 *   - learningWords sorted by priority score (higher = shown sooner)
 *   - priority = wrongCount * 100 + (100 - accuracy%) + random(20)
 *   - Every N answers (interleaveCount), a new word is injected
 */

import type { Word } from '@/types/word'
import type { LearningMode } from '@/types/learning'

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

export type SessionPhase = 'list' | 'learning' | 'complete'

export interface SessionEngine {
  words: Word[]
  newWords: Word[]
  learningWords: LearningWord[]
  reviewWords: Word[]
  phase: SessionPhase
  currentItem: { word: Word; mode: LearningMode } | null
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

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const ALL_MODES: LearningMode[] = [
  'flashcard',
  'audio_challenge',
  'text_challenge',
  'typing_challenge',
  'fill_blank',
  'matching',
  'synonym_match',
]

const LEVEL_NAMES: Record<LearningMode, string> = {
  flashcard: 'Flashcard',
  audio_challenge: 'Nghe viết',
  text_challenge: 'Ảnh & Từ',
  typing_challenge: 'Gõ từ',
  fill_blank: 'Điền khuyết',
  matching: 'Ghép cặp',
  synonym_match: 'Đồng nghĩa',
}

/** How many answers elapse before a new word is injected from the newWords pool. */
const INTERLEAVE_COUNT = 3

/** Modes that must be attempted at least once before a word is considered fully exposed. */
const REQUIRED_EXPOSURE: LearningMode[] = ['audio_challenge', 'typing_challenge']

// ---------------------------------------------------------------------------
//  Public helpers
// ---------------------------------------------------------------------------

export function getLevelName(mode: LearningMode): string {
  return LEVEL_NAMES[mode]
}

// ---------------------------------------------------------------------------
//  Internal helpers
// ---------------------------------------------------------------------------

function computePriority(stats: {
  timesCorrect: number
  timesWrong: number
  totalResponses: number
}): number {
  const accuracy = stats.totalResponses > 0
    ? (stats.timesCorrect / stats.totalResponses) * 100
    : 100
  return stats.timesWrong * 100 + (100 - accuracy) + Math.random() * 20
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
    priority: computePriority({ timesCorrect: 0, timesWrong: 0, totalResponses: 0 }),
  }
}

/**
 * Select a random learning mode for a word, biased by past performance.
 *
 * Rules:
 *   - First time (totalResponses === 0) → flashcard
 *   - Untried modes are preferred over tried ones
 *   - required-exposure modes (audio/typing) take priority among untried
 *   - Wrong modes are penalised (weight 0.3)
 *   - Consecutive same-mode is penalised (weight 0.2)
 */
function selectMode(lw: LearningWord): LearningMode {
  if (lw.totalResponses === 0) return 'flashcard'

  // If the word was wrong, cycle to the next mode for remediation
  const modeCycle: LearningMode[] = ['flashcard', 'typing_challenge', 'audio_challenge', 'fill_blank', 'matching', 'text_challenge', 'synonym_match']
  if (lw.lastMode && lw.wrongModes.includes(lw.lastMode)) {
    const currentIdx = modeCycle.indexOf(lw.lastMode)
    const nextMode = currentIdx >= 0 ? modeCycle[(currentIdx + 1) % modeCycle.length]! : 'flashcard'
    return nextMode
  }

  const untried = ALL_MODES.filter((m) => !lw.attemptedModes.includes(m))

  if (untried.length > 0) {
    // Ensure required-exposure modes appear before the word is "done"
    const missingRequired = REQUIRED_EXPOSURE.filter((m) => !lw.attemptedModes.includes(m))
    if (missingRequired.length > 0) {
      return missingRequired[Math.floor(Math.random() * missingRequired.length)]!
    }
    return untried[Math.floor(Math.random() * untried.length)]!
  }

  // All modes have been tried — weighted random selection
  const weights = ALL_MODES.map((m) => {
    let w = 1
    if (lw.wrongModes.includes(m)) w = 0.3
    if (m === lw.lastMode) w *= 0.2
    return { mode: m, weight: w }
  })

  const totalWeight = weights.reduce((s, x) => s + x.weight, 0)
  let r = Math.random() * totalWeight
  for (const entry of weights) {
    r -= entry.weight
    if (r <= 0) return entry.mode
  }

  return ALL_MODES[ALL_MODES.length - 1]!
}

/**
 * Pick the next word from learningWords (sorted by priority) and assign a mode.
 * Handles interleaving and priming the learningWords pool.
 */
function pickNextWord(engine: SessionEngine): SessionEngine {
  const totalAnswered = engine.learningWords.reduce((s, lw) => s + lw.totalResponses, 0)

  // Interleave: every INTERLEAVE_COUNT answers, inject a new word
  if (totalAnswered > 0 && totalAnswered % INTERLEAVE_COUNT === 0 && engine.newWords.length > 0) {
    const word = engine.newWords.shift()!
    engine.learningWords.push(createLearningWord(word))
  }

  // Prime learningWords from newWords if the active pool is empty
  if (engine.learningWords.length === 0) {
    if (engine.newWords.length > 0) {
      const word = engine.newWords.shift()!
      engine.learningWords.push(createLearningWord(word))
    } else {
      return { ...engine, phase: 'complete', currentItem: null }
    }
  }

  // Highest priority = most urgent to review
  engine.learningWords.sort((a, b) => b.priority - a.priority)

  const top = engine.learningWords[0]!
  const mode = selectMode(top)

  return { ...engine, currentItem: { word: top.word, mode } }
}

// ---------------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------------

/** Create a fresh engine with all words in the unstudied pool. */
export function createEngine(words: Word[]): SessionEngine {
  return {
    words,
    newWords: [...words],
    learningWords: [],
    reviewWords: [],
    phase: 'list',
    currentItem: null,
  }
}

/** Transition from the list phase into active learning. */
export function startLearning(engine: SessionEngine): SessionEngine {
  return pickNextWord({ ...engine, phase: 'learning' })
}

/**
 * Record an answer for the current word and advance to the next word/mode.
 *
 * SRS priority adjustments:
 *   - correct + fast (<3s)  → priority -30
 *   - correct + slow (>8s)  → priority +10
 *   - wrong  + fast         → priority +50
 *   - wrong  + slow         → priority +30
 *   - wrong  + close        → priority +15
 *   - correct (any speed)   → correctStreak++
 *   - correctStreak >= 3    → move to reviewWords (mastered)
 */
export function processAnswer(
  engine: SessionEngine,
  wordId: string,
  isCorrect: boolean,
  responseTime: number,
  wasCloseCall: boolean
): SessionEngine {
  const idx = engine.learningWords.findIndex((lw) => lw.word.id === wordId)
  if (idx === -1) return engine

  // Copy so we don't mutate
  const lw = { ...engine.learningWords[idx]! }
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

  // ---- Update stats ----
  lw.totalResponses++
  if (isCorrect) {
    lw.timesCorrect++
    lw.correctStreak++
  } else {
    lw.timesWrong++
    lw.correctStreak = 0
    if (wasCloseCall) lw.closeCalls++

    // Force cycle to next mode so the word is retested in a different format
    const modeCycle: LearningMode[] = ['flashcard', 'typing_challenge', 'audio_challenge', 'fill_blank', 'matching', 'text_challenge', 'synonym_match']
    const currentIdx = lw.lastMode ? modeCycle.indexOf(lw.lastMode) : -1
    const nextMode = modeCycle[(currentIdx + 1) % modeCycle.length]!
    lw.lastMode = nextMode
    if (!lw.attemptedModes.includes(nextMode)) {
      lw.attemptedModes = [...lw.attemptedModes, nextMode]
    }
  }

  lw.averageResponseTime = lw.averageResponseTime
    ? (lw.averageResponseTime + responseTime) / 2
    : responseTime

  // ---- SRS priority delta ----
  const isFast = responseTime < 3000
  const isSlow = responseTime > 8000

  if (isCorrect) {
    if (isFast) {
      lw.priority = Math.max(0, lw.priority - 30)
    } else if (isSlow) {
      lw.priority += 10
    } else {
      lw.priority = Math.max(0, lw.priority - 10)
    }
  } else {
    if (wasCloseCall) {
      lw.priority += 15
    } else if (isFast) {
      lw.priority += 50
    } else {
      lw.priority += 30
    }
  }

  // Ensure priority stays in healthy range (but preserve the SRS delta above)
  lw.priority = Math.max(0, Math.min(1000, lw.priority))

  // ---- Check mastery ----
  let newLearningWords = [...engine.learningWords]
  newLearningWords[idx] = lw
  let newReviewWords = [...engine.reviewWords]

  if (lw.correctStreak >= 3) {
    newReviewWords.push(lw.word)
    newLearningWords = newLearningWords.filter((x) => x.word.id !== wordId)
  }

  return pickNextWord({
    ...engine,
    learningWords: newLearningWords,
    reviewWords: newReviewWords,
  })
}

/** Return the current word/mode pair, or null if the session is complete. */
export function getCurrentItem(
  engine: SessionEngine
): { word: Word; mode: LearningMode } | null {
  return engine.currentItem
}

/** Override the mode for the current word. */
export function setCurrentMode(
  engine: SessionEngine,
  wordId: string,
  mode: LearningMode
): SessionEngine {
  if (engine.currentItem?.word.id === wordId) {
    return { ...engine, currentItem: { ...engine.currentItem, mode } }
  }
  return engine
}
