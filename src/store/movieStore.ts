/**
 * movieStore.ts — Upgraded Zustand store for CineTrack v2
 * New: isFavorite, tags, schema migration from v1 → v2
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MovieStatus = 'watchlist' | 'watched'

export interface Movie {
  id: string
  tmdbId?: number
  imdbId?: string
  title: string
  year: string
  poster: string | null
  genre: string[]
  overview: string
  tmdbRating: number
  userRating: number
  userNotes: string
  status: MovieStatus
  addedAt: number
  watchedAt?: number
  isFavorite?: boolean
  tags?: string[]
  lastViewedAt?: number // for smart daily pick
}

export interface FilterState {
  genre: string
  sortBy: 'addedAt' | 'rating' | 'title' | 'year'
  sortDir: 'asc' | 'desc'
  minUserRating: number
}

interface MovieStore {
  movies: Movie[]
  filters: FilterState
  addMovie: (movie: Omit<Movie, 'id' | 'addedAt'>) => void
  removeMovie: (id: string) => void
  markWatched: (id: string) => void
  moveToWatchlist: (id: string) => void
  updateUserRating: (id: string, rating: number) => void
  updateUserNotes: (id: string, notes: string) => void
  toggleFavorite: (id: string) => void
  addTag: (id: string, tag: string) => void
  removeTag: (id: string, tag: string) => void
  setFilter: (filter: Partial<FilterState>) => void
  importMovies: (movies: Movie[]) => void
  clearAll: () => void
  getWatchlist: () => Movie[]
  getWatched: () => Movie[]
}

export const useMovieStore = create<MovieStore>()(
  persist(
    (set, get) => ({
      movies: [],
      filters: {
        genre: '',
        sortBy: 'addedAt',
        sortDir: 'desc',
        minUserRating: 0,
      },

      addMovie: (movie) => {
        // Prevent duplicates by imdbId or tmdbId
        const existing = get().movies
        if (movie.imdbId && existing.some((m) => m.imdbId === movie.imdbId)) return
        if (movie.tmdbId && existing.some((m) => m.tmdbId === movie.tmdbId)) return
        set((state) => ({
          movies: [
            {
              ...movie,
              id: `movie_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              addedAt: Date.now(),
              isFavorite: false,
              tags: [],
            },
            ...state.movies,
          ],
        }))
      },

      removeMovie: (id) =>
        set((state) => ({ movies: state.movies.filter((m) => m.id !== id) })),

      markWatched: (id) =>
        set((state) => ({
          movies: state.movies.map((m) =>
            m.id === id ? { ...m, status: 'watched', watchedAt: Date.now() } : m
          ),
        })),

      moveToWatchlist: (id) =>
        set((state) => ({
          movies: state.movies.map((m) =>
            m.id === id ? { ...m, status: 'watchlist', watchedAt: undefined } : m
          ),
        })),

      updateUserRating: (id, rating) =>
        set((state) => ({
          movies: state.movies.map((m) => (m.id === id ? { ...m, userRating: rating } : m)),
        })),

      updateUserNotes: (id, notes) =>
        set((state) => ({
          movies: state.movies.map((m) => (m.id === id ? { ...m, userNotes: notes } : m)),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          movies: state.movies.map((m) =>
            m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
          ),
        })),

      addTag: (id, tag) =>
        set((state) => ({
          movies: state.movies.map((m) =>
            m.id === id
              ? { ...m, tags: [...new Set([...(m.tags ?? []), tag.trim()])] }
              : m
          ),
        })),

      removeTag: (id, tag) =>
        set((state) => ({
          movies: state.movies.map((m) =>
            m.id === id
              ? { ...m, tags: (m.tags ?? []).filter((t) => t !== tag) }
              : m
          ),
        })),

      setFilter: (filter) =>
        set((state) => ({ filters: { ...state.filters, ...filter } })),

      importMovies: (movies) =>
        set(() => ({ movies })),

      clearAll: () => set(() => ({ movies: [] })),

      getWatchlist: () => get().movies.filter((m) => m.status === 'watchlist'),
      getWatched: () => get().movies.filter((m) => m.status === 'watched'),
    }),
    {
      name: 'cinetrack-v2',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        // Migrate from v1 (cinetrack-movies) if needed
        if (version < 2) {
          const old = persisted as { movies?: Movie[] }
          return {
            movies: (old.movies ?? []).map((m) => ({
              ...m,
              isFavorite: false,
              tags: [],
            })),
            filters: {
              genre: '',
              sortBy: 'addedAt' as const,
              sortDir: 'desc' as const,
              minUserRating: 0,
            },
          }
        }
        return persisted as { movies: Movie[]; filters: FilterState }
      },
    }
  )
)

/* ── Selectors / Helpers ── */

export function applyFilters(movies: Movie[], filters: FilterState): Movie[] {
  let result = [...movies]
  if (filters.genre)
    result = result.filter((m) =>
      m.genre.some((g) => g.toLowerCase() === filters.genre.toLowerCase())
    )
  if (filters.minUserRating > 0)
    result = result.filter((m) => m.userRating >= filters.minUserRating)

  result.sort((a, b) => {
    let cmp = 0
    switch (filters.sortBy) {
      case 'addedAt': cmp = a.addedAt - b.addedAt; break
      case 'rating':  cmp = a.tmdbRating - b.tmdbRating; break
      case 'title':   cmp = a.title.localeCompare(b.title); break
      case 'year':    cmp = parseInt(a.year || '0') - parseInt(b.year || '0'); break
    }
    return filters.sortDir === 'asc' ? cmp : -cmp
  })
  return result
}

export function getAllGenres(movies: Movie[]): string[] {
  const s = new Set<string>()
  movies.forEach((m) => m.genre.forEach((g) => s.add(g)))
  return Array.from(s).sort()
}
