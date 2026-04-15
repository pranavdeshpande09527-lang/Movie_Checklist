/**
 * BottomNav.tsx — 5-tab navigation with streak indicator
 */

import { NavLink } from 'react-router-dom'
import { Home, Bookmark, CheckCircle, Search, BarChart3, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMovieStore } from '../store/movieStore'
import { useGamificationStore } from '../store/gamificationStore'

const TABS = [
  { to: '/',          icon: Home,         label: 'Home' },
  { to: '/watchlist', icon: Bookmark,     label: 'Watchlist' },
  { to: '/watched',   icon: CheckCircle,  label: 'Watched' },
  { to: '/search',    icon: Search,       label: 'Search' },
  { to: '/insights',  icon: BarChart3,    label: 'Insights' },
]

export default function BottomNav() {
  const { movies } = useMovieStore()
  const { streak } = useGamificationStore()
  const watchlistCount = movies.filter((m) => m.status === 'watchlist').length

  return (
    <nav className="bottom-nav glass">
      <div className="flex items-center justify-around px-1 py-2">
        {TABS.map(({ to, icon: Icon, label }) => {
          const showBadge = to === '/watchlist' && watchlistCount > 0
          const showStreak = to === '/' && streak > 0

          return (
            <NavLink key={to} to={to} end={to === '/'}>
              {({ isActive }) => (
                <motion.div
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative min-w-[52px]"
                  whileTap={{ scale: 0.85 }}
                  animate={{ 
                    background: isActive ? 'rgba(229,9,20,0.12)' : 'transparent',
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Icon */}
                  <div className="relative">
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={isActive ? 'text-accent' : 'text-muted'}
                    />

                    {/* Watchlist badge */}
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                      >
                        {watchlistCount > 9 ? '9+' : watchlistCount}
                      </motion.span>
                    )}

                    {/* Streak flame */}
                    {showStreak && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-2 flex items-center gap-0.5"
                      >
                        <Flame size={12} className="text-orange-400 fill-orange-400" />
                        <span className="text-orange-400 text-[9px] font-bold">{streak}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-accent' : 'text-muted'}`}>
                    {label}
                  </span>

                  {/* Active dot */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -top-0.5 w-1 h-1 rounded-full bg-accent"
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
