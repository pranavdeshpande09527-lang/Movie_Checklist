/**
 * HomePage.tsx — Smart home with mood selector, recommendations, and daily pick
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Film, Wifi, WifiOff, Flame, Maximize2, Star } from 'lucide-react'
import { useMovieStore } from '../store/movieStore'
import { useUIStore, MOOD_GENRES } from '../store/uiStore'
import { useGamificationStore } from '../store/gamificationStore'
import MoodSelector from '../components/MoodSelector'
import MovieCard from '../components/MovieCard'
import MovieDetailDrawer from '../components/MovieDetailDrawer'
import AddMovieModal from '../components/AddMovieModal'
import BulkActionBar from '../components/BulkActionBar'

import { getDailyPick, getRecommendations, filterByMoodGenres } from '../utils/recommendations'
import { discoverByQuery, isGoodMovie, getMovieDetailOMDb, getOMDbPoster, parseOMDbGenres, parseOMDbRating } from '../utils/omdb'


/* ── Cinematic Mode Overlay ── */
function CinematicMode({ movieId, onClose }: { movieId: string; onClose: () => void }) {
  const { movies } = useMovieStore()
  const movie = movies.find((m) => m.id === movieId)
  if (!movie) return null

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Blurred backdrop */}
      {movie.poster && (
        <div className="absolute inset-0 overflow-hidden">
          <img src={movie.poster} alt="" className="w-full h-full object-cover scale-125 blur-2xl opacity-50" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
      )}

      {/* Card */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-5 px-6 w-full max-w-xs"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {movie.poster && (
          <div className="w-48 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img src={movie.poster} alt={movie.title} className="w-full h-auto" />
          </div>
        )}
        <div className="text-center">
          <h2 className="font-display font-extrabold text-white text-2xl">{movie.title}</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-muted text-sm">{movie.year}</span>
            {movie.tmdbRating > 0 && (
              <span className="flex items-center gap-1 text-gold text-sm font-bold">
                <Star size={13} className="fill-gold" />{movie.tmdbRating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {movie.genre.map((g) => (
              <span key={g} className="genre-badge">{g}</span>
            ))}
          </div>
          {movie.overview && (
            <p className="text-white/70 text-sm mt-4 leading-relaxed line-clamp-5">{movie.overview}</p>
          )}
        </div>
        <button onClick={onClose}
          className="px-8 py-3 rounded-2xl font-bold text-white text-sm"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ── Main Page ── */
export default function HomePage() {
  const { movies, addMovie, removeMovie } = useMovieStore()
  const { activeMood, cinematicMovieId, setCinematicMovie, isBulkMode, toggleBulkMode } = useUIStore()
  const { streak } = useGamificationStore()
  const [selectedMovie, setSelectedMovie] = useState<import('../store/movieStore').Movie | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  // Auto-clean any junk seed entries (shorts, compilations, award shows) from previous app versions
  useEffect(() => {
    const JUNK_PATTERNS = [
      'short film', 'compilation', 'nominated', 'award ceremony',
      'awards show', 'highlights', 'behind the scene', 'making of',
      'concert', 'stage show', 'tribute', 'best of',
    ]
    movies.forEach((m) => {
      const t = m.title.toLowerCase()
      if (JUNK_PATTERNS.some((p) => t.includes(p))) removeMovie(m.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Seed library with live OMDb data on first launch
  useEffect(() => {
    if (movies.length !== 0) return
    // Specific popular titles — OMDb returns exact match first, avoiding documentary noise
    const SEED_QUERIES = ['Inception', 'Interstellar', 'Dangal', '3 Idiots', 'Parasite 2019', 'Whiplash']
    const JUNK_GENRES = ['documentary', 'short', 'talk-show', 'news', 'reality-tv']
    Promise.all(SEED_QUERIES.map((q) => discoverByQuery(q).catch(() => [])))
      .then(async (batches) => {
        const seen = new Set<string>()
        const unique = batches.flat().filter((m) => {
          if (seen.has(m.imdbID) || !isGoodMovie(m)) return false
          seen.add(m.imdbID); return true
        }).slice(0, 12)
        for (const m of unique) {
          const detail = await getMovieDetailOMDb(m.imdbID).catch(() => null)
          if (!detail) continue
          // Genre-level filter: skip if OMDb tags it as documentary or short
          const genreLower = (detail.Genre ?? '').toLowerCase()
          if (JUNK_GENRES.some((g) => genreLower.includes(g))) continue
          addMovie({
            imdbId: detail.imdbID, title: detail.Title, year: detail.Year?.slice(0, 4) ?? '',
            poster: getOMDbPoster(detail.Poster), genre: parseOMDbGenres(detail.Genre),
            overview: detail.Plot !== 'N/A' ? detail.Plot : '',
            tmdbRating: parseOMDbRating(detail.imdbRating),
            userRating: 0, userNotes: '', status: 'watchlist',
          })
        }
      })
      .catch(() => { /* offline — user can add movies manually */ })
  }, [])

  // Smart Daily Pick
  const dailyPick = getDailyPick(movies)

  // Recommendations
  const recommendations = getRecommendations(movies, 8)

  // Mood-filtered watchlist
  const moodGenres = MOOD_GENRES[activeMood]
  const filteredWatchlist = filterByMoodGenres(movies.filter(m => m.status === 'watchlist'), moodGenres)

  // Recently added
  const recentlyAdded = [...movies]
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, 6)

  return (
    <div className="flex-1 overflow-y-auto scroll-container pb-safe">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-white">CineTrack</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-muted text-[11px]">
                {isOnline ? (
                  <><Wifi size={9} className="inline mr-1" />Online</>
                ) : (
                  <><WifiOff size={9} className="inline mr-1" />Offline</>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-orange-400/30 bg-orange-400/10">
                <Flame size={13} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-bold">{streak}</span>
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddModal(true)}
              className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30"
            >
              <Plus size={20} className="text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-6">
        {/* Mood Selector */}
        <MoodSelector />

        {/* Daily Pick */}
        {dailyPick && activeMood === 'all' && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-white font-display font-bold text-base">🎯 Today's Pick</p>
              <button onClick={() => setCinematicMovie(dailyPick.id)}
                className="flex items-center gap-1 text-muted text-xs hover:text-white transition-colors">
                <Maximize2 size={11} /> Full View
              </button>
            </div>

            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMovie(dailyPick)}
              className="rounded-2xl overflow-hidden relative cursor-pointer border border-white/[0.06]"
              style={{ background: 'var(--color-surface)' }}
            >
              {dailyPick.poster && (
                <div className="h-36 relative overflow-hidden">
                  <img src={dailyPick.poster} alt="" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center p-4 gap-3">
                {dailyPick.poster && (
                  <div className="w-[64px] h-[96px] rounded-xl overflow-hidden flex-shrink-0 shadow-xl border border-white/10">
                    <img src={dailyPick.poster} alt={dailyPick.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1">Recommended for tonight</p>
                  <h3 className="font-display font-extrabold text-white text-lg leading-tight">{dailyPick.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted text-xs">{dailyPick.year}</span>
                    {dailyPick.tmdbRating > 0 && (
                      <span className="flex items-center gap-1 text-gold text-xs font-bold">
                        <Star size={10} className="fill-gold" />{dailyPick.tmdbRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {dailyPick.genre.slice(0, 2).map((g) => <span key={g} className="genre-badge">{g}</span>)}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <p className="text-white font-display font-bold text-base mb-2.5">
              ✨ {recommendations[0]?.reason ?? 'Recommended For You'}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {recommendations.map(({ movie }) => (
                <motion.div
                  key={movie.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMovie(movie)}
                  className="flex-shrink-0 w-[100px] cursor-pointer"
                >
                  <div className="rounded-xl overflow-hidden mb-1.5 border border-white/[0.06]" style={{ aspectRatio: '2/3' }}>
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                        <Film size={20} className="text-muted" />
                      </div>
                    )}
                  </div>
                  <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{movie.title}</p>
                  {movie.tmdbRating > 0 && (
                    <span className="flex items-center gap-0.5 text-gold text-[10px] mt-0.5">
                      <Star size={9} className="fill-gold" />{movie.tmdbRating.toFixed(1)}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Watchlist — mood filtered */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-white font-display font-bold text-base">
              {activeMood !== 'all' ? `🎭 ${activeMood === 'feelgood' ? 'Feel Good' : activeMood === 'mindblow' ? 'Mind Blowing' : activeMood === 'emotional' ? 'Emotional' : activeMood === 'thriller' ? 'Thrillers' : 'Action'} Films` : '📋 Watchlist'}
              <span className="ml-2 text-muted text-sm font-normal">({filteredWatchlist.length})</span>
            </p>
            <button onClick={toggleBulkMode}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${isBulkMode ? 'text-accent bg-accent/10' : 'text-muted'}`}>
              {isBulkMode ? 'Done' : 'Select'}
            </button>
          </div>

          {filteredWatchlist.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🎬</div>
              <p className="text-muted text-sm">
                {activeMood !== 'all' ? 'No movies match this mood in your watchlist.' : 'Your watchlist is empty. Add movies from Search!'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {filteredWatchlist.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <div className="mb-2">
            <p className="text-white font-display font-bold text-base mb-2.5">🕐 Recently Added</p>
            <div className="grid grid-cols-3 gap-2">
              {recentlyAdded.map((movie) => (
                <motion.div key={movie.id} whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedMovie(movie)} className="cursor-pointer">
                  <div className="rounded-xl overflow-hidden mb-1 border border-white/[0.05]" style={{ aspectRatio: '2/3' }}>
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                        <Film size={16} className="text-muted" />
                      </div>
                    )}
                  </div>
                  <p className="text-white text-[11px] font-medium line-clamp-1">{movie.title}</p>
                  {movie.status === 'watched' && <p className="text-emerald-500 text-[9px]">✓ Watched</p>}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <MovieDetailDrawer movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      {showAddModal && <AddMovieModal open={showAddModal} onClose={() => setShowAddModal(false)} />}
      <BulkActionBar />

      {/* Cinematic Mode */}
      <AnimatePresence>
        {cinematicMovieId && (
          <CinematicMode movieId={cinematicMovieId} onClose={() => setCinematicMovie(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
