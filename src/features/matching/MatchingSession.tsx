import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, ImageIcon, AlertTriangle, Volume2 } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { wordRepo } from '@/db/word-repo'
import { shuffle } from '@/lib/utils'
import { useAudio } from '@/hooks/useAudio'
import { playCorrectSound, playWrongSound } from '@/lib/audio-utils'

interface Props {
  word: Word
  learnedWords?: Word[]
  onComplete: (correct: boolean, responseTime: number) => void
}

interface MatchPair {
  id: string
  word: Word
  imageUrl: string
}

export function MatchingSession({ word, learnedWords, onComplete }: Props) {
  const [pairs, setPairs] = useState<MatchPair[]>([])
  const [shuffledWords, setShuffledWords] = useState<{ id: string; word: string; vi: string }[]>([])
  const [shuffledImages, setShuffledImages] = useState<{ id: string; url: string }[]>([])
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)
  const [noImages, setNoImages] = useState(false)
  const startTimeRef = useRef(Date.now())
  const mistakes = useRef(0)
  const { speak } = useAudio()
  const matchedRef = useRef(matched)
  matchedRef.current = matched
  const completeRef = useRef(complete)
  completeRef.current = complete

  useEffect(() => {
    startTimeRef.current = Date.now()
    setSelectedWord(null)
    setSelectedImage(null)
    setMatched(new Set())
    setComplete(false)
    setWrongId(null)
    mistakes.current = 0

    async function load() {
      let pool = learnedWords?.filter((w) => w.id !== word.id && w.imageUrls.length > 0) || []

      if (pool.length < 2) {
        const all = await wordRepo.getAll()
        pool = all.filter((w) => w.id !== word.id && w.imageUrls.length > 0)
      }

      const selected = shuffle(pool).slice(0, 5)
      const matches = [word, ...selected]

      const withImages = matches.filter((w) => w.imageUrls[0])
      if (withImages.length < 2) {
        setNoImages(true)
        return
      }
      setNoImages(false)

      setPairs(
        withImages.map((w) => ({
          id: w.id,
          word: w,
          imageUrl: w.imageUrls[0]!,
        }))
      )
      setShuffledWords(shuffle(withImages.map((w) => ({
        id: w.id,
        word: w.word,
        vi: w.definitions[0]?.vietnamese ?? '',
      }))))
      setShuffledImages(shuffle(withImages.map((w) => ({ id: w.id, url: w.imageUrls[0]! }))))
    }
    load()
  }, [word.id])

  // Check match when both selections are made
  useEffect(() => {
    if (!selectedWord || !selectedImage) return
    if (selectedWord === selectedImage) {
      if (matchedRef.current.has(selectedWord)) {
        setSelectedWord(null)
        setSelectedImage(null)
        return
      }
      playCorrectSound()
      const newMatched = new Set(matchedRef.current)
      newMatched.add(selectedWord)
      setMatched(newMatched)
      setSelectedWord(null)
      setSelectedImage(null)

      if (newMatched.size === pairs.length) {
        setComplete(true)
        const time = Date.now() - startTimeRef.current
        setTimeout(() => onComplete(mistakes.current === 0, time), 400)
      }
    } else {
      playWrongSound()
      mistakes.current++
      setWrongId(selectedWord)
      setTimeout(() => setWrongId(null), 400)
      setSelectedWord(null)
      setSelectedImage(null)
    }
  }, [selectedWord, selectedImage])

  if (noImages) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <AlertTriangle className="w-10 h-10 opacity-50" />
        <span className="text-sm">Từ này chưa có hình ảnh để ghép</span>
        <button
          onClick={() => onComplete(false, Date.now() - startTimeRef.current)}
          className="text-xs hover:underline"
          style={{ color: 'var(--accent-500)' }}
        >
          Bỏ qua
        </button>
      </div>
    )
  }

  if (pairs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <ImageIcon className="w-6 h-6 opacity-50" />
        <span>Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Nối từ với hình ảnh</h3>
          <p className="text-sm text-gray-500">
            Chọn một từ bên trên, sau đó chọn hình ảnh tương ứng bên dưới
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Badge variant="info" className="text-xs">
              Đã ghép: {matched.size}/{pairs.length}
            </Badge>
            {complete && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 text-emerald-600 font-semibold"
              >
                <Check className="w-4 h-4" />
                Hoàn thành!
              </motion.span>
            )}
          </div>
        </div>

        {/* ─── Words row (horizontal) ─── */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {shuffledWords.map((w) => {
            const isSelected = selectedWord === w.id
            const isMatched = matched.has(w.id)
            const isWrong = wrongId === w.id
            return (
              <motion.button
                key={w.id}
                whileTap={{ scale: 0.95 }}
                animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  if (complete) return
                  setSelectedWord((prev) => (prev === w.id ? null : w.id))
                  if (selectedImage && selectedImage !== w.id) {
                    // Check match immediately
                    if (w.id === selectedImage) {
                      playCorrectSound()
                      const newMatched = new Set(matched)
                      newMatched.add(w.id)
                      setMatched(newMatched)
                      setSelectedImage(null)
                      setSelectedWord(null)
                      if (newMatched.size === pairs.length) {
                        setComplete(true)
                        const time = Date.now() - startTimeRef.current
                        setTimeout(() => onComplete(mistakes.current === 0, time), 400)
                      }
                    } else {
                      playWrongSound()
                      mistakes.current++
                      setWrongId(w.id)
                      setTimeout(() => setWrongId(null), 400)
                      setSelectedImage(null)
                      setSelectedWord(null)
                    }
                    return
                  }
                }}
                disabled={isMatched}
                className="min-w-[140px] px-4 py-3 rounded-xl border-2 font-medium transition-all text-left flex items-center justify-between gap-2"
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
                }}
              >
                <div className="min-w-0">
                  <span className={`text-base font-bold block leading-tight ${isMatched ? 'text-gray-400' : 'text-gray-900'}`}>
                    {w.word}
                  </span>
                  <span className="text-[12px] text-gray-500 leading-tight block">{w.vi}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(w.word) }}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0"
                  style={{ color: 'var(--accent-500)' }}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </motion.button>
            )
          })}
        </div>

        {/* ─── Images row (horizontal) ─── */}
        <div className="flex flex-wrap gap-4 justify-center">
          {shuffledImages.map((img) => {
            const isSelected = selectedImage === img.id
            const isMatched = matched.has(img.id)
            return (
              <motion.button
                key={img.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (complete) return
                  setSelectedImage((prev) => (prev === img.id ? null : img.id))
                  if (selectedWord && selectedWord !== img.id) {
                    if (img.id === selectedWord) {
                      playCorrectSound()
                      const newMatched = new Set(matched)
                      newMatched.add(img.id)
                      setMatched(newMatched)
                      setSelectedImage(null)
                      setSelectedWord(null)
                      if (newMatched.size === pairs.length) {
                        setComplete(true)
                        const time = Date.now() - startTimeRef.current
                        setTimeout(() => onComplete(mistakes.current === 0, time), 400)
                      }
                    } else {
                      playWrongSound()
                      mistakes.current++
                      setWrongId(selectedWord)
                      setTimeout(() => setWrongId(null), 400)
                      setSelectedImage(null)
                      setSelectedWord(null)
                    }
                    return
                  }
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
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                  }}
                />
                {isMatched && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                    <Check className="w-8 h-8 text-white drop-shadow" />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
