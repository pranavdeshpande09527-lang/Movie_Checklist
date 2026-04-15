/**
 * MovieCard.tsx — Premium swipeable card
 * New: ❤️ favorite, custom tags, haptic feedback, confetti on watch, bulk select
 */

import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Star, Trash2, Eye, Film, RotateCcw, ChevronRight, Heart, CheckSquare, Square } from 'lucide-react'
import type { Movie } from '../store/movieStore'
import { useMovieStore } from '../store/movieStore'
import { useUIStore } from '../store/uiStore'
import { useGamificationStore } from '../store/gamificationStore'

interface MovieCardProps {
  movie: Movie
  onClick?: (movie: Movie) => void
}

const SWIPE_THRESHOLD = 72

function haptic(pattern: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const { removeMovie, markWatched, moveToWatchlist, toggleFavorite } = useMovieStore()
  const { fireConfetti, isBulkMode, selectedMovieIds, toggleSelect, queueAchievement } = useUIStore()
  const { updateStreak, checkAndUnlockAchievements } = useGamificationStore()
  const { movies } = useMovieStore()
  const [imgError, setImgError] = useState(false)
  const x = useMotionValue(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteOpacity = useTransform(x, [-130, -50, 0], [1, 0.6, 0])
  const watchOpacity = useTransform(x, [0, 50, 130], [0, 0.6, 1])
  const cardOpacity = useTransform(x, [-180, -100, 0, 100, 180], [0.3, 0.85, 1, 0.85, 0.3])
  const cardScale = useTransform(x, [-110, 0, 110], [0.96, 1, 0.96])

  const isSelected = isBulkMode && selectedMovieIds.has(movie.id)

  const handleWatched = () => {
    markWatched(movie.id)
    haptic([30, 20, 30])
    fireConfetti()
    updateStreak()

    // Check achievements
    const watched = movies.filter((m) => m.status === 'watched')
    const allGenres = new Set(watched.flatMap((m) => m.genre))
    const totalAdded = movies.length
    const addedToday = movies.filter((m) => {
      const d = new Date(m.addedAt)
      const t = new Date()
      return d.toDateString() === t.toDateString()
    }).length
    const hour = new Date().getHours()

    const newlyUnlocked = checkAndUnlockAchievements({
      totalWatched: watched.length + 1,
      ratedCount: movies.filter((m) => m.userRating > 0).length,
      genreCount: allGenres.size,
      addedToday,
      watchedGenres: Array.from(allGenres),
      hour,
      totalAdded,
    })
    newlyUnlocked.forEach((a) => queueAchievement({ id: a.id, title: a.title, icon: a.icon }))
  }

  const handleDragEnd = () => {
    const currentX = x.get()
    if (currentX > SWIPE_THRESHOLD) {
      animate(x, 420, { duration: 0.22, ease: 'easeOut' })
      setTimeout(() => {
        if (movie.status === 'watchlist') handleWatched()
        else moveToWatchlist(movie.id)
      }, 180)
    } else if (currentX < -SWIPE_THRESHOLD) {
      haptic(50)
      animate(x, -420, { duration: 0.22, ease: 'easeOut' })
      setTimeout(() => removeMovie(movie.id), 180)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 450, damping: 35 })
    }
  }

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      haptic(40)
      toggleSelect(movie.id)
    }, 550)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ isolation: 'isolate' }}>
      {/* Swipe reveals */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden flex items-stretch pointer-events-none">
        <motion.div style={{ opacity: deleteOpacity }}
          className="w-1/2 flex items-center justify-start pl-5 swipe-bg-delete">
          <div className="flex flex-col items-center gap-1">
            <Trash2 size={20} className="text-white" />
            <span className="text-white text-[10px] font-bold">Remove</span>
          </div>
        </motion.div>
        <motion.div style={{ opacity: watchOpacity }}
          className="w-1/2 flex items-center justify-end pr-5 swipe-bg-watch ml-auto">
          <div className="flex flex-col items-center gap-1">
            {movie.status === 'watchlist' ? <Eye size={20} className="text-white" /> : <RotateCcw size={20} className="text-white" />}
            <span className="text-white text-[10px] font-bold">
              {movie.status === 'watchlist' ? 'Watched' : 'Re-add'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Card */}
      <motion.div
        className="movie-card bg-surface rounded-2xl overflow-hidden cursor-pointer relative z-10 border border-white/[0.05]"
        style={{ x, opacity: cardOpacity, scale: cardScale }}
        drag={isBulkMode ? false : 'x'}
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (isBulkMode) { toggleSelect(movie.id); return }
          if (Math.abs(x.get()) < 6) onClick?.(movie)
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        layout
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileTap={{ scale: isBulkMode ? 0.97 : 0.98 }}
      >
        {/* Bulk select indicator */}
        {isBulkMode && (
          <div className="absolute top-3 left-3 z-20">
            {isSelected
              ? <CheckSquare size={20} className="text-accent" />
              : <Square size={20} className="text-muted" />
            }
          </div>
        )}

        <div className="flex gap-3 p-3">
          {/* Poster */}
          <div className="relative flex-shrink-0 w-[70px] h-[105px] rounded-xl overflow-hidden bg-surface-2 shadow-md">
            {movie.poster && !imgError ? (
              <img src={movie.poster} alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setImgError(true)}
                loading="lazy" />
            ) : (
              <div className="poster-placeholder w-full h-full">
                <Film size={20} className="text-muted" />
                <span className="text-[9px] text-muted leading-tight text-center line-clamp-3 px-1">{movie.title}</span>
              </div>
            )}
            {movie.status === 'watched' && (
              <div className="absolute inset-0 bg-emerald-900/50 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <Eye size={14} className="text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-1.5">
                <h3 className="font-display font-bold text-white text-sm leading-tight line-clamp-2 flex-1">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  {/* Favorite */}
                  <button
                    onClick={(e) => { e.stopPropagation(); haptic(20); toggleFavorite(movie.id) }}
                    className="p-0.5 transition-transform active:scale-75"
                  >
                    <Heart
                      size={14}
                      className={movie.isFavorite ? 'text-pink-500 fill-pink-500' : 'text-border/60'}
                    />
                  </button>
                  <ChevronRight size={14} className="text-border" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                {movie.year && <span className="text-muted text-[11px]">{movie.year}</span>}
                {movie.status === 'watched' && movie.watchedAt && (
                  <span className="text-emerald-500 text-[10px] font-medium">
                    ✓ {new Date(movie.watchedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genre.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {movie.genre.slice(0, 2).map((g) => (
                    <span key={g} className="genre-badge">{g}</span>
                  ))}
                  {movie.genre.length > 2 && (
                    <span className="genre-badge">+{movie.genre.length - 2}</span>
                  )}
                </div>
              )}

              {/* Custom tags */}
              {(movie.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(movie.tags ?? []).slice(0, 3).map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ratings row */}
            <div className="flex items-center gap-3 mt-2">
              {movie.tmdbRating > 0 && (
                <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                  <Star size={10} className="text-gold fill-gold" />
                  <span className="text-gold text-[11px] font-bold">{movie.tmdbRating.toFixed(1)}</span>
                </div>
              )}
              {movie.userRating > 0 && (
                <div className="flex items-center gap-0.5">
                  {stars.map((s) => (
                    <Star key={s} size={10}
                      className={s <= movie.userRating ? 'text-accent fill-accent' : 'text-border/60'} />
                  ))}
                </div>
              )}
            </div>

            {movie.userNotes && (
              <p className="text-muted text-[10px] mt-1 line-clamp-1 italic">&quot;{movie.userNotes}&quot;</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
