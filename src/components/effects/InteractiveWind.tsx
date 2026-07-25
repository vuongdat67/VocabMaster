import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playWindChime } from '@/lib/sound-manager'

interface Bubble {
 id: number
 word: string
 x: number
 y: number
 size: number
 speed: number
 color: string
}

const COLORS = [
 '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
 '#818cf8', '#667eea', '#7c3aed', '#6d28d9',
]

/**
 * Interactive wind-chime word bubbles component.
 * Words float like wind chimes, click/hover to hear gentle chime sounds.
 */
export function InteractiveWind({ words = [] }: { words: string[] }) {
 const [bubbles, setBubbles] = useState<Bubble[]>([])
 const [activeWord, setActiveWord] = useState<string | null>(null)
 const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

 // Generate initial bubbles
 useEffect(() => {
 if (words.length === 0) return

 // Create initial bubbles
 const initial = words.slice(0, 15).map((word, i) => ({
 id: i,
 word,
 x: Math.random() * 85 + 5,
 y: Math.random() * 85 + 5,
 size: Math.random() * 12 + 10,
 speed: 8 + Math.random() * 12,
 color: COLORS[i % COLORS.length] ?? '#6366f1',
 }))
 setBubbles(initial)

 // Periodic gentle breeze
 intervalRef.current = setInterval(() => {
 setBubbles((prev) =>
 prev.map((b) => ({
 ...b,
 x: Math.max(2, Math.min(98, b.x + (Math.random() - 0.5) * 6)),
 y: Math.max(2, Math.min(98, b.y + (Math.random() - 0.5) * 4)),
 }))
 )
 // Random chime on breeze
 if (Math.random() > 0.6) {
 playWindChime(0.2 + Math.random() * 0.3)
 }
 }, 4000)

 return () => {
 if (intervalRef.current) clearInterval(intervalRef.current)
 }
 }, [words])

 const handleBubbleClick = useCallback((bubble: Bubble) => {
 setActiveWord(bubble.word)
 // Play a chime based on position (higher x = higher pitch)
 const intensity = 0.3 + (bubble.x / 100) * 0.5
 playWindChime(intensity)
 setTimeout(() => setActiveWord(null), 1200)
 }, [])

 if (words.length === 0) return null

 return (
 <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
 {/* Floating word bubbles */}
 <AnimatePresence>
 {bubbles.map((bubble) => (
 <motion.button
 key={bubble.id}
 className="absolute rounded-full flex items-center justify-center cursor-pointer pointer-events-auto select-none"
 style={{
 left: `${bubble.x}%`,
 top: `${bubble.y}%`,
 width: `${bubble.size * 2}px`,
 height: `${bubble.size * 2}px`,
 background: `radial-gradient(circle, ${bubble.color}15, ${bubble.color}08)`,
 border: `1px solid ${bubble.color}20`,
 }}
 animate={{
 y: [0, -8, 0, -5, 0],
 scale: activeWord === bubble.word ? [1, 1.3, 1] : [1, 1.02, 0.98, 1],
 }}
 transition={{
 y: {
 duration: bubble.speed,
 repeat: Infinity,
 ease: 'easeInOut',
 },
 scale: {
 duration: 1.5,
 ease: 'easeInOut',
 },
 }}
 whileHover={{ scale: 1.2, borderColor: bubble.color + '60' }}
 onClick={() => handleBubbleClick(bubble)}
 >
 <span
 className="text-xs font-medium whitespace-nowrap px-1"
 style={{ color: bubble.color + '99' }}
 >
 {bubble.word}
 </span>
 </motion.button>
 ))}
 </AnimatePresence>

 {/* Active word tooltip */}
 <AnimatePresence>
 {activeWord && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
 >
 <div className="bg-white rounded-xl shadow-lg border border-indigo-200 px-5 py-2.5">
 <p className="text-sm font-medium text-indigo-600">
 🎐 {activeWord}
 </p>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )
}
