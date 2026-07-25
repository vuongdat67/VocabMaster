import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { useAudio } from '@/hooks/useAudio'
import { wordRepo } from '@/db/word-repo'

interface Props {
  word: Word
  onComplete: (correct: boolean, responseTime: number) => void
}

export function AudioChallengeSession({ word, onComplete }: Props) {
  const [options, setOptions] = useState<Word[]>([])
  const [answered, setAnswered] = useState(false)
  const startTime = useRef(Date.now())
  const { speak } = useAudio()
  const spokenRef = useRef(false)

  useEffect(() => {
    startTime.current = Date.now()
    setAnswered(false)
    spokenRef.current = false

    // Load 3 random other words as distractors + the correct one
    async function loadOptions() {
      const allWords = await wordRepo.getAll()
      const others = allWords.filter((w) => w.id !== word.id)
      const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3)
      const allOptions = [...shuffled, word].sort(() => Math.random() - 0.5)
      setOptions(allOptions)
    }
    loadOptions()
  }, [word.id])

  // Auto-play pronunciation when word loads
  useEffect(() => {
    if (!spokenRef.current && word.word) {
      spokenRef.current = true
      const timer = setTimeout(() => speak(word.word), 200)
      return () => clearTimeout(timer)
    }
  }, [word.word, speak])

  const handleReplay = () => {
    speak(word.word)
  }

  const handleSelect = (selected: Word) => {
    if (answered) return
    setAnswered(true)
    const time = Date.now() - startTime.current
    const correct = selected.id === word.id
    setTimeout(() => onComplete(correct, time), 400)
  }

  return (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <Card className="p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <button
            onClick={handleReplay}
            disabled={answered}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: answered
                ? 'color-mix(in srgb, var(--accent-500) 15%, var(--surface-card))'
                : 'var(--accent-500)',
            }}
          >
            <Volume2
              className="w-10 h-10"
              style={{ color: answered ? 'var(--accent-600)' : 'white' }}
            />
          </button>
        </motion.div>

        <h3 className="text-lg font-medium text-gray-700 mt-4">
          Chọn từ tương ứng với âm thanh
        </h3>
        <p className="text-xs text-gray-500 mt-1">Nhấn loa để nghe lại</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(opt)}
            disabled={answered}
            className="p-4 rounded-xl border-2 text-left transition-all"
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
            {opt.imageUrls[0] && (
              <img
                src={opt.imageUrls[0]}
                alt=""
                className="w-full h-24 object-cover rounded-lg mb-2"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <p className="font-semibold text-gray-900">{answered ? opt.word : '???'}</p>
            <p className="text-sm text-gray-500">{opt.definitions[0]?.vietnamese}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
