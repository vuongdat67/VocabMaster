import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, RefreshCw, Trophy, Volume2, ArrowRight } from 'lucide-react'
import { wordRepo } from '@/db/word-repo'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { useSoundEffects } from '@/hooks/useSoundEffects'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const STORAGE_KEY = 'speech_game_state'

export function SpeechGamePage() {
  const { playCorrect, playWrong, initSound } = useSoundEffects()
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [recognition, setRecognition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentWord = words[currentIndex]

  // Load words or restore from storage
  useEffect(() => {
    async function loadWords() {
      try {
        const savedState = sessionStorage.getItem(STORAGE_KEY)
        if (savedState) {
          const parsed = JSON.parse(savedState)
          setWords(parsed.words)
          setCurrentIndex(parsed.currentIndex)
          setTotalScore(parsed.totalScore)
          setLoading(false)
        } else {
          const allWords = await wordRepo.getAll()
          const shuffled = [...allWords].sort(() => 0.5 - Math.random()).slice(0, 10)
          setWords(shuffled)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        setError('Không thể tải từ vựng.')
        setLoading(false)
      }
    }
    loadWords()

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRec) {
      const rec = new SpeechRec()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        setTranscript(text)
      }

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setError('Vui lòng cấp quyền sử dụng Micro cho trình duyệt.')
        }
      }

      rec.onend = () => {
        setIsListening(false)
      }

      setRecognition(rec)
    } else {
      setError('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng sử dụng Chrome, Edge hoặc Safari bản mới nhất.')
    }
  }, [])

  // Save state to sessionStorage
  useEffect(() => {
    if (words.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        words,
        currentIndex,
        totalScore
      }))
    }
  }, [words, currentIndex, totalScore])

  useEffect(() => {
    if (transcript && currentWord && !isListening) {
      evaluatePronunciation(transcript, currentWord.word)
    }
  }, [transcript, isListening])

  const evaluatePronunciation = (spoken: string, expected: string) => {
    const target = expected.toLowerCase().replace(/[.,?!]/g, '').trim()
    const actual = spoken.toLowerCase().replace(/[.,?!]/g, '').trim()

    let newScore = 0
    if (actual === target) {
      newScore = 100
    } else if (actual.includes(target) || target.includes(actual)) {
      newScore = 80
    } else {
      newScore = 30
    }

    setScore(newScore)
    if (newScore >= 70) {
      setTotalScore(prev => prev + 10)
      playCorrect()
    } else {
      playWrong()
    }
  }

  const toggleListen = () => {
    initSound() // user interaction allows audio context to start
    if (isListening) {
      recognition?.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      setScore(null)
      try {
        recognition?.start()
        setIsListening(true)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setTranscript('')
      setScore(null)
    }
  }

  const playAudio = () => {
    if (currentWord?.audioUrl) {
      new Audio(currentWord.audioUrl).play().catch(console.error)
    } else if (currentWord?.word) {
      const msg = new SpeechSynthesisUtterance(currentWord.word)
      msg.lang = 'en-US'
      window.speechSynthesis.speak(msg)
    }
  }

  const resetGame = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  if (loading) return <div className="p-8 text-center flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (error) return <div className="p-8 text-center text-error font-medium bg-error/10 rounded-2xl max-w-lg mx-auto mt-10">{error}</div>
  if (words.length === 0 || !currentWord) return <div className="p-8 text-center text-base-content/60 mt-10">Chưa có từ vựng nào trong kho để luyện tập. Hãy thêm từ vựng mới!</div>

  const isComplete = currentIndex >= words.length - 1 && score !== null

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-base-content mb-2">Luyện Phát Âm</h1>
          <p className="text-base-content/70">Đọc từ vựng tiếng Anh để AI chấm điểm</p>
        </div>
        <div className="flex items-center gap-2 bg-warning/20 text-warning px-6 py-3 rounded-2xl font-bold text-lg shadow-sm border border-warning/30">
          <Trophy className="w-6 h-6" />
          Điểm: {totalScore}
        </div>
      </div>

      <Card className="p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute top-6 left-6 text-sm font-bold text-base-content/50 bg-base-200 px-4 py-2 rounded-full">
          {currentIndex + 1} / {words.length}
        </div>

        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="mt-8 mb-12"
        >
          <h2 className="text-6xl sm:text-7xl font-black text-base-content mb-6 tracking-tight">
            {currentWord.word}
          </h2>
          <div className="flex items-center justify-center gap-4 text-base-content/60 mb-8">
            <span className="text-2xl font-medium tracking-wide">{currentWord.ipa}</span>
            <button 
              onClick={playAudio}
              className="p-3 bg-base-200 hover:bg-primary/10 hover:text-primary rounded-full transition-colors shadow-sm text-base-content"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
          <p className="text-xl text-base-content/80 capitalize bg-base-200 inline-block px-6 py-2 rounded-xl">
            {currentWord.definitions[0]?.vietnamese || currentWord.definitions[0]?.meaning}
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-6 mb-8">
          <button
            onClick={toggleListen}
            className={`relative p-8 rounded-full transition-all duration-300 ${
              isListening 
                ? 'bg-error/10 text-error shadow-[0_0_0_12px_rgba(255,0,0,0.1)] hover:bg-error/20 scale-110' 
                : 'bg-base-content text-base-100 hover:bg-primary hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {isListening ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>
                <Mic className="w-12 h-12" />
              </motion.div>
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </button>
          
          <p className="text-base-content/60 font-medium">
            {isListening ? 'Đang nghe... (Hãy đọc to từ vựng trên)' : 'Bấm vào Micro để bắt đầu đọc'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {transcript && !isListening && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mt-8 p-8 rounded-3xl border-2 ${
                score && score >= 70 ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'
              }`}
            >
              <p className="text-sm text-base-content/70 mb-2 font-medium">Hệ thống nghe được:</p>
              <p className="text-3xl font-bold text-base-content mb-6">"{transcript}"</p>
              
              {score !== null && (
                <div className="flex flex-col items-center gap-6">
                  <div className={`text-2xl font-black ${score >= 70 ? 'text-success' : 'text-error'}`}>
                    {score >= 70 ? 'Tuyệt vời! Chính xác! 🎉' : 'Phát âm chưa chuẩn, thử lại nhé! 💪'}
                  </div>
                  
                  {score >= 70 && !isComplete && (
                    <button
                      onClick={nextWord}
                      className="flex items-center gap-2 bg-base-content hover:bg-primary text-base-100 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:-translate-y-1"
                    >
                      Từ tiếp theo <ArrowRight className="w-6 h-6" />
                    </button>
                  )}
                  {isComplete && score >= 70 && (
                    <button
                      onClick={resetGame}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-content px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:-translate-y-1"
                    >
                      Chơi lại <RefreshCw className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
