import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Shuffle } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAudio } from '@/hooks/useAudio'

interface Props {
  word: Word
  onComplete: (correct: boolean, responseTime: number) => void
}

const funnyEmojis = ['😂', '🤪', '😅', '💀', '🤦', '🙈', '😵‍💫', '🥴', '🤡', '😤']
const funnyErrors = [
  'Sắp xếp lại thử xem!',
  'Chưa đúng rồi!',
  'Gần lắm rồi!',
  'Sai rồi, thử lại đi!',
  'Ui, suýt đúng!',
  'Chưa chính xác!',
]

function scrambleWord(word: string): string {
  const letters = word.split('')
  const len = letters.length
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j]!, letters[i]!]
  }
  return letters.join('')
}

/** Fisher-Yates shuffle that guarantees the result !== original */
function getScrambled(word: string): string {
  if (word.length <= 1) return word
  let scrambled: string
  let attempts = 0
  do {
    scrambled = scrambleWord(word)
    attempts++
  } while (scrambled === word && attempts < 20)
  return scrambled
}

export function JumbleSession({ word, onComplete }: Props) {
  const [input, setInput] = useState('')
  const [scrambled, setScrambled] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorEmoji, setErrorEmoji] = useState('😅')
  const [errorText, setErrorText] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [answered, setAnswered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const startTime = useRef(Date.now())
  const { speak } = useAudio()

  useEffect(() => {
    startTime.current = Date.now()
    setScrambled(getScrambled(word.word))
    setInput('')
    setShowError(false)
    setAttempts(0)
    setAnswered(false)
    inputRef.current?.focus()
    const timer = setTimeout(() => speak(word.word), 300)
    return () => clearTimeout(timer)
  }, [word.word, speak])

  const handleSubmit = useCallback(() => {
    if (answered) return
    const time = Date.now() - startTime.current
    const normalized = input.trim().toLowerCase()
    const correct = normalized === word.word.toLowerCase()

    // Always speak the word on submit
    speak(word.word)

    if (correct) {
      setAnswered(true)
      setTimeout(() => onComplete(true, time), 300)
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setErrorEmoji(funnyEmojis[Math.floor(Math.random() * funnyEmojis.length)] ?? '😂')
      setErrorText(funnyErrors[Math.floor(Math.random() * funnyErrors.length)] ?? 'Sai rồi!')
      setShowError(true)
      setTimeout(() => setShowError(false), 1500)

      if (newAttempts >= 2) {
        setAnswered(true)
        setInput(word.word)
        setTimeout(() => speak(word.word), 500)
        setTimeout(() => onComplete(false, time), 1000)
      } else {
        setInput('')
        inputRef.current?.focus()
      }
    }
  }, [answered, input, word.word, attempts, speak, onComplete])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const vietnameseHint = word.definitions
    .map((d) => d.vietnamese)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <Card className="p-8">
        {word.imageUrls[0] && (
          <img
            src={word.imageUrls[0]}
            alt={word.word}
            className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 shadow-md"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <motion.div
          key={scrambled + (answered ? '-answered' : '')}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <div
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl mb-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-500) 10%, var(--surface-card))',
              borderColor: 'color-mix(in srgb, var(--accent-500) 30%, var(--border-default))',
              border: '2px solid',
            }}
          >
            <Shuffle
              className="w-5 h-5"
              style={{ color: 'var(--accent-500)' }}
            />
            {answered ? (
              <span
                className="text-2xl font-bold tracking-wider"
                style={{ color: '#22c55e' }}
              >
                {word.word}
              </span>
            ) : (
              <span
                className="text-2xl font-bold tracking-[0.15em]"
                style={{ color: 'var(--text-primary)' }}
              >
                {scrambled}
              </span>
            )}
          </div>
        </motion.div>

        {!answered && vietnameseHint && (
          <p
            className="text-sm mb-4 px-4 py-2 rounded-lg inline-block"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))',
            }}
          >
            Gợi ý: {vietnameseHint}
          </p>
        )}

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={answered ? word.word : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={answered}
            placeholder="Gõ từ đã sắp xếp..."
            className="w-full text-center text-2xl py-3 px-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: answered
                ? '#22c55e'
                : 'var(--border-default)',
              backgroundColor: answered
                ? 'color-mix(in srgb, #22c55e 10%, var(--surface-card))'
                : 'var(--surface-card)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent-400)',
            } as React.CSSProperties}
          />
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => speak(word.word)}
            className="p-2.5 rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              color: 'var(--accent-500)',
              backgroundColor: 'color-mix(in srgb, var(--accent-500) 10%, transparent)',
            }}
            title="Nghe phát âm"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {!answered && (
            <Button onClick={handleSubmit} disabled={!input.trim()}>
              Kiểm tra (Enter)
            </Button>
          )}
        </div>
      </Card>

      {/* Funny error popup */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 20, opacity: 0 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none"
          >
            <div className="text-7xl mb-2">{errorEmoji}</div>
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--accent-600)' }}
            >
              {errorText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
