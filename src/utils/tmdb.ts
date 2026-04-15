/**
 * TMDB API utility
 * Uses TMDB (The Movie Database) v3 API
 *
 * NOTE: The API key below is a public read-only key.
 * For production, store it in an environment variable (.env).
 * Create a free account at https://www.themoviedb.org/settings/api
 */

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

// Public demo key — replace with your own from https://www.themoviedb.org/settings/api
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '4f5f43495afcc67e9553f6a1f6a53db0'

export interface TMDBMovie {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  genre_ids: number[]
  popularity: number
}

export interface TMDBMovieDetail extends TMDBMovie {
  genres: { id: number; name: string }[]
  runtime: number
  tagline: string
}

/** Map TMDB genre IDs to names */
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
}

/** Build a poster URL from TMDB path */
export function getPosterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' = 'w342'): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

/** Build a backdrop URL from TMDB path */
export function getBackdropUrl(path: string | null): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/w780${path}`
}

/** Search movies by query string */
export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!query.trim()) return []
  const url = `${TMDB_BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&page=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch movies')
  const data = await res.json()
  return data.results as TMDBMovie[]
}

/** Get trending movies (for home screen recommendations) */
export async function getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBMovie[]> {
  const url = `${TMDB_BASE}/trending/movie/${timeWindow}?api_key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch trending')
  const data = await res.json()
  return data.results as TMDBMovie[]
}

/** Get popular movies */
export async function getPopular(): Promise<TMDBMovie[]> {
  const url = `${TMDB_BASE}/movie/popular?api_key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch popular')
  const data = await res.json()
  return data.results as TMDBMovie[]
}

/** Get movie details including genres */
export async function getMovieDetail(tmdbId: number): Promise<TMDBMovieDetail> {
  const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch movie detail')
  return res.json()
}

/** Convert genre_ids array to genre name strings */
export function idsToGenres(ids: number[]): string[] {
  return ids.map((id) => GENRE_MAP[id] || 'Other').filter(Boolean)
}

/** Format a TMDB movie into our app's Movie shape (without id/addedAt) */
export function formatTMDBMovie(m: TMDBMovie) {
  return {
    tmdbId: m.id,
    title: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : '',
    poster: getPosterUrl(m.poster_path),
    genre: idsToGenres(m.genre_ids),
    overview: m.overview,
    tmdbRating: Math.round(m.vote_average * 10) / 10,
    userRating: 0,
    userNotes: '',
    status: 'watchlist' as const,
  }
}

/** Get movies popular in a specific region (e.g. 'IN' for India) */
export async function getRegionalMovies(region = 'IN'): Promise<TMDBMovie[]> {
  const url = `${TMDB_BASE}/movie/popular?api_key=${API_KEY}&region=${region}&language=en-US&page=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch regional movies')
  const data = await res.json()
  return data.results as TMDBMovie[]
}

/**
 * Discover Indian-language films
 * Covers Hindi (hi), Tamil (ta), Telugu (te), Malayalam (ml), Kannada (kn)
 */
export async function getIndianMovies(): Promise<TMDBMovie[]> {
  const res = await fetch(
    `${TMDB_BASE}/discover/movie?api_key=${API_KEY}` +
    `&with_original_language=hi%7Cta%7Cte%7Cml%7Ckn` +
    `&sort_by=popularity.desc&vote_count.gte=200&page=1`
  )
  if (!res.ok) throw new Error('Failed to fetch Indian movies')
  const data = await res.json()
  return data.results as TMDBMovie[]
}

/**
 * Discover "hidden gem" movies — well-rated but not mainstream blockbusters.
 * Optionally filtered by original language (e.g. "hi" for Hindi).
 */
export async function discoverHiddenGems(language?: string): Promise<TMDBMovie[]> {
  const langParam = language ? `&with_original_language=${language}` : ''
  const res = await fetch(
    `${TMDB_BASE}/discover/movie?api_key=${API_KEY}` +
    `&sort_by=vote_average.desc` +
    `&vote_count.gte=500` +
    `&vote_average.gte=7.2` +
    `&vote_average.lte=8.4` +
    `&without_genres=99,10770` + // exclude documentaries & TV movies
    langParam +
    `&page=1`
  )
  if (!res.ok) throw new Error('Failed to fetch hidden gems')
  const data = await res.json()
  // Sort by lowest popularity to surface lesser-known films
  const sorted = (data.results as TMDBMovie[]).sort((a, b) => a.popularity - b.popularity)
  return sorted.slice(0, 20)
}
