import { create } from 'zustand'
import type { Word } from '@/types/word'
import type { LearningMode, LearningSession, AnswerResult } from '@/types/learning'
import type { SessionConfig } from '@/types/learning'
import { wordRepo } from '@/db/word-repo'
import {
  createEngine,
  startLearning as engineStartLearning,
  processAnswer,
  getCurrentItem,
  setCurrentMode,
  type SessionEngine,
  type SessionPhase,
} from '@/algorithms/session-engine'

interface LearningStore {
  // Engine state
  engine: SessionEngine | null
  phase: SessionPhase
  currentLevel: LearningMode | null

  // Legacy fields (kept for compatibility)
  currentSession: { words: Word[]; modes: LearningMode[]; config: SessionConfig } | null
  currentWordIndex: number
  currentMode: LearningMode | null
  sessionResults: AnswerResult[]
  sessionStartTime: number
  isSessionActive: boolean
  isSessionComplete: boolean
  retryQueue: Array<{ word: Word; mode: LearningMode }>
  isRetrying: boolean
  studiedWords: Record<string, Word>
  sessionWordIds: string[]

  currentWord: Word | null
  phaseListWords: Word[]

  lastResult: { wordId: string; correct: boolean } | null

  // Actions
  startSession: (config: SessionConfig) => Promise<void>
  recordAnswer: (result: AnswerResult) => void
  updateLastResult: (lr: { wordId: string; correct: boolean }) => void
  submitAndAdvance: (result: AnswerResult) => void
  nextWord: () => void
  endSession: () => Promise<LearningSession | null>
  resetSession: () => void
  beginLearning: () => void
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  engine: null,
  phase: 'list',
  currentLevel: null,
  currentSession: null,
  currentWordIndex: 0,
  currentMode: null,
  sessionResults: [],
  sessionStartTime: 0,
  isSessionActive: false,
  isSessionComplete: false,
  retryQueue: [],
  isRetrying: false,
  studiedWords: {},
  sessionWordIds: [],
  currentWord: null,
  phaseListWords: [],
  lastResult: null,

  startSession: async (config) => {
    const allWords = await wordRepo.getByIds(config.wordPool)
    const engine = createEngine(allWords)
    set({
      engine,
      phase: 'list',
      currentLevel: null,
      currentSession: {
        words: allWords,
        modes: allWords.map(() => 'flashcard' as LearningMode),
        config,
      },
      currentWordIndex: 0,
      currentMode: null,
      sessionResults: [],
      sessionStartTime: Date.now(),
      isSessionActive: true,
      isSessionComplete: false,
      retryQueue: [],
      isRetrying: false,
      studiedWords: {},
      sessionWordIds: allWords.map((w) => w.id),
      currentWord: null,
      phaseListWords: allWords,
      lastResult: null,
    })
  },

  beginLearning: () => {
    const { engine } = get()
    if (!engine) return
    const newEngine = engineStartLearning(engine)
    const item = getCurrentItem(newEngine)

    set({
      engine: newEngine,
      phase: newEngine.phase,
      currentLevel: item?.mode ?? null,
      currentMode: item?.mode ?? null,
      currentWord: item?.word ?? null,
      currentWordIndex: 0,
      lastResult: null,
    })
  },

  recordAnswer: (result) => {
    const { engine, sessionResults } = get()
    if (!engine) return

    const word = engine.words.find((w) => w.id === result.wordId)
    if (word) {
      set((state) => ({
        studiedWords: { ...state.studiedWords, [word.id]: word },
        sessionResults: [...sessionResults, result],
      }))
    } else {
      set({ sessionResults: [...sessionResults, result] })
    }
  },

  updateLastResult: (lr: { wordId: string; correct: boolean }) => {
    set({ lastResult: lr })
  },

