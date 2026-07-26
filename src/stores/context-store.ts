import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Word } from '@/types/word'

export interface Question {
  word: Word
  sentenceParts: string[]
  missingWord: string
}

interface ContextState {
  questions: Question[]
  currentIndex: number
  gameState: 'setup' | 'playing' | 'completed'
  userInput: string
  isCorrect: boolean | null
  sessionResults: { wordId: string; isCorrect: boolean }[]
  startTime: number
  
  setQuestions: (q: Question[]) => void
  setCurrentIndex: (idx: number | ((prev: number) => number)) => void
  setGameState: (state: 'setup' | 'playing' | 'completed') => void
  setUserInput: (input: string) => void
  setIsCorrect: (correct: boolean | null) => void
  setSessionResults: (res: { wordId: string; isCorrect: boolean }[] | ((prev: { wordId: string; isCorrect: boolean }[]) => { wordId: string; isCorrect: boolean }[])) => void
  setStartTime: (time: number) => void
  resetGame: () => void
}

export const useContextStore = create<ContextState>()(
  persist(
    (set) => ({
      questions: [],
      currentIndex: 0,
      gameState: 'setup',
      userInput: '',
      isCorrect: null,
      sessionResults: [],
      startTime: 0,
      
      setQuestions: (questions) => set({ questions }),
      setCurrentIndex: (idx) => set((state) => ({ 
        currentIndex: typeof idx === 'function' ? idx(state.currentIndex) : idx 
      })),
      setGameState: (state) => set({ gameState: state }),
      setUserInput: (input) => set({ userInput: input }),
      setIsCorrect: (correct) => set({ isCorrect: correct }),
      setSessionResults: (res) => set((state) => ({
        sessionResults: typeof res === 'function' ? res(state.sessionResults) : res
      })),
      setStartTime: (time) => set({ startTime: time }),
      resetGame: () => set({
        questions: [],
        currentIndex: 0,
        gameState: 'setup',
        userInput: '',
        isCorrect: null,
        sessionResults: [],
        startTime: 0
      })
    }),
    {
      name: 'context-storage',
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
)
