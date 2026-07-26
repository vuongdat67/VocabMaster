import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { wordRepo } from '@/db/word-repo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RefreshCw, Gamepad2, ArrowRight, Clock } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import confetti from 'canvas-confetti'
import { sessionRepo } from '@/db/session-repo'
import { useWordleStore } from '@/stores/wordle-store'
import { MascotWidget } from '@/components/mascot/MascotWidget'

const MAX_TRIES = 6

export function WordleGamePage() {
  const {
    targetWord, setTargetWord,
    guesses, setGuesses,
    currentGuess, setCurrentGuess,
    gameState, setGameState,
    timeLeft, setTimeLeft,
    startTime, setStartTime,
    resetGame
  } = useWordleStore()
  
  const [toast, setToast] = useState<{message: string, type: 'error'|'success'} | null>(null)

  const { speak } = useAudio()
  const { playCorrect, playWrong, playPop } = useSoundEffects()

  const startGame = async () => {
    const allWords = await wordRepo.getAll()
    // Filter words that have valid alphabet letters only
    const validWords = allWords.filter(w => /^[a-zA-Z]+$/.test(w.word) && w.word.length >= 3 && w.word.length <= 8)
    
    if (validWords.length === 0) {
      alert("Không đủ từ vựng hợp lệ (từ 3 đến 8 chữ cái không chứa dấu cách) để chơi!")
      return
    }

    const randomWord = validWords[Math.floor(Math.random() * validWords.length)]
    if (randomWord) {
      resetGame()
      setTargetWord(randomWord)
      setStartTime(Date.now())
      setGameState('playing')
    }
  }

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setGameState('timeout')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState, timeLeft, setTimeLeft, setGameState])

  const finishGame = useCallback((won: boolean) => {
    const now = Date.now()
    const timeSpent = Math.max(1, (180 - timeLeft) * 1000)
    
    sessionRepo.save({
      id: crypto.randomUUID(),
      mode: 'wordle',
      words: [targetWord!.id],
      results: [{
        wordId: targetWord!.id,
        isCorrect: won,
        responseTime: timeSpent,
        wasCloseCall: !won && guesses.length >= MAX_TRIES - 1,
        mode: 'wordle',
        timestamp: now
      }],
      startedAt: startTime,
      completedAt: now,
      totalTime: timeSpent
    })
  }, [targetWord, guesses.length, startTime, timeLeft])

  useEffect(() => {
    if (gameState === 'won') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      playCorrect()
      speak(targetWord!.word)
      finishGame(true)
    } else if (gameState === 'lost' || gameState === 'timeout') {
      playWrong()
      finishGame(false)
    }
  }, [gameState]) // Execute once when gameState changes to a terminal state

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing' || !targetWord) return
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    if (e.key === 'Enter') {
      if (currentGuess.length !== targetWord.word.length) {
        setToast({ message: 'Chưa đủ chữ cái!', type: 'error' })
        setTimeout(() => setToast(null), 2000)
        return
      }
      
      const newGuesses = [...guesses, currentGuess]
      setGuesses(newGuesses)
      setCurrentGuess('')

      if (currentGuess.toLowerCase() === targetWord.word.toLowerCase()) {
        setGameState('won')
      } else if (newGuesses.length >= MAX_TRIES) {
        setGameState('lost')
      } else {
        playPop()
      }
    } else if (e.key === 'Backspace') {
      setCurrentGuess(currentGuess.slice(0, -1))
      playPop()
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      if (currentGuess.length < targetWord.word.length) {
        setCurrentGuess(currentGuess + e.key.toUpperCase())
        playPop()
      }
    }
  }, [gameState, targetWord, currentGuess, guesses])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getKeyColor = (char: string) => {
    if (!targetWord || guesses.length === 0) return 'bg-gray-100 text-gray-800'
    const charLower = char.toLowerCase()
    
    let isCorrect = false
    let isPresent = false
    let isAbsent = false

    guesses.forEach(guess => {
      const g = guess.toLowerCase()
      const t = targetWord.word.toLowerCase()
      for (let i = 0; i < g.length; i++) {
        if (g[i] === charLower) {
          if (t[i] === charLower) isCorrect = true
          else if (t.includes(charLower)) isPresent = true
          else isAbsent = true
        }
      }
    })

    if (isCorrect) return 'bg-emerald-500 text-white border-emerald-600'
    if (isPresent) return 'bg-amber-400 text-white border-amber-500'
    if (isAbsent) return 'bg-gray-400 text-white border-gray-500'
    return 'bg-gray-100 text-gray-800'
  }

  if (gameState === 'setup') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="p-8 text-center space-y-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Đoán từ (Wordle)</h3>
            <p className="text-gray-500">
              Bạn có 6 lượt để đoán một từ vựng tiếng Anh. Màu xanh lá báo hiệu đúng chữ và đúng vị trí.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full h-14 text-lg"
            onClick={startGame}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Bắt đầu chơi
          </Button>
        </Card>
      </div>
    )
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const wordLength = targetWord?.word.length || 5

  return (
    <div className="max-w-lg mx-auto py-8 flex flex-col items-center relative">
      
      <div className="w-full flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-blue-500" /> Đoán Từ
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="relative flex items-center gap-1 font-mono text-lg font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
            <motion.div
              className="absolute -left-6 -top-4 text-2xl z-10"
              animate={{
                y: [0, -8, 0],
                x: [0, 8, -4, 0],
                rotate: [0, -15, 15, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🧚
            </motion.div>
            <Clock className={`w-4 h-4 ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
            <span className={timeLeft <= 30 ? 'text-red-500 font-bold' : ''}>{formatTime(timeLeft)}</span>
          </div>
          <Button variant="ghost" onClick={() => setGameState('setup')} icon={<RefreshCw className="w-4 h-4" />}>
            Chơi lại
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-2 mb-8">
        {Array.from({ length: MAX_TRIES }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length
          const guess = guesses[rowIndex] || (isCurrentRow ? currentGuess : '')
          const isSubmitted = rowIndex < guesses.length

          return (
            <div key={rowIndex} className="flex gap-2" style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}>
              {Array.from({ length: wordLength }).map((_, colIndex) => {
                const char = guess[colIndex] || ''
                let bgColor = 'bg-white border-gray-200 text-gray-800'
                
                if (isSubmitted && targetWord) {
                  const targetChar = targetWord.word[colIndex]?.toLowerCase() || ''
                  const charLower = char.toLowerCase()
                  
                  if (charLower && charLower === targetChar) {
                    bgColor = 'bg-emerald-500 border-emerald-600 text-white'
                  } else if (charLower && targetWord.word.toLowerCase().includes(charLower)) {
                    bgColor = 'bg-amber-400 border-amber-500 text-white'
                  } else {
                    bgColor = 'bg-gray-400 border-gray-500 text-white'
                  }
                } else if (char) {
                  bgColor = 'bg-white border-gray-400 text-gray-900'
                }

                return (
                  <motion.div
                    key={colIndex}
                    initial={false}
                    animate={isSubmitted ? { rotateX: [0, 90, 0] } : { scale: char ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.4, delay: isSubmitted ? colIndex * 0.1 : 0 }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase border-2 rounded-lg ${bgColor}`}
                  >
                    {char}
                  </motion.div>
                )
              })}
            </div>
          )
        })}
      </div>

      {toast && (
        <div className={`mb-6 px-4 py-2 rounded-lg font-medium text-white shadow-md ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      {(gameState === 'won' || gameState === 'lost') && (
        <Card className="w-full p-6 text-center space-y-4 bg-gray-50 mb-8 border-gray-200">
          <h3 className={`text-2xl font-bold ${gameState === 'won' ? 'text-emerald-600' : 'text-red-600'}`}>
            {gameState === 'won' ? 'Tuyệt vời!' : 'Thua mất rồi!'}
          </h3>
          <p className="text-gray-600 text-lg">
            Từ đúng là: <strong className="text-gray-900 text-2xl uppercase tracking-wider block mt-2">{targetWord?.word}</strong>
          </p>
          <p className="text-sm text-gray-500 italic">
            Nghĩa: {targetWord?.definitions[0]?.vietnamese || targetWord?.synonyms[0]}
          </p>
          <div className="pt-4">
            <Button variant="primary" onClick={startGame} className="w-full">Chơi ván mới</Button>
          </div>
        </Card>
      )}

      {/* Virtual Keyboard */}
      <div className="w-full max-w-lg space-y-2 select-none">
        {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-2">
            {i === 2 && (
              <button 
                onClick={() => handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))}
                className="px-3 sm:px-4 py-3 sm:py-4 bg-gray-200 text-gray-800 font-bold rounded flex-1 text-xs sm:text-sm hover:bg-gray-300"
              >
                ENTER
              </button>
            )}
            {row.split('').map(char => (
              <button
                key={char}
                onClick={() => handleKeyDown(new KeyboardEvent('keydown', { key: char }))}
                className={`w-8 sm:w-10 py-3 sm:py-4 font-bold rounded text-sm sm:text-base transition-colors border-b-2 ${getKeyColor(char)}`}
              >
                {char}
              </button>
            ))}
            {i === 2 && (
              <button 
                onClick={() => handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))}
                className="px-3 sm:px-4 py-3 sm:py-4 bg-gray-200 text-gray-800 font-bold rounded flex-1 text-xs sm:text-sm hover:bg-gray-300"
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
