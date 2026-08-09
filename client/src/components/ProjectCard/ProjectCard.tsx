import type { AiProject, ProjectStatus } from '../../../../shared/types'
import ProjectLevelBadge from '../ProjectLevelBadge/ProjectLevelBadge'

const STATUS_OPTIONS: ProjectStatus[] = ['not-started', 'in-progress', 'done']

type ProjectCardProps = {
  project: AiProject
  /** Omitted entirely (rather than shown disabled) when signed out — status
   * tracking has nothing to attach to without a user. */
  status?: ProjectStatus
  onStatusChange?: (status: ProjectStatus) => void
}

function ProjectCard({ project, status, onStatusChange }: ProjectCardProps) {
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">{project.title}</h2>
        <ProjectLevelBadge level={project.level} />
      </div>
      <p className="mt-2 flex-1 text-sm text-slate-600">{project.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.techStack.map((tech) => (
          <span key={tech} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {tech}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">Skills: {project.skills.join(', ')}</p>
      {onStatusChange && (
        <select
          value={status ?? 'not-started'}
          onChange={(e) => onStatusChange(e.target.value as ProjectStatus)}
          className="mt-3 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </article>
  )
}

export default ProjectCard
