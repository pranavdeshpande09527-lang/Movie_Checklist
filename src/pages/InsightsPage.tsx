/**
 * InsightsPage.tsx — Analytics dashboard, achievements, personality, goals
 * 5th tab in the bottom nav
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Trophy, Target, Plus, X, CheckCircle2,
  Star, Film, TrendingUp, Calendar
} from 'lucide-react'
import { useMovieStore } from '../store/movieStore'
import { useGamificationStore, getGoalProgress, type WatchGoal } from '../store/gamificationStore'
import {
  generatePersonality,
  getGenreDistribution,
  getWeeklyActivity,
} from '../utils/personality'
import ShareCard from '../components/ShareCard'

/* ── Mini SVG Bar Chart ── */
function BarChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end justify-between gap-1 h-16">
      {data.map((d) => (
        <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
          <motion.div
            className="w-full rounded-t-lg"
            style={{
              background: d.count > 0
                ? 'linear-gradient(180deg, #e50914 0%, #ff6b35 100%)'
                : 'var(--color-surface-2)',
              minHeight: 4,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${(d.count / max) * 56}px` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
          />
          <span className="text-[9px] text-muted">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Genre Donut ── */
function GenreList({ data }: { data: { genre: string; count: number; pct: number }[] }) {
  const COLORS = ['#e50914', '#f97316', '#f5c518', '#22d3a8', '#3b82f6', '#8b5cf6', '#ec4899']
  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => (
        <div key={d.genre} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
          <span className="text-white text-xs flex-1">{d.genre}</span>
          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${d.pct}%` }}
              transition={{ duration: 0.8, delay: i * 0.07 }}
            />
          </div>
          <span className="text-muted text-[11px] w-8 text-right">{d.pct}%</span>
        </div>
      ))}
    </div>
  )
}

