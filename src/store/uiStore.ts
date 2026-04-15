/**
 * uiStore.ts — Ephemeral UI state (not persisted)
 * Mood filter, theme, bulk selection, cinematic mode
 */

import { create } from 'zustand'

export type Mood = 'all' | 'feelgood' | 'mindblow' | 'emotional' | 'thriller' | 'action'
export type AppTheme = 'default' | 'horror' | 'scifi' | 'romance' | 'comedy' | 'action'

interface UIStore {
  // Mood
  activeMood: Mood
  setMood: (mood: Mood) => void

  // Theme
  activeTheme: AppTheme
  setTheme: (theme: AppTheme) => void

  // Bulk selection
  selectedMovieIds: Set<string>
  isBulkMode: boolean
  toggleBulkMode: () => void
  toggleSelect: (id: string) => void
  clearSelection: () => void

  // Cinematic mode
  cinematicMovieId: string | null
  setCinematicMovie: (id: string | null) => void

  // Achievement toast queue
  pendingAchievements: { id: string; title: string; icon: string }[]
  queueAchievement: (a: { id: string; title: string; icon: string }) => void
  dismissAchievement: () => void

  // Confetti trigger
  confettiTrigger: number
  fireConfetti: () => void
}

export const useUIStore = create<UIStore>()((set) => ({
  activeMood: 'all',
  setMood: (mood) => set({ activeMood: mood }),

  activeTheme: 'default',
  setTheme: (theme) => set({ activeTheme: theme }),

  selectedMovieIds: new Set(),
  isBulkMode: false,
  toggleBulkMode: () =>
    set((s) => ({ isBulkMode: !s.isBulkMode, selectedMovieIds: new Set() })),
  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedMovieIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedMovieIds: next }
    }),
  clearSelection: () => set({ selectedMovieIds: new Set(), isBulkMode: false }),

  cinematicMovieId: null,
  setCinematicMovie: (id) => set({ cinematicMovieId: id }),

  pendingAchievements: [],
  queueAchievement: (a) =>
    set((s) => ({ pendingAchievements: [...s.pendingAchievements, a] })),
  dismissAchievement: () =>
    set((s) => ({ pendingAchievements: s.pendingAchievements.slice(1) })),

  confettiTrigger: 0,
  fireConfetti: () => set((s) => ({ confettiTrigger: s.confettiTrigger + 1 })),
}))

/* ── MOOD → GENRE mapping ── */
export const MOOD_GENRES: Record<Mood, string[]> = {
  all:       [],
  feelgood:  ['Comedy', 'Animation', 'Family', 'Romance', 'Music'],
  mindblow:  ['Sci-Fi', 'Mystery', 'Thriller', 'Fantasy'],
  emotional: ['Drama', 'Romance', 'History', 'War'],
  thriller:  ['Thriller', 'Horror', 'Crime', 'Mystery'],
  action:    ['Action', 'Adventure', 'Western'],
}

export const MOOD_META: Record<Mood, { label: string; emoji: string; color: string }> = {
  all:       { label: 'All',        emoji: '🎬', color: '#8888a0' },
  feelgood:  { label: 'Feel Good',  emoji: '😄', color: '#f5c518' },
  mindblow:  { label: 'Mind Blow',  emoji: '🤯', color: '#7c3aed' },
  emotional: { label: 'Emotional',  emoji: '😢', color: '#3b82f6' },
  thriller:  { label: 'Thriller',   emoji: '😱', color: '#e50914' },
  action:    { label: 'Action',     emoji: '💥', color: '#f97316' },
}
