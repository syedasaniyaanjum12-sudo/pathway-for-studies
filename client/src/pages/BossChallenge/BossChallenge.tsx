import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { python } from '@codemirror/lang-python'
import type { BossChallenge as BossChallengeContent, BossChallengeAttemptResult } from '../../../../shared/types'
import { getWorldById } from '../../../../shared/data/worlds'
import { fetchBossChallenges, submitBossChallengeAttempt } from '../../lib/api'
import { runQuery, type QueryResult } from '../../lib/sqlEngine'
import { resultsMatch } from '../../../../shared/grading/sqlGrading'
import { runPython, warmUpEngine, type PythonRunResult } from '../../lib/pythonEngine'
import { valuesMatch } from '../../../../shared/grading/pythonGrading'
import { useAuth } from '../../context/AuthContext'
import CodeEditor from '../../components/CodeEditor/CodeEditor'
import ResultTable from '../../components/ResultTable/ResultTable'
import PythonResultView from '../../components/PythonResultView/PythonResultView'

type PartVerdict =
  | { status: 'idle' }
  | { status: 'grading' }
  | { status: 'error'; message: string }
  | { status: 'correct'; sqlResult?: QueryResult; pyResult?: PythonRunResult }
  | { status: 'incorrect'; sqlResult?: QueryResult; pyResult?: PythonRunResult }

function BossChallenge() {
  const { worldId } = useParams<{ worldId: string }>()
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<BossChallengeContent[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [code, setCode] = useState<Record<string, string>>({})
  const [verdicts, setVerdicts] = useState<Record<string, PartVerdict>>({})
  const [showHint, setShowHint] = useState<Record<string, boolean>>({})
  const [correctPartIds, setCorrectPartIds] = useState<Set<string>>(new Set())
  const [attemptResult, setAttemptResult] = useState<BossChallengeAttemptResult | null>(null)

  useEffect(() => {
    warmUpEngine()
  }, [])

  useEffect(() => {
    fetchBossChallenges()
      .then(setChallenges)
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
  }, [])

  const challenge = challenges?.find((c) => c.id === worldId) ?? null
  const world = worldId ? getWorldById(worldId) : undefined
  const totalParts = challenge?.parts.length ?? 0
  const defeated = challenge !== null && correctPartIds.size === totalParts && totalParts > 0
  const healthPercent = totalParts > 0 ? Math.round(((totalParts - correctPartIds.size) / totalParts) * 100) : 100

  // Once every part is solved, record the win — only once per "defeat"
  // (attemptResult is null until this fires, and stays set afterward).
  useEffect(() => {
    if (!defeated || !challenge || attemptResult) return
    if (!user) return
    submitBossChallengeAttempt(challenge.id, Array.from(correctPartIds))
      .then(setAttemptResult)
      .catch(() => {
        // Best-effort persistence, same as every other submission in the app.
      })
  }, [defeated, challenge, user, correctPartIds, attemptResult])

  async function handleRun(partId: string) {
    if (!challenge) return
    const part = challenge.parts.find((p) => p.id === partId)
    const partCode = code[partId]
    if (!part || !partCode?.trim()) return

    setVerdicts((prev) => ({ ...prev, [partId]: { status: 'grading' } }))
    try {
      let isCorrect: boolean
      let sqlResult: QueryResult | undefined
      let pyResult: PythonRunResult | undefined

      if (challenge.track === 'sql') {
        const [actual, expected] = await Promise.all([
          runQuery(partCode),
          runQuery(part.solutionQuery!),
        ])
        sqlResult = actual
        isCorrect = resultsMatch(actual, expected, Boolean(part.orderMatters))
      } else {
        const runOptions = { checkVar: 'result', datasets: part.datasets ?? [] }
        const [actual, expected] = await Promise.all([
          runPython(partCode, runOptions),
          runPython(part.solutionCode!, runOptions),
        ])
        pyResult = actual
        if (actual.error) {
          setVerdicts((prev) => ({ ...prev, [partId]: { status: 'error', message: actual.error! } }))
          return
        }
        isCorrect = valuesMatch(actual.value, expected.value)
      }

      setVerdicts((prev) => ({
        ...prev,
        [partId]: { status: isCorrect ? 'correct' : 'incorrect', sqlResult, pyResult },
      }))
      if (isCorrect) {
        setCorrectPartIds((prev) => new Set(prev).add(partId))
      }
    } catch (err) {
      setVerdicts((prev) => ({
        ...prev,
        [partId]: { status: 'error', message: err instanceof Error ? err.message : String(err) },
      }))
    }
  }

  if (loadError) {
    return (
      <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Couldn't load this Boss Challenge: {loadError}. Is the API server running (
        <code className="font-mono">cd server && npm run dev</code>)?
      </p>
    )
  }

  if (!challenges) {
    return <p className="text-sm text-slate-500">Loading Boss Challenge…</p>
  }

  if (!challenge) {
    return (
      <div>
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          No Boss Challenge found for this world.
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
          <span aria-hidden>{world?.icon ?? '🐉'}</span> {challenge.title}
        </h1>
      </div>
      <p className="mt-1 text-sm italic text-slate-500">{challenge.introText}</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Boss HP</span>
          <span>
            {totalParts - correctPartIds.size} / {totalParts} parts remaining
          </span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${defeated ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      {defeated && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          🏆 Boss Defeated!{user ? ' +50 XP' : ' Sign in next time to earn XP and save this win.'}
        </p>
      )}
      {!user && !defeated && (
        <p className="mt-1 text-xs text-slate-400">Sign in to save this win and earn XP.</p>
      )}

      <div className="mt-6 space-y-8">
        {challenge.parts.map((part, index) => {
          const verdict = verdicts[part.id] ?? { status: 'idle' }
          const solved = correctPartIds.has(part.id)
          return (
            <div
              key={part.id}
              className={`rounded-lg border p-4 ${
                solved ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <p className="font-medium text-slate-900">
                Part {index + 1}
                {solved && <span className="ml-2">✅</span>}
              </p>
              <p className="mt-1 text-slate-700">{part.prompt}</p>

              <div className="mt-3">
                <CodeEditor
                  value={code[part.id] ?? ''}
                  onChange={(value) => setCode((prev) => ({ ...prev, [part.id]: value }))}
                  language={challenge.track === 'data-analytics' ? python() : undefined}
                  placeholder={challenge.track === 'sql' ? '-- write your query here' : '# write your code here'}
                />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleRun(part.id)}
                  disabled={verdict.status === 'grading'}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {verdict.status === 'grading' ? 'Running…' : 'Run'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => ({ ...prev, [part.id]: !prev[part.id] }))}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  {showHint[part.id] ? 'Hide hint' : 'Show hint'}
                </button>
              </div>

              {showHint[part.id] && (
                <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">💡 {part.hint}</p>
              )}

              <div className="mt-3">
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
                    ❌ Not quite yet.
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
        })}
      </div>
    </div>
  )
}

export default BossChallenge
