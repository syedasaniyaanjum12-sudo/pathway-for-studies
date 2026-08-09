import type { ProjectLevel } from '../../data/aiProjects'
import Badge, { type BadgeTone } from '../Badge/Badge'

const LEVEL_TONES: Record<ProjectLevel, BadgeTone> = {
  Beginner: 'emerald',
  Intermediate: 'sky',
  Advanced: 'violet',
  Portfolio: 'indigo',
}

function ProjectLevelBadge({ level }: { level: ProjectLevel }) {
  return <Badge tone={LEVEL_TONES[level]}>{level}</Badge>
}

export default ProjectLevelBadge
