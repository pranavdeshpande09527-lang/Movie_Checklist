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
import type { Movie } from '../store/movieStore'
import { getDailyPick, getRecommendations, filterByMoodGenres } from '../utils/recommendations'

const CURATED_FALLBACK: Omit<Movie, 'id' | 'addedAt'>[] = [
  // International Classics
  { title: 'Inception', year: '2010', genre: ['Sci-Fi', 'Thriller'], poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', tmdbRating: 8.8, userRating: 0, userNotes: '', overview: 'A thief who steals corporate secrets through dream-sharing.', status: 'watchlist', imdbId: 'tt1375666' },
  { title: 'The Dark Knight', year: '2008', genre: ['Action', 'Crime'], poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg', tmdbRating: 9.0, userRating: 0, userNotes: '', overview: 'Batman faces The Joker in a battle for Gotham\'s soul.', status: 'watchlist', imdbId: 'tt0468569' },
  { title: 'Interstellar', year: '2014', genre: ['Sci-Fi', 'Drama'], poster: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg', tmdbRating: 8.6, userRating: 0, userNotes: '', overview: 'Explorers travel through a wormhole in space to save humanity.', status: 'watchlist', imdbId: 'tt0816692' },
  { title: 'Parasite', year: '2019', genre: ['Drama', 'Thriller'], poster: 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg', tmdbRating: 8.5, userRating: 0, userNotes: '', overview: 'A poor family schemes to become employed by a wealthy family.', status: 'watchlist', imdbId: 'tt6751668' },
  { title: 'The Godfather', year: '1972', genre: ['Crime', 'Drama'], poster: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', tmdbRating: 9.2, userRating: 0, userNotes: '', overview: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', status: 'watchlist', imdbId: 'tt0068646' },
  { title: 'Pulp Fiction', year: '1994', genre: ['Crime', 'Drama'], poster: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', tmdbRating: 8.9, userRating: 0, userNotes: '', overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine.', status: 'watchlist', imdbId: 'tt0110912' },
  // 🇮🇳 Indian Hits
  { title: '3 Idiots', year: '2009', genre: ['Comedy', 'Drama'], poster: 'https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg', tmdbRating: 8.4, userRating: 0, userNotes: '', overview: 'Two friends search for their lost companion who inspired them to think differently.', status: 'watchlist', imdbId: 'tt1187043' },
  { title: 'Dangal', year: '2016', genre: ['Drama', 'Biography', 'Sport'], poster: 'https://m.media-amazon.com/images/M/MV5BMjMxNjkwMTgwNl5BMl5BanBnXkFtZTgwMzAxNDc0MDI@._V1_SX300.jpg', tmdbRating: 8.4, userRating: 0, userNotes: '', overview: 'Former wrestler Mahavir Singh Phogat trains his daughters to become world-class wrestlers.', status: 'watchlist', imdbId: 'tt5074352' },
  { title: 'Baahubali: The Beginning', year: '2015', genre: ['Action', 'Adventure', 'Drama'], poster: 'https://m.media-amazon.com/images/M/MV5BYWVlMjVkMjItZjM5Yi00Y2YwLWFlNzAtNTkzOWM2NDQyMGZlXkEyXkFqcGdeQXVyODIwMDI1NjM@._V1_SX300.jpg', tmdbRating: 8.0, userRating: 0, userNotes: '', overview: 'An epic tale of two brothers separated at birth leading to a legendary power struggle.', status: 'watchlist', imdbId: 'tt2631186' },
  { title: 'RRR', year: '2022', genre: ['Action', 'Drama'], poster: 'https://m.media-amazon.com/images/M/MV5BOGEzYzcxYjAtYjU2Yi00ZWZjLTk3YzQtMzVmYTI3MGI1MDE1XkEyXkFqcGdeQXVyMTEzMTI1Mjk3._V1_SX300.jpg', tmdbRating: 7.9, userRating: 0, userNotes: '', overview: 'A fictional story about two legendary Indian revolutionaries and their journey away from home.', status: 'watchlist', imdbId: 'tt8178634' },
  { title: 'Andhadhun', year: '2018', genre: ['Thriller', 'Crime', 'Comedy'], poster: 'https://m.media-amazon.com/images/M/MV5BZWZkZWRkNGMtNDg3Zi00MDM1LWJmNGItMjY0OWE2NjVmYmVlXkEyXkFqcGdeQXVyNDAzNDk0MTQ@._V1_SX300.jpg', tmdbRating: 8.2, userRating: 0, userNotes: '', overview: 'A series of events unfold after a blind pianist witnesses a murder.', status: 'watchlist', imdbId: 'tt8108198' },
  { title: 'Tumbbad', year: '2018', genre: ['Horror', 'Fantasy', 'Thriller'], poster: 'https://m.media-amazon.com/images/M/MV5BYmQ4ZDMzOGMtMzdiZC00ZGI5LWFjZmMtZWM5ZWQwZTAzODlhXkEyXkFqcGdeQXVyNDFzMDg1Mjc@._V1_SX300.jpg', tmdbRating: 8.0, userRating: 0, userNotes: '', overview: 'A story about a man who discovers a god that was forgotten by time and greed.', status: 'watchlist', imdbId: 'tt8239946' },
]

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
  const { movies, addMovie, getWatchlist } = useMovieStore()
  const { activeMood, cinematicMovieId, setCinematicMovie, isBulkMode, toggleBulkMode } = useUIStore()
  const { streak } = useGamificationStore()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  // Add fallback movies if library is empty
  const watchlist = getWatchlist()
  useEffect(() => {
    if (movies.length === 0) {
      CURATED_FALLBACK.forEach((m) => addMovie(m))
    }
  }, [])

  // Smart Daily Pick
  const dailyPick = getDailyPick(movies)

  // Recommendations
  const recommendations = getRecommendations(movies, 8)

  // Mood-filtered watchlist
  const moodGenres = MOOD_GENRES[activeMood]
  const filteredWatchlist = filterByMoodGenres(watchlist, moodGenres)

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
