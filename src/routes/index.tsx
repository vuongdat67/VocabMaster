import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Suspense fallback={<LoadingFallback />}><HomePage /></Suspense> },
      { path: 'learn', element: <Suspense fallback={<LoadingFallback />}><LearningSessionPage /></Suspense> },
      { path: 'words', element: <Suspense fallback={<LoadingFallback />}><WordListPage /></Suspense> },
      { path: 'words/:id', element: <Suspense fallback={<LoadingFallback />}><WordDetailPage /></Suspense> },
      { path: 'import', element: <Suspense fallback={<LoadingFallback />}><ImportPage /></Suspense> },
      { path: 'review', element: <Suspense fallback={<LoadingFallback />}><ReviewPage /></Suspense> },
      { path: 'stats', element: <Suspense fallback={<LoadingFallback />}><StatsPage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense> },
      // Games
      { path: 'games/matching', element: <Suspense fallback={<LoadingFallback />}><MatchingGamePage /></Suspense> },
      { path: 'games/synonym', element: <Suspense fallback={<LoadingFallback />}><SynonymGamePage /></Suspense> },
      // Wind garden
      { path: 'wind', element: <Suspense fallback={<LoadingFallback />}><WindPage /></Suspense> },
      // Image Manager
      { path: 'images', element: <Suspense fallback={<LoadingFallback />}><ImageManagerPage /></Suspense> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
