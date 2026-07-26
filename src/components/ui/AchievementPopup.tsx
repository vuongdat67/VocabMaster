import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import { useAchievementStore } from '@/stores/achievement-store'
import confetti from 'canvas-confetti'

export function AchievementPopup() {
  const { newlyUnlocked, clearNewlyUnlocked } = useAchievementStore()

  useEffect(() => {
    if (newlyUnlocked) {
      // Bắn pháo hoa
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#F59E0B', '#10B981', '#3B82F6']
      })
      
      // Tự động đóng sau 5 giây
      const timer = setTimeout(() => {
        clearNewlyUnlocked()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [newlyUnlocked, clearNewlyUnlocked])

  return (
    <AnimatePresence>
      {newlyUnlocked && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-start gap-4 p-4 pr-12 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-yellow-400 max-w-sm"
        >
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0 text-2xl shadow-inner">
            {newlyUnlocked.icon}
          </div>
          
          <div className="pt-1">
            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Thành tựu mới!</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1">
              {newlyUnlocked.title}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {newlyUnlocked.description}
            </p>
          </div>

          <button
            onClick={clearNewlyUnlocked}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
