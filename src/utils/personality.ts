/**
 * personality.ts — Movie Personality Profile engine
 * Analyzes watch history to generate a cinematic archetype
 */

import type { Movie } from '../store/movieStore'

export interface PersonalityProfile {
  archetype: string
  description: string
  icon: string
  dominantGenre: string
  traits: string[]
  color: string
}

const ARCHETYPES: Record<string, PersonalityProfile> = {
  'Sci-Fi': {
    archetype: 'The Visionary',
    description: 'You\'re drawn to the cosmos, technology, and the future. You ask "what if?" constantly.',
    icon: '🚀',
    dominantGenre: 'Sci-Fi',
    traits: ['Curious', 'Analytical', 'Future-focused'],
    color: '#00d4ff',
  },
  'Horror': {
    archetype: 'The Thrill Seeker',
    description: 'You crave adrenaline and the unknown. Fear is just another form of excitement to you.',
    icon: '💀',
    dominantGenre: 'Horror',
    traits: ['Bold', 'Intense', 'Fearless'],
    color: '#e50914',
  },
  'Drama': {
    archetype: 'The Empath',
    description: 'Deep human stories move you. You feel every character\'s journey as your own.',
    icon: '🎭',
    dominantGenre: 'Drama',
    traits: ['Empathetic', 'Thoughtful', 'Soulful'],
    color: '#3b82f6',
  },
  'Action': {
    archetype: 'The Strategist',
    description: 'Fast-paced, high-stakes, explosive — you live for the thrill of the mission.',
    icon: '⚡',
    dominantGenre: 'Action',
    traits: ['Decisive', 'Bold', 'Energetic'],
    color: '#f97316',
  },
  'Comedy': {
    archetype: 'The Optimist',
    description: 'Life is better with laughter. You find joy in the absurd and the everyday.',
    icon: '😄',
    dominantGenre: 'Comedy',
    traits: ['Cheerful', 'Social', 'Light-hearted'],
    color: '#f5c518',
  },
  'Romance': {
    archetype: 'The Dreamer',
    description: 'You believe in love, connection, and meaningful relationships above all else.',
    icon: '❤️',
    dominantGenre: 'Romance',
    traits: ['Romantic', 'Idealistic', 'Passionate'],
    color: '#ec4899',
  },
  'Thriller': {
    archetype: 'The Detective',
    description: 'You love unraveling mysteries. Every twist keeps you on the edge of your seat.',
    icon: '🔍',
    dominantGenre: 'Thriller',
    traits: ['Sharp', 'Observant', 'Intense'],
    color: '#8b5cf6',
  },
  'Animation': {
    archetype: 'The Free Spirit',
    description: 'You find magic in imagination. Age is just a number — wonder is ageless.',
    icon: '✨',
    dominantGenre: 'Animation',
    traits: ['Creative', 'Playful', 'Imaginative'],
    color: '#22d3a8',
  },
  'Adventure': {
    archetype: 'The Explorer',
    description: 'Every map has unexplored corners. You crave discovery and new horizons.',
    icon: '🗺️',
    dominantGenre: 'Adventure',
    traits: ['Adventurous', 'Brave', 'Curious'],
    color: '#84cc16',
  },
  'History': {
    archetype: 'The Scholar',
    description: 'Understanding the past shapes your vision of the future. You love context and depth.',
    icon: '📜',
    dominantGenre: 'History',
    traits: ['Wise', 'Patient', 'Knowledgeable'],
    color: '#d97706',
  },
}

const DEFAULT_PROFILE: PersonalityProfile = {
  archetype: 'The Cinephile',
  description: 'You\'re building your story. Watch more movies to reveal your cinematic personality.',
  icon: '🎬',
  dominantGenre: 'Mixed',
  traits: ['Eclectic', 'Open-minded', 'Curious'],
  color: '#e50914',
}

export function generatePersonality(watchedMovies: Movie[]): PersonalityProfile {
  if (watchedMovies.length < 3) return DEFAULT_PROFILE

  // Count genre frequency, weighted by user rating
  const freq: Record<string, number> = {}
  watchedMovies.forEach((m) => {
    const weight = m.userRating > 0 ? m.userRating : 2
    m.genre.forEach((g) => {
      freq[g] = (freq[g] ?? 0) + weight
    })
  })

  const topGenre = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0]
  return ARCHETYPES[topGenre] ?? DEFAULT_PROFILE
}

export function getGenreDistribution(movies: Movie[]): { genre: string; count: number; pct: number }[] {
  const freq: Record<string, number> = {}
  movies.forEach((m) => m.genre.forEach((g) => { freq[g] = (freq[g] ?? 0) + 1 }))
  const total = Object.values(freq).reduce((s, v) => s + v, 0)
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([genre, count]) => ({ genre, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
}

export function getWeeklyActivity(movies: Movie[]): { day: string; count: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const counts = [0, 0, 0, 0, 0, 0, 0]
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  movies
    .filter((m) => m.watchedAt && m.watchedAt >= oneWeekAgo)
    .forEach((m) => {
      const d = new Date(m.watchedAt!).getDay()
      counts[d]++
    })

  return days.map((day, i) => ({ day, count: counts[i] }))
}

export function getRatingTrend(movies: Movie[]): { label: string; avg: number }[] {
  const rated = movies
    .filter((m) => m.userRating > 0 && m.watchedAt)
    .sort((a, b) => (a.watchedAt ?? 0) - (b.watchedAt ?? 0))

  if (rated.length < 2) return []

  // Chunk into groups of max 5
  const chunkSize = Math.max(1, Math.ceil(rated.length / 5))
  const result: { label: string; avg: number }[] = []

  for (let i = 0; i < rated.length; i += chunkSize) {
    const chunk = rated.slice(i, i + chunkSize)
    const avg = chunk.reduce((s, m) => s + m.userRating, 0) / chunk.length
    result.push({ label: `#${i + 1}–${i + chunk.length}`, avg: Math.round(avg * 10) / 10 })
  }
  return result
}
