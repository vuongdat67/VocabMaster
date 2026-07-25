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

function buildTemplate(word: string): { template: string; blankIndices: number[] } {
  const chars = word.toLowerCase().split('')
  const vowels = new Set(['a', 'e', 'i', 'o', 'u'])
  const total = chars.length
  const showIndices = new Set<number>()
  showIndices.add(0)
  if (total > 3) showIndices.add(total - 1)
  chars.forEach((ch, i) => { if (vowels.has(ch)) showIndices.add(i) })
  const targetShow = Math.ceil(total * 0.45)
  while (showIndices.size > targetShow) {
    const toRemove = [...showIndices].filter((i) => i !== 0).sort(() => Math.random() - 0.5)[0]
    if (toRemove !== undefined) showIndices.delete(toRemove)
  }
  while (showIndices.size < Math.ceil(total * 0.35)) {
    showIndices.add(Math.floor(Math.random() * total))
  }
  const blankIndices: number[] = []
  const template = chars.map((ch, i) => {
    if (showIndices.has(i)) return ch
    blankIndices.push(i)
    return '_'
  }).join('')
  return { template, blankIndices }
}

export function FillBlankSession({ word, onComplete }: Props) {
  const [mode, setMode] = useState<'sentence' | 'word'>('word')
  const [input, setInput] = useState('')
  const [answered, setAnswered] = useState(false)
  const [blankSentence, setBlankSentence] = useState('')
  const [template, setTemplate] = useState('')
  const [blankIndices, setBlankIndices] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const startTime = useRef(Date.now())
  const { speak } = useAudio()

  useEffect(() => {
    startTime.current = Date.now()
    setInput('')
    setAnswered(false)
    inputRef.current?.focus()

    // Random: 30% sentence fill-blank, 70% word template
    const isSentence = Math.random() < 0.3 && !!word.examples[0]
    setMode(isSentence ? 'sentence' : 'word')

    if (isSentence && word.examples[0]) {
      const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const blanked = word.examples[0].sentence.replace(new RegExp(escaped, 'gi'), '______')
      setBlankSentence(blanked)
    } else {
      const { template: t, blankIndices: bi } = buildTemplate(word.word)
      setTemplate(t)
      setBlankIndices(bi)
    }

    const timer = setTimeout(() => speak(word.word), 300)
    return () => clearTimeout(timer)
  }, [word.word, word.examples, speak])

  const handleSubmit = () => {
    if (answered) return
    const time = Date.now() - startTime.current
    const normalized = input.trim().toLowerCase()
    const correct = mode === 'sentence'
      ? normalized === word.word.toLowerCase()
      : normalized === blankIndices.map((i) => word.word.toLowerCase()[i]!).join('')
    speak(word.word)
    setAnswered(true)
    setTimeout(() => onComplete(correct, time), 400)
  }

  const resultCorrect = (() => {
    const n = input.trim().toLowerCase()
    return mode === 'sentence'
      ? n === word.word.toLowerCase()
      : n === blankIndices.map((i) => word.word.toLowerCase()[i]!).join('')
  })()

  const renderWordTemplate = () => {
    const chars = template.split('')
    let inputIdx = 0
    return chars.map((ch, i) => {
      if (ch === '_') {
        const filled = input[inputIdx] ?? ''
        inputIdx++
        return (
          <span key={i}
            className="inline-flex items-center justify-center w-8 h-10 rounded-lg border-2 text-lg font-bold mx-0.5 transition-all"
            style={{
              borderColor: answered
                ? filled ? '#22c55e' : '#ef4444'
                : filled ? 'var(--accent-400)' : 'var(--border-default)',
              backgroundColor: answered
                ? filled ? 'color-mix(in srgb, #22c55e 10%, var(--surface-card))' : 'color-mix(in srgb, #ef4444 10%, var(--surface-card))'
                : filled ? 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))' : 'var(--surface-card)',
              color: answered
                ? filled ? '#16a34a' : '#ef4444'
                : 'var(--text-primary)',
            }}
          >
            {answered && !filled ? (word.word[i] ?? '_') : (filled || '_')}
          </span>
        )
      }
      return (
        <span key={i} className="inline-flex items-center justify-center w-8 h-10 rounded-lg text-lg font-bold mx-0.5"
          style={{ color: 'var(--accent-500)' }}>
          {ch}
        </span>
      )
    })
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="p-8 text-center">
        {word.imageUrls[0] && (
          <img src={word.imageUrls[0]} alt={word.word}
            className="w-28 h-28 object-cover rounded-xl mx-auto mb-4"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <button onClick={() => speak(word.word)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mb-3 inline-block"
          style={{ color: 'var(--accent-500)' }}>
          <Volume2 className="w-6 h-6" />
        </button>

        {mode === 'word' && (
          <>
            <p className="text-sm text-gray-500 mb-4">Điền chữ còn thiếu ({blankIndices.length} chỗ)</p>
            <div className="flex justify-center flex-wrap gap-1 mb-6">{renderWordTemplate()}</div>
          </>
        )}

        {mode === 'sentence' && (
          <Card className="p-4 mb-4" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 6%, var(--surface-card))' }}>
            <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed text-center">
              {blankSentence.split('______').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block mx-1 px-3 py-1 rounded-lg border-b-2"
                      style={{
                        borderColor: answered ? (resultCorrect ? '#22c55e' : '#ef4444') : 'var(--accent-400)',
                        backgroundColor: answered
                          ? resultCorrect ? 'color-mix(in srgb, #22c55e 10%, var(--surface-card))' : 'color-mix(in srgb, #ef4444 10%, var(--surface-card))'
                          : 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))',
                        color: answered ? (resultCorrect ? '#16a34a' : '#dc2626') : 'var(--text-primary)',
                      }}>
                      {answered ? word.word : '______'}
                    </span>
                  )}
                </span>
              ))}
            </p>
            {word.examples[0] && <p className="text-sm text-gray-500 mt-2 italic">{word.examples[0].vietnamese}</p>}
          </Card>
        )}
      </Card>

      <div className="flex gap-3">
        <input ref={inputRef} type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSubmit())}
          disabled={answered}
          placeholder={mode === 'word' ? `Gõ ${blankIndices.length} chữ...` : 'Gõ từ còn thiếu...'}
          className="flex-1 py-3 px-4 rounded-xl border-2 focus:outline-none focus:ring-2 text-lg transition-all"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-card)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--accent-400)',
          } as React.CSSProperties}
        />
        {!answered && <Button onClick={handleSubmit} disabled={!input.trim()} size="lg">Kiểm tra</Button>}
      </div>

      {answered && (
        <p className={`text-center font-medium ${resultCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {resultCorrect ? 'Chính xác!' : `Đáp án: ${word.word}`}
        </p>
      )}
    </div>
  )
}
