/**
 * StatsBar — animated stats strip showing Total / Watched / Remaining progress
 */

import { motion } from 'framer-motion'
import { useMovieStore } from '../store/movieStore'

export default function StatsBar() {
  const { movies } = useMovieStore()
  const total = movies.length
  const watched = movies.filter((m) => m.status === 'watched').length
  const remaining = total - watched
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0

  if (total === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-5 border border-white/[0.06] overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #1a1a24 0%, #1e1e2e 100%)' }}
    >
      {/* Decorative accent glow */}
      <div
        className="absolute top-0 left-0 w-32 h-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 0% 50%, #e50914 0%, transparent 70%)' }}
      />

      {/* Stats row */}
      <div className="flex items-center justify-between mb-4 relative">
        <StatItem value={total} label="Total" color="text-white" />
        <div className="w-px h-8 bg-border/60" />
        <StatItem value={watched} label="Watched" color="text-emerald-400" />
        <div className="w-px h-8 bg-border/60" />
        <StatItem value={remaining} label="Remaining" color="text-gold" />
        <div className="w-px h-8 bg-border/60" />
        <StatItem value={`${pct}%`} label="Done" color="gradient-text" isGradient />
      </div>

      {/* Progress track */}
      <div className="relative">
        <div className="h-2.5 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          />
        </div>
        <p className="text-muted text-[10px] mt-2 text-right">
          {watched} of {total} watched
          {pct === 100 && ' 🎉 All done!'}
        </p>
      </div>
    </motion.div>
  )
}

function StatItem({
  value, label, color, isGradient,
}: {
  value: string | number
  label: string
  color: string
  isGradient?: boolean
}) {
  return (
    <div className="text-center flex-1">
      <p className={`text-2xl font-display font-extrabold leading-none ${isGradient ? '' : color}`}
        style={isGradient ? {
          background: 'linear-gradient(135deg, #e50914 0%, #ff6b35 50%, #f5c518 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } : {}}>
        {value}
      </p>
      <p className="text-muted text-[10px] mt-0.5 font-medium">{label}</p>
    </div>
  )
}
