import { useMemo, useState } from 'react'
import { sqlQuestions, type SqlDifficulty, type SqlQuestion } from '../../data/sqlQuestions'
import { runQuery, type QueryResult } from '../../lib/sqlEngine'
import { resultsMatch } from '../../lib/grading'
import DifficultyBadge from '../../components/DifficultyBadge/DifficultyBadge'
import CodeEditor from '../../components/CodeEditor/CodeEditor'
import ResultTable from '../../components/ResultTable/ResultTable'
import SchemaReference from './SchemaReference'

const DIFFICULTY_FILTERS: Array<SqlDifficulty | 'All'> = [
  'All',
  'Easy',
  'Medium',
  'Hard',
  'Interview',
]

type Verdict =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'error'; message: string }
  | { status: 'correct'; result: QueryResult }
  | { status: 'incorrect'; result: QueryResult }

function SqlPractice() {
  const [difficultyFilter, setDifficultyFilter] = useState<SqlDifficulty | 'All'>('All')
  const [selectedQuestion, setSelectedQuestion] = useState<SqlQuestion>(sqlQuestions[0])
  const [query, setQuery] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [verdict, setVerdict] = useState<Verdict>({ status: 'idle' })

  const visibleQuestions = useMemo(
    () =>
      difficultyFilter === 'All'
        ? sqlQuestions
        : sqlQuestions.filter((q) => q.difficulty === difficultyFilter),
    [difficultyFilter],
  )

  function selectQuestion(question: SqlQuestion) {
    setSelectedQuestion(question)
    setQuery('')
    setShowHint(false)
    setVerdict({ status: 'idle' })
  }

  async function handleRun() {
    if (!query.trim()) return
    setVerdict({ status: 'running' })
    try {
      // Two independent fresh databases: one for the learner's query, one
      // for the solution. Keeping them separate means a query that mutates
      // data (CREATE VIEW, etc.) can never affect the grading run.
      const [actual, expected] = await Promise.all([
        runQuery(query),
        runQuery(selectedQuestion.solutionQuery),
      ])
      const isCorrect = resultsMatch(actual, expected, Boolean(selectedQuestion.orderMatters))
      setVerdict(isCorrect ? { status: 'correct', result: actual } : { status: 'incorrect', result: actual })
    } catch (err) {
      setVerdict({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
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
          {visibleQuestions.map((question) => (
            <li key={question.id}>
              <button
                type="button"
                onClick={() => selectQuestion(question)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  question.id === selectedQuestion.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-transparent hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{question.title}</span>
                  <DifficultyBadge difficulty={question.difficulty} />
                </div>
                <span className="text-xs text-slate-500">{question.topic}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{selectedQuestion.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <DifficultyBadge difficulty={selectedQuestion.difficulty} />
              <span className="text-xs text-slate-500">{selectedQuestion.topic}</span>
            </div>
          </div>
          <SchemaReference />
        </div>

        <p className="mt-4 text-slate-700">{selectedQuestion.prompt}</p>

        <div className="mt-4">
          <CodeEditor value={query} onChange={setQuery} placeholder="-- write your query here" />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={verdict.status === 'running'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {verdict.status === 'running' ? 'Running…' : 'Run Query'}
          </button>
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>
        </div>

        {showHint && (
          <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            💡 {selectedQuestion.hint}
          </p>
        )}

        <div className="mt-4">
          {verdict.status === 'error' && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {verdict.message}
            </p>
          )}
          {verdict.status === 'correct' && (
            <p className="mb-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              ✅ Correct!
            </p>
          )}
          {verdict.status === 'incorrect' && (
            <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              ❌ Not quite — your query ran, but the result doesn't match yet.
            </p>
          )}
          {(verdict.status === 'correct' || verdict.status === 'incorrect') && (
            <ResultTable columns={verdict.result.columns} rows={verdict.result.rows} />
          )}
        </div>
      </section>
    </div>
  )
}

export default SqlPractice
