import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { isPythonSandboxAvailable, gradePythonServerSide } from '../lib/pythonSandbox.js'
import type { DatasetBinding, SubmissionResult } from '../../../shared/types.js'

export const dataAnalyticsExercisesRouter = Router()

dataAnalyticsExercisesRouter.get('/', async (_req, res) => {
  const exercises = await prisma.dataAnalyticsExercise.findMany({ orderBy: { id: 'asc' } })
  res.json(exercises)
})

const submitSchema = z.object({
  submittedCode: z.string().min(1),
  isCorrect: z.boolean(),
})

// Same trust boundary as SQL submissions (see sqlQuestions.ts): for
// Easy/Medium/Hard, this records the grading result the client already
// computed via Pyodide, unchecked. For Interview-tier exercises (Phase 6),
// the server independently re-runs the submission in a RestrictedPython
// sandbox (server/python/run_sandboxed.py) and its own isCorrect is
// authoritative — falling back to the client's self-report only if the
// sandbox itself isn't available on this deployment (see
// isPythonSandboxAvailable) or fails to run.
dataAnalyticsExercisesRouter.post('/:id/submissions', requireAuth, async (req, res) => {
  const { id } = req.params as { id: string }
  const parsed = submitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const exercise = await prisma.dataAnalyticsExercise.findUnique({ where: { id } })
  if (!exercise) {
    res.status(404).json({ error: 'Exercise not found' })
    return
  }

  let isCorrect = parsed.data.isCorrect
  let gradedBy: SubmissionResult['gradedBy'] = 'client'
  let serverNote: string | undefined

  if (exercise.difficulty === 'Interview') {
    const available = await isPythonSandboxAvailable()
    if (!available) {
      serverNote = 'Python sandbox is not available on this server (RestrictedPython/pandas/numpy not installed) — showing your own grading result instead.'
    } else {
      try {
        const graded = await gradePythonServerSide(
          exercise.solutionCode,
          exercise.datasets as unknown as DatasetBinding[],
          parsed.data.submittedCode,
        )
        isCorrect = graded.isCorrect
        gradedBy = 'server'
      } catch (err) {
        serverNote = err instanceof Error ? err.message : String(err)
      }
    }
  }

  const submission = await prisma.dataAnalyticsSubmission.create({
    data: {
      userId: req.userId!,
      exerciseId: exercise.id,
      submittedCode: parsed.data.submittedCode,
      isCorrect,
    },
  })

  const result: SubmissionResult = { id: submission.id, isCorrect, gradedBy, serverNote }
  res.status(201).json(result)
})
