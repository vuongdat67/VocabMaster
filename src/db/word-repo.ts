import { db } from './database'
import type { Word, WordPack } from '@/types/word'

export const wordRepo = {
  async getAll(): Promise<Word[]> {
    return db.words.toArray()
  },

  async getById(id: string): Promise<Word | undefined> {
    return db.words.get(id)
  },

  async getByTag(tag: string): Promise<Word[]> {
    return db.words.where('tags').equals(tag).toArray()
  },

  async getByDifficulty(level: 1 | 2 | 3 | 4 | 5): Promise<Word[]> {
    return db.words.where('difficulty').equals(level).toArray()
  },

  async search(query: string): Promise<Word[]> {
    const lower = query.toLowerCase()
    return db.words
      .filter(
        (w) =>
          w.word.toLowerCase().includes(lower) ||
          w.definitions.some((d) => d.vietnamese.toLowerCase().includes(lower)) ||
          w.definitions.some((d) => d.meaning.toLowerCase().includes(lower))
      )
      .toArray()
  },

  async count(): Promise<number> {
    return db.words.count()
  },

  async add(word: Word): Promise<string> {
    return db.words.add(word)
  },

  async bulkAdd(words: Word[]): Promise<string[]> {
    // Filter out duplicates by word text
    const existing = await db.words.toArray()
    const existingWords = new Set(existing.map((w) => w.word.toLowerCase()))
    const newWords = words.filter((w) => !existingWords.has(w.word.toLowerCase()))
    if (newWords.length === 0) return []
    return db.words.bulkAdd(newWords, { allKeys: true })
  },

  async update(id: string, changes: Partial<Word>): Promise<number> {
    return db.words.update(id, { ...changes, updatedAt: Date.now() })
  },

  async delete(id: string): Promise<void> {
    return db.words.delete(id)
  },

  async getAllTags(): Promise<string[]> {
    const words = await db.words.toArray()
    const tagSet = new Set<string>()
    words.forEach((w) => w.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  },

  /** Get words by a list of ids, used for session loading */
  async getByIds(ids: string[]): Promise<Word[]> {
    return db.words.where('id').anyOf(ids).toArray()
  },

  /** Get words NOT yet studied (no SRS data) */
  async getUnstudied(limit: number): Promise<Word[]> {
    const srsEntries = await db.srsData.toArray()
    const studiedIds = new Set(srsEntries.map((s) => s.wordId))
    return db.words
      .filter((w) => !studiedIds.has(w.id))
      .limit(limit)
      .toArray()
  },

  // --- Word Packs ---
  async getWordPacks(): Promise<WordPack[]> {
    return db.wordPacks.toArray()
  },

  async addWordPack(pack: WordPack): Promise<string> {
    return db.wordPacks.add(pack)
  },

  async bulkAddWordPacks(packs: WordPack[]): Promise<string[]> {
    return db.wordPacks.bulkAdd(packs, { allKeys: true })
  },

  async getWordsByPack(packId: string): Promise<Word[]> {
    const pack = await db.wordPacks.get(packId)
    if (!pack) return []
    return db.words.where('tags').anyOf(pack.tags).toArray()
  },
}
