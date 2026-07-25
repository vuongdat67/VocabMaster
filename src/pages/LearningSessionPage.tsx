import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, BookOpen, Check, X, RefreshCw, Volume2, Eye, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { wordRepo } from '@/db/word-repo'
import { useLearningSession } from '@/hooks/useLearningSession'
import type { WordPack, Word } from '@/types/word'
import { useAudio } from '@/hooks/useAudio'
import { FlashcardSession } from '@/features/flashcards/FlashcardSession'
import { AudioChallengeSession } from '@/features/audio-challenge/AudioChallengeSession'
import { TextChallengeSession } from '@/features/text-challenge/TextChallengeSession'
import { TypingChallengeSession } from '@/features/typing-challenge/TypingChallengeSession'
import { FillBlankSession } from '@/features/fill-blank/FillBlankSession'
import { MatchingSession } from '@/features/matching/MatchingSession'
import { SynonymMatchSession } from '@/features/synonym-match/SynonymMatchSession'
import { CelebrationEffect } from '@/components/effects/CelebrationEffect'
import { getLevelName } from '@/algorithms/session-engine'
import { playCorrectSound, playWrongSound, playClickSound } from '@/lib/audio-utils'

export function LearningSessionPage() {
  const navigate = useNavigate()
  const session = useLearningSession()
  const [packs, setPacks] = useState<WordPack[]>([])
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastResult, setLastResult] = useState<{ word: string; correct: boolean } | null>(null)
  const [resultVisible, setResultVisible] = useState(false)
  const [waitingContinue, setWaitingContinue] = useState(false)
  const [lastWord, setLastWord] = useState<string | null>(null)
  const { speak } = useAudio()

  useEffect(() => {
    wordRepo.getWordPacks().then(setPacks)
  }, [])

  const handleStart = useCallback(async () => {
    if (!selectedPack) return
    const words = await wordRepo.getWordsByPack(selectedPack)
    await session.startSession(words.map((w) => w.id))
  }, [selectedPack, session])

  const handleBeginLearning = useCallback(() => {
    setLastResult(null)
    setResultVisible(false)
    setWaitingContinue(false)
    session.beginLearning()
  }, [session])

  const handleAnswer = useCallback(
    (isCorrect: boolean, responseTime: number, wasCloseCall = false) => {
      const currentWord = session.currentWord
      if (!currentWord) return
      const mode = session.currentMode ?? 'flashcard'

      // Record answer only — don't advance
      session.recordAnswer({
        wordId: currentWord.id,
        isCorrect,
        responseTime,
        wasCloseCall,
        mode,
        timestamp: Date.now(),
      })

      // Update lastResult with word+mode info for the wheel
      session.updateLastResult({ wordId: currentWord.id, correct: isCorrect })

      // Play sound
      if (mode !== 'flashcard') {
        if (isCorrect) playCorrectSound()
        else playWrongSound()
      }

      setLastWord(currentWord.word)
      setWaitingContinue(true)

      if (isCorrect) {
        setShowCelebration(true)
        window.dispatchEvent(new CustomEvent('vocab:correct'))
        setTimeout(() => setShowCelebration(false), 1200)
      }
    },
    [session]
  )

  const handleContinue = useCallback(() => {
    setWaitingContinue(false)
    setResultVisible(false)
    playClickSound()
    session.nextWord()
    // Auto-persist if session just completed
    if (session.isSessionComplete) {
      session.endSession()
    }
  }, [session])

  const handleEndSession = useCallback(async () => {
    await session.endSession()
  }, [session])

  // ── Setup screen: choose pack ──
  if (!session.isSessionActive && !session.isSessionComplete) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <Card className="p-8">
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, var(--surface-card))' }}
            >
              <BookOpen className="w-8 h-8" style={{ color: 'var(--accent-500)' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Bắt đầu học</h2>
            <p className="text-gray-500 mt-2">Chọn chủ đề từ vựng để bắt đầu</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((pack) => (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(pack.id)}
                className="w-full p-5 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: selectedPack === pack.id ? 'var(--accent-500)' : 'var(--border-default)',
                  backgroundColor: selectedPack === pack.id
                    ? 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))'
                    : 'transparent',
                  boxShadow: selectedPack === pack.id
                    ? `0 0 0 2px color-mix(in srgb, var(--accent-500) 20%, transparent)`
                    : 'none',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate mr-2">{pack.name}</h3>
                  <Badge variant={pack.difficulty === 'beginner' ? 'success' : pack.difficulty === 'intermediate' ? 'warning' : 'danger'}>
                    {pack.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{pack.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{pack.wordCount} từ</span>
                  {selectedPack === pack.id && (
                    <span className="text-xs font-medium" style={{ color: 'var(--accent-500)' }}>Đã chọn</span>
                  )}
                </div>
              </button>
            ))}
            {packs.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400">
                <p>Chưa có gói từ vựng nào.</p>
                <p className="text-sm mt-1">Vào trang Import để thêm từ vựng.</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button onClick={handleStart} disabled={!selectedPack} className="w-full" size="lg" icon={<Play className="w-4 h-4" />}>
              Bắt đầu học
            </Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  // ── Phase LIST: show all words before learning ──
  if (session.phase === 'list' && session.phaseListWords.length > 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Danh sách từ vựng</h2>
          <p className="text-gray-500 mt-1">{session.phaseListWords.length} từ — hãy xem qua trước khi bắt đầu</p>
        </div>

        {/* Word grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {session.phaseListWords.map((w) => (
            <Card key={w.id} className="p-3 text-center" compact>
              <p className="text-sm font-semibold text-gray-900 truncate">{w.word}</p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                {w.definitions[0]?.vietnamese ?? ''}
              </p>
              {w.imageUrls[0] && (
                <img src={w.imageUrls[0]} alt="" className="w-full h-16 object-cover rounded-lg mt-2" />
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-center pt-2 pb-8">
          <Button size="lg" onClick={handleBeginLearning} icon={<Play className="w-5 h-5" />}>
            Bắt đầu học ngay
          </Button>
        </div>
      </motion.div>
    )
  }

  // ── Session complete ──
  if (session.isSessionComplete) {
    const correct = session.sessionResults.filter((r) => r.isCorrect).length
    const total = session.sessionResults.length

    const wordResultMap = new Map<string, { word: Word; correct: boolean }>()
    for (const result of session.sessionResults) {
      const w = session.studiedWords[result.wordId]
      if (w) wordResultMap.set(result.wordId, { word: w, correct: result.isCorrect })
    }
    const wordResults = Array.from(wordResultMap.values())

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto space-y-6">
        <CelebrationEffect active={correct === total} />
        <div className="text-center space-y-3">
          <div className="text-6xl">{correct === total ? '🎉' : correct > total / 2 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold text-gray-900">Hoàn thành!</h2>
          <p className="text-gray-500">
            Bạn đã đúng <strong style={{ color: 'var(--accent-600)' }}>{correct}</strong>/{total} từ
          </p>
          {correct === total && (
            <p className="text-sm font-medium" style={{ color: 'var(--accent-500)' }}>Perfect! Tất cả đều đúng 🏆</p>
          )}
          <div className="max-w-md mx-auto w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--accent-500)' }}
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (correct / total) * 100 : 0}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
        </div>

        {wordResults.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-500)' }} />
              Chi tiết từ vựng
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {wordResults.map(({ word, correct: isCorrect }) => (
                <div key={word.id} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                  <div className="flex items-start gap-3">
                    {word.imageUrls[0] && (
                      <img src={word.imageUrls[0]} alt={word.word} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 truncate">{word.word}</span>
                        {isCorrect ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      </div>
                      {word.definitions[0] && <p className="text-xs text-gray-500 mt-0.5 truncate">{word.definitions[0].vietnamese}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3 justify-center pb-8">
          <Button variant="secondary" onClick={() => navigate('/')}>Về Dashboard</Button>
          <Button onClick={() => session.resetSession()}>Học tiếp</Button>
        </div>
      </motion.div>
    )
  }

  // ── Active session ──
  const currentWord = session.currentWord
  const mode = session.currentMode
  const level = session.currentLevel

  if (!currentWord || !mode || !level) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 flex items-center gap-1">
              {session.currentWordIndex + 1} / {Math.max(1, (session.engine?.learningWords.length ?? 0) + (session.engine?.newWords.length ?? 0))}
              {session.engine && session.lastResult && (
                <span className="ml-2 text-xs text-gray-400">
                  (đã qua {session.engine.learningWords.filter(lw => lw.totalResponses > 0).length + session.engine.reviewWords.length} từ)
                </span>
              )}
            </span>
            <span className="font-medium capitalize flex items-center gap-1.5" style={{ color: 'var(--accent-600)' }}>
              <Eye className="w-3.5 h-3.5" />
              {getLevelName(level)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--accent-500)' }}
              initial={{ width: 0 }}
              animate={{ width: `${((session.currentWordIndex) / Math.max(1, (session.engine?.learningWords.length ?? 0) + (session.engine?.newWords.length ?? 0))) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleEndSession}>Kết thúc</Button>
      </div>


      {/* Mode rendering */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentWord.id}-${mode}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {mode === 'flashcard' && (
            <FlashcardSession word={currentWord} onComplete={(correct, time) => handleAnswer(correct, time)} />
          )}
          {mode === 'audio_challenge' && (
            <AudioChallengeSession word={currentWord} onComplete={(correct, time) => handleAnswer(correct, time)} />
          )}
          {mode === 'text_challenge' && (
            <TextChallengeSession word={currentWord} onComplete={(correct, time, wasClose) => handleAnswer(correct, time, wasClose)} />
          )}
          {mode === 'typing_challenge' && (
            <TypingChallengeSession word={currentWord} onComplete={(correct, time) => handleAnswer(correct, time)} />
          )}
          {mode === 'fill_blank' && (
            <FillBlankSession word={currentWord} onComplete={(correct, time) => handleAnswer(correct, time)} />
          )}
          {mode === 'matching' && (
            <MatchingSession word={currentWord} onComplete={(correct, time) => handleAnswer(correct, time)} />
          )}
          {mode === 'synonym_match' && (
            <SynonymMatchSession word={currentWord} onComplete={(correct, time) => handleAnswer(correct, time)} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tiếp tục button */}
      <AnimatePresence>
        {waitingContinue && mode !== 'flashcard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-center pt-2"
          >
            <Button
              size="lg"
              onClick={handleContinue}
              icon={<ArrowRight className="w-5 h-5" />}
              className="min-w-[200px]"
            >
              Tiếp tục
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcard auto-advance (no continue needed for self-assessment) */}
      {waitingContinue && mode === 'flashcard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-2"
        >
          <Button
            size="lg"
            onClick={handleContinue}
            icon={<ArrowRight className="w-5 h-5" />}
            className="min-w-[200px]"
          >
            Tiếp tục
          </Button>
        </motion.div>
      )}
    </div>
  )
}
