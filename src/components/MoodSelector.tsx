/**
 * MoodSelector.tsx — Horizontal mood filter strip for the Home page
 */

import { motion } from 'framer-motion'
import { useUIStore, MOOD_META, type Mood } from '../store/uiStore'

const MOODS: Mood[] = ['all', 'feelgood', 'mindblow', 'emotional', 'thriller', 'action']

export default function MoodSelector() {
  const { activeMood, setMood } = useUIStore()

  return (
    <div className="mb-5">
      <p className="text-muted text-[11px] font-semibold uppercase tracking-wider mb-2.5">
        What's your mood?
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {MOODS.map((mood) => {
          const meta = MOOD_META[mood]
          const isActive = activeMood === mood
          return (
            <motion.button
              key={mood}
              onClick={() => setMood(mood)}
              whileTap={{ scale: 0.9 }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all border"
              style={{
                background: isActive ? `${meta.color}22` : 'var(--color-surface)',
                borderColor: isActive ? meta.color : 'rgba(255,255,255,0.08)',
                color: isActive ? meta.color : 'var(--color-text-muted)',
                boxShadow: isActive ? `0 0 12px ${meta.color}44` : 'none',
              }}
            >
              <span>{meta.emoji}</span>
              <span className="text-xs">{meta.label}</span>
              {isActive && mood !== 'all' && (
                <motion.div
                  layoutId="mood-dot"
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: meta.color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
