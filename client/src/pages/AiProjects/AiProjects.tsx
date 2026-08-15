import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AiProject, ProjectLevel, ProjectStatus } from '../../../../shared/types'
import { getWorldById } from '../../../../shared/data/worlds'
import { fetchAiProjects, fetchProgress, setProjectStatus } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import ProjectCard from '../../components/ProjectCard/ProjectCard'
import SearchInput from '../../components/SearchInput/SearchInput'
import EmptyState from '../../components/EmptyState/EmptyState'

const LEVEL_FILTERS: Array<ProjectLevel | 'All'> = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Portfolio',
]

function AiProjects() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState<AiProject[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<ProjectLevel | 'All'>('All')
  const [search, setSearch] = useState('')

  // World Map (Phase 2) deep-links here with ?world=<id> — an additional
  // level filter layered on top of the level-filter buttons/search, cleared
  // via the banner below (which just drops the query param).
  const activeWorld = useMemo(() => {
    const worldId = searchParams.get('world')
    return worldId ? getWorldById(worldId) : undefined
  }, [searchParams])
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
    const byWorld = activeWorld?.projectLevel
      ? projects.filter((p) => p.level === activeWorld.projectLevel)
      : projects
    const byLevel = levelFilter === 'All' ? byWorld : byWorld.filter((p) => p.level === levelFilter)
    const term = search.trim().toLowerCase()
    if (!term) return byLevel
    return byLevel.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.techStack.some((tech) => tech.toLowerCase().includes(term)) ||
        p.skills.some((skill) => skill.toLowerCase().includes(term)),
    )
  }, [projects, activeWorld, levelFilter, search])

  function clearFilters() {
    setLevelFilter('All')
    setSearch('')
  }

  function clearWorldFilter() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('world')
      return next
    })
  }

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

      {activeWorld && (
        <div className="mt-4 flex max-w-sm items-center justify-between gap-2 rounded-md bg-violet-50 px-3 py-2 text-sm text-violet-800">
          <span>
            <span aria-hidden>{activeWorld.icon}</span> World: <strong>{activeWorld.title}</strong>
          </span>
          <button
            type="button"
            onClick={clearWorldFilter}
            className="shrink-0 text-xs font-medium text-violet-600 hover:text-violet-800"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mt-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects, tech, skills…" />
      </div>

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

      {visibleProjects.length === 0 ? (
        <div className="mt-6">
          <EmptyState message="No projects match your search/filter." onClear={clearFilters} />
        </div>
      ) : (
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
      )}
    </div>
  )
}

export default AiProjects
