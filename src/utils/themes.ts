/**
 * themes.ts — Dynamic genre-based CSS theme system
 */

export type AppTheme = 'default' | 'horror' | 'scifi' | 'romance' | 'comedy' | 'action'

interface ThemeConfig {
  label: string
  accent: string
  accentDim: string
  bg: string
  surface: string
  surface2: string
  gradient: string
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  default: {
    label: 'Cinema',
    accent: '#e50914',
    accentDim: 'rgba(229,9,20,0.15)',
    bg: '#0f0f13',
    surface: '#1a1a24',
    surface2: '#232335',
    gradient: 'linear-gradient(135deg, #e50914 0%, #ff6b35 50%, #f5c518 100%)',
  },
  horror: {
    label: 'Horror',
    accent: '#8b0000',
    accentDim: 'rgba(139,0,0,0.2)',
    bg: '#0a0000',
    surface: '#160808',
    surface2: '#1e0e0e',
    gradient: 'linear-gradient(135deg, #8b0000 0%, #c0392b 100%)',
  },
  scifi: {
    label: 'Sci-Fi',
    accent: '#00d4ff',
    accentDim: 'rgba(0,212,255,0.15)',
    bg: '#000a14',
    surface: '#061220',
    surface2: '#0a1e30',
    gradient: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
  },
  romance: {
    label: 'Romance',
    accent: '#ec4899',
    accentDim: 'rgba(236,72,153,0.15)',
    bg: '#0f0008',
    surface: '#1a0010',
    surface2: '#23001a',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  },
  comedy: {
    label: 'Comedy',
    accent: '#f5c518',
    accentDim: 'rgba(245,197,24,0.15)',
    bg: '#0f0e00',
    surface: '#1a1900',
    surface2: '#252300',
    gradient: 'linear-gradient(135deg, #f5c518 0%, #f97316 100%)',
  },
  action: {
    label: 'Action',
    accent: '#f97316',
    accentDim: 'rgba(249,115,22,0.15)',
    bg: '#0f0800',
    surface: '#1a1000',
    surface2: '#231800',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
  },
}

const GENRE_TO_THEME: Record<string, AppTheme> = {
  Horror: 'horror',
  Thriller: 'horror',
  'Sci-Fi': 'scifi',
  Fantasy: 'scifi',
  Romance: 'romance',
  Comedy: 'comedy',
  Animation: 'comedy',
  Action: 'action',
  Adventure: 'action',
}

export function genreToTheme(genre: string): AppTheme {
  return GENRE_TO_THEME[genre] ?? 'default'
}

export function applyTheme(theme: AppTheme) {
  const t = THEMES[theme]
  const root = document.documentElement
  root.style.setProperty('--color-accent', t.accent)
  root.style.setProperty('--color-accent-dim', t.accentDim)
  root.style.setProperty('--color-bg', t.bg)
  root.style.setProperty('--color-surface', t.surface)
  root.style.setProperty('--color-surface-2', t.surface2)
}

export function resetTheme() {
  applyTheme('default')
}
