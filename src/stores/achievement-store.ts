import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'learning' | 'streak' | 'game'
  condition: (stats: any) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_word',
    title: 'Bước Chân Đầu Tiên',
    description: 'Học từ vựng đầu tiên',
    icon: '🌱',
    category: 'learning',
    condition: (stats) => stats.totalWordsLearned >= 1
  },
  {
    id: 'word_10',
    title: 'Khởi Động',
    description: 'Học 10 từ vựng',
    icon: '🏃',
    category: 'learning',
    condition: (stats) => stats.totalWordsLearned >= 10
  },
  {
    id: 'word_100',
    title: 'Học Giả Tân Binh',
    description: 'Học 100 từ vựng',
    icon: '📚',
    category: 'learning',
    condition: (stats) => stats.totalWordsLearned >= 100
  },
  {
    id: 'streak_3',
    title: 'Làm Nóng Cơ Thể',
    description: 'Đạt chuỗi 3 ngày học liên tiếp',
    icon: '🔥',
    category: 'streak',
    condition: (stats) => stats.currentStreak >= 3
  },
  {
    id: 'streak_7',
    title: 'Kỷ Luật Thép',
    description: 'Đạt chuỗi 7 ngày học liên tiếp',
    icon: '⚡',
    category: 'streak',
    condition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_30',
    title: 'Bất Bại',
    description: 'Đạt chuỗi 30 ngày học liên tiếp',
    icon: '👑',
    category: 'streak',
    condition: (stats) => stats.currentStreak >= 30
  }
]

interface AchievementState {
  unlockedIds: string[]
  newlyUnlocked: Achievement | null
  unlock: (id: string) => void
  checkAchievements: (stats: any) => void
  clearNewlyUnlocked: () => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
      newlyUnlocked: null,
      unlock: (id) => {
        const { unlockedIds } = get()
        if (!unlockedIds.includes(id)) {
          const achievement = ACHIEVEMENTS.find(a => a.id === id)
          set({ 
            unlockedIds: [...unlockedIds, id],
            newlyUnlocked: achievement || null
          })
        }
      },
      checkAchievements: (stats) => {
        const { unlockedIds, unlock } = get()
        if (!stats) return
        
        ACHIEVEMENTS.forEach(achievement => {
          if (!unlockedIds.includes(achievement.id)) {
            if (achievement.condition(stats)) {
              unlock(achievement.id)
            }
          }
        })
      },
      clearNewlyUnlocked: () => set({ newlyUnlocked: null })
    }),
    {
      name: 'vocab-achievements',
      partialize: (state) => ({ unlockedIds: state.unlockedIds })
    }
  )
)
