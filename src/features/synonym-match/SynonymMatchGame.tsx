import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { wordRepo } from '@/db/word-repo'
import { shuffle } from '@/lib/utils'

interface SynPair {
 id: string
 word: string
 synonym: string
}

interface PoolItem {
 id: string
 pairId: string
 text: string
}

interface Reaction {
 id: number
 emoji: string
 x: number
 y: number
}

const FALLBACK_COLORS = [
 '#6366f1', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed',
 '#db2777', '#ea580c', '#65a30d', '#0d9488',
]

function getFallbackColor(id: string): string {
 let hash = 0
 for (let i = 0; i < id.length; i++) {
 hash = id.charCodeAt(i) + ((hash << 5) - hash)
 }
 return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length] ?? '#6366f1'
}

import { useSettingsStore } from '@/stores/settings-store'

function useSoundEffects() {
  const { settings } = useSettingsStore()
  const [soundEnabled, setSoundEnabled] = useState(settings.sfxEnabled)
 const enabledRef = useRef(true)
 const ctxRef = useRef<AudioContext | null>(null)

 useEffect(() => {
 enabledRef.current = soundEnabled
 }, [soundEnabled])

 const getContext = useCallback(() => {
 if (!ctxRef.current) {
 const AudioCtor =
 window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
 if (!AudioCtor) return null
 try {
 ctxRef.current = new AudioCtor()
 } catch {
 return null
 }
 }
 if (ctxRef.current.state === 'suspended') {
 ctxRef.current.resume()
 }
 return ctxRef.current
 }, [])

 const playCorrect = useCallback(() => {
 if (!enabledRef.current) return
 const ctx = getContext()
 if (!ctx) return
 const now = ctx.currentTime
 // Two ascending tones: 523Hz (C5) then 659Hz (E5)
 const notes = [523, 659]
 notes.forEach((freq, i) => {
 const osc = ctx.createOscillator()
 const gain = ctx.createGain()
 osc.type = 'sine'
 const t = now + i * 0.15
 osc.frequency.setValueAtTime(freq, t)
 gain.gain.setValueAtTime(0.25, t)
 gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
 osc.connect(gain).connect(ctx.destination)
 osc.start(t)
 osc.stop(t + 0.2)
 })
 }, [getContext])

 const playWrong = useCallback(() => {
 if (!enabledRef.current) return
 const ctx = getContext()
 if (!ctx) return
 const now = ctx.currentTime
 // Low buzz: 200Hz sawtooth
 const osc = ctx.createOscillator()
 const gain = ctx.createGain()
 osc.type = 'sawtooth'
 osc.frequency.setValueAtTime(200, now)
 gain.gain.setValueAtTime(0.2, now)
 gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
 osc.connect(gain).connect(ctx.destination)
 osc.start(now)
 osc.stop(now + 0.3)
 }, [getContext])

 const playComplete = useCallback(() => {
 if (!enabledRef.current) return
 const ctx = getContext()
 if (!ctx) return
 const now = ctx.currentTime
 // Ascending arpeggio: C5 E5 G5 C6
 const arpeggio = [523, 659, 784, 1047]
 arpeggio.forEach((freq, i) => {
 const osc = ctx.createOscillator()
 const gain = ctx.createGain()
 osc.type = 'sine'
 const t = now + i * 0.12
 osc.frequency.setValueAtTime(freq, t)
 gain.gain.setValueAtTime(0.25, t)
 gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
 osc.connect(gain).connect(ctx.destination)
 osc.start(t)
 osc.stop(t + 0.25)
 })
 }, [getContext])

 return { soundEnabled, setSoundEnabled, playCorrect, playWrong, playComplete }
}

