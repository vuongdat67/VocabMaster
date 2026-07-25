import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, BookOpen, ArrowLeft, Check, X, Volume2, Clock, AlertTriangle, BarChart3, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { progressRepo } from '@/db/progress-repo'
import { wordRepo } from '@/db/word-repo'
import { useAudio } from '@/hooks/useAudio'
import type { Word } from '@/types/word'
import type { SRSData } from '@/types/learning'

interface DueEntry extends SRSData {
  word?: Word
}

function formatDate(ts: number): string {
  if (!ts) return '--'
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatInterval(days: number): string {
  if (days < 1) return '< 1 ngày'
  if (days === 1) return '1 ngày'
  if (days < 30) return `${days} ngày`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 tháng' : `${months} tháng`
}

function formatAccuracy(correct: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((correct / total) * 100)}%`
}

/* ------------------------------------------------------------------ */
/* Inline flip card — no import from FlashcardSession */
/* ------------------------------------------------------------------ */
function FlipCard({
  word,
  onComplete,
}: {
  word: Word
  onComplete: (correct: boolean, responseTime: number) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)
  const startTime = useRef(Date.now())
  const { speak } = useAudio()

  useEffect(() => {
    startTime.current = Date.now()
    setFlipped(false)
    setAnswered(false)
    const timer = setTimeout(() => speak(word.word), 300)
    return () => clearTimeout(timer)
  }, [word.word, speak])

  const handleAnswer = (correct: boolean) => {
    if (answered) return
    setAnswered(true)
    const time = Date.now() - startTime.current
    setTimeout(() => onComplete(correct, time), 400)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div
        className="relative cursor-pointer"
        onClick={() => !flipped && setFlipped(true)}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="relative w-full min-h-[320px]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ── Front: English word ── */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden' as const }}
          >
            <Card className="p-8 flex flex-col items-center justify-center min-h-[320px]"
              style={{ borderColor: 'color-mix(in srgb, var(--accent-500) 40%, transparent)' }}
            >
              {word.imageUrls[0] && (
                <img
                  src={word.imageUrls[0]}
                  alt={word.word}
                  className="w-32 h-32 object-cover rounded-xl mb-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {word.word}
              </h2>
              {word.ipa && (
                <p className="text-gray-400 text-lg">{word.ipa}</p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  speak(word.word)
                }}
                className="mt-4 p-2 rounded-full hover:bg-gray-100"
                style={{ color: 'var(--accent-500)' }}
              >
                <Volume2 className="w-6 h-6" />
              </button>
              <p className="text-sm text-gray-400 mt-4">Chạm để lật thẻ</p>
            </Card>
          </div>

          {/* ── Back: definition + examples ── */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden' as const,
              transform: 'rotateY(180deg)',
            }}
          >
            <Card className="p-8 flex flex-col items-center justify-center min-h-[320px]"
              style={{ borderColor: 'color-mix(in srgb, var(--accent-500) 40%, transparent)' }}
            >
              <div className="text-center mb-6">
                {word.definitions.map((def, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-xl text-gray-900 font-medium">
                      {def.vietnamese}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {def.meaning}
                    </p>
                  </div>
                ))}
                {word.examples[0] && (
                  <div className="mt-4 p-3 rounded-lg"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))' }}
                  >
                    <p className="text-sm text-gray-700 italic">
                      &ldquo;{word.examples[0].sentence}&rdquo;
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {word.examples[0].vietnamese}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* ── Answer buttons ── */}
      {flipped && !answered && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-center mt-6"
        >
          <Button
            variant="danger"
            size="lg"
            icon={<X className="w-5 h-5" />}
            onClick={() => handleAnswer(false)}
          >
            Chưa nhớ
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon={<Check className="w-5 h-5" />}
            onClick={() => handleAnswer(true)}
          >
            Đã nhớ
          </Button>
        </motion.div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stats-comparison component shown at end of review */
/* ------------------------------------------------------------------ */
function StatsComparison({
  sessionCorrect,
  sessionTotal,
}: {
  sessionCorrect: number
  sessionTotal: number
}) {
  const [stats, setStats] = useState<{
    averageAccuracy: number
    totalStudied: number
  } | null>(null)

  useEffect(() => {
    progressRepo.getStats().then(setStats)
  }, [])

  const sessionAccuracy = sessionTotal > 0 ? (sessionCorrect / sessionTotal) * 100 : 0
  const overallAccuracy = stats?.averageAccuracy ?? 0
  const diff = sessionAccuracy - overallAccuracy

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center"
          style={{ borderColor: 'color-mix(in srgb, var(--accent-500) 40%, transparent)' }}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Buổi này
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent-600)' }}>
            {formatAccuracy(sessionCorrect, sessionTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {sessionCorrect}/{sessionTotal} đúng
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Trung bình
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent-600)' }}>
            {formatAccuracy(stats?.totalStudied ? Math.round(overallAccuracy) : 0, 100)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.totalStudied ?? 0} từ đã học
          </p>
        </Card>
      </div>

      {stats && stats.totalStudied > 0 && (
        <Card
          className="p-4 text-center"
          style={{
            borderColor: diff >= 0
              ? 'color-mix(in srgb, #22c55e 40%, transparent)'
              : 'color-mix(in srgb, #ef4444 40%, transparent)',
          }}
        >
          <p className="text-sm text-gray-500 mb-1">
            So với trung bình
          </p>
          <p
            className={`text-xl font-bold ${
              diff >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {diff >= 0 ? '+' : ''}
            {diff.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {diff >= 0
              ? 'Bạn đang làm tốt hơn thường lệ!'
              : 'Hãy cố gắng hơn ở lần sau nhé!'}
          </p>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main ReviewPage */
/* ------------------------------------------------------------------ */
export function ReviewPage() {
  const [dueWords, setDueWords] = useState<DueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [reviewActive, setReviewActive] = useState(false)
  const [sessionResults, setSessionResults] = useState<
    { wordId: string; isCorrect: boolean; responseTime: number }[]
  >([])
  const [reviewComplete, setReviewComplete] = useState(false)
  const { speak } = useAudio()

  // Load due words on mount
  useEffect(() => {
    async function load() {
      try {
        const due = await progressRepo.getDueWords(30)
        const wordIds = due.map((d) => d.wordId)
        const words = await wordRepo.getByIds(wordIds)
        const wordMap = new Map(words.map((w) => [w.id, w]))
        const combined = due
          .map((d) => ({ ...d, word: wordMap.get(d.wordId) }))
          .filter((d) => d.word)
        setDueWords(combined)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* Start review */
  const handleStartReview = () => {
    setFlashcardIndex(0)
    setSessionResults([])
    setReviewActive(true)
    setReviewComplete(false)
  }

  /* Handle each card answer */
  const handleCardComplete = (correct: boolean, responseTime: number) => {
    const entry = dueWords[flashcardIndex]
    if (!entry?.word) return

    const result = {
      wordId: entry.word.id,
      isCorrect: correct,
      responseTime,
    }
    const newResults = [...sessionResults, result]
    setSessionResults(newResults)

    const nextIndex = flashcardIndex + 1
    if (nextIndex >= dueWords.length) {
      // Persist all results before showing completion
      persistReviewResults(newResults)
      setReviewComplete(true)
      setReviewActive(false)
    } else {
      setFlashcardIndex(nextIndex)
    }
  }

  const persistReviewResults = async (results: { wordId: string; isCorrect: boolean; responseTime: number }[]) => {
    const { calculateNextReview, createInitialSRSData } = await import('@/algorithms/srs')
    const { progressRepo, sessionRepo } = await import('@/db')

    for (const result of results) {
      const existing = await progressRepo.getSRS(result.wordId)
      const srsData = existing ?? createInitialSRSData(result.wordId)
      const updates = calculateNextReview(srsData, {
        isCorrect: result.isCorrect,
        responseTime: result.responseTime,
        wasCloseCall: false,
      })
      const updatedSRS = {
        ...srsData,
        ...updates,
        studiedInSessions: srsData.studiedInSessions + 1,
        lastStudiedAt: Date.now(),
        updatedAt: Date.now(),
      }
      await progressRepo.upsertSRS(updatedSRS)
    }
  }

  const handleFinishEarly = () => {
    setReviewComplete(true)
    setReviewActive(false)
  }

  const handleReset = () => {
    setReviewActive(false)
    setReviewComplete(false)
    setSessionResults([])
    setFlashcardIndex(0)
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  /* ── Active review (inline flip cards) ── */
  if (reviewActive) {
    const entry = dueWords[flashcardIndex]
    if (!entry?.word) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleFinishEarly}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Kết thúc sớm
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--accent-600)' }}>
            Ôn tập: {flashcardIndex + 1}/{dueWords.length}
          </span>
          <div className="w-20" /> {/* spacer */}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--accent-500)' }}
            initial={{ width: 0 }}
            animate={{
              width: `${((flashcardIndex) / dueWords.length) * 100}%`,
            }}
          />
        </div>

        {/* Flip card */}
        <FlipCard word={entry.word} onComplete={handleCardComplete} />
      </motion.div>
    )
  }

  /* ── Review complete ── */
  if (reviewComplete) {
    const correct = sessionResults.filter((r) => r.isCorrect).length
    const total = sessionResults.length

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center space-y-6"
      >
        <div className="text-6xl">
          {correct === total ? '🌟' : correct >= total / 2 ? '👍' : '💪'}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Ôn tập hoàn tất!
        </h2>
        <p className="text-gray-500">
          Bạn đã ôn {total} từ — đúng {formatAccuracy(correct, total)}
        </p>

        {/* Accuracy comparison vs overall stats */}
        <StatsComparison sessionCorrect={correct} sessionTotal={total} />

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="secondary" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
            Quay lại danh sách
          </Button>
        </div>
      </motion.div>
    )
  }

  /* ── Due-word list ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, var(--surface-card))' }}
        >
          <Clock className="w-5 h-5" style={{ color: 'var(--accent-500)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ôn tập</h2>
          <p className="text-sm text-gray-500">
            {dueWords.length > 0
              ? `${dueWords.length} từ cần ôn hôm nay`
              : 'Không có từ cần ôn'}
          </p>
        </div>
      </div>

      {/* ── Explanation text ── */}
      <Card className="p-4"
        style={{ borderLeft: '4px solid var(--accent-500)',
          backgroundColor: 'color-mix(in srgb, var(--accent-500) 8%, var(--surface-card))'
        }}
      >
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent-500)' }} />
          <div>
            <p className="text-sm font-medium"
              style={{ color: 'var(--accent-700)' }}
            >
              Ôn tập giúp bạn ghi nhớ từ lâu hơn. Các từ sau cần ôn lại hôm nay.
            </p>
            <p className="text-xs mt-1"
              style={{ color: 'color-mix(in srgb, var(--accent-500) 80%, transparent)' }}
            >
              Lượt ôn tập dựa trên lịch trình SRS — hãy cố gắng ôn đều đặn mỗi ngày để đạt hiệu quả tốt nhất.
            </p>
          </div>
        </div>
      </Card>

      {dueWords.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-1">
            Không có từ cần ôn
          </h3>
          <p className="text-sm text-gray-400">
            Học thêm từ mới để có từ cần ôn tập nhé!
          </p>
        </Card>
      ) : (
        <>
          {/* ── Start-review button ── */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleStartReview}
              icon={<Play className="w-5 h-5" />}
              className="text-white px-8"
              style={{ backgroundColor: 'var(--accent-500)' }}
            >
              Bắt đầu ôn tập ({dueWords.length} từ)
            </Button>
          </div>

          {/* ── Due-word grid ── */}
          <div className="grid gap-3 sm:grid-cols-2">
            {dueWords.map((entry) => (
              <motion.div
                key={entry.wordId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow"
                  style={{ borderLeft: '4px solid var(--accent-300)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: word info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-base font-semibold text-gray-900 cursor-pointer hover:text-accent transition-colors"
                          onClick={() => speak(entry.word?.word ?? '')}
                        >
                          {entry.word?.word}
                        </span>
                        {entry.timesWrong > 2 && (
                          <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />
                            Khó
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {entry.word?.definitions[0]?.vietnamese}
                      </p>
                      {entry.word?.partOfSpeech && (
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {entry.word.partOfSpeech}
                        </span>
                      )}
                    </div>

                    {/* Right: SRS stats */}
                    <div className="shrink-0 text-right space-y-1">
                      <div className="flex items-center gap-1.5 justify-end">
                        <X className="w-3 h-3 text-red-400" />
                        <span className="text-xs font-medium text-gray-700">
                          {entry.timesWrong} lần
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDate(entry.lastStudiedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <BarChart3 className="w-3 h-3" style={{ color: 'var(--accent-500)' }} />
                        <span className="text-xs text-gray-400">
                          {formatInterval(entry.interval)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
