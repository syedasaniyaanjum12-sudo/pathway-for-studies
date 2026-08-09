import { useEffect, useMemo, useState } from 'react'
import type { AiProject, ProjectLevel } from '../../../../shared/types'
import { fetchAiProjects } from '../../lib/api'
import ProjectCard from '../../components/ProjectCard/ProjectCard'

const LEVEL_FILTERS: Array<ProjectLevel | 'All'> = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Portfolio',
]

function AiProjects() {
  const [projects, setProjects] = useState<AiProject[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<ProjectLevel | 'All'>('All')

  useEffect(() => {
    fetchAiProjects()
      .then(setProjects)
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
  }, [])

  const visibleProjects = useMemo(() => {
    if (!projects) return []
    return levelFilter === 'All' ? projects : projects.filter((p) => p.level === levelFilter)
  }, [projects, levelFilter])

  if (loadError) {
    return (
      <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Couldn't load projects: {loadError}. Is the API server running (
        <code className="font-mono">cd server && npm run dev</code>)?
      </p>
    )
  }

  if (!projects) {
    return <p className="text-sm text-slate-500">Loading projects…</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">AI Engineer Projects</h1>
      <p className="mt-1 text-slate-600">
        {projects.length} projects from first API call to portfolio-ready product.
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
