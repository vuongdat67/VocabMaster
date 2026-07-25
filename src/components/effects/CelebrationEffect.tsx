import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiPiece {
 id: number
 x: number
 color: string
 rotation: number
 shape: 'circle' | 'square'
}

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

export function CelebrationEffect({ active = false }: { active?: boolean }) {
 const [pieces, setPieces] = useState<ConfettiPiece[]>([])

 useEffect(() => {
 if (active) {
 const newPieces: ConfettiPiece[] = Array.from({ length: 20 }, (_, i) => ({
 id: Date.now() + i,
 x: Math.random() * 100,
 color: colors[Math.floor(Math.random() * colors.length)] ?? '#6366f1',
 rotation: Math.random() * 360,
 shape: Math.random() > 0.5 ? 'circle' : 'square',
 }))
 setPieces(newPieces)
 const timer = setTimeout(() => setPieces([]), 2000)
 return () => clearTimeout(timer)
 }
 }, [active])

 return (
 <AnimatePresence>
 {pieces.map((piece) => (
 <motion.div
 key={piece.id}
 className="fixed pointer-events-none z-50"
 style={{ left: `${piece.x}%`, top: -20 }}
 initial={{ y: -20, opacity: 1, rotate: 0 }}
 animate={{
 y: typeof window !== 'undefined' ? window.innerHeight + 20 : 500,
 opacity: [1, 1, 0],
 rotate: piece.rotation,
 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 1.5 + Math.random(), ease: 'easeOut' }}
 >
 <div
 className={`w-3 h-3 ${
 piece.shape === 'circle' ? 'rounded-full' : 'rounded-sm'
 }`}
 style={{ backgroundColor: piece.color }}
 />
 </motion.div>
 ))}
 </AnimatePresence>
 )
}
