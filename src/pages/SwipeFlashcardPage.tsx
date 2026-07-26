import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { progressRepo } from '@/db/progress-repo'
import { calculateNextReview, createInitialSRSData } from '@/algorithms/srs'
import { wordRepo } from '@/db/word-repo'
import { Word } from '@/types/word'
import { Button } from '@/components/ui/Button'
import { Volume2, Zap, ArrowLeft, ArrowRight, Brain, Check, X } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { Card } from '@/components/ui/Card'
import confetti from 'canvas-confetti'
import { sessionRepo } from '@/db/session-repo'

export function SwipeFlashcardPage() {
  const [deck, setDeck] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'completed'>('setup')
  const [showMeaning, setShowMeaning] = useState(false)
  
  const [sessionResults, setSessionResults] = useState<{wordId: string, isCorrect: boolean}[]>([])
  const [startTime, setStartTime] = useState(Date.now())
  
  const { speak } = useAudio()
  const { playPop, playCorrect, playWrong } = useSoundEffects()
  
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const bgLeft = useTransform(x, [-200, 0], [1, 0])
  const bgRight = useTransform(x, [0, 200], [0, 1])

  // Auto-read word when loaded
  useEffect(() => {
    if (gameState === 'playing' && deck[currentIndex]) {
      speak(deck[currentIndex].word)
    }
  }, [currentIndex, gameState, deck, speak])

  const loadCards = async () => {
    const srsDue = await progressRepo.getDueWords(20)
    if (srsDue.length > 0) {
      const ids = srsDue.map(s => s.wordId)
      const words = await wordRepo.getByIds(ids)
      setDeck(words)
    } else {
      const all = await wordRepo.getAll()
      const shuffled = [...all].sort(() => 0.5 - Math.random()).slice(0, 10)
      setDeck(shuffled)
    }
    setCurrentIndex(0)
    setSessionResults([])
    setStartTime(Date.now())
    setGameState('playing')
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    const word = deck[currentIndex]
    const isCorrect = direction === 'right'
    
    if (isCorrect) playCorrect()
    else playWrong()
    
    if (word) {
      let srs = await progressRepo.getSRS(word.id)
      if (!srs) srs = createInitialSRSData(word.id)
      
      const nextData = calculateNextReview(srs, { isCorrect, responseTime: 2000, wasCloseCall: false })
      await progressRepo.upsertSRS({ ...srs, ...nextData, updatedAt: Date.now() })
      
      setSessionResults(prev => [...prev, { wordId: word.id, isCorrect }])
    }
    
    setTimeout(() => {
      setShowMeaning(false)
      if (currentIndex + 1 < deck.length) {
        setCurrentIndex(prev => prev + 1)
      } else {
        // Complete session
        const now = Date.now()
        sessionRepo.save({
          id: crypto.randomUUID(),
          mode: 'swipe',
          words: deck.map(w => w.id),
          results: [...sessionResults, { wordId: word?.id || '', isCorrect }].filter(r => r.wordId).map(r => ({
            wordId: r.wordId,
            isCorrect: r.isCorrect,
            responseTime: (now - startTime) / deck.length,
            wasCloseCall: false,
            mode: 'swipe',
            timestamp: now
          })),
          startedAt: startTime,
          completedAt: now,
          totalTime: now - startTime
        })
        
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        setGameState('completed')
      }
    }, 200)
  }

  const onDragEnd = (e: any, info: any) => {
    if (info.offset.x > 100) {
      handleSwipe('right')
    } else if (info.offset.x < -100) {
      handleSwipe('left')
    }
  }

  if (gameState === 'setup') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="p-8 text-center space-y-8">
          <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quẹt thẻ (Tinder-style Flashcards)</h3>
            <p className="text-gray-500">
              Ôn tập từ vựng tốc độ cao. Vuốt sang phải nếu bạn Đã nhớ, vuốt sang trái nếu bạn Quên.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full h-14 text-lg bg-pink-500 hover:bg-pink-600"
            onClick={loadCards}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Bắt đầu ôn tập
          </Button>
        </Card>
      </div>
    )
  }

  if (gameState === 'completed') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="p-8 text-center space-y-8">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tuyệt vời! Bạn đã hoàn thành</h3>
            <p className="text-gray-500">
              Bạn đã ôn tập xong {deck.length} từ vựng hôm nay.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full h-14 text-lg"
            onClick={() => setGameState('setup')}
          >
            Quay lại
          </Button>
        </Card>
      </div>
    )
  }

  const currentWord = deck[currentIndex]
  if (!currentWord) return null

  return (
    <div className="max-w-2xl mx-auto py-8 h-[calc(100vh-8rem)] flex flex-col relative">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Brain className="w-5 h-5 text-pink-500" /> Ôn tập
        </h2>
        <span className="font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {deck.length}
        </span>
      </div>

      <div className="flex-1 relative w-full px-4 perspective-1000">
        <AnimatePresence>
          <motion.div
            key={currentWord.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate, opacity }}
            onDragEnd={onDragEnd}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-4 sm:inset-x-8 bg-white rounded-3xl shadow-xl border-2 border-gray-100 flex flex-col items-center justify-center p-8 text-center cursor-grab active:cursor-grabbing z-10 overflow-hidden"
            onClick={() => setShowMeaning(!showMeaning)}
          >
            {/* Overlay indicators */}
            <motion.div style={{ opacity: bgLeft }} className="absolute inset-0 bg-red-500/10 rounded-3xl z-0 pointer-events-none" />
            <motion.div style={{ opacity: bgRight }} className="absolute inset-0 bg-emerald-500/10 rounded-3xl z-0 pointer-events-none" />
            <motion.div style={{ opacity: bgLeft }} className="absolute top-8 right-8 text-red-500 font-black text-2xl border-4 border-red-500 px-4 py-1 rounded-xl rotate-12 z-20 pointer-events-none uppercase">QUÊN</motion.div>
            <motion.div style={{ opacity: bgRight }} className="absolute top-8 left-8 text-emerald-500 font-black text-2xl border-4 border-emerald-500 px-4 py-1 rounded-xl -rotate-12 z-20 pointer-events-none uppercase">NHỚ</motion.div>

            {/* Speaker Icon at the very top right of the card */}
            <div className="absolute top-4 right-4 z-20">
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-accent-500 hover:bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center" 
                onClick={(e) => { e.stopPropagation(); speak(currentWord.word) }}
              >
                <Volume2 className="w-6 h-6" />
              </Button>
            </div>

            <div className="relative z-10 w-full px-4">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight break-words">
                {currentWord.word}
              </h2>
              {currentWord.ipa && <p className="text-gray-400 font-mono mb-8 text-lg">{currentWord.ipa}</p>}
              
              <div className={`transition-all duration-300 ${showMeaning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <p className="text-2xl text-accent-600 font-semibold mb-4">
                  {currentWord.definitions[0]?.vietnamese || currentWord.synonyms[0]}
                </p>
                {currentWord.definitions[0]?.meaning && (
                  <p className="text-gray-500 italic">
                    {currentWord.definitions[0].meaning}
                  </p>
                )}
              </div>
              
              {!showMeaning && (
                <div className="absolute bottom-[-2rem] left-0 right-0 text-gray-300 font-medium animate-pulse">
                  Chạm để xem nghĩa
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-6 mt-8 mb-4 px-8">
        <button 
          onClick={() => {
            x.set(-200)
            handleSwipe('left')
          }}
          className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all active:scale-95"
        >
          <X className="w-8 h-8" />
        </button>
        <button 
          onClick={() => {
            x.set(200)
            handleSwipe('right')
          }}
          className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:scale-110 transition-all active:scale-95"
        >
          <Check className="w-8 h-8" />
        </button>
      </div>
      
      <p className="text-center text-gray-400 text-sm font-medium">Vuốt hoặc dùng nút điều khiển</p>
    </div>
  )
}
