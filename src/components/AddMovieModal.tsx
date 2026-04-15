/**
 * AddMovieModal — modal for adding movies manually
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Film } from 'lucide-react'
import { useMovieStore } from '../store/movieStore'

const GENRES_LIST = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller', 'War', 'Western',
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function AddMovieModal({ open, onClose }: Props) {
  const { addMovie } = useMovieStore()
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Please enter a movie title')
      return
    }
    addMovie({
      tmdbId: undefined,
      title: title.trim(),
      year: year.trim(),
      poster: null,
      genre: genres,
      overview: '',
      tmdbRating: 0,
      userRating: 0,
      userNotes: notes.trim(),
      status: 'watchlist',
    })
    // Reset
    setTitle('')
    setYear('')
    setGenres([])
    setNotes('')
    setError('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[300] rounded-t-3xl bg-surface border border-border/60"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ maxHeight: '90dvh', overflowY: 'auto' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-accent/15">
                    <Film size={18} className="text-accent" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-white">Add Movie</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-muted hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="text-sm text-muted font-medium mb-1.5 block">Movie Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError('') }}
                  placeholder="e.g. Inception"
                  className="w-full bg-surface-2 text-white text-sm rounded-xl px-4 py-3 border border-border placeholder:text-muted"
                  autoFocus
                />
                {error && <p className="text-accent text-xs mt-1">{error}</p>}
              </div>

              {/* Year */}
              <div className="mb-4">
                <label className="text-sm text-muted font-medium mb-1.5 block">Release Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2010"
                  min="1888"
                  max="2030"
                  className="w-full bg-surface-2 text-white text-sm rounded-xl px-4 py-3 border border-border placeholder:text-muted"
                />
              </div>

              {/* Genre picker */}
              <div className="mb-4">
                <label className="text-sm text-muted font-medium mb-2 block">Genres</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES_LIST.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        genres.includes(g)
                          ? 'bg-accent/20 border-accent/50 text-accent'
                          : 'bg-surface-2 border-border text-muted hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-sm text-muted font-medium mb-1.5 block">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why do you want to watch it?"
                  rows={2}
                  className="w-full bg-surface-2 text-white text-sm rounded-xl px-4 py-3 border border-border resize-none placeholder:text-muted"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #e50914 0%, #ff6b35 100%)' }}
              >
                <Plus size={18} />
                Add to Watchlist
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