/* ── Goal Card ── */
function GoalCard({ goal, watched }: { goal: WatchGoal; watched: { watchedAt?: number }[] }) {
  const { removeGoal } = useGamificationStore()
  const progress = getGoalProgress(goal, watched)
  const pct = Math.round((progress / goal.target) * 100)
  const done = progress >= goal.target

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 border relative overflow-hidden"
      style={{
        background: done ? 'rgba(34,211,168,0.08)' : 'var(--color-surface)',
        borderColor: done ? 'rgba(34,211,168,0.3)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => removeGoal(goal.id)}
        className="absolute top-3 right-3 text-muted hover:text-white transition-colors"
      >
        <X size={13} />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Target size={14} className={done ? 'text-emerald-400' : 'text-accent'} />
        <p className="text-white text-sm font-semibold pr-6">{goal.label}</p>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-bold ${done ? 'text-emerald-400' : 'text-muted'}`}>
          {progress}/{goal.target} {done && '🎉'}
        </span>
        <span className="text-muted text-[11px]">{goal.period}</span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: done ? '#22d3a8' : 'linear-gradient(90deg, #e50914, #f5c518)' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </motion.div>
  )
}

/* ── Add Goal Form ── */
function AddGoalForm({ onAdd }: { onAdd: (g: Omit<WatchGoal, 'id' | 'createdAt'>) => void }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [target, setTarget] = useState('10')
  const [period, setPeriod] = useState<'week' | 'month' | 'alltime'>('month')

  const submit = () => {
    if (!label.trim() || !parseInt(target)) return
    onAdd({ label, target: parseInt(target), period })
    setLabel('')
    setTarget('10')
    setOpen(false)
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full py-3 px-4 rounded-2xl border border-dashed border-border/60 text-muted hover:text-white hover:border-accent/40 transition-colors text-sm"
      >
        <Plus size={14} /> Add a new goal
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border/60 p-4 bg-surface mt-2 flex flex-col gap-3">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Watch 10 movies this month"
                className="w-full bg-surface-2 text-white text-sm rounded-xl px-3 py-2.5 border border-border placeholder:text-muted"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-20 bg-surface-2 text-white text-sm rounded-xl px-3 py-2.5 border border-border text-center"
                  min={1} max={999}
                />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'alltime')}
                  className="flex-1 bg-surface-2 text-white text-sm rounded-xl px-3 py-2.5 border border-border"
                >
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="alltime">All time</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={submit}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)' }}>
                  Set Goal
                </button>
                <button onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-muted border border-border">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Main Page ── */
export default function InsightsPage() {
  const { movies } = useMovieStore()
  const { achievements, streak, bestStreak, goals, addGoal } = useGamificationStore()
  const [showShare, setShowShare] = useState(false)

  const watched = movies.filter((m) => m.status === 'watched')
  const personality = generatePersonality(watched)
  const genreDist = getGenreDistribution(watched)
  const weeklyActivity = getWeeklyActivity(watched)
  const unlockedBadges = achievements.filter((a) => a.unlocked)
  const lockedBadges = achievements.filter((a) => !a.unlocked)

  const totalMovies = movies.length
  const ratedMovies = movies.filter((m) => m.userRating > 0)
  const avgRating = ratedMovies.length
    ? (ratedMovies.reduce((s, m) => s + m.userRating, 0) / ratedMovies.length).toFixed(1)
    : '—'
  const favCount = movies.filter((m) => m.isFavorite).length

  return (
    <div className="flex-1 overflow-y-auto scroll-container pb-safe px-4 pt-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-extrabold text-xl text-white">Insights</h1>
          <p className="text-muted text-xs mt-0.5">Your cinematic journey</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)' }}
        >
          Share
        </motion.button>
      </div>

      {/* ── Personality Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 mb-5 relative overflow-hidden border border-white/[0.06]"
        style={{
          background: `linear-gradient(135deg, ${personality.color}22 0%, #1a1a24 60%)`,
        }}
      >
        <div className="absolute -bottom-4 -right-4 text-8xl opacity-10">{personality.icon}</div>
        <div className="flex items-start gap-4 relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${personality.color}22`, border: `1px solid ${personality.color}44` }}>
            {personality.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: personality.color }}>
              Your Movie Personality
            </p>
            <h2 className="font-display font-extrabold text-white text-xl leading-tight">
              {personality.archetype}
            </h2>
            <p className="text-muted text-xs mt-1.5 leading-relaxed line-clamp-3">
              {personality.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {personality.traits.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                  style={{ color: personality.color, borderColor: `${personality.color}44`, background: `${personality.color}15` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { value: totalMovies, label: 'Total', icon: Film, color: '#8888a0' },
          { value: watched.length, label: 'Watched', icon: CheckCircle2, color: '#22d3a8' },
          { value: avgRating, label: 'Avg ★', icon: Star, color: '#f5c518' },
          { value: favCount, label: 'Favs', icon: TrendingUp, color: '#ec4899' },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-3 text-center border border-white/[0.05]"
            style={{ background: 'var(--color-surface)' }}
          >
            <s.icon size={14} className="mx-auto mb-1" style={{ color: s.color }} />
            <p className="font-display font-extrabold text-white text-lg leading-none">{s.value}</p>
            <p className="text-muted text-[10px] mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Streak ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 mb-5 border border-orange-500/20 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, #1a1a24 100%)' }}
      >
        <div className="text-4xl">{streak > 0 ? '🔥' : '❄️'}</div>
        <div className="flex-1">
          <p className="font-display font-extrabold text-white text-2xl leading-none">
            {streak} <span className="text-base font-semibold text-muted">day streak</span>
          </p>
          <p className="text-muted text-xs mt-1">Best: {bestStreak} days · Keep it going!</p>
        </div>
        <Calendar size={28} className="text-orange-400/30" />
      </motion.div>

      {/* ── Weekly Activity ── */}
      <div className="rounded-2xl p-4 mb-5 border border-white/[0.05]" style={{ background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={15} className="text-accent" />
          <h3 className="font-display font-bold text-white text-sm">This Week's Activity</h3>
        </div>
        <BarChart data={weeklyActivity} />
      </div>

      {/* ── Genre Distribution ── */}
      {genreDist.length > 0 && (
        <div className="rounded-2xl p-4 mb-5 border border-white/[0.05]" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Film size={15} className="text-accent" />
            <h3 className="font-display font-bold text-white text-sm">Genre Mix</h3>
            <span className="ml-auto text-muted text-[11px]">from {watched.length} watched</span>
          </div>
          <GenreList data={genreDist} />
        </div>
      )}

      {/* ── Goals ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} className="text-accent" />
          <h3 className="font-display font-bold text-white text-sm">Watching Goals</h3>
        </div>
        <div className="flex flex-col gap-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} watched={watched} />
          ))}
          <AddGoalForm onAdd={addGoal} />
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={15} className="text-gold" />
          <h3 className="font-display font-bold text-white text-sm">Achievements</h3>
          <span className="ml-auto text-muted text-[11px]">{unlockedBadges.length}/{achievements.length} unlocked</span>
        </div>

        {/* Unlocked */}
        {unlockedBadges.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {unlockedBadges.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-3 text-center border border-yellow-400/25"
                style={{ background: 'linear-gradient(135deg, rgba(245,197,24,0.1) 0%, #1a1a24 100%)' }}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className="text-white text-[11px] font-bold leading-tight">{a.title}</p>
                <p className="text-muted text-[9px] mt-0.5 leading-tight">{a.description}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Locked */}
        <div className="grid grid-cols-3 gap-2">
          {lockedBadges.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl p-3 text-center border border-white/[0.04] opacity-40"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="text-2xl mb-1 grayscale">{a.icon}</div>
              <p className="text-muted text-[11px] font-semibold leading-tight">{a.title}</p>
              <p className="text-muted text-[9px] mt-0.5 leading-tight">{a.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Share modal */}
      {showShare && <ShareCard onClose={() => setShowShare(false)} />}
    </div>
  )
}
