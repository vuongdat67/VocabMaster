import { useState, useRef, useEffect, useCallback } from 'react'
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

type CharState = { char: string; revealed: boolean; wrong: boolean }

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

export function TypingChallengeSession({ word, onComplete }: Props) {
  // Strip spaces for typing — "thank you" becomes "thankyou"
  const displayWord = word.word.replace(/\s+/g, '')
  const wordLen = displayWord.length
  const wordLower = displayWord.toLowerCase()

  const [chars, setChars] = useState<CharState[]>([])
  const [showError, setShowError] = useState(false)
  const [errorEmoji, setErrorEmoji] = useState('😅')
  const [errorText, setErrorText] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [activeBox, setActiveBox] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const startTime = useRef(Date.now())
  const { speak } = useAudio()

  const initChars = useCallback(() => {
    setChars(Array.from({ length: wordLen }, () => ({ char: '', revealed: false, wrong: false })))
  }, [wordLen])

  useEffect(() => {
    startTime.current = Date.now()
    setAttempts(0)
    setAnswered(false)
    setActiveBox(0)
    setErrorEmoji('😅')
    setErrorText('')
    initChars()
    setTimeout(() => speak(word.word), 300)
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [word.word, speak, initChars])

  const handleSubmit = useCallback(() => {
    if (answered) return
    const current = chars.map((c) => c.char).join('')
    const correct = current.toLowerCase() === wordLower
    const time = Date.now() - startTime.current

    speak(word.word)

    if (correct) {
      setAnswered(true)
      setTimeout(() => onComplete(true, time), 300)
      return
    }

    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    // Build new state: correct letters stay, wrong letters turn red and clear
    const newChars = chars.map((c, i) => {
      if (wordLower[i] === c.char.toLowerCase()) {
        return { char: c.char, revealed: true, wrong: false } // correct position
      }
      return { char: '', revealed: false, wrong: true } // wrong — clear for retry
    })

    // Hint logic: reveal first correct letters based on attempt
    if (newAttempts >= 3) {
      // Give up: reveal ALL correct letters
      setChars(displayWord.split('').map((ch) => ({ char: ch, revealed: true, wrong: false })))
      setErrorEmoji('😵')
      setErrorText(`Đáp án: ${word.word}`)
      setShowError(true)
      setTimeout(() => setShowError(false), 1200)
      setAnswered(true)
      setTimeout(() => speak(word.word), 500)
      setTimeout(() => onComplete(false, time), 1000)
      return
    }

    // Progressive reveal: attempt 1 → reveal 30% letters, attempt 2 → 60%
    const revealRatio = newAttempts === 1 ? 0.3 : 0.6
    const revealCount = Math.ceil(wordLen * revealRatio)

    // Determine which positions to reveal
    const wrongPositions: number[] = []
    newChars.forEach((c, i) => { if (c.wrong) wrongPositions.push(i) })
    const toReveal = wrongPositions.slice(0, revealCount)
    const finalChars = newChars.map((c, i) => {
      if (toReveal.includes(i)) {
        return { char: wordLower[i] as string, revealed: true, wrong: false }
      }
      return c
    })

    setErrorEmoji(funnyEmojis[Math.floor(Math.random() * funnyEmojis.length)] ?? '😅')
    setErrorText(funnyErrors[Math.floor(Math.random() * funnyErrors.length)] ?? 'Sai rồi!')
    setShowError(true)
    setTimeout(() => setShowError(false), 1200)

    setChars(finalChars)

    // Find first empty box to focus
    const firstEmpty = finalChars.findIndex((c) => c.char === '' && !c.revealed)
    setActiveBox(firstEmpty >= 0 ? firstEmpty : 0)
    setTimeout(() => inputRefs.current[firstEmpty >= 0 ? firstEmpty : 0]?.focus(), 100)
  }, [chars, attempts, answered, wordLower, wordLen, speak, onComplete])

  const handleLetterChange = useCallback((index: number, value: string) => {
    if (answered) return
    const char = value.slice(-1).toLowerCase()
    setChars((prev) => {
      const next: CharState[] = prev.map((c) => ({ ...c }))
      next[index] = { char, revealed: false, wrong: false }
      return next
    })
    // Auto-advance to next empty box
    if (char && index < wordLen - 1) {
      const nextIdx = index + 1
      setActiveBox(nextIdx)
      inputRefs.current[nextIdx]?.focus()
    }
  }, [answered, wordLen])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newChars: CharState[] = chars.map((c) => ({ ...c }))
      if (newChars[index]!.char) {
        newChars[index] = { char: '', revealed: false, wrong: false }
        setChars(newChars)
      } else if (index > 0) {
        const prevIdx = index - 1
        newChars[prevIdx] = { char: '', revealed: false, wrong: false }
        setChars(newChars)
        setActiveBox(prevIdx)
        inputRefs.current[prevIdx]?.focus()
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      // Auto-advance to next unfilled box — or submit if all filled
      const nextEmpty = chars.findIndex((c) => c.char === '' && !c.revealed)
      if (nextEmpty >= 0) {
        setActiveBox(nextEmpty)
        inputRefs.current[nextEmpty]?.focus()
      } else {
        handleSubmit()
      }
    }
  }, [chars, handleSubmit])

  // Auto-check when all boxes filled
  const allFilled = chars.every((c) => c.char !== '')
  useEffect(() => {
    if (allFilled && !answered) {
      const timer = setTimeout(() => handleSubmit(), 200)
      return () => clearTimeout(timer)
    }
  }, [allFilled, answered, handleSubmit])

  // Calculate card width based on word length
  const boxSize = wordLen > 10 ? 36 : 44
  const cardWidth = wordLen * (boxSize + 8) + 40

  return (
    <div className="max-w-lg mx-auto text-center space-y-6">
      <div className="overflow-hidden">
        <Card className="p-6 mx-auto" style={{ maxWidth: `${Math.min(cardWidth, 600)}px` }}>
          {word.imageUrls[0] && (
            <img
              src={word.imageUrls[0]}
              alt={word.word}
              className="w-24 h-24 object-cover rounded-xl mx-auto mb-3"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}

          <button
            onClick={() => speak(word.word)}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mb-3 inline-block"
            style={{ color: 'var(--accent-500)' }}
          >
            <Volume2 className="w-7 h-7" />
          </button>

          <p className="text-sm text-gray-500 mb-4">
            {attempts === 0 ? 'Nghe và gõ lại từ tiếng Anh' : `Lần ${attempts}/3 — gõ lại`}
          </p>

          {/* Letter boxes — responsive */}
          <div className="flex justify-center gap-1.5 flex-wrap mb-4" dir="ltr">
            {chars.map((c, i) => {
              const isActive = activeBox === i && !answered
              const hasChar = c.char !== ''
              const isCorrect = hasChar && wordLower[i] === c.char.toLowerCase()
              const isWrong = hasChar && !isCorrect
              const isHint = c.revealed && !hasChar

              let borderColor = 'var(--border-default)'
              let bgColor = 'var(--surface-card)'
              let textColor = 'var(--text-primary)'

              if (answered) {
                borderColor = '#22c55e'
                bgColor = 'color-mix(in srgb, #22c55e 10%, var(--surface-card))'
                textColor = '#16a34a'
              } else if (isCorrect) {
                borderColor = '#22c55e'
                bgColor = 'color-mix(in srgb, #22c55e 8%, var(--surface-card))'
                textColor = '#16a34a'
              } else if (isWrong) {
                borderColor = '#ef4444'
                bgColor = 'color-mix(in srgb, #ef4444 8%, var(--surface-card))'
                textColor = '#ef4444'
              } else if (isHint) {
                borderColor = 'var(--accent-400)'
                bgColor = 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))'
                textColor = 'var(--accent-500)'
              } else if (isActive) {
                borderColor = 'var(--accent-500)'
                bgColor = 'color-mix(in srgb, var(--accent-500) 6%, var(--surface-card))'
              }

              return (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  maxLength={1}
                  value={c.char}
                  onChange={(e) => handleLetterChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={answered || c.revealed}
                  className="rounded-lg border-2 text-center font-bold transition-all uppercase"
                  style={{
                    width: `${boxSize}px`,
                    height: `${boxSize + 4}px`,
                    fontSize: wordLen > 10 ? '0.9rem' : '1.1rem',
                    borderColor,
                    backgroundColor: bgColor,
                    color: textColor,
                    caretColor: 'var(--accent-500)',
                  }}
                />
              )
            })}
          </div>

          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1 mt-2"
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--accent-500)' }}>
                {word.word}
              </p>
              <p className="text-xs text-gray-500">
                {word.definitions[0]?.vietnamese ?? ''}
                {word.definitions[0]?.meaning ? ` — ${word.definitions[0].meaning}` : ''}
              </p>
            </motion.div>
          )}
        </Card>
      </div>

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
