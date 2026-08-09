import { useEffect, useMemo, useState } from 'react'
import { python } from '@codemirror/lang-python'
import type { DataAnalyticsExercise, Difficulty } from '../../../../shared/types'
import { fetchDataAnalyticsExercises, fetchProgress, submitDataAnalyticsExercise } from '../../lib/api'
import { runPython, warmUpEngine, type PythonRunResult } from '../../lib/pythonEngine'
import { valuesMatch } from '../../lib/pythonGrading'
import { useAuth } from '../../context/AuthContext'
import DifficultyBadge from '../../components/DifficultyBadge/DifficultyBadge'
import CodeEditor from '../../components/CodeEditor/CodeEditor'
import PythonResultView from '../../components/PythonResultView/PythonResultView'
import SolvedMark from '../../components/SolvedMark/SolvedMark'
import DatasetReference from './DatasetReference'

const DIFFICULTY_FILTERS: Array<Difficulty | 'All'> = ['All', 'Easy', 'Medium', 'Hard', 'Interview']

type Verdict =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'runtime-error'; result: PythonRunResult }
  | { status: 'correct'; result: PythonRunResult }
  | { status: 'incorrect'; result: PythonRunResult }

function DataAnalytics() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<DataAnalyticsExercise[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [verdict, setVerdict] = useState<Verdict>({ status: 'idle' })
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())

  // Start downloading Pyodide as soon as this page is visited, rather than
  // waiting for the learner's first "Run" click.
  useEffect(() => {
    warmUpEngine()
  }, [])

  useEffect(() => {
    fetchDataAnalyticsExercises()
      .then((data) => {
        setExercises(data)
        setSelectedExerciseId(data[0]?.id ?? null)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
  }, [])

  useEffect(() => {
    if (!user) {
      setSolvedIds(new Set())
      return
    }
    fetchProgress()
      .then((progress) => setSolvedIds(new Set(progress.solvedExerciseIds)))
      .catch(() => {
        // Non-critical — the page still works without progress checkmarks.
      })
  }, [user])

  const visibleExercises = useMemo(() => {
    if (!exercises) return []
    return difficultyFilter === 'All'
      ? exercises
      : exercises.filter((ex) => ex.difficulty === difficultyFilter)
  }, [exercises, difficultyFilter])

  const selectedExercise = exercises?.find((ex) => ex.id === selectedExerciseId) ?? null

  function selectExercise(exercise: DataAnalyticsExercise) {
    setSelectedExerciseId(exercise.id)
    setCode('')
    setShowHint(false)
    setVerdict({ status: 'idle' })
  }

  async function handleRun() {
    if (!code.trim() || !selectedExercise) return
    setVerdict({ status: 'running' })
    const runOptions = { checkVar: 'result', datasets: selectedExercise.datasets }
    const [actual, expected] = await Promise.all([
      runPython(code, runOptions),
      runPython(selectedExercise.solutionCode, runOptions),
    ])
    if (actual.error) {
      setVerdict({ status: 'runtime-error', result: actual })
      return
    }
    const isCorrect = valuesMatch(actual.value, expected.value)
    setVerdict({ status: isCorrect ? 'correct' : 'incorrect', result: actual })

    if (user) {
      if (isCorrect) {
        setSolvedIds((prev) => new Set(prev).add(selectedExercise.id))
      }
      submitDataAnalyticsExercise(selectedExercise.id, code, isCorrect).catch(() => {
        // Best-effort logging of an attempt; losing one submission record
        // shouldn't block the learner from seeing their result.
      })
    }
  }

  if (loadError) {
    return (
      <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Couldn't load exercises: {loadError}. Is the API server running (
        <code className="font-mono">cd server && npm run dev</code>)?
      </p>
    )
  }

  if (!exercises || !selectedExercise) {
    return <p className="text-sm text-slate-500">Loading exercises…</p>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside>
        <div className="mb-3 flex flex-wrap gap-2">
          {DIFFICULTY_FILTERS.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => setDifficultyFilter(difficulty)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                difficultyFilter === difficulty
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
        <ul className="space-y-1">
          {visibleExercises.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => selectExercise(exercise)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  exercise.id === selectedExercise.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-transparent hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-slate-800">
                    {solvedIds.has(exercise.id) && <SolvedMark />}
                    {exercise.title}
                  </span>
                  <DifficultyBadge difficulty={exercise.difficulty} />
                </div>
                <span className="text-xs text-slate-500">{exercise.topic}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{selectedExercise.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <DifficultyBadge difficulty={selectedExercise.difficulty} />
              <span className="text-xs text-slate-500">{selectedExercise.topic}</span>
            </div>
          </div>
          <DatasetReference datasets={selectedExercise.datasets} />
        </div>

        <p className="mt-4 text-slate-700">{selectedExercise.prompt}</p>
        <p className="mt-1 text-xs text-slate-400">
          Assign your answer to a variable named <code className="font-mono">result</code>.
        </p>

        <div className="mt-4">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={python()}
            placeholder="# write your code here"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={verdict.status === 'running'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {verdict.status === 'running' ? 'Running…' : 'Run Code'}
          </button>
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>
        </div>

        {verdict.status === 'running' && (
          <p className="mt-2 text-xs text-slate-400">
            First run on this page loads a Python environment in your browser — this can take
            10–20 seconds.
          </p>
        )}

        {showHint && (
          <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            💡 {selectedExercise.hint}
          </p>
        )}

        <div className="mt-4">
          {verdict.status === 'runtime-error' && (
            <pre className="overflow-auto rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {verdict.result.error}
            </pre>
          )}
          {verdict.status === 'correct' && (
            <p className="mb-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              ✅ Correct!
            </p>
          )}
          {verdict.status === 'incorrect' && (
            <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              ❌ Not quite — your code ran, but result doesn't match yet.
            </p>
          )}
          {(verdict.status === 'correct' || verdict.status === 'incorrect') && (
            <>
              {verdict.result.stdout && (
                <pre className="mb-2 overflow-auto rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-100">
                  {verdict.result.stdout}
                </pre>
              )}
              {verdict.result.image && (
                <img
                  src={`data:image/png;base64,${verdict.result.image}`}
                  alt="Matplotlib output"
                  className="mb-2 max-w-full rounded-md border border-slate-200"
                />
              )}
              <PythonResultView value={verdict.result.value} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default DataAnalytics
