/**
 * AchievementToast.tsx — Animated toast popup for newly unlocked badges
 */

import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../store/uiStore'

export default function AchievementToast() {
  const { pendingAchievements, dismissAchievement } = useUIStore()
  const current = pendingAchievements[0]

  // Auto-dismiss after 3.5s
  if (current) {
    setTimeout(dismissAchievement, 3500)
  }

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] w-[85vw] max-w-sm"
          onClick={dismissAchievement}
        >
          <div
            className="rounded-2xl p-4 flex items-center gap-4 border border-yellow-400/30 shadow-2xl cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #1e1a00 0%, #2a2500 100%)',
              boxShadow: '0 0 40px rgba(245,197,24,0.25)',
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.35)' }}
            >
              {current.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-0.5">
                🏆 Achievement Unlocked!
              </p>
              <p className="font-display font-extrabold text-white text-base leading-tight">
                {current.title}
              </p>
            </div>

            {/* Sparkle glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
              <div className="absolute inset-0 animate-pulse opacity-20"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, #f5c518 0%, transparent 70%)' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
