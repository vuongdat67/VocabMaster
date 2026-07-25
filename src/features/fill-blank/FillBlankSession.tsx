import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAudio } from '@/hooks/useAudio'

interface Props {
  word: Word
  onComplete: (correct: boolean, responseTime: number) => void
}

export function FillBlankSession({ word, onComplete }: Props) {
  const [input, setInput] = useState('')
  const [answered, setAnswered] = useState(false)
  const [blankSentence, setBlankSentence] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const startTime = useRef(Date.now())
  const { speak } = useAudio()

  useEffect(() => {
    startTime.current = Date.now()
    setInput('')
    setAnswered(false)
    inputRef.current?.focus()

    const example = word.examples[0]
    if (example) {
      const blanked = example.sentence.replace(new RegExp(word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '______')
      setBlankSentence(blanked)
    } else {
      setBlankSentence(`I need to learn the word "${'______'}"`)
    }

    const timer = setTimeout(() => speak(word.word), 500)
    return () => clearTimeout(timer)
  }, [word.word, word.examples, word.id, speak])

  const handleSubmit = () => {
    if (answered) return
    const time = Date.now() - startTime.current
    const normalized = input.trim().toLowerCase()
    const correct = normalized === word.word.toLowerCase()

    setAnswered(true)
    setTimeout(() => onComplete(correct, time), 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const resultCorrect = input.trim().toLowerCase() === word.word.toLowerCase()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="p-8 text-center">
        {word.imageUrls[0] && (
          <img
            src={word.imageUrls[0]}
            alt={word.word}
            className="w-28 h-28 object-cover rounded-xl mx-auto mb-4"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <button
          onClick={() => speak(word.word)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mb-3 inline-block"
          style={{ color: 'var(--accent-500)' }}
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </Card>

      <Card className="p-6">
        <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed text-center mb-6">
          {blankSentence.split('______').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  className="inline-block mx-1 px-3 py-1 rounded-lg border-b-2 transition-all"
                  style={{
                    borderColor: answered
                      ? resultCorrect
                        ? '#22c55e'
                        : '#ef4444'
                      : 'var(--accent-400)',
                    backgroundColor: answered
                      ? resultCorrect
                        ? 'color-mix(in srgb, #22c55e 10%, var(--surface-card))'
                        : 'color-mix(in srgb, #ef4444 10%, var(--surface-card))'
                      : 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))',
                    color: answered
                      ? resultCorrect
                        ? '#16a34a'
                        : '#dc2626'
                      : 'var(--text-primary)',
                  }}
                >
                  {answered ? word.word : '______'}
                </span>
              )}
            </span>
          ))}
        </p>

        {word.examples[0] && (
          <p className="text-sm text-gray-500 text-center mt-2 italic">
            {word.examples[0].vietnamese}
          </p>
        )}
      </Card>

      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={answered}
          placeholder="Gõ từ còn thiếu..."
          className="flex-1 py-3 px-4 rounded-xl border-2 focus:outline-none focus:ring-2 text-lg transition-all"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-card)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--accent-400)',
          } as React.CSSProperties}
        />
        {!answered && (
          <Button onClick={handleSubmit} disabled={!input.trim()} size="lg">
            Kiểm tra
          </Button>
        )}
      </div>

      {answered && (
        <p className={`text-center font-medium ${resultCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {resultCorrect ? 'Chính xác!' : `Đáp án: ${word.word}`}
        </p>
      )}
    </div>
  )
}
