import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, Volume2, VolumeX, RefreshCw } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { wordRepo } from '@/db/word-repo'
import { shuffle } from '@/lib/utils'
import { useAudio } from '@/hooks/useAudio'

interface MatchItem {
  id: string
  pairId: string
  type: 'word' | 'image'
  content: string
  wordId: string
  vietnamese?: string
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

function useSoundEffects() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const enabledRef = useRef(true)

  useEffect(() => {
    enabledRef.current = soundEnabled
  }, [soundEnabled])

  const getContext = useCallback(() => {
    const AudioCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return null
    try {
      const ctx = new AudioCtor()
      if (ctx.state === 'suspended') ctx.resume()
      return ctx
    } catch {
      return null
    }
  }, [])

  const playNote = useCallback((freq: number, time: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabledRef.current) return null
    const ctx = getContext()
    if (!ctx) return null
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, time)
    gain.gain.setValueAtTime(0.25, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(time)
    osc.stop(time + duration)
    return { osc, gain }
  }, [getContext])

  const playCorrect = useCallback(() => {
    if (!enabledRef.current) return
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    playNote(523, now, 0.2)
    playNote(659, now + 0.15, 0.2)
  }, [getContext, playNote])

  const playWrong = useCallback(() => {
    if (!enabledRef.current) return
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
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
    ;[523, 659, 784, 1047].forEach((freq, i) => playNote(freq, now + i * 0.12, 0.25))
  }, [getContext, playNote])

  return { soundEnabled, setSoundEnabled, playCorrect, playWrong, playComplete }
}

