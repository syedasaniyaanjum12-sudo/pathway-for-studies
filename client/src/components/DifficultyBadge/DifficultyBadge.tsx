import type { SqlDifficulty } from '../../data/sqlQuestions'

const DIFFICULTY_STYLES: Record<SqlDifficulty, string> = {
  Easy: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard: 'bg-rose-100 text-rose-700',
  Interview: 'bg-indigo-100 text-indigo-700',
}

// Reused wherever a difficulty needs to be shown — the question list, the
// question detail header, and (from Phase 3 onward) Data Analytics
// exercises, which share the same four difficulty levels.
function DifficultyBadge({ difficulty }: { difficulty: SqlDifficulty }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[difficulty]}`}
    >
      {difficulty}
    </span>
  )
}

export default DifficultyBadge
