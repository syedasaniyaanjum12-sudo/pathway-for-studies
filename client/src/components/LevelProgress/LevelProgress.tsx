import type { ProgressSummary } from '../../../../shared/types'

interface LevelProgressProps {
  progress: ProgressSummary
  /** Compact pill for the nav header instead of the full banner. */
  compact?: boolean
}

// Phase 8: the RPG-style level/XP display. Every number here comes straight
// off GET /api/me/progress (see shared/data/levels.ts for the XP curve) —
// no separate fetch, no client-side XP math to keep in sync with the server.
function LevelProgress({ progress, compact = false }: LevelProgressProps) {
  const { level, levelTitle, xpIntoLevel, xpToNextLevel, progressFraction, totalXp } = progress
  const percent = Math.round(progressFraction * 100)

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
        title={`${totalXp} XP total`}
      >
        <span aria-hidden>🎮</span>
        Lv {level} · {levelTitle}
      </span>
    )
  }

  return (
    <div className="rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          LEVEL {level} — {levelTitle}
        </h2>
        <span className="text-sm font-medium text-indigo-700">{totalXp} XP total</span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {xpToNextLevel !== null
          ? `${xpIntoLevel} XP into this level · ${xpToNextLevel} XP to Level ${level + 1}`
          : `Max level reached — ${totalXp} XP earned across every track.`}
      </p>
    </div>
  )
}

export default LevelProgress
