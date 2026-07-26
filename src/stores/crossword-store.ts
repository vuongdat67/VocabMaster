import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CrosswordGridInfo } from '@/utils/crossword'

type CellPos = { x: number; y: number }

interface CrosswordState {
  gameState: 'setup' | 'playing' | 'completed' | 'timeout' | 'gameover'
  wordCount: number
  gridInfo: CrosswordGridInfo | null
  userGrid: string[][]
  selectedCell: CellPos | null
  activeDirection: 'across' | 'down'
  timeLeft: number
  wrongAttempts: number
  
  setGameState: (state: 'setup' | 'playing' | 'completed' | 'timeout' | 'gameover') => void
  setWordCount: (count: number) => void
  setGridInfo: (info: CrosswordGridInfo | null) => void
  setUserGrid: (grid: string[][]) => void
  setSelectedCell: (cell: CellPos | null) => void
  setActiveDirection: (dir: 'across' | 'down') => void
  setTimeLeft: (time: number | ((prev: number) => number)) => void
  setWrongAttempts: (attempts: number | ((prev: number) => number)) => void
  resetGame: () => void
}

export const useCrosswordStore = create<CrosswordState>()(
  persist(
    (set) => ({
      gameState: 'setup',
      wordCount: 20,
      gridInfo: null,
      userGrid: [],
      selectedCell: null,
      activeDirection: 'across',
      timeLeft: 0,
      wrongAttempts: 0,
      
      setGameState: (state) => set({ gameState: state }),
      setWordCount: (count) => set({ wordCount: count }),
      setGridInfo: (info) => set({ gridInfo: info }),
      setUserGrid: (grid) => set({ userGrid: grid }),
      setSelectedCell: (cell) => set({ selectedCell: cell }),
      setActiveDirection: (dir) => set({ activeDirection: dir }),
      setTimeLeft: (time) => set((state) => ({ 
        timeLeft: typeof time === 'function' ? time(state.timeLeft) : time 
      })),
      setWrongAttempts: (attempts) => set((state) => ({
        wrongAttempts: typeof attempts === 'function' ? attempts(state.wrongAttempts) : attempts
      })),
      resetGame: () => set({
        gameState: 'setup',
        gridInfo: null,
        userGrid: [],
        selectedCell: null,
        timeLeft: 0,
        wrongAttempts: 0,
      })
    }),
    {
      name: 'crossword-storage',
      storage: createJSONStorage(() => sessionStorage), 
      // Use sessionStorage so it resets when closing tab but survives navigation
    }
  )
)
