import { db } from '@/db/database'
import { supabase } from './supabaseClient'

class SyncEngine {
  private isSyncing = false

  async sync() {
    if (this.isSyncing) return
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return // Must be logged in

    const userId = session.user.id

    try {
      this.isSyncing = true
      
      // 1. Get last sync time from settings (local)
      const lastSyncRecord = await db.settings.get('lastSyncTime')
      const lastSyncTime = (lastSyncRecord?.value as number) || 0

      // 2. We will just do a simple push-pull for words and srsData as MVP
      // PUSH: Local -> Cloud (Only items updated after lastSyncTime)
      await this.pushWords(userId, lastSyncTime)
      await this.pushSrsData(userId, lastSyncTime)

      // PULL: Cloud -> Local (Only items updated after lastSyncTime)
      await this.pullWords(userId, lastSyncTime)
      await this.pullSrsData(userId, lastSyncTime)

      // 3. Update last sync time
      const newSyncTime = Date.now()
      await db.settings.put({ key: 'lastSyncTime', value: newSyncTime })

    } catch (err) {
      console.error('Sync failed:', err)
      throw err
    } finally {
      this.isSyncing = false
    }
  }

  private async pushWords(userId: string, lastSyncTime: number) {
    const localWords = await db.words.filter(w => (w.updatedAt || w.createdAt) > lastSyncTime).toArray()
    if (localWords.length === 0) return

    const payload = localWords.map(w => ({
      id: w.id,
      user_id: userId,
      word: w.word,
      ipa: w.ipa,
      part_of_speech: w.partOfSpeech,
      definitions: w.definitions,
      examples: w.examples,
      synonyms: w.synonyms,
      antonyms: w.antonyms,
      image_urls: w.imageUrls,
      audio_url: w.audioUrl,
      tags: w.tags,
      difficulty: w.difficulty,
      created_at: w.createdAt,
      updated_at: w.updatedAt || Date.now()
    }))

    const { error } = await supabase.from('words').upsert(payload)
    if (error) throw error
  }

  private async pullWords(userId: string, lastSyncTime: number) {
    const { data: cloudWords, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastSyncTime)

    if (error) throw error
    if (!cloudWords || cloudWords.length === 0) return

    const localPayload = cloudWords.map(w => ({
      id: w.id,
      word: w.word,
      ipa: w.ipa,
      partOfSpeech: w.part_of_speech,
      definitions: w.definitions,
      examples: w.examples,
      synonyms: w.synonyms,
      antonyms: w.antonyms,
      imageUrls: w.image_urls,
      audioUrl: w.audio_url,
      tags: w.tags,
      difficulty: w.difficulty,
      createdAt: w.created_at,
      updatedAt: w.updated_at
    }))

    await db.words.bulkPut(localPayload as any)
  }

  private async pushSrsData(userId: string, lastSyncTime: number) {
    const localSrs = await db.srsData.filter(s => (s.updatedAt || s.createdAt) > lastSyncTime).toArray()
    if (localSrs.length === 0) return

    const payload = localSrs.map(s => ({
      word_id: s.wordId,
      user_id: userId,
      interval: s.interval,
      ease_factor: s.easeFactor,
      repetitions: s.repetitions,
      next_review_at: s.nextReviewAt,
      average_response_time: s.averageResponseTime,
      last_response_time: s.lastResponseTime,
      times_correct: s.timesCorrect,
      times_wrong: s.timesWrong,
      close_calls: s.closeCalls,
      studied_in_sessions: s.studiedInSessions,
      last_studied_at: s.lastStudiedAt,
      mode_history: s.modeHistory,
      wrong_modes: s.wrongModes,
      created_at: s.createdAt,
      updated_at: s.updatedAt || Date.now()
    }))

    const { error } = await supabase.from('srs_data').upsert(payload)
    if (error) throw error
  }

  private async pullSrsData(userId: string, lastSyncTime: number) {
    const { data: cloudSrs, error } = await supabase
      .from('srs_data')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastSyncTime)

    if (error) throw error
    if (!cloudSrs || cloudSrs.length === 0) return

    const localPayload = cloudSrs.map(s => ({
      wordId: s.word_id,
      interval: s.interval,
      easeFactor: s.ease_factor,
      repetitions: s.repetitions,
      nextReviewAt: s.next_review_at,
      averageResponseTime: s.average_response_time,
      lastResponseTime: s.last_response_time,
      timesCorrect: s.times_correct,
      timesWrong: s.times_wrong,
      closeCalls: s.close_calls,
      studiedInSessions: s.studied_in_sessions,
      lastStudiedAt: s.last_studied_at,
      modeHistory: s.mode_history,
      wrongModes: s.wrong_modes,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }))

    await db.srsData.bulkPut(localPayload as any)
  }

  // Helper to force full sync (e.g. initial login on new device)
  async forceSync() {
    await db.settings.put({ key: 'lastSyncTime', value: 0 })
    return this.sync()
  }
}

export const syncEngine = new SyncEngine()
