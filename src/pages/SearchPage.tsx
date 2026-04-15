/**
 * SearchPage — powered by OMDb API
 * New v2: Recent search cache, trending chips, result caching
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search, Plus, Loader2, X, Film, CheckCircle, Clock, TrendingUp, Sparkles } from 'lucide-react'
import {
  searchMoviesOMDb,
  getMovieDetailOMDb,
  getOMDbPoster,
  parseOMDbGenres,
  parseOMDbRating,
  type OMDbSearchResult,
} from '../utils/omdb'
import { useMovieStore } from '../store/movieStore'

const TRENDING_GLOBAL = ['Inception', 'Interstellar', 'The Godfather', 'Parasite', 'Oppenheimer', 'Dune', 'Avatar', 'Top Gun']
const TRENDING_INDIAN = ['3 Idiots', 'Dangal', 'Baahubali', 'RRR', 'Drishyam', 'Andhadhun', 'Article 370', 'Pushpa', 'KGF Chapter 2', 'Tumbbad', 'Vikram', 'Mirzapur']

// Underrated / Hidden Gems
const HIDDEN_GEMS_GLOBAL = ['Prisoners', 'Moon', 'Coherence', 'A Ghost Story', 'Enemy', 'Upgrade', 'Predestination', 'Sound of Metal', 'The Lighthouse', 'Annihilation', 'Timecrimes', 'Whiplash']
const HIDDEN_GEMS_INDIAN = ['Tumbbad', 'Newton', 'Court', 'Masaan', 'Talvar', 'Ship of Theseus', 'Kapoor and Sons', 'Lootera', 'Raman Raghav 2.0', 'Haider', 'Trapped', 'Ugly']
const MAX_RECENT = 6
const RECENT_KEY = 'cinetrack-recent-searches'

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(q: string) {
  const prev = getRecent().filter((r) => r !== q)
  const next = [q, ...prev].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}
function clearRecent() { localStorage.removeItem(RECENT_KEY) }

// In-memory result cache
const searchCache = new Map<string, OMDbSearchResult[]>()

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OMDbSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecent)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { movies, addMovie } = useMovieStore()
  const addedImdbIds = new Set(movies.map((m) => m.imdbId).filter(Boolean))

  useEffect(() => {
    if (!query.trim()) { setResults([]); setError(''); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const key = query.trim().toLowerCase()
      if (searchCache.has(key)) { setResults(searchCache.get(key)!); return }

      setLoading(true); setError('')
      try {
        const data = await searchMoviesOMDb(query)
        searchCache.set(key, data)
        setResults(data)
        if (data.length === 0) setError(`No movies found for "${query}"`)
        else { saveRecent(query.trim()); setRecentSearches(getRecent()) }
      } catch {
        setError('Search failed — check your connection'); setResults([])
      } finally { setLoading(false) }
    }, 380)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const handleAdd = async (result: OMDbSearchResult) => {
    if (addedImdbIds.has(result.imdbID)) return
    setAddingId(result.imdbID)
    try {
      const detail = await getMovieDetailOMDb(result.imdbID)
      if (detail) {
        addMovie({
          imdbId: detail.imdbID, title: detail.Title, year: detail.Year?.slice(0, 4) ?? '',
          poster: getOMDbPoster(detail.Poster), genre: parseOMDbGenres(detail.Genre),
          overview: detail.Plot !== 'N/A' ? detail.Plot : '',
          tmdbRating: parseOMDbRating(detail.imdbRating),
          userRating: 0, userNotes: '', status: 'watchlist',
        })
      } else {
        addMovie({
          imdbId: result.imdbID, title: result.Title, year: result.Year?.slice(0, 4) ?? '',
          poster: getOMDbPoster(result.Poster), genre: [], overview: '',
          tmdbRating: 0, userRating: 0, userNotes: '', status: 'watchlist',
        })
      }
    } catch {
      addMovie({
        imdbId: result.imdbID, title: result.Title, year: result.Year?.slice(0, 4) ?? '',
        poster: getOMDbPoster(result.Poster), genre: [], overview: '',
        tmdbRating: 0, userRating: 0, userNotes: '', status: 'watchlist',
      })
    } finally { setAddingId(null) }
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-container pb-safe px-4 pt-5">

      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display font-extrabold text-xl text-white">Search Movies</h1>
        <p className="text-muted text-xs mt-0.5">Powered by OMDb · {movies.length} in your library</p>
      </div>

      {/* Search input */}
      <div className="relative mb-5">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading
            ? <Loader2 size={17} className="text-accent animate-spin" />
            : <Search size={17} className="text-muted" />
          }
        </div>
        <input
          ref={inputRef} type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for any movie..." autoComplete="off" autoCapitalize="words"
          className="w-full bg-surface border border-border rounded-2xl pl-11 pr-10 py-3.5 text-white text-sm placeholder:text-muted focus:border-accent/50 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors p-1">
            <X size={15} />
          </button>
        )}
      </div>

      {error && !loading && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted text-sm text-center py-10">
          {error}
        </motion.p>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {results.length > 0 && (
          <motion.div key={query} variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="flex flex-col gap-3">
            <p className="text-muted text-[11px] mb-1">
              {results.length} result{results.length !== 1 ? 's' : ''} — tap <strong className="text-white">+</strong> to add
            </p>
            {results.map((r) => (
              <SearchResultCard key={r.imdbID} result={r}
                isAdded={addedImdbIds.has(r.imdbID)} isAdding={addingId === r.imdbID} onAdd={handleAdd} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty / Discovery state */}
      {!query && results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 py-4">

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-muted" />
                  <span className="text-muted text-[11px] font-semibold uppercase tracking-wider">Recent Searches</span>
                </div>
                <button onClick={() => { clearRecent(); setRecentSearches([]) }}
                  className="text-muted text-[11px] hover:text-white transition-colors">
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="flex items-center gap-1.5 text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-muted hover:text-white hover:border-accent/40 transition-colors">
                    <Clock size={10} /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending — Global */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-accent" />
              <span className="text-muted text-[11px] font-semibold uppercase tracking-wider">Trending Worldwide</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_GLOBAL.map((s) => (
                <button key={s} onClick={() => setQuery(s)}
                  className="text-xs bg-surface border border-accent/20 px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:border-accent/50 transition-colors">
                  🔥 {s}
                </button>
              ))}
            </div>
          </div>

          {/* Trending — Indian */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base leading-none">🇮🇳</span>
              <span className="text-muted text-[11px] font-semibold uppercase tracking-wider">Indian Hits</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_INDIAN.map((s) => (
                <button key={s} onClick={() => setQuery(s)}
                  className="text-xs bg-surface border border-orange-500/25 px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:border-orange-400/60 transition-colors">
                  🎬 {s}
                </button>
              ))}
            </div>
          </div>


          {/* Hidden Gems — Global */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-purple-400" />
              <span className="text-purple-400 text-[11px] font-semibold uppercase tracking-wider">Hidden Gems</span>
            </div>
            <p className="text-muted text-[10px] mb-3">Critically loved, criminally underrated 🌍</p>
            <div className="flex flex-wrap gap-2">
              {HIDDEN_GEMS_GLOBAL.map((s) => (
                <button key={s} onClick={() => setQuery(s)}
                  className="text-xs bg-surface border border-purple-500/25 px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:border-purple-400/60 transition-colors">
                  💎 {s}
                </button>
              ))}
            </div>
          </div>

          {/* Hidden Gems — Indian */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-wider">Indian Hidden Gems</span>
            </div>
            <p className="text-muted text-[10px] mb-3">Masterpieces most people haven't seen 🇮🇳</p>
            <div className="flex flex-wrap gap-2">
              {HIDDEN_GEMS_INDIAN.map((s) => (
                <button key={s} onClick={() => setQuery(s)}
                  className="text-xs bg-surface border border-amber-500/25 px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:border-amber-400/60 transition-colors">
                  ✨ {s}
                </button>
              ))}
            </div>
          </div>

          {/* Hero prompt */}
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <div className="w-20 h-20 rounded-3xl bg-surface-2 flex items-center justify-center">
              <Search size={36} className="text-accent/50" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Find any movie</h3>
              <p className="text-muted text-sm mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                Search 6M+ titles and instantly add to your watchlist
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ── Search Result Card ── */
interface CardProps {
  result: OMDbSearchResult
  isAdded: boolean
  isAdding: boolean
  onAdd: (r: OMDbSearchResult) => void
}

function SearchResultCard({ result, isAdded, isAdding, onAdd }: CardProps) {
  const [imgError, setImgError] = useState(false)
  const poster = getOMDbPoster(result.Poster)

  return (
    <motion.div variants={item} className="flex gap-3 p-3 rounded-2xl border border-white/[0.06] bg-surface">
      <div className="flex-shrink-0 w-[60px] h-[90px] rounded-xl overflow-hidden bg-surface-2">
        {poster && !imgError ? (
          <img src={poster} alt={result.Title} className="w-full h-full object-cover" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="poster-placeholder w-full h-full"><Film size={18} className="text-muted" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-display font-bold text-white text-sm leading-tight line-clamp-2">{result.Title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted text-[11px]">{result.Year}</span>
            <span className="text-border text-[10px]">·</span>
            <span className="text-muted text-[10px] capitalize">{result.Type}</span>
          </div>
        </div>
        <p className="text-[10px] text-border/60 font-mono">{result.imdbID}</p>
      </div>
      <div className="flex items-center flex-shrink-0 self-center">
        <motion.button
          onClick={() => onAdd(result)} disabled={isAdded || isAdding}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-bold ${
            isAdded ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default'
              : 'bg-accent text-white active:scale-90 hover:bg-red-600 shadow-lg shadow-accent/20'
          }`}
          whileTap={isAdded ? {} : { scale: 0.88 }}
        >
          {isAdding ? <Loader2 size={16} className="animate-spin" /> : isAdded ? <CheckCircle size={16} /> : <Plus size={18} strokeWidth={2.5} />}
        </motion.button>
      </div>
    </motion.div>
  )
}
