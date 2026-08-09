export type BadgeTone = 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky' | 'violet'

const TONE_STYLES: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
}

// Generic color-coded pill. DifficultyBadge (SQL/Data Analytics) and
// ProjectLevelBadge (AI Projects) both render through this instead of each
// defining their own pill markup — the only thing that differs between them
// is which label maps to which tone.
function Badge({ tone, children }: { tone: BadgeTone; children: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_STYLES[tone]}`}>
      {children}
    </span>
  )
}

export default Badge
