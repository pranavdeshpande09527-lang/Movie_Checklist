/**
 * App.tsx — Root application with 5-tab routing
 * New: InsightsPage route, ConfettiCanvas, AchievementToast, theme injection
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import BottomNav from './components/BottomNav'
import ConfettiCanvas from './components/ConfettiCanvas'
import AchievementToast from './components/AchievementToast'
import HomePage from './pages/HomePage'
import WatchlistPage from './pages/WatchlistPage'
import WatchedPage from './pages/WatchedPage'
import SearchPage from './pages/SearchPage'
import InsightsPage from './pages/InsightsPage'
import { applyTheme } from './utils/themes'

export default function App() {
  const location = useLocation()

  // Apply default theme on mount
  useEffect(() => {
    applyTheme('default')
  }, [])

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* Confetti layer — renders on its own canvas overlay */}
      <ConfettiCanvas />

      {/* Achievement notifications */}
      <AchievementToast />

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/watched" element={<WatchedPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}
