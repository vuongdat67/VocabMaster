import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playWindChime, playWhoosh } from '@/lib/sound-manager'

interface WindWord {
 id: number
 text: string
 x: number
 y: number
 delay: number
 speed: 'slow' | 'fast'
}

export function WindEffect({ words = [], enabled = true }: { words?: string[]; enabled?: boolean }) {
 const [windWords, setWindWords] = useState<WindWord[]>([])
 const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
 const lastChimeRef = useRef(0)

 // Gentle breeze - random wind chimes
 useEffect(() => {
 if (!enabled) return

 const breezeInterval = setInterval(() => {
 const now = Date.now()
 if (now - lastChimeRef.current > 8000 && Math.random() > 0.5) {
 lastChimeRef.current = now
 playWindChime(0.3 + Math.random() * 0.4)
 }
 }, 4000)

 return () => clearInterval(breezeInterval)
 }, [enabled])

 // Floating word bubbles
 useEffect(() => {
 if (!enabled || words.length === 0) return

 intervalRef.current = setInterval(() => {
 if (Math.random() > 0.35) return

 const word = words[Math.floor(Math.random() * words.length)]
 if (!word) return

 const newWord: WindWord = {
 id: Date.now(),
 text: word,
 x: Math.random() * 70 + 15,
 y: Math.random() * 70 + 15,
 delay: Math.random() * 0.5,
 speed: Math.random() > 0.5 ? 'slow' : 'fast',
 }

 setWindWords((prev) => [...prev.slice(-8), newWord])

 // Gentle whoosh sound for fast words
 if (newWord.speed === 'fast' && Math.random() > 0.5) {
 playWhoosh()
 }
 }, 2500)

 return () => {
 if (intervalRef.current) clearInterval(intervalRef.current)
 }
 }, [words, enabled])

 if (!enabled) return null

 return (
 <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
 <AnimatePresence>
 {windWords.map((w) => (
 <motion.div
 key={w.id}
 className="absolute font-bold whitespace-nowrap select-none"
 style={{
 left: `${w.x}%`,
 top: `${w.y}%`,
 fontSize: w.speed === 'fast' ? '0.75rem' : '1rem',
 color: w.speed === 'fast'
 ? 'rgba(99, 102, 241, 0.15)'
 : 'rgba(139, 92, 246, 0.12)',
 }}
 initial={{ opacity: 0, x: -40, rotate: -8 }}
 animate={{
 opacity: [0, 0.4, 0.2, 0],
 x: [0, 80, 160],
 y: [0, -25, -50],
 rotate: [-8, 3, -3],
 }}
 exit={{ opacity: 0 }}
 transition={{
 duration: w.speed === 'fast' ? 3 : 5,
 delay: w.delay,
 ease: 'easeOut',
 }}
 >
 {w.text}
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 )
}
