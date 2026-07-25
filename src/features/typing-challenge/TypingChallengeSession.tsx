import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2 } from 'lucide-react'
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
  'Ôi không! Thiếu mất rồi!',
  'Gần đúng rồi đó!',
  'Sai rồi, thử lại đi!',
  'Hmm, chưa chính xác!',
  'Ui, suýt đúng!',
]

export function TypingChallengeSession({ word, onComplete }: Props) {
  const [input, setInput] = useState('')
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
    setInput('')
    setShowError(false)
    setAttempts(0)
    setAnswered(false)
    inputRef.current?.focus()
    const timer = setTimeout(() => speak(word.word), 300)
    return () => clearTimeout(timer)
  }, [word.word, speak])

  const handleSubmit = () => {
    if (answered) return
    const time = Date.now() - startTime.current
    const normalized = input.trim().toLowerCase()
    const correct = normalized === word.word.toLowerCase()

    // Always speak the word on submit — emphasize whether right or wrong
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
        // Give up after 2 failed attempts
        setAnswered(true)
        setInput(word.word)
        // Speak again more clearly on failure
        setTimeout(() => speak(word.word), 500)
        setTimeout(() => onComplete(false, time), 1000)
      } else {
        setInput('')
        inputRef.current?.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <Card className="p-8">
        {word.imageUrls[0] && (
          <img
            src={word.imageUrls[0]}
            alt={word.word}
            className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <button
          onClick={() => speak(word.word)}
          className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mb-4 inline-block"
          style={{ color: 'var(--accent-500)' }}
        >
          <Volume2 className="w-8 h-8" />
        </button>

        <p className="text-sm text-gray-500 mb-4">
          Nghe và gõ lại từ tiếng Anh
        </p>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={answered ? word.word : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={answered}
            placeholder="Gõ từ tại đây..."
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

        {!answered && (
          <Button onClick={handleSubmit} className="mt-4" disabled={!input.trim()}>
            Kiểm tra (Enter)
          </Button>
        )}
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
            <p className="text-lg font-bold text-red-500">{errorText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
