import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProgressSummary } from '../../../../shared/types'
import { useAuth } from '../../context/AuthContext'
import { fetchSqlQuestions, fetchDataAnalyticsExercises, fetchAiProjects, fetchProgress } from '../../lib/api'
import LevelProgress from '../../components/LevelProgress/LevelProgress'

const TRACKS = [
  {
    to: '/sql-practice',
    title: 'SQL Practice',
    description: 'Progressive SQL questions from basics to interview-level.',
  },
  {
    to: '/data-analytics',
    title: 'Data Analytics',
    description: 'Python data analysis with NumPy, Pandas, and Matplotlib.',
  },
  {
    to: '/ai-projects',
    title: 'AI Engineer Projects',
    description: 'A project catalog from first steps to portfolio pieces.',
  },
] as const

// Solved/total counts shown under each card once signed in. Undefined
// (rather than 0) while loading, so the UI can tell "still fetching" apart
// from "genuinely solved 0 so far."
interface TrackCounts {
  sqlSolved?: number
  sqlTotal?: number
  exercisesSolved?: number
  exercisesTotal?: number
  projectsStarted?: number
  projectsTotal?: number
}

function Home() {
  const { user } = useAuth()
  const [counts, setCounts] = useState<TrackCounts>({})
  const [progress, setProgress] = useState<ProgressSummary | null>(null)

  useEffect(() => {
    if (!user) {
      setCounts({})
      setProgress(null)
      return
    }
    Promise.all([fetchSqlQuestions(), fetchDataAnalyticsExercises(), fetchAiProjects(), fetchProgress()])
      .then(([questions, exercises, projects, fetchedProgress]) => {
        setCounts({
          sqlSolved: fetchedProgress.solvedSqlQuestionIds.length,
          sqlTotal: questions.length,
          exercisesSolved: fetchedProgress.solvedExerciseIds.length,
          exercisesTotal: exercises.length,
          projectsStarted: Object.values(fetchedProgress.projectStatuses).filter(
            (s) => s !== 'not-started',
          ).length,
          projectsTotal: projects.length,
        })
        setProgress(fetchedProgress)
      })
      .catch(() => {
        // Non-critical — the cards work fine without progress counts.
      })
  }, [user])

  const progressByTrack: Record<(typeof TRACKS)[number]['to'], string | undefined> = {
    '/sql-practice':
      counts.sqlTotal !== undefined ? `${counts.sqlSolved} / ${counts.sqlTotal} solved` : undefined,
    '/data-analytics':
      counts.exercisesTotal !== undefined
        ? `${counts.exercisesSolved} / ${counts.exercisesTotal} solved`
        : undefined,
    '/ai-projects':
      counts.projectsTotal !== undefined
        ? `${counts.projectsStarted} / ${counts.projectsTotal} started`
        : undefined,
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">
        Pathway for Studies
      </h1>
      <p className="mt-2 text-slate-600">
        Pick a track to start practicing.
      </p>
      {!user && (
        <p className="mt-1 text-sm text-slate-400">Sign in to track your progress across all three tracks.</p>
      )}
      <Link
        to="/world-map"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        🗺️ View your World Map — the full journey from Level 0 to Level 10
      </Link>
      {progress && (
        <div className="mt-6">
          <LevelProgress progress={progress} />
          {progress.unlockedSkills.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Skills unlocked ({progress.unlockedSkills.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {progress.unlockedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {TRACKS.map((track) => (
          <Link
            key={track.to}
            to={track.to}
            className="rounded-lg border border-slate-200 bg-white p-6 text-left transition hover:border-indigo-300 hover:shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {track.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{track.description}</p>
            {progressByTrack[track.to] && (
              <p className="mt-3 text-xs font-medium text-indigo-600">{progressByTrack[track.to]}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
