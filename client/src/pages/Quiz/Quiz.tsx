import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Quiz as QuizContent, QuizAttemptResult } from '../../../../shared/types'
import { getWorldById } from '../../../../shared/data/worlds'
import { fetchQuizzes, submitQuizAttempt } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

// Grades client-side against the answer key already present in `quiz` (see
// docs/PLAN.md's Phase 3 note on why quizzes ship their full answer key
// upfront, same trust model as SQL/DA solutions) — works even signed out,
// with nothing to persist. Mirrors the shape POST .../attempts returns so
// the render logic below doesn't need two code paths.
function gradeLocally(quiz: QuizContent, choices: Record<string, string>): QuizAttemptResult {
  const review: QuizAttemptResult['review'] = {}
  let correctCount = 0
  for (const question of quiz.questions) {
    const correct = choices[question.id] === question.correctChoiceId
    if (correct) correctCount += 1
    review[question.id] = {
      correct,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
    }
  }
  const totalCount = quiz.questions.length
  return {
    id: 'local',
    quizId: quiz.id,
    correctCount,
    totalCount,
    passed: totalCount > 0 && correctCount / totalCount >= 0.75,
    review,
  }
}

function Quiz() {
  const { worldId } = useParams<{ worldId: string }>()
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<QuizContent[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizAttemptResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
  }, [])

  const quiz = quizzes?.find((qz) => qz.id === worldId) ?? null
  const world = worldId ? getWorldById(worldId) : undefined

  function selectChoice(questionId: string, choiceId: string) {
    if (result) return // locked once graded — "Try Again" resets first
    setChoices((prev) => ({ ...prev, [questionId]: choiceId }))
  }

  async function handleSubmit() {
    if (!quiz) return
    setSubmitting(true)
    const localResult = gradeLocally(quiz, choices)
    setResult(localResult)
    if (user) {
      try {
        const serverResult = await submitQuizAttempt(quiz.id, choices)
        setResult(serverResult) // authoritative + persisted; should match localResult
      } catch {
        // Best-effort persistence, same as every other submission in the
        // app — the learner still sees their (client-computed) result.
      }
    }
    setSubmitting(false)
  }

  function tryAgain() {
    setChoices({})
    setResult(null)
  }

  if (loadError) {
    return (
      <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Couldn't load this quiz: {loadError}. Is the API server running (
        <code className="font-mono">cd server && npm run dev</code>)?
      </p>
    )
  }

  if (!quizzes) {
    return <p className="text-sm text-slate-500">Loading quiz…</p>
  }

  if (!quiz) {
    return (
      <div>
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          No quiz found for this world.
        </p>
        <Link to="/world-map" className="mt-3 inline-block text-sm font-medium text-indigo-600">
          ← Back to World Map
        </Link>
      </div>
    )
  }

  const allAnswered = quiz.questions.every((question) => choices[question.id])

  return (
    <div className="max-w-2xl">
      <Link to="/world-map" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        ← Back to World Map
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        <span aria-hidden>{world?.icon ?? '📝'}</span> {quiz.title}
      </h1>
      {!user && (
        <p className="mt-1 text-xs text-slate-400">
          Sign in to save this result and earn XP — you can still take the quiz right now either way.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {quiz.questions.map((question, index) => {
          const review = result?.review[question.id]
          return (
            <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">
                {index + 1}. {question.prompt}
              </p>
              <div className="mt-3 space-y-2">
                {question.choices.map((choice) => {
                  const selected = choices[question.id] === choice.id
                  const isCorrectChoice = review && choice.id === review.correctChoiceId
                  const isWrongSelected = review && selected && !review.correct
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => selectChoice(question.id, choice.id)}
                      disabled={Boolean(result)}
                      className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                        isCorrectChoice
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : isWrongSelected
                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                            : selected
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-slate-200 hover:bg-slate-50'
                      } ${result ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {choice.text}
                      {isCorrectChoice && <span className="ml-2">✅</span>}
                      {isWrongSelected && <span className="ml-2">❌</span>}
                    </button>
                  )
                })}
              </div>
              {review && (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  💡 {review.explanation}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {!result ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? 'Grading…' : 'Submit Quiz'}
        </button>
      ) : (
        <div className="mt-6 space-y-3">
          <p
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              result.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {result.passed ? '✅ Passed!' : '❌ Not quite'} — {result.correctCount} / {result.totalCount}{' '}
            correct{result.passed && user ? ' (+15 XP)' : ''}
          </p>
          <button
            type="button"
            onClick={tryAgain}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Quiz
