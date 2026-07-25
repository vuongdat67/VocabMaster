import type { Word } from '@/types/word'
import type { LearningMode } from '@/types/learning'
import { wordRepo } from '@/db/word-repo'
import { randomSubset } from './utils'

export interface DistractorOptions {
  /** How many distractors to generate */
  count: number
  /** Learning mode determines which similarity dimension to weight more heavily */
  mode: LearningMode
  /** Target word difficulty (1-5) */
  difficulty: 1 | 2 | 3 | 4 | 5
}

// ---------------------------------------------------------------------------
// IPA analysis helpers
// ---------------------------------------------------------------------------

const IPA_VOWELS = new Set([
  'i', 'ɪ', 'e', 'ɛ', 'æ', 'a', 'ɑ', 'ɔ', 'o', 'u', 'ʊ', 'ʌ', 'ə',
  'ɜ', 'ɝ', 'ɞ', 'ɐ', 'ɤ', 'ɨ', 'ʉ', 'ɯ', 'y', 'ʏ', 'ø', 'œ', 'ɶ',
])

const IPA_CONSONANTS = new Set([
  'p', 'b', 't', 'd', 'ʈ', 'ɖ', 'c', 'ɟ', 'k', 'g', 'q', 'ɢ', 'ʔ',
  'm', 'ɱ', 'n', 'ɳ', 'ɲ', 'ŋ', 'ɴ', 'ʙ', 'r', 'ʀ', 'ɾ', 'ɽ',
  'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'ʂ', 'ʐ', 'h', 'ɦ', 'ɬ', 'ɮ',
  'l', 'ɭ', 'ʎ', 'ʟ', 'w', 'j', 'ɰ', 'ç', 'ʝ', 'x', 'ɣ', 'χ', 'ʁ', 'ħ', 'ʕ',
])

const IPA_AFFRICATES = new Set([
  'tʃ', 'dʒ', 'ts', 'dz', 'pf', 'bv', 'tɕ', 'dʑ', 'tʂ', 'dʐ',
])

/** Strip IPA delimiters and stress marks, leaving only phoneme characters. */
function cleanIPA(ipa: string): string {
  return ipa.replace(/[ˈˌ./]/g, '').trim()
}

/**
 * Extract the first consonant phoneme from an IPA string.
 * Checks affricates (multi-character consonants) first, then single consonants.
 */
function getFirstPhoneme(ipa: string): string {
  const cleaned = cleanIPA(ipa)
  if (!cleaned) return ''

  for (const affricate of IPA_AFFRICATES) {
    if (cleaned.startsWith(affricate)) return affricate
  }

  for (const char of cleaned) {
    if (IPA_CONSONANTS.has(char)) return char
  }

  // Fall back to the first character if nothing consonant-like was found
  return cleaned[0] ?? ''
}

/**
 * Extract the first vowel nucleus (single vowel or diphthong) from an IPA string.
 */
function getVowelNucleus(ipa: string): string {
  const cleaned = cleanIPA(ipa)
  let nucleus = ''

  for (const char of cleaned) {
    if (IPA_VOWELS.has(char)) {
      nucleus += char
    } else if (nucleus.length > 0) {
      // We already collected the vowel nucleus and hit a non-vowel — stop
      break
    }
  }

  return nucleus
}

/**
 * Count the number of syllables in an IPA string by counting vowel clusters.
 */
function getSyllableCount(ipa: string): number {
  const cleaned = cleanIPA(ipa)
  let count = 0
  let prevWasVowel = false

  for (const char of cleaned) {
    const isVowel = IPA_VOWELS.has(char)
    if (isVowel && !prevWasVowel) {
      count++
    }
    prevWasVowel = isVowel
  }

  return Math.max(count, 1)
}

// ---------------------------------------------------------------------------
// Similarity scoring
// ---------------------------------------------------------------------------

/**
 * Compute phonetic similarity between two IPA strings.
 *
 * Returns a score from 0 to 6:
 *  +3  first phoneme matches
 *  +2  vowel nucleus matches
 *  +1  syllable count matches
 */
