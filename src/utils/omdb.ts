/**
 * OMDb API utility — Open Movie Database
 * https://www.omdbapi.com
 *
 * Used for: Movie search by title, fetching detailed movie info
 * TMDB is used separately for Trending (Home page)
 */

const OMDB_BASE = 'https://www.omdbapi.com'
const API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'ec0083da'

/* ===== TYPES ===== */

export interface OMDbSearchResult {
  imdbID: string
  Title: string
  Year: string
  Poster: string // URL or "N/A"
  Type: string   // "movie" | "series" | "episode"
}

export interface OMDbMovieDetail {
  imdbID: string
  Title: string
  Year: string
  Poster: string
  Genre: string        // comma-separated e.g. "Action, Drama"
  Plot: string
  imdbRating: string   // e.g. "8.4" or "N/A"
  Director: string
  Actors: string
  Runtime: string      // e.g. "148 min"
  Rated: string        // e.g. "PG-13"
  Released: string
}

/* ===== API FUNCTIONS ===== */

/**
 * Search movies by title using OMDb
 * Returns up to 10 results per page
 */
export async function searchMoviesOMDb(query: string, page = 1): Promise<OMDbSearchResult[]> {
  if (!query.trim()) return []
  const url = `${OMDB_BASE}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie&page=${page}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('OMDb network error')
  const data = await res.json()
  if (data.Response === 'False') return []
  return (data.Search ?? []) as OMDbSearchResult[]
}

/**
 * Discover movies by a dynamic category keyword.
 * Used to power discovery sections (trending, Indian, hidden gems) dynamically via OMDb.
 */
export async function discoverByQuery(query: string): Promise<OMDbSearchResult[]> {
  return searchMoviesOMDb(query, 1)
}

/**
 * Filter OMDb results to real, watchable feature films.
 * Removes short films, award shows, compilations, making-of docs, etc.
 */
export function isGoodMovie(m: OMDbSearchResult): boolean {
  if (m.Type !== 'movie') return false
  const t = m.Title.toLowerCase()
  const JUNK_PATTERNS = [
    'short film', 'short films', 'compilation', 'collection', 'anthology',
    'nominated', 'award ceremony', 'awards show', 'highlights', 'ceremony',
    'behind the scene', 'making of', 'making-of', 'documentary',
    'the making', 'recap', 'extras', 'special edition', 'cut scenes',
    'volume 1', 'volume 2', 'part 1:', 'part 2:', 'season',
    'vii', 'viii', ':episode', 'episode ', 'live action performance',
    'live performance', 'concert', 'stage show', 'ballet',
    'anniversary', 'tribute', 'best of',
  ]
  return !JUNK_PATTERNS.some((p) => t.includes(p))
}

/**
 * Fetch detailed movie info by IMDb ID
 */
export async function getMovieDetailOMDb(imdbId: string): Promise<OMDbMovieDetail | null> {
  const url = `${OMDB_BASE}/?apikey=${API_KEY}&i=${imdbId}&plot=short`
  const res = await fetch(url)
  if (!res.ok) return null

  const data = await res.json()
  if (data.Response === 'False') return null

  return data as OMDbMovieDetail
}

/* ===== HELPERS ===== */

/** Convert OMDb poster URL — returns null if "N/A" */
export function getOMDbPoster(poster: string): string | null {
  return poster && poster !== 'N/A' ? poster : null
}

/** Parse OMDb genre string into array */
export function parseOMDbGenres(genre: string): string[] {
  if (!genre || genre === 'N/A') return []
  return genre.split(',').map((g) => g.trim())
}

/** Parse OMDb imdbRating string into number (0 if N/A) */
export function parseOMDbRating(rating: string): number {
  if (!rating || rating === 'N/A') return 0
  return parseFloat(rating)
}

/** Format an OMDb search result into our app's Movie shape */
export function formatOMDbMovie(m: OMDbMovieDetail) {
  return {
    tmdbId: undefined,
    imdbId: m.imdbID,
    title: m.Title,
    year: m.Year?.slice(0, 4) ?? '',
    poster: getOMDbPoster(m.Poster),
    genre: parseOMDbGenres(m.Genre),
    overview: m.Plot !== 'N/A' ? m.Plot : '',
    tmdbRating: parseOMDbRating(m.imdbRating),
    userRating: 0,
    userNotes: '',
    status: 'watchlist' as const,
  }
}

/** Format a search result (without detail) into our app's Movie shape */
export function formatOMDbSearchResult(m: OMDbSearchResult) {
  return {
    tmdbId: undefined,
    imdbId: m.imdbID,
    title: m.Title,
    year: m.Year?.slice(0, 4) ?? '',
    poster: getOMDbPoster(m.Poster),
    genre: [],
    overview: '',
    tmdbRating: 0,
    userRating: 0,
    userNotes: '',
    status: 'watchlist' as const,
  }
}
