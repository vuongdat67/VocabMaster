import type { Word } from '@/types/word'

export interface CompactWord {
  w: string
  ipa: string
  pos: string
  vi: string
  en: string
  ex?: string
  exVi?: string
  syn?: string[]
  tags: string[]
  diff: 1 | 2 | 3 | 4 | 5
}

function expandCompact(cw: CompactWord): Word {
  return {
    id: crypto.randomUUID(),
    word: cw.w,
    ipa: cw.ipa,
    partOfSpeech: cw.pos as Word['partOfSpeech'],
    definitions: [{ meaning: cw.en, vietnamese: cw.vi }],
    examples: cw.ex ? [{ sentence: cw.ex, vietnamese: cw.exVi ?? '' }] : [],
    synonyms: cw.syn ?? [],
    antonyms: [],
    imageUrls: [],
    tags: cw.tags,
    difficulty: cw.diff,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function expandWordList(compact: CompactWord[]): Word[] {
  return compact.map(expandCompact)
}
