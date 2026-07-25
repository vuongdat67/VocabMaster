import type { LearningMode } from './learning'

export interface WeeklyActivity {
  date: string
  wordsStudied: number
  correct: number
  wrong: number
  timeSpent: number
}

export interface UserStats {
  totalWordsLearned: number
  totalWordsStudied: number
  totalCorrect: number
  totalWrong: number
  overallAccuracy: number
  currentStreak: number
  longestStreak: number
  totalStudyTime: number
  sessionsCompleted: number
  wordsByDifficulty: Record<number, number>
  accuracyByMode: Record<LearningMode, number>
  lastStudyDate: number
  weeklyActivity: WeeklyActivity[]
}
