import type { SqlDifficulty } from '../../data/sqlQuestions'
import Badge, { type BadgeTone } from '../Badge/Badge'

const DIFFICULTY_TONES: Record<SqlDifficulty, BadgeTone> = {
  Easy: 'emerald',
  Medium: 'amber',
  Hard: 'rose',
  Interview: 'indigo',
}

// Reused wherever a difficulty needs to be shown — the question list, the
// question detail header, and (from Phase 3 onward) Data Analytics
// exercises, which share the same four difficulty levels.
function DifficultyBadge({ difficulty }: { difficulty: SqlDifficulty }) {
  return <Badge tone={DIFFICULTY_TONES[difficulty]}>{difficulty}</Badge>
}

export default DifficultyBadge
