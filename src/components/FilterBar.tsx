/**
 * FilterBar — horizontal filter/sort controls for movie lists
 */

import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { useMovieStore, getAllGenres, type FilterState } from '../store/movieStore'

export default function FilterBar() {
  const { movies, filters, setFilter } = useMovieStore()
  const [open, setOpen] = useState(false)
  const genres = getAllGenres(movies)

  const hasActiveFilters = filters.genre || filters.minUserRating > 0 || filters.sortBy !== 'addedAt'

  const clearFilters = () => {
    setFilter({ genre: '', minUserRating: 0, sortBy: 'addedAt', sortDir: 'desc' })
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Filter toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 transition-all ${
            hasActiveFilters
              ? 'bg-accent/20 border-accent/40 text-accent'
              : 'bg-surface-2 border-border text-muted hover:text-white'
          }`}
        >
          <SlidersHorizontal size={12} />
          Filter
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          )}
        </button>

        {/* Sort quick picks */}
        {(['addedAt', 'rating', 'title'] as FilterState['sortBy'][]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter({ sortBy: s, sortDir: s === filters.sortBy && filters.sortDir === 'desc' ? 'asc' : 'desc' })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 transition-all ${
              filters.sortBy === s
                ? 'bg-surface-2 border-border text-white'
                : 'bg-transparent border-transparent text-muted'
            }`}
          >
            {s === 'addedAt' ? 'Recent' : s === 'rating' ? 'Rating' : 'A–Z'}
            {filters.sortBy === s && (
              <span className="ml-1">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-muted border border-border flex-shrink-0"
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {/* Genre filter */}
              {genres.length > 0 && (
                <div>
                  <p className="text-muted text-xs font-medium mb-2">Genre</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <button
                      onClick={() => setFilter({ genre: '' })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        !filters.genre
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-surface-2 border-border text-muted'
                      }`}
                    >
                      All
                    </button>
                    {genres.map((g) => (
                      <button
                        key={g}
                        onClick={() => setFilter({ genre: filters.genre === g ? '' : g })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          filters.genre === g
                            ? 'bg-accent/20 border-accent/40 text-accent'
                            : 'bg-surface-2 border-border text-muted hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Min rating filter */}
              <div>
                <p className="text-muted text-xs font-medium mb-2">
                  Min User Rating {filters.minUserRating > 0 && `(${filters.minUserRating}+ ★)`}
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilter({ minUserRating: r })}
                      className={`w-8 h-8 rounded-full text-xs font-semibold border transition-all ${
                        filters.minUserRating === r
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-surface-2 border-border text-muted'
                      }`}
                    >
                      {r === 0 ? 'All' : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
