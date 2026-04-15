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

// Public demo key - replace with your own from https://www.themoviedb.org/settings/api
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

/**
 * Curated fallback movies shown when TMDB API is unavailable.
 * Uses real TMDB IDs and poster paths that can load via image CDN separately.
 */
export const FALLBACK_MOVIES: TMDBMovie[] = [
  {
    id: 550, title: 'Fight Club', release_date: '1999-10-15',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', backdrop_path: '/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg',
    overview: 'An insomniac office worker and a soap salesman build a global organization to help vent male aggression.',
    vote_average: 8.4, genre_ids: [18, 53], popularity: 100,
  },
  {
    id: 155, title: 'The Dark Knight', release_date: '2008-07-14',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: '/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
    overview: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must confront inner demons.',
    vote_average: 8.5, genre_ids: [28, 80, 18, 53], popularity: 120,
  },
  {
    id: 13, title: 'Forrest Gump', release_date: '1994-06-23',
    poster_path: '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', backdrop_path: '/qdIMHd4sEfJSckfVJfKQvisL02a.jpg',
    overview: 'The presidencies of Kennedy and Johnson, through the perspective of a man with an IQ of 75.',
    vote_average: 8.5, genre_ids: [35, 18, 10749], popularity: 110,
  },
  {
    id: 278, title: 'The Shawshank Redemption', release_date: '1994-09-23',
    poster_path: '/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg', backdrop_path: '/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg',
    overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption.',
    vote_average: 8.7, genre_ids: [18, 80], popularity: 115,
  },
  {
    id: 238, title: 'The Godfather', release_date: '1972-03-14',
    poster_path: '/3bhkrj58Vtu7enYsLeFJfT9bILB.jpg', backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    overview: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
    vote_average: 8.7, genre_ids: [18, 80], popularity: 105,
  },
  {
    id: 680, title: 'Pulp Fiction', release_date: '1994-09-10',
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', backdrop_path: '/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
    overview: 'The lives of two mob hitmen, a boxer, and a pair of bandits intertwine in four tales of violence.',
    vote_average: 8.5, genre_ids: [53, 80], popularity: 108,
  },
  {
    id: 372058, title: 'Your Name', release_date: '2016-08-26',
    poster_path: '/q719jXXEzOoYaps6babgKnONONX.jpg', backdrop_path: '/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg',
    overview: 'Two strangers find themselves linked in a bizarre way when they discover they are swapping bodies.',
    vote_average: 8.4, genre_ids: [16, 14, 10749], popularity: 95,
  },
  {
    id: 27205, title: 'Inception', release_date: '2010-07-15',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    overview: 'A thief who steals corporate secrets through dream-sharing is given a chance to have his past erased.',
    vote_average: 8.4, genre_ids: [28, 878, 53], popularity: 125,
  },
  {
    id: 82684, title: 'Interstellar', release_date: '2014-11-05',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdrop_path: '/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    vote_average: 8.4, genre_ids: [12, 18, 878], popularity: 118,
  },
  {
    id: 11, title: 'Star Wars', release_date: '1977-05-25',
    poster_path: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', backdrop_path: '/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg',
    overview: 'Luke Skywalker joins forces with a Jedi Knight and a roguish smuggler to save the galaxy.',
    vote_average: 8.2, genre_ids: [12, 28, 14, 878], popularity: 98,
  },
  {
    id: 346698, title: 'Barbie', release_date: '2023-07-19',
    poster_path: '/iuFNMS8vlbm6oAiCDgMFzQUGT8V.jpg', backdrop_path: '/nHf61UzkfFno5X1ofIjWpbaksNq.jpg',
    overview: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbieland.',
    vote_average: 7.1, genre_ids: [35, 12, 14], popularity: 130,
  },
  {
    id: 872585, title: 'Oppenheimer', release_date: '2023-07-19',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdrop_path: '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
    overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    vote_average: 8.1, genre_ids: [18, 36], popularity: 135,
  },
]
