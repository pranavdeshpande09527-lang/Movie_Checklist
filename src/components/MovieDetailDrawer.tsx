/**
 * MovieDetailDrawer.tsx — Premium bottom sheet
 * New: YouTube trailer embed, custom tags, favorites, cinematic mode launch
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Eye, Trash2, Edit3, RotateCcw, ExternalLink,
  Heart, Tag, Play, Maximize2, Plus
} from 'lucide-react'
import type { Movie } from '../store/movieStore'
import { useMovieStore } from '../store/movieStore'
import { useUIStore } from '../store/uiStore'
import { useGamificationStore } from '../store/gamificationStore'

interface Props {
  movie: Movie | null
  onClose: () => void
}

const RATING_LABELS = ['', 'Awful', 'Bad', 'Okay', 'Good', 'Amazing']
const PRESET_TAGS = ['Weekend', 'With Friends', 'Rewatch', 'Classic', 'Comfort Movie', 'Tearjerker', 'Hidden Gem']

function TrailerEmbed({ title, year }: { imdbId?: string; title: string; year: string }) {
  const [loaded, setLoaded] = useState(false)
  const query = encodeURIComponent(`${title} ${year} official trailer`)
  // Use YouTube nocookie embed search — no API key needed
  const src = `https://www.youtube-nocookie.com/embed?listType=search&list=${query}&autoplay=0`

  return (
    <div className="rounded-2xl overflow-hidden bg-surface-2 mb-5" style={{ aspectRatio: '16/9' }}>
      {!loaded && (
        <button
          onClick={() => setLoaded(true)}
          className="w-full h-full flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center group-active:scale-90 transition-transform">
            <Play size={24} className="text-accent ml-1" />
          </div>
          <span className="text-muted text-xs">Tap to load trailer</span>
        </button>
      )}
      {loaded && (
        <iframe
          src={src}
          title={`${title} trailer`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  )
}

export default function MovieDetailDrawer({ movie, onClose }: Props) {
  const {
    updateUserRating, updateUserNotes, markWatched, moveToWatchlist,
    removeMovie, toggleFavorite, addTag, removeTag,
  } = useMovieStore()
  const { fireConfetti, setCinematicMovie, queueAchievement } = useUIStore()
  const { updateStreak, checkAndUnlockAchievements } = useGamificationStore()
  const { movies } = useMovieStore()

  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [tagInput, setTagInput] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (movie) setNotes(movie.userNotes ?? '')
  }, [movie?.id])

  // Auto-save notes after 800ms idle
  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (movie) updateUserNotes(movie.id, val)
    }, 800)
  }

  const handleWatched = () => {
    if (!movie) return
    markWatched(movie.id)
    fireConfetti()
    updateStreak()
    const watched = movies.filter((m) => m.status === 'watched')
    const allGenres = new Set(watched.flatMap((m) => m.genre))
    const newlyUnlocked = checkAndUnlockAchievements({
      totalWatched: watched.length + 1,
      ratedCount: movies.filter((m) => m.userRating > 0).length,
      genreCount: allGenres.size,
      addedToday: 0,
      watchedGenres: Array.from(allGenres),
      hour: new Date().getHours(),
      totalAdded: movies.length,
    })
    newlyUnlocked.forEach((a) => queueAchievement({ id: a.id, title: a.title, icon: a.icon }))
    onClose()
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (!movie || !trimmed) return
    addTag(movie.id, trimmed)
    setTagInput('')
    setShowTagInput(false)
  }

  if (!movie) return null

  const tags = movie.tags ?? []
  const isWatched = movie.status === 'watched'

  return (
    <AnimatePresence>
      <motion.div
        className="backdrop fixed inset-0 z-[300] flex flex-col items-center justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[480px] rounded-t-3xl overflow-hidden"
          style={{ background: 'var(--color-surface)', maxHeight: '92dvh', overflowY: 'auto' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Hero with poster + actions */}
          <div className="relative">
            {movie.poster && (
              <div className="h-[140px] relative overflow-hidden">
                <img src={movie.poster} alt="" className="w-full h-full object-cover scale-110 blur-sm opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface" />
              </div>
            )}

            <div className="relative px-5 pb-4 -mt-4">
              <div className="flex gap-4">
                {/* Poster thumbnail */}
                {movie.poster && (
                  <div className="w-[88px] h-[132px] rounded-xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Meta */}
                <div className="flex-1 pt-6 min-w-0">
                  <h2 className="font-display font-extrabold text-white text-xl leading-tight">{movie.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                    {movie.year && <span className="text-muted text-xs">{movie.year}</span>}
                    {movie.tmdbRating > 0 && (
                      <span className="flex items-center gap-1 text-gold text-xs font-bold">
                        <Star size={11} className="fill-gold" />{movie.tmdbRating.toFixed(1)}
                      </span>
                    )}
                    {movie.imdbId && (
                      <a href={`https://www.imdb.com/title/${movie.imdbId}`} target="_blank"
                        rel="noopener noreferrer" className="text-yellow-500 text-[10px] font-bold hover:underline flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}>
                        IMDb <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                  {/* Genres */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {movie.genre.map((g) => (
                      <span key={g} className="genre-badge">{g}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick action row */}
              <div className="flex items-center gap-2 mt-4">
                {/* Favorite */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => toggleFavorite(movie.id)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
                  style={{
                    background: movie.isFavorite ? 'rgba(236,72,153,0.15)' : 'var(--color-surface-2)',
                    borderColor: movie.isFavorite ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Heart size={16} className={movie.isFavorite ? 'text-pink-500 fill-pink-500' : 'text-muted'} />
                </motion.button>

                {/* Cinematic mode */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => { setCinematicMovie(movie.id); onClose() }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06] bg-surface-2 text-muted"
                >
                  <Maximize2 size={15} />
                </motion.button>

                {/* Primary action */}
                {!isWatched ? (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleWatched}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #22d3a8, #0d9488)' }}>
                    <Eye size={15} /> Mark Watched
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { moveToWatchlist(movie.id); onClose() }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-muted border border-border bg-surface-2">
                    <RotateCcw size={15} /> Move to Watchlist
                  </motion.button>
                )}

                {/* Delete */}
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => { removeMovie(movie.id); onClose() }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-red-500/25 bg-red-500/10 text-red-400">
                  <Trash2 size={15} />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-8 flex flex-col gap-5">
            {/* Trailer */}
            <div>
              <p className="text-muted text-[11px] font-semibold uppercase tracking-widest mb-2">🎬 Trailer</p>
              <TrailerEmbed imdbId={movie.imdbId} title={movie.title} year={movie.year} />
            </div>

            {/* Overview */}
            {movie.overview && (
              <div>
                <p className="text-muted text-[11px] font-semibold uppercase tracking-widest mb-2">Synopsis</p>
                <p className="text-white/80 text-sm leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {/* User rating */}
            <div>
              <p className="text-muted text-[11px] font-semibold uppercase tracking-widest mb-2">Your Rating</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.button key={s}
                    whileTap={{ scale: 0.8 }}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => updateUserRating(movie.id, s)}
                    className="p-1.5 transition-all"
                  >
                    <Star size={28}
                      className={s <= (hoverRating || movie.userRating) ? 'text-accent fill-accent' : 'text-border'}
                    />
                  </motion.button>
                ))}
                {movie.userRating > 0 && (
                  <span className="ml-1 text-accent text-sm font-bold">{RATING_LABELS[movie.userRating]}</span>
                )}
              </div>
            </div>

            {/* Custom Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={12} className="text-muted" />
                <p className="text-muted text-[11px] font-semibold uppercase tracking-widest">Tags</p>
                <button onClick={() => setShowTagInput(!showTagInput)}
                  className="ml-auto text-muted hover:text-white transition-colors">
                  <Plus size={14} />
                </button>
              </div>

              {/* Preset tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_TAGS.map((t) => {
                  const isActive = tags.includes(t)
                  return (
                    <button key={t}
                      onClick={() => isActive ? removeTag(movie.id, t) : addTag(movie.id, t)}
                      className="text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium"
                      style={{
                        borderColor: isActive ? 'rgba(229,9,20,0.5)' : 'rgba(255,255,255,0.08)',
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        background: isActive ? 'rgba(229,9,20,0.1)' : 'var(--color-surface-2)',
                      }}
                    >
                      {isActive ? '✓ ' : ''}{t}
                    </button>
                  )
                })}
              </div>

              {/* Custom tag input */}
              {showTagInput && (
                <div className="flex gap-2">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Custom tag..."
                    className="flex-1 bg-surface-2 text-white text-sm rounded-xl px-3 py-2 border border-border placeholder:text-muted"
                  />
                  <button onClick={handleAddTag}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-white bg-accent">
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted text-[11px] font-semibold uppercase tracking-widest">Notes</p>
                <button onClick={() => setEditing(!editing)} className="text-muted hover:text-white transition-colors">
                  <Edit3 size={13} />
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={editing ? 4 : 2}
                placeholder="Your thoughts on this film..."
                className="w-full bg-surface-2 text-white text-sm rounded-xl px-4 py-3 border border-border placeholder:text-muted resize-none focus:border-accent/50 transition-colors leading-relaxed"
              />
              {notes !== movie.userNotes && (
                <p className="text-muted text-[10px] mt-1 text-right">Auto-saving...</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
