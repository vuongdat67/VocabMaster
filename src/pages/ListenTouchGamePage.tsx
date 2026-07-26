import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Trophy, ArrowRight, Loader2, Play } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { wordRepo } from '@/db/word-repo'
import { useAudio } from '@/hooks/useAudio'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import type { Word } from '@/types/word'
import { Link } from 'react-router-dom'
import { getImageForWord } from '@/lib/image-search'

export function ListenTouchGamePage() {
  const [words, setWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [options, setOptions] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  
  const { speak } = useAudio()
  const { playCorrect, playWrong } = useSoundEffects()

  useEffect(() => {
    async function load() {
      const allWords = await wordRepo.getAll()
      // Lọc các từ dài đủ hoặc random để test
      const shuffled = allWords.sort(() => 0.5 - Math.random()).slice(0, 15)
      setWords(shuffled)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (words.length === 0 || currentWordIndex >= words.length) return
    const current = words[currentWordIndex]
    
    if (!current) return
    const others = words.filter(w => w.id !== current.id)
    const wrong = others[Math.floor(Math.random() * others.length)]
    
    if (wrong && current) {
      setOptions([current, wrong].sort(() => 0.5 - Math.random()))
    } else if (current) {
      setOptions([current])
    }
    
    setSelectedWord(null)
    if (current) {
      setTimeout(() => {
        speak(current.word)
      }, 500)
    }
  }, [currentWordIndex, words, speak])

  const handleSelect = (word: Word) => {
    if (selectedWord) return // already answered
    const current = words[currentWordIndex]
    if (!current) return
    setSelectedWord(word.id)
    
    if (word.id === current.id) {
      playCorrect()
      setScore(s => s + 1)
      setTimeout(() => {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(i => i + 1)
        } else {
          setGameOver(true)
        }
      }, 1500)
    } else {
      playWrong()
      setTimeout(() => {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(i => i + 1)
        } else {
          setGameOver(true)
        }
      }, 1500)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (words.length < 2) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Chưa đủ từ vựng!</h2>
        <p className="text-gray-500">Cần ít nhất 2 từ vựng trong kho để chơi trò này.</p>
        <Link to="/explore">
          <Button className="mt-6">Khám phá từ vựng</Button>
        </Link>
      </div>
    )
  }

  if (gameOver) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-20">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Tuyệt vời!</h2>
        <p className="text-xl text-gray-600 mb-8">Bạn đã trả lời đúng {score}/{words.length} từ.</p>
        <Button onClick={() => window.location.reload()} icon={<Play className="w-4 h-4"/>}>
          Chơi lại nào
        </Button>
      </motion.div>
    )
  }

  const current = words[currentWordIndex]

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-12">
        <Link to="/" className="text-gray-500 font-bold hover:text-blue-500 flex items-center gap-2">
          &larr; Trở về
        </Link>
        <div className="flex items-center gap-2 font-bold text-gray-500">
          <Volume2 className="w-5 h-5 text-blue-500" /> Listen & Touch
        </div>
        <Button variant="ghost" size="sm" onClick={() => current && speak(current.word)}>
          <Volume2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-full py-4 px-8 mb-16 shadow-sm border border-gray-100 flex justify-center items-center gap-3">
        <Volume2 className="w-6 h-6 text-blue-500 animate-pulse" />
        <span className="text-xl font-bold text-gray-700 dark:text-gray-200 text-center">
          Touch the {current?.word}?
        </span>
      </div>

      <div className="flex gap-8 justify-center flex-wrap">
        {options.map((opt) => {
          const isSelected = selectedWord === opt.id
          const isCorrect = current ? opt.id === current.id : false
          let stateClass = 'hover:scale-105 bg-white border-2 border-transparent hover:border-blue-200 shadow-xl'
          
          if (selectedWord) {
            if (isSelected) {
              stateClass = isCorrect 
                ? 'bg-green-50 border-2 border-green-400 scale-110 shadow-green-200' 
                : 'bg-red-50 border-2 border-red-400 scale-95 shadow-red-200 opacity-50'
            } else {
              stateClass = isCorrect 
                ? 'bg-green-50 border-2 border-green-400 shadow-green-200 scale-110' // highlight correct answer if wrong was picked
                : 'opacity-50 scale-95'
            }
          }

          return (
            <motion.button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              disabled={!!selectedWord}
              className={`w-48 h-48 sm:w-64 sm:h-64 rounded-[3rem] flex flex-col items-center justify-center p-6 transition-all duration-300 ${stateClass}`}
            >
              {opt.imageUrls?.[0] ? (
                <img src={opt.imageUrls[0]} alt={opt.word} className="w-32 h-32 object-cover rounded-2xl mb-4 pointer-events-none" />
              ) : (
                <span className="text-6xl mb-4 pointer-events-none">✨</span>
              )}
              <span className="text-xl font-bold text-gray-700 capitalize pointer-events-none">{opt.word}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
