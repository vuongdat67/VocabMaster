export type LearningMode =
  | 'flashcard'
  | 'audio_challenge'
  | 'text_challenge'
  | 'typing_challenge'
  | 'fill_blank'
  | 'matching'
  | 'synonym_match'
  | 'crossword'
  | 'wordle'
  | 'swipe'
  | 'context'
  | 'wind'

export interface SRSData {
  wordId: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewAt: number
  averageResponseTime: number
  lastResponseTime: number
  timesCorrect: number
  timesWrong: number
  closeCalls: number
  studiedInSessions: number
  lastStudiedAt: number
  modeHistory: LearningMode[]
  wrongModes: LearningMode[]
  createdAt: number
  updatedAt: number
}

export interface AnswerResult {
  wordId: string
  isCorrect: boolean
  responseTime: number
  wasCloseCall: boolean
  mode: LearningMode
  timestamp: number
}

export interface LearningSession {
  id: string
  mode: LearningMode
  words: string[]
  results: AnswerResult[]
  startedAt: number
  completedAt?: number
  totalTime: number
}

export interface SessionConfig {
  wordPool: string[]
  order: 'sequential' | 'random'
  newWordsPerSession: number
  maxReviewWords: number
  shuffleMode: 'shuffle_all' | 'interleave' | 'sequential'
  enableInterleaving: boolean
}
