/**
 * SearchPage.tsx
 * All discovery sections (Trending, Indian, Hidden Gems) are powered by OMDb API — fully dynamic, zero hardcoded movies.
 * Category definitions only store a search keyword; actual movie titles come from the OMDb API response.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search, Plus, Loader2, X, Film, CheckCircle, Clock, TrendingUp, Sparkles, Globe } from 'lucide-react'
import {
  searchMoviesOMDb,
  discoverByQuery,
  getMovieDetailOMDb,
  getOMDbPoster,
  parseOMDbGenres,
  parseOMDbRating,
  type OMDbSearchResult,
} from '../utils/omdb'
import { useMovieStore } from '../store/movieStore'

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

// Discovery section definitions — only keywords here, no movie titles
// OMDb returns the actual movie list dynamically at runtime
interface SectionDef {
  id: string
  label: string
  emoji: string
  subtitle?: string
  // Multiple search queries are tried in parallel and merged for variety
  queries: string[]
  chipClass: string
  iconColor: string
}

const DISCOVERY_SECTIONS: SectionDef[] = [
  {
    id: 'trending',
    label: 'Trending Worldwide',
    emoji: '🔥',
    queries: ['action 2024', 'thriller 2024', 'drama 2024'],
    chipClass: 'border-accent/20 hover:border-accent/50',
    iconColor: 'text-accent',
  },
  {
    id: 'indian',
    label: 'Indian Hits',
    emoji: '🎬',
    subtitle: 'Bollywood & regional cinema',
    queries: ['Bollywood 2023', 'Hindi movie', 'Indian drama'],
    chipClass: 'border-orange-500/25 hover:border-orange-400/60',
    iconColor: 'text-orange-400',
  },
  {
    id: 'gems_global',
    label: 'Hidden Gems',
    emoji: '💎',
    subtitle: 'Critically loved, criminally underrated 🌍',
    queries: ['cult classic thriller', 'independent film', 'underrated sci-fi'],
    chipClass: 'border-purple-500/25 hover:border-purple-400/60',
    iconColor: 'text-purple-400',
  },
  {
    id: 'gems_indian',
    label: 'Indian Hidden Gems',
    emoji: '✨',
    subtitle: "Masterpieces most people haven't seen 🇮🇳",
    queries: ['Hindi classic', 'Indian award', 'Bollywood hidden'],
    chipClass: 'border-amber-500/25 hover:border-amber-400/60',
    iconColor: 'text-amber-400',
  },
]

interface SectionState {
  movies: OMDbSearchResult[]
  loading: boolean
  error: boolean
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

  const [sections, setSections] = useState<Record<string, SectionState>>(() =>
    Object.fromEntries(DISCOVERY_SECTIONS.map((s) => [s.id, { movies: [], loading: true, error: false }]))
  )

  const { movies, addMovie } = useMovieStore()
  const addedImdbIds = new Set(movies.map((m) => m.imdbId).filter(Boolean))

  // Fetch all discovery sections on mount — all via OMDb
  useEffect(() => {
    const update = (id: string, patch: Partial<SectionState>) =>
      setSections((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

    DISCOVERY_SECTIONS.forEach((section) => {
      // Run all queries in parallel, merge, deduplicate
      Promise.all(section.queries.map((q) => discoverByQuery(q).catch(() => [] as OMDbSearchResult[])))
        .then((allResults) => {
          const seen = new Set<string>()
          const merged: OMDbSearchResult[] = []
          for (const batch of allResults) {
            for (const m of batch) {
              if (!seen.has(m.imdbID) && m.Type === 'movie') {
                seen.add(m.imdbID)
                merged.push(m)
              }
            }
          }
          if (merged.length === 0) {
            update(section.id, { loading: false, error: true })
          } else {
            update(section.id, { movies: merged.slice(0, 12), loading: false, error: false })
          }
        })
        .catch(() => update(section.id, { loading: false, error: true }))
    })
  }, [])

  // Debounced OMDb search
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
            : <Search size={17} className="text-muted" />}
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

      {/* Search Results */}
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

      {/* Discovery state — shown when no active search */}
      {!query && results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 py-2">

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-muted" />
                  <span className="text-muted text-[11px] font-semibold uppercase tracking-wider">Recent Searches</span>
                </div>
                <button onClick={() => { clearRecent(); setRecentSearches([]) }}
                  className="text-muted text-[11px] hover:text-white transition-colors">Clear</button>
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

          {/* Dynamic OMDb-powered discovery sections */}
          {DISCOVERY_SECTIONS.map((section) => {
            const state = sections[section.id]
            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-1">
                  {section.id === 'trending' ? <TrendingUp size={13} className={section.iconColor} /> :
                   section.id === 'indian' ? <Globe size={13} className={section.iconColor} /> :
                   <Sparkles size={13} className={section.iconColor} />}
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${section.iconColor}`}>
                    {section.label}
                  </span>
                </div>
                {section.subtitle && (
                  <p className="text-muted text-[10px] mb-3">{section.subtitle}</p>
                )}

                {state.loading ? (
                  <div className="flex gap-2 flex-wrap">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-7 w-24 rounded-full bg-surface animate-pulse" />
                    ))}
                  </div>
                ) : state.error ? (
                  <p className="text-muted text-xs italic">Could not load — check your connection.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {state.movies.map((m) => (
                      <button key={m.imdbID} onClick={() => setQuery(m.Title)}
                        className={`text-xs bg-surface border ${section.chipClass} px-3 py-1.5 rounded-full text-white/70 hover:text-white transition-colors`}>
                        {section.emoji} {m.Title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

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
