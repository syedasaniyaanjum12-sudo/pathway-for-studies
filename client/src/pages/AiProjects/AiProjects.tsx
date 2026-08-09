import { useMemo, useState } from 'react'
import { aiProjects, type ProjectLevel } from '../../data/aiProjects'
import ProjectCard from '../../components/ProjectCard/ProjectCard'

const LEVEL_FILTERS: Array<ProjectLevel | 'All'> = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Portfolio',
]

function AiProjects() {
  const [levelFilter, setLevelFilter] = useState<ProjectLevel | 'All'>('All')

  const visibleProjects = useMemo(
    () =>
      levelFilter === 'All' ? aiProjects : aiProjects.filter((p) => p.level === levelFilter),
    [levelFilter],
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">AI Engineer Projects</h1>
      <p className="mt-1 text-slate-600">
        {aiProjects.length} projects from first API call to portfolio-ready product.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEVEL_FILTERS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setLevelFilter(level)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              levelFilter === level
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}

export default AiProjects
