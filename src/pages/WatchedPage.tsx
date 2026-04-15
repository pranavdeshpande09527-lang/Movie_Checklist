/**
 * WatchedPage — polished completed movies list with rich stats
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Film, Star, Trophy, Clock } from 'lucide-react'
import { useMovieStore, applyFilters } from '../store/movieStore'
import MovieCard from '../components/MovieCard'
import FilterBar from '../components/FilterBar'
import MovieDetailDrawer from '../components/MovieDetailDrawer'
import type { Movie } from '../store/movieStore'

export default function WatchedPage() {
  const { movies, filters } = useMovieStore()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  const watched = movies.filter((m) => m.status === 'watched')
  const filtered = applyFilters(watched, filters)

  // Stats
  const rated = watched.filter((m) => m.userRating > 0)
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, m) => sum + m.userRating, 0) / rated.length).toFixed(1)
    : null

  const topRated = rated.sort((a, b) => b.userRating - a.userRating)[0]
  const latestWatched = watched
    .filter((m) => m.watchedAt)
    .sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0))[0]

  return (
    <div className="flex-1 overflow-y-auto scroll-container pb-safe px-4 pt-5">

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <h1 className="font-display font-extrabold text-xl text-white">Watched</h1>
        </div>
        <p className="text-muted text-sm mt-0.5">
          {watched.length} {watched.length === 1 ? 'movie' : 'movies'} completed
        </p>
      </div>

      {/* Rich stats grid */}
      {watched.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Total watched */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 relative overflow-hidden border border-emerald-500/15"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,168,0.12) 0%, #1a1a24 100%)' }}
          >
            <div className="absolute -bottom-3 -right-3 opacity-10">
              <Trophy size={48} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-display font-extrabold text-emerald-400">{watched.length}</p>
            <p className="text-muted text-[11px] mt-0.5 font-medium">Movies watched</p>
          </motion.div>

          {/* Avg rating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl p-4 relative overflow-hidden border border-yellow-400/15"
            style={{ background: 'linear-gradient(135deg, rgba(245,197,24,0.1) 0%, #1a1a24 100%)' }}
          >
            <div className="absolute -bottom-3 -right-3 opacity-10">
              <Star size={48} className="text-gold" />
            </div>
            <div className="flex items-end gap-1">
              <p className="text-3xl font-display font-extrabold text-gold">{avgRating ?? '—'}</p>
              {avgRating && <Star size={14} className="text-gold fill-gold mb-1.5" />}
            </div>
            <p className="text-muted text-[11px] mt-0.5 font-medium">Avg your rating</p>
          </motion.div>

          {/* Top rated */}
          {topRated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-3 border border-accent/15 col-span-2"
              style={{ background: 'linear-gradient(135deg, rgba(229,9,20,0.08) 0%, #1a1a24 100%)' }}
            >
              <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">⭐ Your Favourite</p>
              <div className="flex items-center gap-3">
                {topRated.poster && (
                  <img
                    src={topRated.poster}
                    alt={topRated.title}
                    className="w-10 h-14 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm leading-tight line-clamp-1">{topRated.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={11} className={s <= topRated.userRating ? 'text-accent fill-accent' : 'text-border/50'} />
                    ))}
                    <span className="text-accent text-xs font-bold ml-1">{topRated.userRating}/5</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Last watched */}
          {latestWatched && !topRated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-3 border border-border/40 col-span-2 flex items-center gap-3"
              style={{ background: '#1a1a24' }}
            >
              <Clock size={16} className="text-muted flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-muted text-[10px]">Last watched</p>
                <p className="text-white text-sm font-semibold line-clamp-1">{latestWatched.title}</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Filters */}
      {watched.length > 0 && <FilterBar />}

      {/* Swipe hint */}
      {watched.length > 0 && (
        <p className="text-muted text-[11px] text-center mb-3">
          Swipe right to re-add · Swipe left to remove
        </p>
      )}

      {/* Movie list */}
      {filtered.length > 0 ? (
        <motion.div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : watched.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-sm">No movies match your filters</p>
        </div>
      )}

      {/* Detail drawer */}
      <MovieDetailDrawer movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-5"
    >
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-surface-2 flex items-center justify-center">
          <Film size={40} className="text-emerald-400/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 size={16} className="text-emerald-400" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-display font-bold text-white text-xl">Nothing watched yet</h3>
        <p className="text-muted text-sm mt-2 max-w-[220px] mx-auto leading-relaxed">
          Mark movies as watched from your Watchlist to see them here
        </p>
      </div>
    </motion.div>
  )
}
