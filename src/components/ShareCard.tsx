/**
 * ShareCard.tsx — Generate a shareable "My Top Movies" card
 * Exports as PNG via html2canvas or copies text to clipboard
 */

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Copy, Star, Film } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useMovieStore } from '../store/movieStore'

interface Props {
  onClose: () => void
}

export default function ShareCard({ onClose }: Props) {
  const { movies } = useMovieStore()
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  const watched = movies.filter((m) => m.status === 'watched')
  const top5 = [...movies]
    .filter((m) => m.isFavorite || m.userRating >= 4 || m.status === 'watched')
    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || b.userRating - a.userRating || b.tmdbRating - a.tmdbRating)
    .slice(0, 5)

  const topGenres = (() => {
    const freq: Record<string, number> = {}
    watched.forEach((m) => m.genre.forEach((g) => { freq[g] = (freq[g] ?? 0) + 1 }))
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => g)
  })()

  const avgRating = (() => {
    const rated = movies.filter((m) => m.userRating > 0)
    return rated.length ? (rated.reduce((s, m) => s + m.userRating, 0) / rated.length).toFixed(1) : '—'
  })()

  const handleExport = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f0f13',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = 'my-cinetrack-list.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      handleCopyText()
    } finally {
      setExporting(false)
    }
  }

  const handleCopyText = () => {
    const lines = [
      '🎬 My CineTrack List',
      `✅ Watched: ${watched.length} movies`,
      `⭐ Avg Rating: ${avgRating}/5`,
      topGenres.length ? `🎭 Top Genres: ${topGenres.join(', ')}` : '',
      '',
      '🍿 My Top Movies:',
      ...top5.map((m, i) => `${i + 1}. ${m.title} (${m.year}) ${m.userRating > 0 ? '★'.repeat(m.userRating) : ''}`),
      '',
      'Track yours at CineTrack 🎬',
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        className="backdrop fixed inset-0 z-[400] flex flex-col items-center justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[480px] rounded-t-3xl overflow-hidden"
          style={{ background: '#1a1a24', maxHeight: '92dvh', overflowY: 'auto' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          <div className="px-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-extrabold text-white text-lg">Share My List</h2>
              <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* The shareable card */}
            <div
              ref={cardRef}
              className="rounded-2xl overflow-hidden p-5 mb-5"
              style={{
                background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #16213e 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Film size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-white text-base">CineTrack</h3>
                  <p className="text-muted text-[11px]">My Movie Journey</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { value: watched.length, label: 'Watched' },
                  { value: movies.filter((m) => m.status === 'watchlist').length, label: 'To Watch' },
                  { value: `${avgRating}★`, label: 'Avg Rating' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="font-display font-extrabold text-white text-xl">{s.value}</p>
                    <p className="text-muted text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Top movies */}
              {top5.length > 0 && (
                <div>
                  <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">⭐ Top Picks</p>
                  <div className="flex gap-2">
                    {top5.map((m) => (
                      <div key={m.id} className="flex-1 min-w-0">
                        <div className="rounded-xl overflow-hidden mb-1" style={{ aspectRatio: '2/3', background: '#232335' }}>
                          {m.poster ? (
                            <img src={m.poster} alt={m.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film size={14} className="text-muted" />
                            </div>
                          )}
                        </div>
                        <p className="text-white text-[9px] font-semibold line-clamp-2 text-center leading-tight">{m.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Genres */}
              {topGenres.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {topGenres.map((g) => (
                    <span key={g} className="genre-badge">{g}</span>
                  ))}
                  <span className="ml-auto text-muted text-[10px]">via CineTrack</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)', color: 'white' }}
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Save as Image'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyText}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border border-border bg-surface text-white"
              >
                {copied ? <><Star size={15} className="text-gold" /> Copied!</> : <><Copy size={15} /> Copy Text</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
