import { lazy, Suspense } from 'react'
import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

// Lazy-loaded pages - mỗi page là một chunk riêng
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })))
const LearningSessionPage = lazy(() => import('@/pages/LearningSessionPage').then(m => ({ default: m.LearningSessionPage })))
const WordListPage = lazy(() => import('@/pages/WordListPage').then(m => ({ default: m.WordListPage })))
const WordDetailPage = lazy(() => import('@/pages/WordDetailPage').then(m => ({ default: m.WordDetailPage })))
const ImportPage = lazy(() => import('@/pages/ImportPage').then(m => ({ default: m.ImportPage })))
const ReviewPage = lazy(() => import('@/pages/ReviewPage').then(m => ({ default: m.ReviewPage })))
const StatsPage = lazy(() => import('@/pages/StatsPage').then(m => ({ default: m.StatsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const MatchingGamePage = lazy(() => import('@/pages/MatchingGamePage').then(m => ({ default: m.MatchingGamePage })))
const SynonymGamePage = lazy(() => import('@/pages/SynonymGamePage').then(m => ({ default: m.SynonymGamePage })))
const WindPage = lazy(() => import('@/pages/WindPage').then(m => ({ default: m.WindPage })))
const ImageManagerPage = lazy(() => import('@/pages/ImageManagerPage').then(m => ({ default: m.ImageManagerPage })))
const CrosswordGamePage = lazy(() => import('@/pages/CrosswordGamePage').then(m => ({ default: m.CrosswordGamePage })))
const WordleGamePage = lazy(() => import('@/pages/WordleGamePage').then(m => ({ default: m.WordleGamePage })))
const SwipeFlashcardPage = lazy(() => import('@/pages/SwipeFlashcardPage').then(m => ({ default: m.SwipeFlashcardPage })))
const ContextGamePage = lazy(() => import('@/pages/ContextGamePage').then(m => ({ default: m.ContextGamePage })))
const DictionaryPage = lazy(() => import('@/pages/DictionaryPage').then(m => ({ default: m.DictionaryPage })))
const SpeechGamePage = lazy(() => import('@/pages/SpeechGamePage').then(m => ({ default: m.SpeechGamePage })))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  )
}

function LazyPage({ children }: { children: React.ReactNode }) {
  // Component wrapper không cần thiết, Suspense bao ở dưới
  return <>{children}</>
}

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Suspense fallback={<LoadingFallback />}><HomePage /></Suspense> },
      { path: 'learn', element: <Suspense fallback={<LoadingFallback />}><LearningSessionPage /></Suspense> },
      { path: 'words', element: <Suspense fallback={<LoadingFallback />}><WordListPage /></Suspense> },
      { path: 'words/:id', element: <Suspense fallback={<LoadingFallback />}><WordDetailPage /></Suspense> },
      { path: 'dictionary', element: <Suspense fallback={<LoadingFallback />}><DictionaryPage /></Suspense> },
      { path: 'import', element: <Suspense fallback={<LoadingFallback />}><ImportPage /></Suspense> },
      { path: 'review', element: <Suspense fallback={<LoadingFallback />}><ReviewPage /></Suspense> },
      { path: 'stats', element: <Suspense fallback={<LoadingFallback />}><StatsPage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense> },
      // Games
      { path: 'games/matching', element: <Suspense fallback={<LoadingFallback />}><MatchingGamePage /></Suspense> },
      { path: 'games/synonym', element: <Suspense fallback={<LoadingFallback />}><SynonymGamePage /></Suspense> },
      { path: 'games/crossword', element: <Suspense fallback={<LoadingFallback />}><CrosswordGamePage /></Suspense> },
      { path: 'games/wordle', element: <Suspense fallback={<LoadingFallback />}><WordleGamePage /></Suspense> },
      { path: 'games/swipe', element: <Suspense fallback={<LoadingFallback />}><SwipeFlashcardPage /></Suspense> },
      { path: 'games/context', element: <Suspense fallback={<LoadingFallback />}><ContextGamePage /></Suspense> },
      { path: 'games/speech', element: <Suspense fallback={<LoadingFallback />}><SpeechGamePage /></Suspense> },
      // Wind garden
      { path: 'wind', element: <Suspense fallback={<LoadingFallback />}><WindPage /></Suspense> },
      // Image Manager
      { path: 'images', element: <Suspense fallback={<LoadingFallback />}><ImageManagerPage /></Suspense> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
