/**
 * recommendations.ts — Heuristic recommendation engine
 * No external API needed — pure local logic
 */

import type { Movie } from '../store/movieStore'

export interface Recommendation {
  movie: Movie
  score: number
  reason: string
}

/** Analyze watch history to find top genres */
export function getTopGenres(watched: Movie[]): string[] {
  const freq: Record<string, number> = {}
  watched.forEach((m) => {
    m.genre.forEach((g) => {
      freq[g] = (freq[g] ?? 0) + (m.userRating > 0 ? m.userRating : 3)
    })
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g)
}

/** Get top-rated movies by the user (userRating ≥ 4) */
export function getLikedMovies(watched: Movie[]): Movie[] {
  return watched.filter((m) => m.userRating >= 4)
}

/**
 * Score an unwatched movie for recommendation.
 * Higher = more relevant.
 */
function scoreMovie(movie: Movie, topGenres: string[]): number {
  let score = 0

  // Genre match
  const genreHits = movie.genre.filter((g) => topGenres.includes(g)).length
  score += genreHits * 25

  // TMDB rating (normalize 0-10 → 0-20 pts)
  score += (movie.tmdbRating / 10) * 20

  // Recency bonus: newer additions score higher
  const ageHours = (Date.now() - movie.addedAt) / (1000 * 60 * 60)
  score += Math.max(0, 10 - ageHours / 24) // up to 10 pts for last 10 days

  // Favorite bonus
  if (movie.isFavorite) score += 15

  return score
}

/**
 * Build smart recommendations from unwatched movies.
 * Returns top 10 with reason strings.
 */
export function getRecommendations(
  allMovies: Movie[],
  limit = 10
): Recommendation[] {
  const watched = allMovies.filter((m) => m.status === 'watched')
  const unwatched = allMovies.filter((m) => m.status === 'watchlist')

  if (unwatched.length === 0) return []

  const topGenres = getTopGenres(watched)
  const likedGenres = topGenres.slice(0, 2)

  const scored = unwatched.map((movie) => {
    const score = scoreMovie(movie, topGenres)
    let reason = 'Highly rated on TMDB'
    if (movie.genre.some((g) => likedGenres.includes(g))) {
      reason = `Because you love ${likedGenres[0] ?? 'movies like this'}`
    } else if (movie.isFavorite) {
      reason = 'One of your favourites'
    } else if (movie.tmdbRating >= 8) {
      reason = 'Critically acclaimed'
    } else if ((Date.now() - movie.addedAt) < 3 * 24 * 60 * 60 * 1000) {
      reason = 'Recently added by you'
    }
    return { movie, score, reason }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Smart Daily Pick:
 * - Must be unwatched
 * - Weighted by TMDB rating + genre preference
 * - Rotates daily (deterministic based on date)
 */
export function getDailyPick(allMovies: Movie[]): Movie | null {
  const unwatched = allMovies.filter((m) => m.status === 'watchlist')
  if (unwatched.length === 0) return null

  const watched = allMovies.filter((m) => m.status === 'watched')
  const topGenres = getTopGenres(watched)

  // Score + pick deterministically by day
  const scored = unwatched
    .map((m) => ({ movie: m, score: scoreMovie(m, topGenres) }))
    .sort((a, b) => b.score - a.score)

  // Top 5 highest scored, then rotate by day index
  const pool = scored.slice(0, Math.min(5, scored.length))
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return pool[dayIndex % pool.length].movie
}

/**
 * Mood-based filter: returns movies matching a mood's genres
 */
export function filterByMoodGenres(movies: Movie[], genres: string[]): Movie[] {
  if (genres.length === 0) return movies
  return movies.filter((m) => m.genre.some((g) => genres.includes(g)))
}