  submitAndAdvance: (result) => {
    const { engine, sessionResults } = get()
    if (!engine) return

    // 1. Record word data
    const word = engine.words.find((w) => w.id === result.wordId)
    const newResults = [...sessionResults, result]

    // 2. Process answer through engine
    const newEngine = processAnswer(
      engine,
      result.wordId,
      result.isCorrect,
      result.responseTime,
      result.wasCloseCall
    )
    const item = getCurrentItem(newEngine)

    // 3. Store word data
    let studiedUpdate: Record<string, Word> = {}
    if (word) {
      studiedUpdate = { [word.id]: word }
    }

    set({
      engine: newEngine,
      phase: newEngine.phase,
      currentLevel: item?.mode ?? null,
      currentMode: item?.mode ?? null,
      currentWord: item?.word ?? null,
      currentWordIndex: newEngine.learningWords.length > 0
        ? newEngine.learningWords.reduce(
            (found, lw, i) => (lw.word.id === item?.word.id ? i : found),
            0
          )
        : 0,
      sessionResults: newResults,
      studiedWords: { ...get().studiedWords, ...studiedUpdate },
      lastResult: { wordId: result.wordId, correct: result.isCorrect },
      isSessionComplete: newEngine.phase === 'complete',
    })
  },

  nextWord: () => {
    const { engine, lastResult } = get()
    if (!engine) return

    if (lastResult) {
      // Process the stored answer through the engine
      const newEngine = processAnswer(
        engine,
        lastResult.wordId,
        lastResult.correct,
        0, // responseTime — we don't have it stored separately but engine handles it
        false
      )
      const item = getCurrentItem(newEngine)
      set({
        engine: newEngine,
        phase: newEngine.phase,
        currentLevel: item?.mode ?? null,
        currentMode: item?.mode ?? null,
        currentWord: item?.word ?? null,
        lastResult: null,
        isSessionComplete: newEngine.phase === 'complete',
      })
    } else {
      const item = getCurrentItem(engine)
      set({
        currentLevel: item?.mode ?? null,
        currentMode: item?.mode ?? null,
        currentWord: item?.word ?? null,
        isSessionComplete: engine.phase === 'complete',
      })
    }
  },

  endSession: async () => {
    const { sessionResults, sessionStartTime, sessionWordIds } = get()

    // Update SRS for each result
    const { sessionRepo, progressRepo } = await import('@/db')
    const { calculateNextReview, createInitialSRSData } = await import('@/algorithms/srs')

    for (const result of sessionResults) {
      const existing = await progressRepo.getSRS(result.wordId)
      const srsData = existing ?? createInitialSRSData(result.wordId)
      const updates = calculateNextReview(srsData, {
        isCorrect: result.isCorrect,
        responseTime: result.responseTime,
        wasCloseCall: result.wasCloseCall,
      })
      const updatedSRS = {
        ...srsData,
        ...updates,
        studiedInSessions: srsData.studiedInSessions + 1,
        lastStudiedAt: Date.now(),
        modeHistory: [...srsData.modeHistory, result.mode].slice(-20),
        wrongModes: result.isCorrect
          ? srsData.wrongModes
          : [...new Set([...srsData.wrongModes, result.mode])],
        updatedAt: Date.now(),
      }
      await progressRepo.upsertSRS(updatedSRS)
    }

    const session: LearningSession = {
      id: crypto.randomUUID(),
      mode: 'flashcard',
      words: sessionWordIds,
      results: sessionResults,
      startedAt: sessionStartTime,
      completedAt: Date.now(),
      totalTime: Date.now() - sessionStartTime,
    }

    await sessionRepo.save(session)
    set({ isSessionActive: false, isSessionComplete: true })

    return session
  },

  resetSession: () => {
    set({
      engine: null,
      phase: 'list',
      currentLevel: null,
      currentSession: null,
      currentWordIndex: 0,
      currentMode: null,
      sessionResults: [],
      sessionStartTime: 0,
      isSessionActive: false,
      isSessionComplete: false,
      retryQueue: [],
      isRetrying: false,
      studiedWords: {},
      sessionWordIds: [],
      currentWord: null,
      phaseListWords: [],
      lastResult: null,
    })
  },
}))
