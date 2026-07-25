import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Check, X } from 'lucide-react'
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
  const startTime = useRef(Date.now())
  const { speak } = useAudio()

  useEffect(() => {
    startTime.current = Date.now()
    setFlipped(false)
    setAnswered(false)
    const timer = setTimeout(() => speak(word.word), 300)
    return () => clearTimeout(timer)
  }, [word.word, speak])

  const handleAnswer = (correct: boolean) => {
    if (answered) return
    setAnswered(true)
    const time = Date.now() - startTime.current
    setTimeout(() => onComplete(correct, time), 400)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div
        className="relative cursor-pointer"
        onClick={() => !flipped && setFlipped(true)}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="relative w-full min-h-[280px]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
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

          {/* Back */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden' as const, transform: 'rotateY(180deg)' }}
          >
            <Card className="p-6 flex flex-col items-center justify-center min-h-[280px]"
              style={{ borderColor: 'color-mix(in srgb, var(--accent-500) 30%, var(--border-default))' }}
            >
              <div className="text-center mb-5">
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
            </Card>
          </div>
        </motion.div>
      </div>

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
    </div>
  )
}
