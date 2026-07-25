import { useSettingsStore } from '@/stores/settings-store'
import { AnimalAnimation } from './AnimalAnimation'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

export function MascotWidget() {
  const { settings } = useSettingsStore()
  const { mascotType, mascotImageUrl } = settings
  const [isDragging, setIsDragging] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)

  const initialPos = {
    'top-right': { top: 72, right: 24 },
    'top-left': { top: 72, left: 24 },
    'bottom-right': { bottom: 148, right: 24 },
    'bottom-left': { bottom: 148, left: 24 },
  }[settings.mascotPosition] ?? { bottom: 148, right: 24 }

  return (
    <>
      {/* Viewport bounds */}
      <div ref={constraintsRef} className="fixed inset-0 z-40 pointer-events-none" />
      <motion.div
        className="fixed z-45 cursor-grab active:cursor-grabbing select-none"
        style={{
          ...initialPos,
          touchAction: 'none',
        }}
        drag
        dragMomentum
        dragElastic={0.1}
        dragConstraints={constraintsRef}
        dragPropagation={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        whileDrag={{ scale: 1.2, transition: { duration: 0.15 } }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {mascotType === 'custom' && mascotImageUrl ? (
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-white bg-white">
            <img
              src={mascotImageUrl}
              alt="Mascot"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <AnimalAnimation />
        )}
      </motion.div>
    </>
  )
}
