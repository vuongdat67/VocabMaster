import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Link2 } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { wordRepo } from '@/db/word-repo'
import { shuffle } from '@/lib/utils'
import { playCorrectSound, playWrongSound } from '@/lib/audio-utils'

interface Props {
  word: Word
  onComplete: (correct: boolean, responseTime: number) => void
}

interface SynonymPair {
  id: string
  word1: string
  word2: string
}

export function SynonymMatchSession({ word, onComplete }: Props) {
  const [pairs, setPairs] = useState<SynonymPair[]>([])
  const [leftWords, setLeftWords] = useState<{ id: string; text: string }[]>([])
  const [rightWords, setRightWords] = useState<{ id: string; text: string }[]>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)
  const mistakes = useRef(0)
  const matchedRef = useRef(matched)
  matchedRef.current = matched
  const completeRef = useRef(complete)
  completeRef.current = complete
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatched(new Set())
    setComplete(false)
    setWrongId(null)
    mistakes.current = 0

    async function load() {
      const all = await wordRepo.getAll()
      const others = all.filter((w) => w.id !== word.id && w.word !== word.word)
      const shuffledOthers = shuffle(others)

      const synPairs: SynonymPair[] = []

      // 1. Real synonyms from word.synonyms (filtered to actual words in DB)
      const synonymWords = all.filter((w) => word.synonyms.includes(w.word))
      for (const synWord of synonymWords.slice(0, 2)) {
        synPairs.push({
          id: `syn-${synWord.id}`,
          word1: word.word,
          word2: synWord.definitions[0]?.vietnamese ?? synWord.word,
        })
      }

      // 2. Definition-based pair
      if (word.definitions[0] && !pairs.some((p) => p.word1 === word.word)) {
        const defShort = word.definitions[0].vietnamese.slice(0, 30)
        synPairs.push({
          id: `def-${word.id}`,
          word1: word.word,
          word2: defShort,
        })
      }

      // 3. Distractors from other words
      const usedWords = new Set([word.word, ...synonymWords.map((w) => w.word)])
      for (const other of shuffledOthers) {
        if (usedWords.has(other.word)) continue
        if (synPairs.length >= 6) break
        usedWords.add(other.word)
        const pairData = other.definitions[0]?.vietnamese ?? other.word
        synPairs.push({
          id: `other-${other.id}`,
          word1: other.word,
          word2: pairData,
        })
      }

      setPairs(synPairs)
      setLeftWords(shuffle(synPairs.map((p) => ({ id: p.id, text: p.word1 }))))
      setRightWords(shuffle(synPairs.map((p) => ({ id: p.id, text: p.word2 }))))
    }
    load()
  }, [word.id])

  const handleLeftClick = (id: string) => {
    if (completeRef.current) return
    setSelectedLeft((prev) => (prev === id ? null : id))
  }

  const handleRightClick = (id: string) => {
    if (completeRef.current) return
    setSelectedRight((prev) => (prev === id ? null : id))
  }

  // Check match when both sides are selected
  useEffect(() => {
    if (!selectedLeft || !selectedRight) return
    if (selectedLeft === selectedRight) {
      if (matchedRef.current.has(selectedLeft)) {
        setSelectedLeft(null)
        setSelectedRight(null)
        return
      }
      playCorrectSound()
      const newMatched = new Set(matchedRef.current)
      newMatched.add(selectedLeft)
      setMatched(newMatched)
      setSelectedLeft(null)
      setSelectedRight(null)

      if (newMatched.size === pairs.length) {
        setComplete(true)
        const time = Date.now() - startTimeRef.current
        setTimeout(() => onComplete(mistakes.current === 0, time), 400)
      }
    } else {
      playWrongSound()
      mistakes.current++
      setWrongId(selectedLeft)
      setTimeout(() => setWrongId(null), 500)
      setSelectedLeft(null)
      setSelectedRight(null)
    }
  }, [selectedLeft, selectedRight])

  if (pairs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <Link2 className="w-8 h-8 mr-2 opacity-50" />
        <span>Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">Nối từ đồng nghĩa</h3>
          </div>
          <p className="text-sm text-gray-500">
            Ghép các cặp từ có nghĩa tương đồng với nhau
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

        {/* Two columns */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-center items-start">
          {/* Left column */}
          <div className="flex-1 w-full sm:w-auto space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-center sm:text-left pl-1">
              Từ
            </p>
            {leftWords.map((w) => {
              const isSelected = selectedLeft === w.id
              const isMatched = matched.has(w.id)
              const isWrong = wrongId === w.id
              return (
                <motion.button
                  key={w.id}
                  whileTap={{ scale: 0.95 }}
                  animate={isWrong ? { x: [0, -5, 5, -3, 3, 0] } : {}}
                  transition={{ duration: 0.25 }}
                  onClick={() => handleLeftClick(w.id)}
                  disabled={isMatched}
                  className="block w-full sm:w-44 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all"
                  style={{
                    borderColor: isMatched
                      ? 'var(--accent-300)'
                      : isSelected
                        ? 'var(--accent-500)'
                        : isWrong
                          ? '#ef4444'
                          : 'var(--border-default)',
                    backgroundColor: isMatched
                      ? 'color-mix(in srgb, var(--accent-500) 10%, var(--surface-card))'
                      : isSelected
                        ? 'color-mix(in srgb, var(--accent-500) 12%, var(--surface-card))'
                        : isWrong
                          ? 'color-mix(in srgb, #ef4444 12%, var(--surface-card))'
                          : 'var(--surface-card)',
                  }}
                >
                  <span className={isMatched ? 'text-gray-400' : 'text-gray-800'}>
                    {w.text}
                  </span>
                  {isMatched && <Check className="w-3.5 h-3.5 inline ml-1.5" style={{ color: 'var(--accent-500)' }} />}
                </motion.button>
              )
            })}
          </div>

          {/* Right column */}
          <div className="flex-1 w-full sm:w-auto space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-center sm:text-left pl-1">
              Đồng nghĩa / Định nghĩa
            </p>
            {rightWords.map((w) => {
              const isSelected = selectedRight === w.id
              const isMatched = matched.has(w.id)
              return (
                <motion.button
                  key={w.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRightClick(w.id)}
                  disabled={isMatched}
                  className="block w-full sm:w-52 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all"
                  style={{
                    borderColor: isMatched
                      ? 'var(--accent-300)'
                      : isSelected
                        ? 'var(--accent-500)'
                        : 'var(--border-default)',
                    backgroundColor: isMatched
                      ? 'color-mix(in srgb, var(--accent-500) 10%, var(--surface-card))'
                      : isSelected
                        ? 'color-mix(in srgb, var(--accent-500) 12%, var(--surface-card))'
                        : 'var(--surface-card)',
                  }}
                >
                  <span className={isMatched ? 'text-gray-400' : 'text-gray-800'}>
                    {w.text}
                  </span>
                  {isMatched && <Check className="w-3.5 h-3.5 inline ml-1.5" style={{ color: 'var(--accent-500)' }} />}
                </motion.button>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
