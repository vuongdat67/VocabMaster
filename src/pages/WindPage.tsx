import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, Volume2, RefreshCw, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { wordRepo } from '@/db/word-repo'
import { playWindChime, playCelebrationBells } from '@/lib/sound-manager'
import { useAudio } from '@/hooks/useAudio'
import { useSettingsStore } from '@/stores/settings-store'
import { useNavigate } from 'react-router-dom'
import type { Word } from '@/types/word'

interface WordBubble {
 id: number
 word: Word
 x: number
 y: number
 size: number
 speed: number
 phase: number       // animation phase offset
 driftX: number     // unique horizontal drift
 driftY: number     // unique vertical drift
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#7c3aed']

function generateBubbles(words: Word[]): WordBubble[] {
  const count = Math.min(words.length, 24)
  const cols = Math.ceil(Math.sqrt(count * 1.5))
  const rows = Math.ceil(count / cols)
  const cellW = 80 / cols
  const cellH = 58 / rows  // only use top 58% of container

  return words.slice(0, count).map((w, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return {
      id: i,
      word: w,
      x: 8 + col * cellW + Math.random() * cellW * 0.6,
      y: 4 + row * cellH + Math.random() * cellH * 0.5,
      size: 11 + Math.random() * 12,
      speed: 5 + Math.random() * 12,
      phase: Math.random() * Math.PI * 2,
      driftX: -3 + Math.random() * 6,
      driftY: -4 + Math.random() * 8,
    }
  })
}

export function WindPage() {
  const [words, setWords] = useState<WordBubble[]>([])
  const [activeWord, setActiveWord] = useState<WordBubble | null>(null)
  const [showMeaning, setShowMeaning] = useState(false)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const { settings } = useSettingsStore()
  const { speak } = useAudio()
  const navigate = useNavigate()

  const loadWords = useCallback(async () => {
    setLoading(true)
    const all = await wordRepo.getAll()
    const selected = all.sort(() => Math.random() - 0.5)
    setWords(generateBubbles(selected))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadWords()
  }, [loadWords])

  // Gentle breeze effect — organic floating
  useEffect(() => {
    if (!enabled || words.length === 0) return

    const interval = setInterval(() => {
      if (Math.random() > 0.35) return
      setWords((prev) =>
        prev.map((b) => ({
          ...b,
          x: Math.max(2, Math.min(96, b.x + (Math.random() - 0.5) * b.driftX * 0.3)),
          y: Math.max(2, Math.min(65, b.y + (Math.random() - 0.5) * b.driftY * 0.2)),
        }))
      )
      if (Math.random() > 0.6 && settings.sfxEnabled) {
        playWindChime(0.1 + Math.random() * 0.2)
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [enabled, words.length, settings.sfxEnabled])

  const handleBubbleClick = useCallback(
    (bubble: WordBubble) => {
      if (activeWord?.id === bubble.id && showMeaning) {
        setActiveWord(null)
        setShowMeaning(false)
        return
      }

      setActiveWord(bubble)
      setShowMeaning(false)

      if (settings.sfxEnabled) {
        const intensity = 0.3 + (bubble.x / 100) * 0.4
        playWindChime(intensity)
      }

      speak(bubble.word.word)

      setTimeout(() => {
        setShowMeaning(true)
        if (settings.sfxEnabled) playCelebrationBells()
      }, 600)
    },
    [activeWord, showMeaning, settings.sfxEnabled, speak]
  )

  const handleRefresh = () => {
    setActiveWord(null)
    setShowMeaning(false)
    loadWords()
    if (settings.soundEnabled) playWindChime(0.5)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-7rem)]" style={{ background: 'var(--surface-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wind className="w-6 h-6" style={{ color: 'var(--accent-500)' }} />
              Vườn Từ
            </h2>
            <p className="text-sm text-gray-500">
              Chạm vào bong bóng để nghe phát âm và xem nghĩa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={enabled ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setEnabled(!enabled)
              if (!enabled && settings.sfxEnabled) playWindChime(0.4)
            }}
          >
            {enabled ? '🎐 Bật' : '🔇 Tắt'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} icon={<RefreshCw className="w-4 h-4" />}>
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6 text-sm">
        <Badge variant="info">{words.length} từ</Badge>
        <Badge variant={enabled ? 'success' : 'default'}>
          {enabled ? '🎵 Âm thanh bật' : '🔇 Âm thanh tắt'}
        </Badge>
      </div>

      {/* Word cloud area */}
      <div className="relative min-h-[65vh] overflow-hidden rounded-2xl"
        style={{ border: '1px solid var(--border-default)' }}
      >
        {/* Wind streak lines */}
        {enabled && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`wind-${i}`}
                className="absolute h-px"
                style={{
                  top: `${5 + i * 18}%`,
                  left: '-10%',
                  width: '120%',
                  background: `linear-gradient(90deg, transparent, ${
                    i % 2 === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(56,189,248,0.15)'
                  }, transparent)`,
                }}
                animate={{
                  x: ['-20%', '120%'],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 6 + i * 2,
                  repeat: Infinity,
                  delay: i * 1.5,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}

        {/* Bubbles */}
        <div className="relative w-full min-h-[65vh] z-0">
          {words.map((bubble) => {
            const isActive = activeWord?.id === bubble.id
            const isHovered = hoveredId === bubble.id
            const color = COLORS[bubble.id % COLORS.length] ?? '#6366f1'

            return (
              <motion.button
                key={bubble.id}
                className="absolute rounded-full flex items-center justify-center cursor-pointer select-none"
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: `${bubble.size * 3}px`,
                  height: `${bubble.size * 3}px`,
                  background:
                    !enabled
                      ? `radial-gradient(circle, ${color}08, ${color}04)`
                      : isActive
                        ? `radial-gradient(circle, ${color}40, ${color}20)`
                        : `radial-gradient(circle, ${color}15, ${color}06)`,
                  border: isActive
                    ? `2px solid ${color}60`
                    : isHovered
                      ? `1.5px solid ${color}40`
                      : `1px solid ${color}15`,
                  zIndex: isActive ? 5 : 1,
                }}
                animate={
                  enabled && !isActive
                    ? {
                        y: [
                          0,
                          -8 - bubble.phase,
                          4 + bubble.phase * 0.3,
                          -3 - bubble.phase * 0.2,
                          0,
                        ],
                        x: [
                          0,
                          3 + bubble.phase * 0.2,
                          -2 - bubble.phase * 0.15,
                          1 + bubble.phase * 0.1,
                          0,
                        ],
                        scale: isHovered
                          ? [1, 1.15, 1.08, 1.12, 1]
                          : [1, 1.03, 0.97, 1.02, 1],
                      }
                    : isActive
                      ? { y: 0, x: 0, scale: [1, 1.12, 1] }
                      : {}
                }
                transition={
                  enabled && !isActive
                    ? {
                        y: {
                          duration: bubble.speed,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: bubble.phase * 0.3,
                        },
                        x: {
                          duration: bubble.speed * 0.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: bubble.phase * 0.2,
                        },
                        scale: {
                          duration: 3 + bubble.phase * 0.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }
                    : isActive
                      ? { duration: 0.5 }
                      : {}
                }
                onMouseEnter={() => setHoveredId(bubble.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleBubbleClick(bubble)}
              >
                <span
                  className="text-xs font-semibold whitespace-nowrap px-1.5 select-none"
                  style={{
                    color: isActive ? `${color}` : `${color}cc`,
                    fontSize: '0.85rem',
                  }}
                >
                  {isActive && showMeaning
                    ? bubble.word.definitions[0]?.vietnamese ?? bubble.word.word
                    : bubble.word.word}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Active word detail popup — anchored at bottom, above bubbles */}
        <AnimatePresence>
          {activeWord && showMeaning && (
            <motion.div
              key="word-popup"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 z-50 backdrop-blur-xl rounded-2xl p-5"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--surface-card) 90%, transparent)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {activeWord.word.word}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        speak(activeWord.word.word)
                      }}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ color: 'var(--accent-500)' }}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{activeWord.word.ipa}</p>
                  <div className="mt-2 space-y-1">
                    {activeWord.word.definitions.slice(0, 2).map((def, i) => (
                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{def.vietnamese}</span>
                        {def.meaning && (
                          <span className="text-gray-500 ml-1">({def.meaning})</span>
                        )}
                      </p>
                    ))}
                  </div>
                  {activeWord.word.examples[0] && (
                    <p className="text-xs text-gray-500 italic mt-2">
                      &ldquo;{activeWord.word.examples[0].sentence}&rdquo;
                    </p>
                  )}
                </div>
                <Badge variant="info" className="shrink-0 ml-2">
                  {activeWord.word.partOfSpeech}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3">
                {activeWord.word.synonyms.slice(0, 3).map((syn) => (
                  <span
                    key={syn}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {words.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Wind className="w-16 h-16 mb-3 opacity-30" />
            <p>Tải từ vựng thất bại</p>
            <Button variant="ghost" size="sm" onClick={loadWords} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}
      </div>

      {/* Instruction */}
      {words.length > 0 && (
        <div className="mt-4 text-center text-xs text-gray-500">
          🎯 Click vào bong bóng → nghe phát âm → xem nghĩa tiếng Việt
          <br />
          🌬️ Di chuột qua để thấy hiệu ứng phồng lên
        </div>
      )}
    </div>
  )
}
