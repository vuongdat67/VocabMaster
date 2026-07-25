import { db } from './database'
import type { LearningSession } from '@/types/learning'

export const sessionRepo = {
  async save(session: LearningSession): Promise<string> {
    return db.sessions.add(session)
  },

  async update(id: string, changes: Partial<LearningSession>): Promise<number> {
    return db.sessions.update(id, changes)
  },

  async getRecent(limit: number = 20): Promise<LearningSession[]> {
    return db.sessions
      .orderBy('startedAt')
      .reverse()
      .limit(limit)
      .toArray()
  },

  async getByDateRange(from: number, to: number): Promise<LearningSession[]> {
    return db.sessions
      .where('startedAt')
      .between(from, to)
      .toArray()
  },

  async getTodaySessions(): Promise<LearningSession[]> {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    return db.sessions
      .where('startedAt')
      .above(startOfDay.getTime())
      .toArray()
  },

  async count(): Promise<number> {
    return db.sessions.count()
  },
}
