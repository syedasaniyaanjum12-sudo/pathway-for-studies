import { useEffect, useMemo, useState } from 'react'
import type { AiProject, ProjectLevel, ProjectStatus } from '../../../../shared/types'
import { fetchAiProjects, fetchProgress, setProjectStatus } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import ProjectCard from '../../components/ProjectCard/ProjectCard'

const LEVEL_FILTERS: Array<ProjectLevel | 'All'> = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Portfolio',
]

function AiProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<AiProject[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<ProjectLevel | 'All'>('All')
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus>>({})

  useEffect(() => {
    fetchAiProjects()
      .then(setProjects)
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
  }, [])

  useEffect(() => {
    if (!user) {
      setStatuses({})
      return
    }
    fetchProgress()
      .then((progress) => setStatuses(progress.projectStatuses))
      .catch(() => {
        // Non-critical — the page still works without status tracking.
      })
  }, [user])

  const visibleProjects = useMemo(() => {
    if (!projects) return []
    return levelFilter === 'All' ? projects : projects.filter((p) => p.level === levelFilter)
  }, [projects, levelFilter])

  function handleStatusChange(projectId: string, status: ProjectStatus) {
    // Optimistic update, same pattern as the SQL/Data Analytics solved
    // marks — the UI reflects the change immediately, the request just
    // persists it.
    setStatuses((prev) => ({ ...prev, [projectId]: status }))
    setProjectStatus(projectId, status).catch(() => {
      // Best-effort; losing one status update isn't worth blocking the UI.
    })
  }

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
      {!user && (
        <p className="mt-1 text-xs text-slate-400">
          Sign in to track your status on each project.
        </p>
      )}

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
          <ProjectCard
            key={project.id}
            project={project}
            status={statuses[project.id]}
            onStatusChange={user ? (status) => handleStatusChange(project.id, status) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default AiProjects
