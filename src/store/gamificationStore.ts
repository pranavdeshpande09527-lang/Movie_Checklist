/**
 * gamificationStore.ts — Streak, Achievements, Goals, Personality
 * Persisted separately so it's independent of movie data
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ── Achievement Definitions ── */
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string       // emoji
  unlockedAt?: number
  unlocked: boolean
}

export const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_watch',    icon: '🎬', title: 'First Watch',       description: 'Watch your first movie' },
  { id: 'ten_club',       icon: '🏆', title: '10 Club',           description: 'Watch 10 movies total' },
  { id: 'fifty_club',     icon: '🌟', title: '50 Club',           description: 'Watch 50 movies total' },
  { id: 'century',        icon: '💯', title: 'Century',           description: 'Watch 100 movies total' },
  { id: 'critic',         icon: '⭐', title: 'The Critic',        description: 'Rate 10 movies' },
  { id: 'perfect_score',  icon: '🎯', title: 'Perfect Score',     description: 'Give a 5-star rating' },
  { id: 'genre_explorer', icon: '🎭', title: 'Genre Explorer',    description: 'Watch movies in 5 different genres' },
  { id: 'binge',          icon: '🔥', title: 'Binge Watch',       description: 'Add 5 movies in one day' },
  { id: 'streak_three',   icon: '📅', title: '3-Day Streak',      description: 'Watch movies 3 days in a row' },
  { id: 'streak_seven',   icon: '🗓️', title: 'Week Warrior',      description: 'Watch movies 7 days in a row' },
  { id: 'night_owl',      icon: '🦉', title: 'Night Owl',         description: 'Watch a movie after midnight' },
  { id: 'hoarder',        icon: '📚', title: 'The Collector',     description: 'Add 25 movies to your watchlist' },
]

/* ── Goal ── */
export interface WatchGoal {
  id: string
  label: string           // e.g. "Watch 10 movies this month"
  target: number
  period: 'week' | 'month' | 'alltime'
  createdAt: number
}

/* ── Store Types ── */
interface GamificationStore {
  achievements: Achievement[]
  streak: number
  lastWatchedDate: string | null  // ISO date string YYYY-MM-DD
  bestStreak: number
  goals: WatchGoal[]

  // Actions
  checkAndUnlockAchievements: (params: {
    totalWatched: number
    ratedCount: number
    genreCount: number
    addedToday: number
    watchedGenres: string[]
    hour: number
    totalAdded: number
  }) => Achievement[]  // returns newly unlocked
  updateStreak: () => void
  addGoal: (goal: Omit<WatchGoal, 'id' | 'createdAt'>) => void
  removeGoal: (id: string) => void
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      achievements: ACHIEVEMENT_DEFS.map((a) => ({ ...a, unlocked: false })),
      streak: 0,
      lastWatchedDate: null,
      bestStreak: 0,
      goals: [],

      checkAndUnlockAchievements: ({ totalWatched, ratedCount, genreCount, addedToday, hour, totalAdded }) => {
        const { achievements } = get()
        const newlyUnlocked: Achievement[] = []

        const conditions: Record<string, boolean> = {
          first_watch:    totalWatched >= 1,
          ten_club:       totalWatched >= 10,
          fifty_club:     totalWatched >= 50,
          century:        totalWatched >= 100,
          critic:         ratedCount >= 10,
          perfect_score:  false, // handled by rating action
          genre_explorer: genreCount >= 5,
          binge:          addedToday >= 5,
          streak_three:   get().streak >= 3,
          streak_seven:   get().streak >= 7,
          night_owl:      hour >= 23 || hour < 4,
          hoarder:        totalAdded >= 25,
        }

        const updated = achievements.map((a) => {
          if (!a.unlocked && conditions[a.id]) {
            const unlocked = { ...a, unlocked: true, unlockedAt: Date.now() }
            newlyUnlocked.push(unlocked)
            return unlocked
          }
          return a
        })

        if (newlyUnlocked.length > 0) set({ achievements: updated })
        return newlyUnlocked
      },

      updateStreak: () => {
        const today = new Date().toISOString().slice(0, 10)
        const { lastWatchedDate, streak, bestStreak } = get()

        if (lastWatchedDate === today) return // already updated today

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yest = yesterday.toISOString().slice(0, 10)

        const newStreak = lastWatchedDate === yest ? streak + 1 : 1
        const newBest = Math.max(newStreak, bestStreak)

        set({ streak: newStreak, lastWatchedDate: today, bestStreak: newBest })
      },

      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            { ...goal, id: `goal_${Date.now()}`, createdAt: Date.now() },
          ],
        })),

      removeGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
    }),
    { name: 'cinetrack-gamification', version: 1 }
  )
)

/* ── Helpers ── */
export function getGoalProgress(goal: WatchGoal, watchedMovies: { watchedAt?: number }[]): number {
  const now = Date.now()
  let filtered = watchedMovies.filter((m) => m.watchedAt)

  if (goal.period === 'week') {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    filtered = filtered.filter((m) => (m.watchedAt ?? 0) >= weekAgo)
  } else if (goal.period === 'month') {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    filtered = filtered.filter((m) => (m.watchedAt ?? 0) >= monthAgo.getTime())
  }

  return Math.min(filtered.length, goal.target)
}
