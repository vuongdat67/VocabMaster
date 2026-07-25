import { create } from 'zustand'
import type { Word } from '@/types/word'

interface WordStore {
  words: Word[]
  isLoading: boolean
  searchQuery: string
  selectedTags: string[]
  setWords: (words: Word[]) => void
  setLoading: (loading: boolean) => void
  setSearchQuery: (query: string) => void
  setSelectedTags: (tags: string[]) => void
  toggleTag: (tag: string) => void
}

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  isLoading: false,
  searchQuery: '',
  selectedTags: [],
  setWords: (words) => set({ words }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  toggleTag: (tag) => {
    const { selectedTags } = get()
    if (selectedTags.includes(tag)) {
      set({ selectedTags: selectedTags.filter((t) => t !== tag) })
    } else {
      set({ selectedTags: [...selectedTags, tag] })
    }
  },
}))
