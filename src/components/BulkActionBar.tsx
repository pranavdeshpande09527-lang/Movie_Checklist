/**
 * BulkActionBar.tsx — Floating bar for bulk movie operations
 * Appears when isBulkMode is active and ≥1 movie is selected
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Trash2, X, CheckSquare } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useMovieStore } from '../store/movieStore'
import { useUIStore as useUI } from '../store/uiStore'

interface Props {
  onConfettiWatch?: () => void
}

export default function BulkActionBar({ onConfettiWatch }: Props) {
  const { selectedMovieIds, isBulkMode, clearSelection } = useUIStore()
  const { markWatched, removeMovie } = useMovieStore()
  const { fireConfetti } = useUI()

  const count = selectedMovieIds.size
  const visible = isBulkMode && count > 0

  const handleMarkWatched = () => {
    selectedMovieIds.forEach((id) => markWatched(id))
    if (count > 0) fireConfetti()
    onConfettiWatch?.()
    clearSelection()
  }

  const handleDelete = () => {
    selectedMovieIds.forEach((id) => removeMovie(id))
    clearSelection()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[400] w-[92vw] max-w-[440px]"
        >
          <div className="rounded-2xl border border-white/10 p-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1e1e2e 0%, #232340 100%)', backdropFilter: 'blur(20px)' }}>

            {/* Count indicator */}
            <div className="flex items-center gap-2 flex-1">
              <CheckSquare size={16} className="text-accent" />
              <span className="text-white font-bold text-sm">{count} selected</span>
            </div>

            {/* Mark Watched */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleMarkWatched}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #22d3a8, #0d9488)', color: '#0f0f13' }}
            >
              <Eye size={14} />
              Watched
            </motion.button>

            {/* Delete */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleDelete}
              className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400"
            >
              <Trash2 size={16} />
            </motion.button>

            {/* Cancel */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={clearSelection}
              className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted"
            >
              <X size={16} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
