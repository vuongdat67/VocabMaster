import { useState, useEffect, useRef, useCallback } from 'react'
import { wordRepo } from '@/db/word-repo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpen, ArrowRight, Lightbulb, CheckCircle2, XCircle } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import confetti from 'canvas-confetti'
import { sessionRepo } from '@/db/session-repo'
import { useContextStore, Question } from '@/stores/context-store'

export function ContextGamePage() {
  const {
    questions, setQuestions,
    currentIndex, setCurrentIndex,
    gameState, setGameState,
    userInput, setUserInput,
    isCorrect, setIsCorrect,
    sessionResults, setSessionResults,
    startTime, setStartTime,
    resetGame
  } = useContextStore()
  
  const [isChecked, setIsChecked] = useState(false)
  const [showHint, setShowHint] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { speak } = useAudio()
  const { playPop, playCorrect, playWrong } = useSoundEffects()

  const startGame = async () => {
    const allWords = await wordRepo.getAll()
    const validWords = allWords.filter(w => w.examples && w.examples.length > 0)
    
    if (validWords.length === 0) {
      alert("Chưa có từ vựng nào chứa câu ví dụ. Hãy thêm ví dụ cho từ vựng trước khi chơi!")
      return
    }

    const shuffled = [...validWords].sort(() => 0.5 - Math.random()).slice(0, 10)
    
    const qs: Question[] = shuffled.map(w => {
      const ex = w.examples![0]!
      // Try to find the exact word or its variations using a case-insensitive regex
      const regex = new RegExp(`\\b${w.word}\\b`, 'i')
      let parts = ['', w.word, '']
      
      const match = ex.sentence.match(regex)
      if (match && match.index !== undefined) {
        parts = [
          ex.sentence.substring(0, match.index),
          match[0],
          ex.sentence.substring(match.index + match[0].length)
        ]
      } else {
        // Fallback if strict word boundary fails
        const fallbackRegex = new RegExp(w.word, 'i')
        const fallbackMatch = ex.sentence.match(fallbackRegex)
        if (fallbackMatch && fallbackMatch.index !== undefined) {
          parts = [
            ex.sentence.substring(0, fallbackMatch.index),
            fallbackMatch[0],
            ex.sentence.substring(fallbackMatch.index + fallbackMatch[0].length)
          ]
        } else {
           // Extreme fallback, just append it
           parts = [ex.sentence + ' (', w.word, ')']
        }
      }

      return {
        word: w,
        sentenceParts: parts,
        missingWord: parts[1] || ''
      }
    })

    resetGame()
    setQuestions(qs)
    setStartTime(Date.now())
    setIsChecked(false)
    setShowHint(false)
    setGameState('playing')
  }

  useEffect(() => {
    if (gameState === 'playing' && !isChecked) {
      inputRef.current?.focus()
    }
  }, [currentIndex, gameState, isChecked])

  const checkAnswer = () => {
    if (!userInput.trim()) return
    const q = questions[currentIndex]
    if (!q) return
    const correct = userInput.toLowerCase().trim() === q.word.word.toLowerCase()
    
    setIsCorrect(correct)
    setIsChecked(true)
    
    setSessionResults(prev => [...prev, { wordId: q.word.id, isCorrect: correct }])

    if (correct) {
      playCorrect()
      // speak the full sentence by combining parts and the missing word
      speak(q.sentenceParts[0] + q.missingWord + q.sentenceParts[2])
    } else {
      playWrong()
    }
  }

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
      setUserInput('')
      setIsChecked(false)
      setShowHint(false)
    } else {
      const now = Date.now()
      sessionRepo.save({
        id: crypto.randomUUID(),
        mode: 'context',
        words: questions.map(q => q.word.id),
        results: sessionResults.map(r => ({
          wordId: r.wordId,
          isCorrect: r.isCorrect,
          responseTime: (now - startTime) / questions.length,
          wasCloseCall: false,
          mode: 'context',
          timestamp: now
        })),
        startedAt: startTime,
        completedAt: now,
        totalTime: now - startTime
      })
      
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      setGameState('completed')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent | KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.repeat) return
      e.preventDefault()
      e.stopPropagation()
      if (isChecked) nextQuestion()
      else checkAnswer()
    }
  }

  useEffect(() => {
    const handleGlobal = (e: KeyboardEvent) => {
      // Only handle global enter if input is disabled/not focused
      if (e.key === 'Enter' && isChecked && gameState === 'playing' && document.activeElement?.tagName !== 'INPUT') {
        if (e.repeat) return
        e.preventDefault()
        nextQuestion()
      }
    }
    window.addEventListener('keydown', handleGlobal)
    return () => window.removeEventListener('keydown', handleGlobal)
  }, [isChecked, gameState, nextQuestion])

  if (gameState === 'setup') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="p-8 text-center space-y-8">
          <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Điền từ vào ngữ cảnh (Context Game)</h3>
            <p className="text-gray-500">
              Học từ vựng qua câu ví dụ thực tế. Đọc câu và điền từ vựng còn thiếu vào ô trống.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700"
            onClick={startGame}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Bắt đầu chơi
          </Button>
        </Card>
      </div>
    )
  }

  if (gameState === 'completed') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="p-8 text-center space-y-8">
          <h3 className="text-2xl font-bold text-purple-600">Tuyệt vời!</h3>
          <p className="text-gray-600">Bạn đã hoàn thành bài tập điền từ.</p>
          <Button variant="primary" onClick={startGame}>Chơi lại</Button>
        </Card>
      </div>
    )
  }

  const q = questions[currentIndex]
  if (!q) return null

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8 px-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-purple-600">
          <BookOpen className="w-6 h-6" /> Điền Từ
        </h2>
        <span className="font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <Card className="p-8 md:p-12 shadow-lg border-2 border-purple-50 bg-white">
        <div className="text-2xl md:text-3xl font-serif text-gray-800 leading-relaxed text-center mb-8">
          {q.sentenceParts[0]}
          {isChecked ? (
            <span className={`inline-block px-3 py-1 rounded-lg mx-2 font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 line-through'}`}>
              {userInput}
            </span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mx-2 w-32 md:w-48 border-b-4 border-gray-300 focus:border-purple-500 outline-none text-center bg-gray-50 px-2 py-1 rounded-t-lg transition-colors font-bold text-purple-700"
              style={{ width: `${Math.max(4, userInput.length || q.word.word.length)}ch` }}
              readOnly={isChecked}
            />
          )}
          {q.sentenceParts[2]}
        </div>

        {isChecked && !isCorrect && (
          <div className="text-center mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-sm text-emerald-600 font-medium mb-1">Đáp án đúng:</p>
            <p className="text-xl font-bold text-emerald-700">{q.word.word}</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <p className="text-gray-500 italic text-lg text-center">
            {/* Find the vietnamese translation of the example if available */}
            {q.word.examples?.find(e => e.sentence === (q.sentenceParts.join('')) || e.sentence === (q.sentenceParts[0] + q.missingWord + q.sentenceParts[2]))?.vietnamese || q.word.definitions[0]?.vietnamese || q.word.synonyms[0]}
          </p>
          
          <div className="flex gap-4 w-full md:w-auto">
            {!isChecked ? (
              <>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowHint(true)} 
                  disabled={showHint}
                  icon={<Lightbulb className="w-4 h-4" />}
                  className="flex-1 md:flex-none"
                >
                  Gợi ý
                </Button>
                <Button 
                  variant="primary" 
                  onClick={checkAnswer} 
                  disabled={!userInput.trim()}
                  className="flex-1 md:flex-none min-w-[120px]"
                >
                  Kiểm tra
                </Button>
              </>
            ) : (
              <Button 
                variant="primary" 
                onClick={nextQuestion} 
                icon={<ArrowRight className="w-5 h-5" />}
                className="w-full md:w-auto min-w-[200px]"
              >
                Tiếp tục
              </Button>
            )}
          </div>

          {showHint && !isChecked && (
            <p className="text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-lg text-sm border border-amber-100">
              Gợi ý: Bắt đầu bằng chữ "{q.word.word.charAt(0).toUpperCase()}", kết thúc bằng "{q.word.word.charAt(q.word.word.length - 1).toUpperCase()}"
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