export function phoneticSimilarity(ipa1: string, ipa2: string): number {
  let score = 0
  if (getFirstPhoneme(ipa1) === getFirstPhoneme(ipa2)) score += 3
  if (getVowelNucleus(ipa1) === getVowelNucleus(ipa2)) score += 2
  if (getSyllableCount(ipa1) === getSyllableCount(ipa2)) score += 1
  return score
}

/**
 * Compute semantic similarity between two words.
 *
 * Returns a score from 0 to 4:
 *  +2  share any tag
 *  +1  definitions share any word (English meaning)
 *  +1  same part of speech
 */
export function semanticSimilarity(word1: Word, word2: Word): number {
  let score = 0

  // +2 if they share any tag
  if (word1.tags.some((tag) => word2.tags.includes(tag))) {
    score += 2
  }

  // +1 if definitions share any word (in the English meaning)
  const words1 = new Set(
    word1.definitions.flatMap((d) => d.meaning.toLowerCase().split(/\s+/)),
  )
  const words2 = new Set(
    word2.definitions.flatMap((d) => d.meaning.toLowerCase().split(/\s+/)),
  )
  for (const w of words1) {
    if (words2.has(w)) {
      score += 1
      break
    }
  }

  // +1 if same part of speech
  if (word1.partOfSpeech === word2.partOfSpeech) {
    score += 1
  }

  return score
}

// ---------------------------------------------------------------------------
// Mode weight configuration
// ---------------------------------------------------------------------------

interface ModeWeights {
  phonetic: number
  semantic: number
}

const MODE_WEIGHTS: Record<LearningMode, ModeWeights | null> = {
  audio_challenge: { phonetic: 0.7, semantic: 0.3 },
  text_challenge: { phonetic: 0.3, semantic: 0.7 },
  matching: { phonetic: 0.2, semantic: 0.8 },
  synonym_match: { phonetic: 0.2, semantic: 0.8 },
  flashcard: { phonetic: 0.4, semantic: 0.6 },
  typing_challenge: null,
  fill_blank: null,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate distractor (wrong-answer) words for a multiple-choice challenge.
 *
 * Returns `count` words that are phonetically and/or semantically close to the
 * correct word, making the test genuinely harder.  The weighting between the
 * two similarity dimensions depends on the learning mode.
 *
 * When fewer than `count` suitable candidates exist in the difficulty-matched
 * pool the result is padded with random words from the same pool.  Modes that
 * do not use distractors (`typing_challenge`, `fill_blank`) return an empty
 * array.
 */
export async function getDistractors(
  correctWord: Word,
  options: DistractorOptions,
): Promise<Word[]> {
  const { count, mode, difficulty } = options

  if (count <= 0) return []

  const weights = MODE_WEIGHTS[mode]
  if (!weights) return []

  // Fetch the full word corpus, excluding the correct word itself
  const allWords = await wordRepo.getAll()
  const pool = allWords.filter((w) => w.id !== correctWord.id)

  // --- Difficulty filter (±1) ---
  const difficultyPool = pool.filter(
    (w) => Math.abs(w.difficulty - difficulty) <= 1,
  )

  if (difficultyPool.length === 0) return []

  // --- Score every candidate by weighted phonetic + semantic similarity ---
  const scored = difficultyPool.map((w) => ({
    word: w,
    score:
      phoneticSimilarity(correctWord.ipa, w.ipa) * weights.phonetic +
      semanticSimilarity(correctWord, w) * weights.semantic,
  }))

  // Sort descending so the most plausible distractors come first
  scored.sort((a, b) => b.score - a.score)

  // Take the top N
  const distractors = scored.slice(0, count).map((c) => c.word)

  // --- Pad if the scored pool is too small ---
  if (distractors.length < count) {
    const selectedIds = new Set(distractors.map((w) => w.id))
    let remaining = difficultyPool.filter((w) => !selectedIds.has(w.id))

    // If the difficulty-restricted pool is exhausted, widen to the full pool
    if (remaining.length === 0) {
      remaining = pool.filter((w) => !selectedIds.has(w.id))
    }

    const padding = randomSubset(remaining, count - distractors.length)
    distractors.push(...padding)
  }

  return distractors.slice(0, count)
}
