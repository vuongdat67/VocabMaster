import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Check, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAudio } from '@/hooks/useAudio'

interface Props {
  word: Word
  onComplete: (correct: boolean, responseTime: number) => void
}

export function FlashcardSession({ word, onComplete }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [timer, setTimer] = useState(0)
  const startTime = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { speak } = useAudio()

  useEffect(() => {
    startTime.current = Date.now()
    setFlipped(false)
    setAnswered(false)
    setTimer(0)
    const t = setTimeout(() => speak(word.word), 300)
    return () => clearTimeout(t)
  }, [word.word, speak])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [word.word])

  const handleFlip = () => {
    if (!answered) setFlipped((f) => !f)
  }

  const handleAnswer = (correct: boolean) => {
    if (answered) return
    setAnswered(true)
    const time = Date.now() - startTime.current
    setTimeout(() => onComplete(correct, time), 400)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Timer + word counter */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="font-mono tabular-nums">{formatTime(timer)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Click để lật</span>
          <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="relative w-full min-h-[280px]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 90 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front — English word */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden' as const }}
          >
            <Card className="p-6 flex flex-col items-center justify-center min-h-[280px]"
              style={{ borderColor: 'color-mix(in srgb, var(--accent-500) 30%, var(--border-default))' }}
            >
              {word.imageUrls[0] && (
                <img
                  src={word.imageUrls[0]}
                  alt={word.word}
                  className="w-24 h-24 object-cover rounded-xl mb-3 shadow-md"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{word.word}</h2>
              {word.ipa && (
                <p className="text-gray-500 text-base">{word.ipa}</p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); speak(word.word) }}
                className="mt-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: 'var(--accent-500)' }}
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <p className="text-xs text-gray-400 mt-3">Chạm để lật thẻ</p>
            </Card>
          </div>

          {/* Back — Vietnamese meaning */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden' as const, transform: 'rotateY(180deg)' }}
          >
            <Card className="p-6 flex flex-col items-center justify-center min-h-[280px]"
              style={{ borderColor: 'color-mix(in srgb, var(--accent-500) 30%, var(--border-default))' }}
            >
              <div className="text-center mb-5 w-full">
                {word.definitions.map((def, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-lg text-gray-900 font-medium">{def.vietnamese}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{def.meaning}</p>
                  </div>
                ))}
                {word.examples[0] && (
                  <div className="mt-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))' }}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">&ldquo;{word.examples[0].sentence}&rdquo;</p>
                    <p className="text-xs text-gray-400 mt-1">{word.examples[0].vietnamese}</p>
                  </div>
                )}
              </div>

              {/* Flip back hint */}
              {!answered && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Chạm để quay lại</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Answer buttons — only when flipped AND not answered */}
      {flipped && !answered && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-center mt-6"
        >
          <Button
            variant="danger"
            size="lg"
            icon={<X className="w-5 h-5" />}
            onClick={() => handleAnswer(false)}
          >
            Chưa nhớ
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon={<Check className="w-5 h-5" />}
            onClick={() => handleAnswer(true)}
          >
            Đã nhớ
          </Button>
        </motion.div>
      )}

      {/* After answered: show result with word info */}
      {answered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-4 text-sm text-gray-500"
        >
          Đã trả lời — chờ chuyển tiếp...
        </motion.div>
      )}
    </div>
  )
}
