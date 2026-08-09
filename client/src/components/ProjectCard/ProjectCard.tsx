import type { AiProject } from '../../../../shared/types'
import ProjectLevelBadge from '../ProjectLevelBadge/ProjectLevelBadge'

function ProjectCard({ project }: { project: AiProject }) {
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
    </article>
  )
}

export default ProjectCard