export function MatchingGame() {
  const [words, setWords] = useState<Word[]>([])
  const [shuffledWords, setShuffledWords] = useState<MatchItem[]>([])
  const [shuffledImages, setShuffledImages] = useState<MatchItem[]>([])
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [wrongPair, setWrongPair] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [erroredImages, setErroredImages] = useState<Set<string>>(new Set())
  const startTime = useRef(Date.now())
  const reactionIdRef = useRef(0)
  const matchedRef = useRef(matchedPairs)
  matchedRef.current = matchedPairs
  const { speak } = useAudio()
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
    setMatchedPairs(new Set())
    setSelectedWord(null)
    setSelectedImage(null)
    setAttempts(0)
    setScore(0)
    setStreak(0)
    setReactions([])
    setErroredImages(new Set())
    startTime.current = Date.now()

    const all = await wordRepo.getAll()
    const withImages = all.filter((w) => w.imageUrls.length > 0)
    const selected = withImages.length >= 6
      ? shuffle(withImages).slice(0, 6)
      : shuffle(all).slice(0, 6)

    setWords(selected)

    setShuffledWords(shuffle(selected.map((w) => ({
      id: `word-${w.id}`,
      pairId: w.id,
      type: 'word' as const,
      content: w.word,
      wordId: w.id,
      vietnamese: w.definitions[0]?.vietnamese ?? '',
    }))))

    setShuffledImages(shuffle(selected.map((w) => ({
      id: `img-${w.id}`,
      pairId: w.id,
      type: 'image' as const,
      content: w.imageUrls[0] ?? '',
      wordId: w.id,
    }))))

    setLoading(false)
  }

  useEffect(() => {
    loadGame()
  }, [])

  // Check match when both selections are made
  useEffect(() => {
    if (!selectedWord || !selectedImage) return
    const wordPairId = selectedWord.replace('word-', '')
    const imgPairId = selectedImage.replace('img-', '')

    if (matchedRef.current.has(wordPairId) || matchedRef.current.has(imgPairId)) {
      setSelectedWord(null)
      setSelectedImage(null)
      return
    }

    if (wordPairId === imgPairId) {
      playCorrect()
      addReaction('🎉')
      const newMatched = new Set(matchedRef.current)
      newMatched.add(wordPairId)
      setMatchedPairs(newMatched)
      setSelectedWord(null)
      setSelectedImage(null)
      setStreak((s) => s + 1)
      setScore((s) => s + 10 + streak * 5)

      if (newMatched.size === words.length) {
        setGameComplete(true)
        playComplete()
        setTimeout(() => speak('Perfect!'), 300)
      } else {
        speak(words.find((w) => w.id === wordPairId)?.word ?? '')
      }
    } else {
      playWrong()
      addReaction('😅')
      setAttempts((a) => a + 1)
      setStreak(0)
      setWrongPair([selectedWord, selectedImage])
      setTimeout(() => {
        setWrongPair([])
        setSelectedWord(null)
        setSelectedImage(null)
      }, 600)
    }
  }, [selectedWord, selectedImage])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  const time = Math.floor((Date.now() - startTime.current) / 1000)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎯 Nối từ với hình ảnh</h2>
          <p className="text-sm text-gray-500">Chọn một từ bên trên, sau đó chọn hình ảnh tương ứng bên dưới</p>
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

      {/* Stats bar */}
      <div className="flex gap-3 text-sm flex-wrap">
        <Badge variant="info">{matchedPairs.size}/{words.length} đã ghép</Badge>
        <Badge variant="warning">🔥 Streak: {streak}</Badge>
        <Badge variant="success">⭐ {score} điểm</Badge>
        <Badge>🔄 {attempts} lần sai</Badge>
        <Badge>⏱ {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</Badge>
      </div>

      {/* Game board */}
      <Card className="p-6 relative overflow-hidden">
        {/* ─── Words row (top) ─── */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {shuffledWords.map((item) => {
            const isSelected = selectedWord === item.id
            const isMatched = matchedPairs.has(item.pairId)
            const isWrong = wrongPair.includes(item.id)
            return (
              <motion.button
                key={item.id}
                layout
                whileTap={isMatched ? undefined : { scale: 0.97 }}
                onClick={() => {
                  if (gameComplete) return
                  setSelectedWord((prev) => (prev === item.id ? null : item.id))
                }}
                disabled={isMatched}
                className="min-w-[150px] px-4 py-3 rounded-xl border-2 font-medium transition-all text-left flex items-center justify-between gap-2"
                style={{
                  borderColor: isMatched
                    ? 'var(--accent-300)'
                    : isSelected
                      ? 'var(--accent-500)'
                      : isWrong
                        ? '#ef4444'
                        : 'var(--border-default)',
                  backgroundColor: isMatched
                    ? 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))'
                    : isSelected
                      ? 'color-mix(in srgb, var(--accent-500) 12%, var(--surface-card))'
                      : isWrong
                        ? 'color-mix(in srgb, #ef4444 12%, var(--surface-card))'
                        : 'var(--surface-card)',
                  opacity: isMatched ? 0.6 : 1,
                }}
              >
                <div className="min-w-0">
                  <span className={`text-base font-bold block leading-tight ${isMatched ? 'text-gray-400' : 'text-gray-900'}`}>
                    {item.content}
                  </span>
                  {item.vietnamese && (
                    <span className="text-[12px] text-gray-500 leading-tight block">{item.vietnamese}</span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(item.content) }}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0"
                  style={{ color: 'var(--accent-500)' }}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </motion.button>
            )
          })}
        </div>

        {/* ─── Images row (bottom) ─── */}
        <div className="flex flex-wrap gap-4 justify-center">
          {shuffledImages.map((item) => {
            const isSelected = selectedImage === item.id
            const isMatched = matchedPairs.has(item.pairId)
            const word = words.find((w) => w.id === item.pairId)
            return (
              <motion.button
                key={item.id}
                layout
                whileTap={isMatched ? undefined : { scale: 0.97 }}
                onClick={() => {
                  if (gameComplete) return
                  setSelectedImage((prev) => (prev === item.id ? null : item.id))
                }}
                disabled={isMatched}
                className="relative rounded-xl overflow-hidden transition-all"
                style={{
                  width: 130,
                  height: 130,
                  borderWidth: 3,
                  borderStyle: 'solid',
                  borderColor: isMatched
                    ? 'var(--accent-400)'
                    : isSelected
                      ? 'var(--accent-500)'
                      : 'var(--border-default)',
                  opacity: isMatched ? 0.55 : 1,
                  boxShadow: isSelected
                    ? `0 0 0 3px color-mix(in srgb, var(--accent-500) 25%, transparent)`
                    : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {item.content && !erroredImages.has(item.pairId) ? (
                  <img
                    src={item.content}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setErroredImages((prev) => new Set(prev).add(item.pairId))}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: getFallbackColor(item.pairId) }}
                  >
                    {word?.word?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                {isMatched && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                    <span className="text-3xl">✓</span>
                  </div>
                )}
              </motion.button>
            )
          })}
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

      {/* Complete screen */}
      <AnimatePresence>
        {gameComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 rounded-2xl border"
            style={{
              backgroundColor: 'color-mix(in srgb, #22c55e 8%, var(--surface-card))',
              borderColor: 'color-mix(in srgb, #22c55e 30%, var(--border-default))',
            }}
          >
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-2xl font-bold text-gray-900">Hoàn thành!</h3>
            <p className="text-gray-500 mt-1">
              {score} điểm • {attempts} lần sai • {streak} streak
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button onClick={loadGame} icon={<RefreshCw className="w-4 h-4" />}>
                Chơi lại
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
