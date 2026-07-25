import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { wordRepo } from '@/db/word-repo'

interface Props {
  word: Word
  onComplete: (correct: boolean, responseTime: number, wasCloseCall: boolean) => void
}

export function TextChallengeSession({ word, onComplete }: Props) {
  const [options, setOptions] = useState<Word[]>([])
  const [answered, setAnswered] = useState(false)
  const startTime = useRef(Date.now())

  useEffect(() => {
    startTime.current = Date.now()
    setAnswered(false)

    async function load() {
      const all = await wordRepo.getAll()
      const others = all.filter((w) => w.id !== word.id)
      const wrong = others.sort(() => Math.random() - 0.5).slice(0, 3)
      const allOptions = [...wrong, word].sort(() => Math.random() - 0.5)
      setOptions(allOptions)
    }
    load()
  }, [word.id])

  const handleSelect = (selected: Word) => {
    if (answered) return
    setAnswered(true)
    const time = Date.now() - startTime.current
    const correct = selected.id === word.id
    const wasClose = !correct && (
      selected.word[0]?.toLowerCase() === word.word[0]?.toLowerCase() ||
      selected.difficulty === word.difficulty
    )
    setTimeout(() => onComplete(correct, time, wasClose), 400)
  }

  return (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <Card className="p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{word.word}</h2>
        {word.ipa && (
          <p className="text-gray-500 text-lg mb-2">{word.ipa}</p>
        )}
        {word.imageUrls[0] && (
          <img
            src={word.imageUrls[0]}
            alt={word.word}
            className="w-24 h-24 object-cover rounded-xl mx-auto mb-2"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <p className="text-sm text-gray-500 mt-4">Chọn nghĩa đúng của từ</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(opt)}
            disabled={answered}
            className="p-4 rounded-xl border-2 transition-all"
            style={{
              borderColor: answered
                ? opt.id === word.id
                  ? '#22c55e'
                  : '#ef4444'
                : 'var(--border-default)',
              backgroundColor: answered
                ? opt.id === word.id
                  ? 'color-mix(in srgb, #22c55e 12%, var(--surface-card))'
                  : 'color-mix(in srgb, #ef4444 12%, var(--surface-card))'
                : 'var(--surface-card)',
            }}
          >
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {opt.definitions[0]?.vietnamese ?? '...'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{opt.definitions[0]?.meaning}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
