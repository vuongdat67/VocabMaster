import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  TrendingUp,
  Zap,
  Clock,
  Brain,
  Image,
  Upload,
  Sparkles,
  Flame,
  Star,
  ChevronRight,
  GraduationCap,
  BarChart3,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap'
import { db, progressRepo } from '@/db'
import { useAchievementStore } from '@/stores/achievement-store'
import { useAvatarStore, fileToBase64 } from '@/stores/avatar-store'
import { checkStreak } from '@/algorithms/review-scheduler'
import { wordRepo } from '@/db/word-repo'
import type { Word, WordPack } from '@/types/word'

/* ─── Types ───────────────────────────────────────── */

interface DashboardData {
  totalWordsLearned: number
  totalWords: number
  totalCorrect: number
  totalWrong: number
  accuracy: number
  streak: number
  sessionsCompleted: number
  dueCount: number
  mastered: number
  learning: number
  newWords: number
  totalStudyTime: number
}

interface DayActivity {
  label: string
  date: string
  active: boolean
}

/* ─── Week label helpers ──────────────────────────── */

const WEEK_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function getCurrentWeekDays(): DayActivity[] {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)

  return WEEK_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    return { label, date: dateStr, active: false }
  })
}

/* ─── Component ───────────────────────────────────── */

export function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [featuredWords, setFeaturedWords] = useState<Word[]>([])
  const [wordPacks, setWordPacks] = useState<WordPack[]>([])
  const [weekActivity, setWeekActivity] = useState<DayActivity[]>(getCurrentWeekDays())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const srsAll = await db.srsData.toArray()
        const totalWords = await db.words.count()
        const totalCorrect = srsAll.reduce((s, d) => s + d.timesCorrect, 0)
        const totalWrong = srsAll.reduce((s, d) => s + d.timesWrong, 0)
        const totalSessions = await db.sessions.count()
        const totalTime = (await db.sessions.toArray()).reduce(
          (s, sess) => s + (sess.totalTime || 0),
          0,
        )
        const due = await progressRepo.getDueCount()
        const streakData = await checkStreak()
        const masteryData = await progressRepo.getWordsByMastery()

        const dashboardStats = {
          totalWordsLearned: srsAll.length,
          totalWords,
          totalCorrect,
          totalWrong,
          accuracy:
            totalCorrect + totalWrong > 0
              ? (totalCorrect / (totalCorrect + totalWrong)) * 100
              : 0,
          streak: streakData.current,
          sessionsCompleted: totalSessions,
          dueCount: due,
          mastered: masteryData.mastered,
          learning: masteryData.learning,
          newWords: masteryData.new,
          totalStudyTime: totalTime,
        }
        
        setData(dashboardStats)
        
        // Cập nhật achievements
        useAchievementStore.getState().checkAchievements(dashboardStats)

        // Build weekly activity from session data
        const sessions = await db.sessions.toArray()
        const activeDays = new Set<string>()
        sessions.forEach((s) => {
          const d = new Date(s.startedAt).toISOString().slice(0, 10)
          activeDays.add(d)
        })
        setWeekActivity((prev) =>
          prev.map((day) => ({ ...day, active: activeDays.has(day.date) })),
        )

        // Load featured words with images
        const allWords = await wordRepo.getAll()
        const withImages = allWords.filter((w) => w.imageUrls[0])
        setFeaturedWords(shuffleArray(withImages).slice(0, 12))

        // Load word packs
        const packs = await wordRepo.getWordPacks()
        setWordPacks(packs)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{
            borderColor: 'var(--accent-500)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    )
  }

  return (
    <div className="pb-8 space-y-5">
      {/* ─── HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Xin chào!
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {data && data.streak > 0
              ? `Đã học ${data.streak} ngày liên tiếp!`
              : 'Chào mừng trở lại! Bắt đầu học ngay!'}
          </p>
        </div>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 active:translate-y-0"
          style={{ backgroundColor: 'var(--accent-600)' }}
        >
          <Zap className="w-4 h-4" />
          Học ngay
        </Link>
      </div>

      {/* ─── MASCOT + STREAK CALENDAR ROW WITH IMAGE BG ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Mascot area — clickable avatar picker */}
        <MascotCard sessionsCompleted={data?.sessionsCompleted ?? 0} />

        {/* Streak Calendar */}
        <div className="md:col-span-4">
          <Card className="h-full">
            <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Tuần này
                </span>
                <Badge variant="warning" className="ml-auto">
                  🔥 {data?.streak ?? 0} ngày
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-1">
                {weekActivity.map((day) => (
                  <div key={day.date} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-400">
                      {day.label}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: day.active
                          ? 'var(--accent-500)'
                          : '#f3f4f6',
                        boxShadow: day.active
                          ? `0 0 0 3px color-mix(in srgb, var(--accent-500) 30%, transparent)`
                          : 'none',
                      }}
                    >
                      {day.active ? (
                        <Star className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
          </Card>
        </div>

        {/* Progress card */}
        <div className="md:col-span-5">
          <Card className="h-full">
            <div className="flex items-center gap-4 p-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 12%, transparent)' }}
              >
                <Brain className="w-6 h-6" style={{ color: 'var(--accent-500)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700">Trình độ</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">
                  Thành thạo:{' '}
                  <strong style={{ color: 'var(--accent-600)' }}>
                    {data?.mastered ?? 0}
                  </strong>
                </span>
                <span className="text-xs text-gray-500">
                  Đang học:{' '}
                  <strong className="text-amber-600">{data?.learning ?? 0}</strong>
                </span>
              </div>
              <ProgressBar
                value={data?.mastered ?? 0}
                max={Math.max(1, data?.totalWords ?? 1)}
                height={5}
                color="custom"
                barColor="var(--accent-500)"
                className="mt-2"
              />
            </div>
          </div>
          </Card>
        </div>
      </div>

      {/* ─── STAT CARDS ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<BookOpen className="w-4 h-4" />}
          label="Đã học"
          value={data?.totalWordsLearned ?? 0}
          sub={`/ ${data?.totalWords ?? 0} từ`}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Độ chính xác"
          value={`${(data?.accuracy ?? 0).toFixed(0)}%`}
          sub={`${(data?.totalCorrect ?? 0) + (data?.totalWrong ?? 0)} lượt`}
          accent
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Cần ôn tập"
          value={data?.dueCount ?? 0}
          sub={data && data.dueCount > 0 ? 'Cần học ngay!' : 'Tốt!'}
          link={data && data.dueCount > 0 ? '/review' : undefined}
          variant="warning"
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Streak"
          value={`${data?.streak ?? 0}`}
          sub={data && data.streak > 0 ? 'ngày liên tiếp' : 'Học hôm nay'}
          variant="success"
        />
      </div>

      <StreakHeatmap />

      {/* ─── QUICK ACCESS ROW ───────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Truy cập nhanh
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionCard
            icon={<GraduationCap className="w-5 h-5" />}
            label="Luyện tập"
            desc="Ôn tập từ đã học"
            to="/learn"
          />
          <QuickActionCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Thống kê"
            desc="Xem tiến độ học tập"
            to="/stats"
          />
          <QuickActionCard
            icon={<Sparkles className="w-5 h-5" />}
            label="Trò chơi"
            desc="Học qua game"
            to="/games/matching"
          />
          <QuickActionCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Danh sách từ"
            desc="Tìm kiếm từ vựng"
            to="/words"
          />
        </div>
      </div>

      {/* ─── WORD IMAGE GALLERY ─────────────────────── */}
      {featuredWords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Image className="w-4 h-4" style={{ color: 'var(--accent-500)' }} />
              Thư viện từ vựng
            </h3>
            <Link
              to="/words"
              className="text-xs font-medium inline-flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ color: 'var(--accent-500)' }}
            >
              Xem tất cả
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {featuredWords.map((w) => (
              <Link
                key={w.id}
                to={`/words/${w.id}`}
                className="block group shrink-0"
              >
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 transition-all duration-300 ring-1 ring-gray-200 group-hover:ring-2 group-hover:shadow-[var(--shadow-card)]"
                  style={{ '--tw-ring-color': 'var(--accent-300)' } as React.CSSProperties}
                >
                  {w.imageUrls[0] && w.imageUrls[0].includes('/') ? (
                    <img
                      src={w.imageUrls[0]}
                      alt={w.word}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-lg font-bold"
                      style={{ color: 'var(--accent-500)' }}
                    >
                      {w.word.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 text-center truncate max-w-20">
                  {w.word}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── WORD PACKS ─────────────────────────────── */}
      {wordPacks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-500)' }} />
              Bộ từ vựng
            </h3>
            <Link
              to="/words"
              className="text-xs font-medium inline-flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ color: 'var(--accent-500)' }}
            >
              Tất cả bộ từ
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wordPacks.map((pack, idx) => (
              <WordPackCard key={pack.id} pack={pack} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════ */

/* ─── StatCard ──────────────────────────────────────── */
const VARIANT_META = {
  default: { bg: 'var(--accent-600)', light: 'color-mix(in srgb, var(--accent-500) 10%, var(--surface-card))', text: 'var(--accent-600)' },
  accent: { bg: 'var(--accent-600)', light: 'color-mix(in srgb, var(--accent-500) 10%, var(--surface-card))', text: 'var(--accent-600)' },
  warning: { bg: '#f97316', light: 'color-mix(in srgb, #f97316 10%, var(--surface-card))', text: '#c2410c' },
  success: { bg: '#22c55e', light: 'color-mix(in srgb, #22c55e 10%, var(--surface-card))', text: '#15803d' },
}

function StatCard({
  icon,
  label,
  value,
  sub,
  link,
  variant = 'default',
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  link?: string
  variant?: 'default' | 'warning' | 'success'
  accent?: boolean
}) {
  const meta = accent ? VARIANT_META.accent : VARIANT_META[variant]
  const content = (
    <motion.div
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }}
      className="rounded-2xl p-4 border transition-all duration-200 cursor-default"
      style={{ backgroundColor: meta.light, borderColor: 'transparent' }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: meta.bg }}
        >
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.text }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: meta.text }}>
        {sub}
      </p>
    </motion.div>
  )
  if (link)
    return (
      <Link to={link} className="block">
        {content}
      </Link>
    )
  return content
}

/* ─── MascotCard — dashboard avatar full-card ────────── */
function MascotCard({ sessionsCompleted }: { sessionsCompleted: number }) {
  const { avatarUrl, setAvatar, removeAvatar } = useAvatarStore()
  const mascotInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToBase64(file)
    setAvatar(dataUrl)
  }

  const handleRemoveAvatar = () => {
    if (!avatarUrl) return
    removeAvatar()
  }

  const handleUploadClick = () => mascotInputRef.current?.click()

  return (
    <div className="md:col-span-3">
      <input
        ref={mascotInputRef}
        type="file"
        accept="image/*,.gif,.mp4,.webm"
        className="hidden"
        onChange={handleAvatarFile}
      />
      <Card
        className="h-full flex flex-col items-end justify-center text-right border-0 overflow-hidden relative group cursor-pointer min-h-[180px]"
        onClick={handleUploadClick}
      >
        {/* ── Full-card background image ── */}
        {avatarUrl ? (
          <>
            <img
              src={avatarUrl}
              alt="Avatar"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark gradient overlay so text is readable */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.15) 70%, transparent)',
            }} />
          </>
        ) : (
          /* Default gradient when no avatar */
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, var(--accent-50), color-mix(in srgb, var(--accent-500) 8%, var(--surface-card)))`,
          }} />
        )}

        {/* ── Hover upload overlay ── */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors z-10 flex items-center justify-center">
          {!avatarUrl && (
            <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-8 h-8 text-white/80 mx-auto drop-shadow" />
              <p className="text-white/70 text-sm mt-1 font-medium">Chọn avatar / GIF</p>
            </div>
          )}
          {avatarUrl && (
            <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-8 h-8 text-white/90 mx-auto drop-shadow" />
              <p className="text-white/80 text-xs mt-1">Nhấp để đổi</p>
            </div>
          )}
        </div>

        {/* ── Content overlay — top-right ── */}
        <div className="relative z-20 p-5 self-start w-full text-right">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: avatarUrl ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }}>
            Hôm nay
          </p>
          <p className="text-4xl font-bold leading-none"
            style={{ color: avatarUrl ? '#ffffff' : 'var(--accent-600)' }}>
            {sessionsCompleted}
          </p>
          <p className="text-sm mt-0.5"
            style={{ color: avatarUrl ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)' }}>
            buổi học
          </p>
        </div>

        {/* ── Remove button (top-left) ── */}
        {avatarUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveAvatar() }}
            className="absolute top-2 left-2 z-20 text-white/60 hover:text-red-400 transition-colors text-[10px] underline underline-offset-2 opacity-0 group-hover:opacity-100"
          >
            Xoá
          </button>
        )}
      </Card>
    </div>
  )
}

/* ─── QuickActionCard ────────────────────────────────── */
function QuickActionCard({
  icon,
  label,
  desc,
  to,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  to: string
}) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ y: -2, x: 2 }}
        className="rounded-2xl p-3.5 bg-white border border-gray-100 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:border-gray-200"
      >
        <div className="flex items-center justify-between mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: 'var(--accent-500)' }}
          >
            {icon}
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
      </motion.div>
    </Link>
  )
}

/* ─── WordPackCard ──────────────────────────────────── */
function WordPackCard({ pack, index }: { pack: WordPack; index: number }) {
  const difficultyMeta = {
    beginner: { color: '#22c55e', label: 'Cơ bản' },
    intermediate: { color: '#eab308', label: 'Trung cấp' },
    advanced: { color: '#f97316', label: 'Nâng cao' },
  } as const

  const meta = difficultyMeta[pack.difficulty] ?? difficultyMeta.beginner

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="hover:shadow-[var(--shadow-card-hover)] transition-shadow" compact>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-1.5 h-8 rounded-full shrink-0"
            style={{ backgroundColor: meta.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {pack.name}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {pack.description}
            </p>
          </div>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: `${meta.color}18`,
              color: meta.color,
            }}
          >
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] text-gray-400">{pack.wordCount} từ</span>
          <div className="flex-1 mx-2">
            <ProgressBar value={0} max={100} height={4} color="custom" barColor={meta.color} />
          </div>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
        </div>
      </Card>
    </motion.div>
  )
}

function shuffleArray<T>(arr: T[]): T[] {
  const r = [...arr]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j] as T, r[i] as T]
  }
  return r
}
