import Dexie, { type Table } from 'dexie'
import type { Word, WordPack } from '@/types/word'
import type { SRSData, LearningSession } from '@/types/learning'
import type { UserSettings } from '@/types/settings'
import type { UserStats, WeeklyActivity } from '@/types/stats'
import type { Folder } from '@/types/folder'

export class VocabDatabase extends Dexie {
  words!: Table<Word, string>
  folders!: Table<Folder, string>
  srsData!: Table<SRSData, string>
  sessions!: Table<LearningSession, string>
  wordPacks!: Table<WordPack, string>
  settings!: Table<{ key: string; value: unknown }, string>
  stats!: Table<UserStats, number>
  weeklyActivity!: Table<WeeklyActivity, string>

  constructor() {
    super('VocabMaster')
    this.version(1).stores({
      words: 'id, *tags, difficulty, word',
      srsData: 'wordId, nextReviewAt, interval, easeFactor, *wrongModes',
      sessions: 'id, startedAt, mode, completedAt',
      wordPacks: 'id, *tags, difficulty',
      settings: 'key',
      stats: '++id',
      weeklyActivity: 'date',
    })
    this.version(2).stores({
      folders: 'id, name, createdAt'
    })
  }
}

export const db = new VocabDatabase()