export function SynonymMatchGame() {
 const [pairs, setPairs] = useState<SynPair[]>([])
 const [leftItems, setLeftItems] = useState<PoolItem[]>([])
 const [rightItems, setRightItems] = useState<PoolItem[]>([])
 const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
 const [selectedRight, setSelectedRight] = useState<string | null>(null)
 const [matched, setMatched] = useState<Set<string>>(new Set())
 const [wrongPair, setWrongPair] = useState<string[]>([])
 const [attempts, setAttempts] = useState(0)
 const [score, setScore] = useState(0)
 const [streak, setStreak] = useState(0)
 const [gameComplete, setGameComplete] = useState(false)
 const [loading, setLoading] = useState(true)
 const [words, setWords] = useState<Word[]>([])
 const [reactions, setReactions] = useState<Reaction[]>([])
 const [erroredImages, setErroredImages] = useState<Set<string>>(new Set())
 const startTime = useRef(Date.now())
 const reactionIdRef = useRef(0)
 const { soundEnabled, setSoundEnabled, playCorrect, playWrong, playComplete } = useSoundEffects()

 const addReaction = (emoji: string) => {
 const id = ++reactionIdRef.current
 const x = 15 + Math.random() * 70
 const y = 30 + Math.random() * 40
 setReactions((prev) => [...prev, { id, emoji, x, y }])
 setTimeout(() => {
 setReactions((prev) => prev.filter((r) => r.id !== id))
 }, 1200)
 }

 const loadGame = async () => {
 setLoading(true)
 setGameComplete(false)
 setMatched(new Set())
 setSelectedLeft(null)
 setSelectedRight(null)
 setAttempts(0)
 setScore(0)
 setStreak(0)
 setReactions([])
 setErroredImages(new Set())
 startTime.current = Date.now()

 const all = shuffle(await wordRepo.getAll())

 // Build synonym pairs from available data
 const synPairs: SynPair[] = []
 const usedWords = new Set<string>()

 for (const word of all) {
 if (usedWords.has(word.word) || synPairs.length >= 7) break

 if (word.synonyms.length > 0) {
 // Use first synonym
 const syn = word.synonyms[0]!
 if (!usedWords.has(syn)) {
 synPairs.push({ id: word.id, word: word.word, synonym: syn })
 usedWords.add(word.word)
 usedWords.add(syn)
 }
 } else if (word.definitions[0]) {
 // Use definition as clue instead
 const clue = word.definitions[0].meaning.split(' ').slice(0, 4).join(' ')
 if (clue.length > 5) {
 synPairs.push({ id: word.id, word: word.word, synonym: clue })
 usedWords.add(word.word)
 }
 }
 }

 // Ensure enough pairs
 while (synPairs.length < 6) {
 const w = all[synPairs.length + 10]
 if (!w) break
 const def = w.definitions[0]?.meaning.split(' ').slice(0, 3).join(' ') ?? w.word
 synPairs.push({ id: w.id, word: w.word, synonym: def })
 }

 const selected = synPairs.slice(0, 7)
 setPairs(selected)

 // Store word objects for definition lookup
 setWords(all.filter((w) => selected.some((p) => p.id === w.id)))

 setLeftItems(shuffle(selected.map((p) => ({ id: `l-${p.id}`, pairId: p.id, text: p.word }))))
 setRightItems(shuffle(selected.map((p) => ({ id: `r-${p.id}`, pairId: p.id, text: p.synonym }))))
 setLoading(false)
 }

 useEffect(() => { loadGame() }, [])

 const handleLeftClick = (id: string) => {
 if (gameComplete) return
 if (matched.has(id.replace('l-', '')) || matched.has(id)) return

 setSelectedLeft(id)
 const pairId = leftItems.find((i) => i.id === id)?.pairId

 if (selectedRight) {
 const rightPairId = rightItems.find((i) => i.id === selectedRight)?.pairId
 if (rightPairId) checkMatch(pairId, rightPairId)
 }
 }

 const handleRightClick = (id: string) => {
 if (gameComplete) return
 if (matched.has(id.replace('r-', '')) || matched.has(id)) return

 setSelectedRight(id)
 const pairId = rightItems.find((i) => i.id === id)?.pairId

 if (selectedLeft) {
 const leftPairId = leftItems.find((i) => i.id === selectedLeft)?.pairId
 if (leftPairId) checkMatch(leftPairId, pairId)
 }
 }

 const checkMatch = (leftPairId?: string, rightPairId?: string) => {
 if (!leftPairId || !rightPairId) {
 setSelectedLeft(null)
 setSelectedRight(null)
 return
 }

 if (leftPairId === rightPairId) {
 playCorrect()
 addReaction('🎉')

 const newMatched = new Set(matched)
 newMatched.add(leftPairId)
 setMatched(newMatched)
 setSelectedLeft(null)
 setSelectedRight(null)
 setStreak((s) => s + 1)
 setScore((s) => s + 10 + streak * 5)

 if (newMatched.size === pairs.length) {
 setGameComplete(true)
 playComplete()

 const now = Date.now()
 const totalTime = now - startTime.current
 import('@/db/session-repo').then(({ sessionRepo }) => {
 sessionRepo.save({
 id: crypto.randomUUID(),
 mode: 'synonym_match',
 words: pairs.map(p => p.id),
 results: pairs.map(p => ({
 wordId: p.id,
 isCorrect: true, 
 responseTime: totalTime / pairs.length,
 wasCloseCall: false,
 mode: 'synonym_match',
 timestamp: now
 })),
 startedAt: startTime.current,
 completedAt: now,
 totalTime
 })
 })
 }
 } else {
 playWrong()
 addReaction('😅')
 setAttempts((a) => a + 1)
 setStreak(0)
 setWrongPair([
 leftItems.find((i) => i.pairId === leftPairId)?.id ?? '',
 rightItems.find((i) => i.pairId === rightPairId)?.id ?? '',
 ].filter(Boolean))
 setTimeout(() => {
 setWrongPair([])
 setSelectedLeft(null)
 setSelectedRight(null)
 }, 500)
 }
 }

 const getStyle = (id: string, pairId: string) => {
 const isMatched = matched.has(pairId)
 const isWrong = wrongPair.includes(id)
 const isSelected = selectedLeft === id || selectedRight === id

 if (isMatched) return 'border-green-400 bg-green-50 opacity-60'
 if (isWrong) return 'border-red-400 bg-red-50 '
 if (isSelected) return 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
 return 'border-gray-200 hover:border-indigo-300 :border-indigo-600'
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
 </div>
 )
 }

 const time = Math.floor((Date.now() - startTime.current) / 1000)

 return (
 <div className="max-w-5xl mx-auto space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-bold text-gray-900 ">🔗 Nối từ đồng nghĩa</h2>
 <p className="text-sm text-gray-500">Ghép từ với từ đồng nghĩa hoặc định nghĩa</p>
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 onClick={() => setSoundEnabled(!soundEnabled)}
 icon={soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
 >
 {soundEnabled ? 'Âm thanh' : 'Tắt âm'}
 </Button>
 <Button variant="ghost" onClick={loadGame} icon={<Shuffle className="w-4 h-4" />}>
 Tráo bài mới
 </Button>
 </div>
 </div>

 <div className="flex gap-4 text-sm">
 <Badge variant="info">{matched.size}/{pairs.length} đã ghép</Badge>
 <Badge variant="warning">🔥 Streak: {streak}</Badge>
 <Badge variant="success">⭐ {score} điểm</Badge>
 <Badge>🔄 {attempts} lần sai</Badge>
 <Badge>⏱ {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</Badge>
 </div>

 <Card className="p-6 relative overflow-hidden">
 <div className="flex gap-8 justify-center">
 <div className="space-y-3 flex-1 max-w-[220px]">
 <p className="text-xs font-medium text-gray-400 mb-2 text-center uppercase tracking-wider">Từ vựng</p>
 {leftItems.map((item) => {
 const isMatched = matched.has(item.pairId)
 const wordObj = words.find((w) => w.id === item.pairId)
 return (
 <motion.button
 key={item.id}
 layout
 onClick={() => handleLeftClick(item.id)}
 disabled={isMatched}
 className={`w-full px-4 py-3 rounded-xl border-2 font-semibold text-gray-900 dark:text-gray-100 transition-all text-center ${getStyle(item.id, item.pairId)} ${isMatched ? 'cursor-default' : 'cursor-pointer'}`}
 whileTap={!isMatched ? { scale: 0.97 } : undefined}
 >
 <div>{item.text}</div>
 {wordObj?.definitions[0]?.vietnamese && (
 <div className="text-xs text-gray-400 mt-0.5 font-normal">
 {wordObj.definitions[0].vietnamese}
 </div>
 )}
 </motion.button>
 )
 })}
 </div>

 <div className="space-y-3 flex-1 max-w-[220px]">
 <p className="text-xs font-medium text-gray-400 mb-2 text-center uppercase tracking-wider">Đồng nghĩa / Định nghĩa</p>
 {rightItems.map((item) => {
 const isMatched = matched.has(item.pairId)
 return (
 <motion.button
 key={item.id}
 layout
 onClick={() => handleRightClick(item.id)}
 disabled={isMatched}
 className={`w-full px-4 py-3 rounded-xl border-2 font-medium text-gray-700 dark:text-gray-200 transition-all text-center text-sm ${getStyle(item.id, item.pairId)} ${isMatched ? 'cursor-default' : 'cursor-pointer'}`}
 whileTap={!isMatched ? { scale: 0.97 } : undefined}
 >
 {item.text}
 </motion.button>
 )
 })}
 </div>
 </div>

 {/* Floating reactions */}
 <AnimatePresence>
 {reactions.map((r) => (
 <motion.div
 key={r.id}
 initial={{ opacity: 1, scale: 0.5 }}
 animate={{ opacity: 0, y: -120, scale: 1.5 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 1.2, ease: 'easeOut' }}
 className="absolute pointer-events-none text-5xl z-10"
 style={{ left: `${r.x}%`, top: `${r.y}%` }}
 >
 {r.emoji}
 </motion.div>
 ))}
 </AnimatePresence>
 </Card>

 <AnimatePresence>
 {gameComplete && (
 <motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 className="text-center p-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 "
 >
 <div className="text-5xl mb-3">🧠</div>
 <h3 className="text-2xl font-bold text-gray-900 ">Tuyệt vời!</h3>
 <p className="text-gray-500 mt-1">{score} điểm • {attempts} lần sai</p>
 <Button onClick={loadGame} className="mt-4" icon={<RefreshCw className="w-4 h-4" />}>
 Chơi lại
 </Button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )
}
