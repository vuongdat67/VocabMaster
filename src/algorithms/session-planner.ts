import type { Word } from '@/types/word'
import type { SRSData, LearningMode, SessionConfig } from '@/types/learning'
import { progressRepo } from '@/db/progress-repo'

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i] as T
    shuffled[i] = shuffled[j] as T
    shuffled[j] = temp
  }
  return shuffled
}

export function selectModeForWord(srs?: SRSData): LearningMode {
  if (!srs || srs.studiedInSessions === 0) return 'flashcard'

  const wrongCount = srs.timesWrong
  const correctCount = srs.timesCorrect
  const lastMode = srs.modeHistory[srs.modeHistory.length - 1]

  // If wrong, pick a different mode than attempted before
  if (wrongCount > correctCount && srs.wrongModes.length > 0) {
    const available = (['audio_challenge', 'text_challenge', 'typing_challenge', 'fill_blank', 'matching', 'synonym_match'] as LearningMode[])
      .filter((m) => !srs.wrongModes.includes(m) && m !== lastMode)
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)]!

  }

  // If correct + fast → easier modes (flashcard)
  const avgTime = srs.averageResponseTime
  if (correctCount > wrongCount && avgTime > 0 && avgTime < 3000) {
    return 'flashcard'
  }

  // Cycle through modes based on studied count
  const modes: LearningMode[] = [
    'flashcard', 'audio_challenge', 'text_challenge',
    'typing_challenge', 'fill_blank', 'matching', 'synonym_match',
  ]
  return modes[srs.studiedInSessions % modes.length] ?? 'flashcard'
}

export interface PlannedSession {
  words: Word[]
  modes: LearningMode[]
  config: SessionConfig
}

export async function planSession(config: SessionConfig): Promise<PlannedSession> {
  const { wordPool, order, newWordsPerSession, maxReviewWords, enableInterleaving } = config

  // Get all words in pool
  const { wordRepo } = await import('@/db/word-repo')
  const allPoolWords = await wordRepo.getByIds(wordPool)
  let pool = [...allPoolWords]

  if (order === 'random') {
    pool = shuffleArray(pool)
  }

  // Separate into new vs review
  const srsEntries = await progressRepo.bulkGetSRS(pool.map((w) => w.id))
  const srsMap = new Map(srsEntries.map((s) => [s.wordId, s]))
  const now = Date.now()

  const newWords = pool.filter((w) => !srsMap.has(w.id)).slice(0, newWordsPerSession)
  const dueWords = pool
    .filter((w) => {
      const srs = srsMap.get(w.id)
      return srs && srs.nextReviewAt <= now
    })
    .slice(0, maxReviewWords)

  // Assemble final word list with interleaving
  let finalWords: Word[] = []

  if (enableInterleaving && newWords.length > 0 && dueWords.length > 0) {
    // Interleave: 1 new → 2-3 review → 1 new → ...
    let nIdx = 0
    let dIdx = 0
    while (nIdx < newWords.length || dIdx < dueWords.length) {
      if (nIdx < newWords.length) finalWords.push(newWords[nIdx++]!)
      for (let i = 0; i < 2 && dIdx < dueWords.length; i++) {
        finalWords.push(dueWords[dIdx++]!)
      }
    }
  } else {
    if (order === 'random') {
      finalWords = shuffleArray([...newWords, ...dueWords])
    } else {
      finalWords = [...newWords, ...dueWords]
    }
  }

  // Assign modes
  const modes = finalWords.map((w) => {
    const srs = srsMap.get(w.id)
    return selectModeForWord(srs)
  })

  return { words: finalWords, modes, config }
}
