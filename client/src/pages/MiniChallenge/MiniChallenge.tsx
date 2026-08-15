import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { python } from '@codemirror/lang-python'
import type { MiniChallenge as MiniChallengeContent, SqlQuestion, DataAnalyticsExercise } from '../../../../shared/types'
import { getWorldById } from '../../../../shared/data/worlds'
import {
  fetchMiniChallenges,
  fetchSqlQuestions,
  fetchDataAnalyticsExercises,
  submitSqlQuestion,
  submitDataAnalyticsExercise,
  submitMiniChallengeAttempt,
} from '../../lib/api'
import { runQuery, type QueryResult } from '../../lib/sqlEngine'
import { resultsMatch } from '../../../../shared/grading/sqlGrading'
import { runPython, warmUpEngine, type PythonRunResult } from '../../lib/pythonEngine'
import { valuesMatch } from '../../../../shared/grading/pythonGrading'
import { useAuth } from '../../context/AuthContext'
import CodeEditor from '../../components/CodeEditor/CodeEditor'
import ResultTable from '../../components/ResultTable/ResultTable'
import PythonResultView from '../../components/PythonResultView/PythonResultView'

type Status = 'running' | 'succeeded' | 'timedOut'

type Verdict =
  | { status: 'idle' }
  | { status: 'grading' }
  | { status: 'error'; message: string }
  | { status: 'correct'; sqlResult?: QueryResult; pyResult?: PythonRunResult }
  | { status: 'incorrect'; sqlResult?: QueryResult; pyResult?: PythonRunResult }

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds)
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function MiniChallenge() {
  const { worldId } = useParams<{ worldId: string }>()
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<MiniChallengeContent[] | null>(null)
  const [sqlQuestions, setSqlQuestions] = useState<SqlQuestion[] | null>(null)
  const [exercises, setExercises] = useState<DataAnalyticsExercise[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [verdict, setVerdict] = useState<Verdict>({ status: 'idle' })
  const [status, setStatus] = useState<Status>('running')
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const attemptRecorded = useRef(false)

  // Start downloading Pyodide immediately — every Mini Challenge is timed,
  // so waiting for the learner's first "Run" click to begin loading it
  // would eat into their clock.
  useEffect(() => {
    warmUpEngine()
  }, [])

  useEffect(() => {
    Promise.all([fetchMiniChallenges(), fetchSqlQuestions(), fetchDataAnalyticsExercises()])
      .then(([c, q, e]) => {
        setChallenges(c)
        setSqlQuestions(q)
        setExercises(e)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
  }, [])

  const challenge = challenges?.find((c) => c.id === worldId) ?? null
  const world = worldId ? getWorldById(worldId) : undefined
  const question =
    challenge?.track === 'sql'
      ? (sqlQuestions?.find((q) => q.id === challenge.refId) ?? null)
      : (exercises?.find((e) => e.id === challenge?.refId) ?? null)

  // Countdown starts as soon as the challenge is loaded. Reaching 0 while
  // still 'running' records a failed attempt (if signed in) — the learner
  // can keep practicing afterward, it just won't count as succeeded.
  useEffect(() => {
    if (!challenge) return
    setRemainingSeconds(challenge.timeLimitSeconds)
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev === null ? prev : Math.max(0, prev - 1)))
    }, 1000)
    return () => clearInterval(interval)
  }, [challenge])

  useEffect(() => {
    if (remainingSeconds === 0 && status === 'running') {
      setStatus('timedOut')
      if (user && challenge && !attemptRecorded.current) {
        attemptRecorded.current = true
        submitMiniChallengeAttempt(challenge.id, {
          elapsedSeconds: challenge.timeLimitSeconds,
          isCorrect: false,
        }).catch(() => {
          // Best-effort, same as every other submission in the app.
        })
      }
    }
  }, [remainingSeconds, status, user, challenge])

  async function handleRun() {
    if (!code.trim() || !challenge || !question) return
    setVerdict({ status: 'grading' })
    try {
      let isCorrect: boolean
      let sqlResult: QueryResult | undefined
      let pyResult: PythonRunResult | undefined

      if (challenge.track === 'sql') {
        const sqlQuestion = question as SqlQuestion
        const [actual, expected] = await Promise.all([runQuery(code), runQuery(sqlQuestion.solutionQuery)])
        sqlResult = actual
        isCorrect = resultsMatch(actual, expected, Boolean(sqlQuestion.orderMatters))
      } else {
        const exercise = question as DataAnalyticsExercise
        const runOptions = { checkVar: 'result', datasets: exercise.datasets }
        const [actual, expected] = await Promise.all([
          runPython(code, runOptions),
          runPython(exercise.solutionCode, runOptions),
        ])
        pyResult = actual
        if (actual.error) {
          setVerdict({ status: 'error', message: actual.error })
          return
        }
        isCorrect = valuesMatch(actual.value, expected.value)
      }

      setVerdict({ status: isCorrect ? 'correct' : 'incorrect', sqlResult, pyResult })

      if (user) {
        // Record the underlying question as solved too, exactly like the
        // normal track page would — a Mini Challenge is still real practice,
        // not a separate content pool.
        if (challenge.track === 'sql') {
          submitSqlQuestion(question!.id, code, isCorrect).catch(() => {})
        } else {
          submitDataAnalyticsExercise(question!.id, code, isCorrect).catch(() => {})
        }

        if (isCorrect && status === 'running' && !attemptRecorded.current) {
          attemptRecorded.current = true
          const elapsedSeconds = challenge.timeLimitSeconds - (remainingSeconds ?? 0)
          setStatus('succeeded')
          submitMiniChallengeAttempt(challenge.id, { elapsedSeconds, isCorrect: true }).catch(() => {})
        } else if (isCorrect && status === 'running') {
          setStatus('succeeded')
        }
      } else if (isCorrect && status === 'running') {
        setStatus('succeeded')
      }
    } catch (err) {
      setVerdict({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  if (loadError) {
    return (
      <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Couldn't load this Mini Challenge: {loadError}. Is the API server running (
        <code className="font-mono">cd server && npm run dev</code>)?
      </p>
    )
  }

  if (!challenges || !sqlQuestions || !exercises) {
    return <p className="text-sm text-slate-500">Loading Mini Challenge…</p>
  }

  if (!challenge || !question) {
    return (
      <div>
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          No Mini Challenge found for this world.
        </p>
        <Link to="/world-map" className="mt-3 inline-block text-sm font-medium text-indigo-600">
          ← Back to World Map
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link to="/world-map" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        ← Back to World Map
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          <span aria-hidden>{world?.icon ?? '⏱️'}</span> {question.title}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-mono font-semibold ${
            status === 'timedOut'
              ? 'bg-rose-100 text-rose-700'
              : status === 'succeeded'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          ⏱️ {formatClock(remainingSeconds ?? challenge.timeLimitSeconds)}
        </span>
      </div>
      <p className="mt-1 text-sm italic text-slate-500">{challenge.flavorText}</p>

      {status === 'timedOut' && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          ⏰ Time's up! This attempt won't count as a success, but keep going and see if you can solve it.
        </p>
      )}
      {status === 'succeeded' && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          🏆 Mini Challenge complete{user ? ' — +25 XP!' : '!'}
        </p>
      )}
      {!user && (
        <p className="mt-1 text-xs text-slate-400">Sign in to save this result and earn XP.</p>
      )}

      <p className="mt-4 text-slate-700">{question.prompt}</p>

      <div className="mt-4">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={challenge.track === 'data-analytics' ? python() : undefined}
          placeholder={challenge.track === 'sql' ? '-- write your query here' : '# write your code here'}
        />
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={verdict.status === 'grading'}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {verdict.status === 'grading' ? 'Running…' : 'Run'}
        </button>
      </div>

      <div className="mt-4">
        {verdict.status === 'error' && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{verdict.message}</p>
        )}
        {verdict.status === 'correct' && (
          <p className="mb-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            ✅ Correct!
          </p>
        )}
        {verdict.status === 'incorrect' && (
          <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            ❌ Not quite — try again before the clock runs out.
          </p>
        )}
        {verdict.status === 'correct' || verdict.status === 'incorrect' ? (
          verdict.sqlResult ? (
            <ResultTable columns={verdict.sqlResult.columns} rows={verdict.sqlResult.rows} />
          ) : verdict.pyResult ? (
            <PythonResultView value={verdict.pyResult.value} />
          ) : null
        ) : null}
      </div>
    </div>
  )
}

export default MiniChallenge
