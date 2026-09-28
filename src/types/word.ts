export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'interjection'
  | 'phrase'

export interface Definition {
  meaning: string
  vietnamese: string
}

export interface Example {
  sentence: string
  vietnamese: string
}

export interface Word {
  id: string
  word: string
  ipa: string
  partOfSpeech: PartOfSpeech
  definitions: Definition[]
  examples: Example[]
  synonyms: string[]
  antonyms: string[]
  imageUrls: string[]
  audioUrl?: string
  tags: string[]
  folderId?: string
  difficulty: 1 | 2 | 3 | 4 | 5
  createdAt: number
  updatedAt: number
}

export interface WordPack {
  id: string
  name: string
  description: string
  wordCount: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}
