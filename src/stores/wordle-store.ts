import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Word } from '@/types/word'

interface WordleState {
  targetWord: Word | null
  guesses: string[]
  currentGuess: string
  gameState: 'setup' | 'playing' | 'won' | 'lost' | 'timeout'
  timeLeft: number
  startTime: number
  
  setTargetWord: (word: Word | null) => void
  setGuesses: (guesses: string[]) => void
  setCurrentGuess: (guess: string) => void
  setGameState: (state: 'setup' | 'playing' | 'won' | 'lost' | 'timeout') => void
  setTimeLeft: (time: number | ((prev: number) => number)) => void
  setStartTime: (time: number) => void
  resetGame: () => void
}

export const useWordleStore = create<WordleState>()(
  persist(
    (set) => ({
      targetWord: null,
      guesses: [],
      currentGuess: '',
      gameState: 'setup',
      timeLeft: 180, // 3 minutes
      startTime: 0,
      
      setTargetWord: (word) => set({ targetWord: word }),
      setGuesses: (guesses) => set({ guesses }),
      setCurrentGuess: (guess) => set({ currentGuess: guess }),
      setGameState: (state) => set({ gameState: state }),
      setTimeLeft: (time) => set((state) => ({ 
        timeLeft: typeof time === 'function' ? time(state.timeLeft) : time 
      })),
      setStartTime: (time) => set({ startTime: time }),
      resetGame: () => set({
        targetWord: null,
        guesses: [],
        currentGuess: '',
        gameState: 'setup',
        timeLeft: 180,
        startTime: 0
      })
    }),
    {
      name: 'wordle-storage',
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
)
