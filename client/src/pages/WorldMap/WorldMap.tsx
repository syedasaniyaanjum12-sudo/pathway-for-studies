import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WORLDS, type WorldDef } from '../../../../shared/data/worlds'
import { quizzes } from '../../../../shared/data/quizzes'
import { miniChallenges } from '../../../../shared/data/miniChallenges'
import { bossChallenges } from '../../../../shared/data/bossChallenges'
import type { SqlQuestion, DataAnalyticsExercise, AiProject, ProgressSummary } from '../../../../shared/types'
import { fetchSqlQuestions, fetchDataAnalyticsExercises, fetchAiProjects, fetchProgress } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

// Which worlds have a Quiz/Mini Challenge/Boss Challenge — derived from the
// same static content modules used to seed the DB, not a separate fetch,
// since a World Map card just needs "does one exist," not the content itself.
const WORLD_IDS_WITH_QUIZ = new Set(quizzes.map((quiz) => quiz.id))
const WORLD_IDS_WITH_MINI_CHALLENGE = new Set(miniChallenges.map((challenge) => challenge.id))
const WORLD_IDS_WITH_BOSS_CHALLENGE = new Set(bossChallenges.map((boss) => boss.id))

const TRACK_PATH: Record<WorldDef['track'], string> = {
  sql: '/sql-practice',
  'data-analytics': '/data-analytics',
  'ai-projects': '/ai-projects',
}

const TRACK_LABEL: Record<WorldDef['track'], string> = {
  sql: 'SQL Practice',
  'data-analytics': 'Data Analytics',
  'ai-projects': 'AI Engineer Projects',
}

interface WorldStats {
  total: number
  /** Solved (SQL/DA) or 'done' (AI Projects) — the count that matters for
   * "is this world finished," matching what earns XP for that world's kind
   * of content (see shared/data/levels.ts). */
  completed: number
}

function WorldMap() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<SqlQuestion[] | null>(null)
  const [exercises, setExercises] = useState<DataAnalyticsExercise[] | null>(null)
  const [projects, setProjects] = useState<AiProject[] | null>(null)
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchSqlQuestions(), fetchDataAnalyticsExercises(), fetchAiProjects()])
      .then(([q, e, p]) => {
        setQuestions(q)
        setExercises(e)
        setProjects(p)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
  }, [])

  useEffect(() => {
    if (!user) {
      setProgress(null)
      return
    }
    fetchProgress()
      .then(setProgress)
      .catch(() => {
        // Non-critical — the map still renders (just without unlock state).
      })
  }, [user])

  // No progress yet (signed out, or still loading) means "start of the
  // journey" — Level 0, nothing solved — rather than hiding the map.
  const currentLevel = progress?.level ?? 0
  const passedQuizIds = new Set(progress?.passedQuizIds ?? [])
  const completedMiniChallengeIds = new Set(progress?.completedMiniChallengeIds ?? [])
  const defeatedBossChallengeIds = new Set(progress?.defeatedBossChallengeIds ?? [])

  const statsByWorld = useMemo(() => {
    const stats = new Map<string, WorldStats>()
    if (!questions || !exercises || !projects) return stats

    const solvedSql = new Set(progress?.solvedSqlQuestionIds ?? [])
    const solvedExercises = new Set(progress?.solvedExerciseIds ?? [])
    const projectStatuses = progress?.projectStatuses ?? {}

    for (const world of WORLDS) {
      if (world.track === 'sql' && world.topics) {
        const items = questions.filter((q) => world.topics!.includes(q.topic))
        stats.set(world.id, {
          total: items.length,
          completed: items.filter((q) => solvedSql.has(q.id)).length,
        })
      } else if (world.track === 'data-analytics' && world.topics) {
        const items = exercises.filter((ex) => world.topics!.includes(ex.topic))
        stats.set(world.id, {
          total: items.length,
          completed: items.filter((ex) => solvedExercises.has(ex.id)).length,
        })
      } else if (world.track === 'ai-projects' && world.projectLevel) {
        const items = projects.filter((p) => p.level === world.projectLevel)
        stats.set(world.id, {
          total: items.length,
          completed: items.filter((p) => projectStatuses[p.id] === 'done').length,
        })
      }
    }
    return stats
  }, [questions, exercises, projects, progress])

  if (loadError) {
    return (
      <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Couldn't load the World Map: {loadError}. Is the API server running (
        <code className="font-mono">cd server && npm run dev</code>)?
      </p>
    )
  }

  if (!questions || !exercises || !projects) {
    return <p className="text-sm text-slate-500">Loading world map…</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">🗺️ World Map</h1>
      <p className="mt-1 text-slate-600">
        Your journey from Level 0 — Beginner to Level 10 — Job-Ready AI Engineer, one world at a
        time.
      </p>
      {!user && (
        <p className="mt-1 text-xs text-slate-400">
          Sign in to start earning XP and unlocking worlds — everything below is still freely
          practicable from its track page either way.
        </p>
      )}

      <ol className="mt-8 space-y-4 border-l-2 border-slate-200 pl-6">
        {WORLDS.map((world) => {
          const stats = statsByWorld.get(world.id) ?? { total: 0, completed: 0 }
          const unlocked = currentLevel >= world.unlockLevel
          const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
          const completionLabel = world.track === 'ai-projects' ? 'done' : 'solved'
          const worldComplete = defeatedBossChallengeIds.has(world.id)

          const content = (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <span aria-hidden>{world.icon}</span>
                  {world.title}
                  {!unlocked && <span aria-hidden>🔒</span>}
                  {worldComplete && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      🏆 World Complete
                    </span>
                  )}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {TRACK_LABEL[world.track]}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{world.description}</p>
              {unlocked ? (
                <>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {stats.completed} / {stats.total} {completionLabel}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs font-medium text-slate-400">
                  Reach Level {world.unlockLevel} to unlock ({stats.total} item
                  {stats.total === 1 ? '' : 's'} waiting)
                </p>
              )}
            </>
          )

          return (
            <li key={world.id} className="relative -ml-[26px] pl-[26px]">
              <span
                className={`absolute left-0 top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 ${
                  unlocked ? 'border-emerald-500 bg-emerald-100' : 'border-slate-300 bg-white'
                }`}
                aria-hidden
              />
              {unlocked ? (
                <div
                  className={`rounded-lg border bg-white p-4 transition hover:shadow-sm ${
                    worldComplete
                      ? 'border-amber-300 hover:border-amber-400'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <Link to={`${TRACK_PATH[world.track]}?world=${world.id}`} className="block">
                    {content}
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {WORLD_IDS_WITH_QUIZ.has(world.id) && (
                      <Link
                        to={`/quiz/${world.id}`}
                        className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        📝 Quiz{passedQuizIds.has(world.id) ? ' ✅' : ''}
                      </Link>
                    )}
                    {WORLD_IDS_WITH_MINI_CHALLENGE.has(world.id) && (
                      <Link
                        to={`/mini-challenge/${world.id}`}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        ⏱️ Mini Challenge{completedMiniChallengeIds.has(world.id) ? ' ✅' : ''}
                      </Link>
                    )}
                    {WORLD_IDS_WITH_BOSS_CHALLENGE.has(world.id) && (
                      <Link
                        to={`/boss-challenge/${world.id}`}
                        className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                      >
                        🐉 Boss Challenge{worldComplete ? ' ✅' : ''}
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 opacity-70">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default WorldMap
