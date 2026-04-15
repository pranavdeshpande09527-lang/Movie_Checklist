/**
 * WatchlistPage.tsx — Full watchlist with bulk actions, filtering, export/import
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Upload, Layers } from 'lucide-react'
import MovieCard from '../components/MovieCard'
import MovieDetailDrawer from '../components/MovieDetailDrawer'
import FilterBar from '../components/FilterBar'
import StatsBar from '../components/StatsBar'
import BulkActionBar from '../components/BulkActionBar'
import { useMovieStore, applyFilters } from '../store/movieStore'
import { useUIStore } from '../store/uiStore'
import type { Movie } from '../store/movieStore'

export default function WatchlistPage() {
  const { movies, filters, importMovies } = useMovieStore()
  const { isBulkMode, toggleBulkMode } = useUIStore()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const watchlist = movies.filter((m) => m.status === 'watchlist')
  const filtered = applyFilters(watchlist, filters)

  const handleExport = () => {
    const data = JSON.stringify({ version: 2, exportedAt: Date.now(), movies }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cinetrack-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const moviesData: Movie[] = data.movies ?? data // support legacy format
        if (Array.isArray(moviesData)) {
          importMovies(moviesData)
        }
      } catch {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-container pb-safe px-4 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-extrabold text-xl text-white">Watchlist</h1>
          <p className="text-muted text-xs mt-0.5">{watchlist.length} movies to watch</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk mode */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleBulkMode}
            className={`p-2 rounded-xl transition-all ${isBulkMode ? 'bg-accent/20 text-accent' : 'bg-surface text-muted'} border border-border/40`}
          >
            <Layers size={16} />
          </motion.button>

          {/* Export */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleExport}
            className="p-2 rounded-xl border border-border/40 bg-surface text-muted hover:text-white transition-colors">
            <Download size={16} />
          </motion.button>

          {/* Import */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl border border-border/40 bg-surface text-muted hover:text-white transition-colors">
            <Upload size={16} />
          </motion.button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <StatsBar />
      <FilterBar />

      {watchlist.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="font-display font-bold text-white text-lg mb-2">Empty Watchlist</h3>
          <p className="text-muted text-sm">Head to Search to find movies to add!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-muted text-sm">No movies match these filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <MovieDetailDrawer movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      <BulkActionBar />
    </div>
  )
}
