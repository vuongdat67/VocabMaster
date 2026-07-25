import { db } from './database'
import type { SRSData } from '@/types/learning'

export const progressRepo = {
  async getSRS(wordId: string): Promise<SRSData | undefined> {
    return db.srsData.get(wordId)
  },

  async bulkGetSRS(wordIds: string[]): Promise<SRSData[]> {
    return db.srsData.where('wordId').anyOf(wordIds).toArray()
  },

  async upsertSRS(data: SRSData): Promise<void> {
    await db.srsData.put(data)
  },

  async getDueWords(limit: number = 50): Promise<SRSData[]> {
    const now = Date.now()
    return db.srsData
      .where('nextReviewAt')
      .belowOrEqual(now)
      .toArray()
      .then((arr) =>
        arr
          .sort((a, b) => {
            // Priority: more wrong > higher interval > older
            const aScore = a.timesWrong * 10 + a.interval + a.nextReviewAt / 1e13
            const bScore = b.timesWrong * 10 + b.interval + b.nextReviewAt / 1e13
            return bScore - aScore
          })
          .slice(0, limit)
      )
  },

  async getDueCount(): Promise<number> {
    const now = Date.now()
    return db.srsData.where('nextReviewAt').belowOrEqual(now).count()
  },

  async getStats(): Promise<{
    totalStudied: number
    totalCorrect: number
    totalWrong: number
    averageAccuracy: number
  }> {
    const all = await db.srsData.toArray()
    const totalStudied = all.length
    const totalCorrect = all.reduce((s, d) => s + d.timesCorrect, 0)
    const totalWrong = all.reduce((s, d) => s + d.timesWrong, 0)
    const total = totalCorrect + totalWrong
    return {
      totalStudied,
      totalCorrect,
      totalWrong,
      averageAccuracy: total > 0 ? (totalCorrect / total) * 100 : 0,
    }
  },

  async getWordsByMastery(): Promise<{
    mastered: number
    learning: number
    new: number
  }> {
    const srsEntries = await db.srsData.toArray()
    const totalWords = await db.words.count()
    const mastered = srsEntries.filter((s) => s.interval >= 21).length
    const learning = srsEntries.length - mastered
    const newWords = totalWords - srsEntries.length
    return { mastered, learning, new: Math.max(0, newWords) }
  },
}
