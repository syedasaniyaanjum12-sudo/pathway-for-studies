import type { Difficulty } from '../../types/difficulty'
import Badge, { type BadgeTone } from '../Badge/Badge'

const DIFFICULTY_TONES: Record<Difficulty, BadgeTone> = {
  Easy: 'emerald',
  Medium: 'amber',
  Hard: 'rose',
  Interview: 'indigo',
}

// Shared by the SQL Practice question list/detail and the Data Analytics
// exercise list/detail — both tracks use the same four difficulty levels.
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge tone={DIFFICULTY_TONES[difficulty]}>{difficulty}</Badge>
}

export default DifficultyBadge
