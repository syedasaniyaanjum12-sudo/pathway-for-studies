import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const dataAnalyticsExercisesRouter = Router()

dataAnalyticsExercisesRouter.get('/', async (_req, res) => {
  const exercises = await prisma.dataAnalyticsExercise.findMany({ orderBy: { id: 'asc' } })
  res.json(exercises)
})

const submitSchema = z.object({
  submittedCode: z.string().min(1),
  isCorrect: z.boolean(),
})

// Same trust boundary as SQL submissions (see sqlQuestions.ts) — records a
// grading result the client already computed via Pyodide.
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
  const submission = await prisma.dataAnalyticsSubmission.create({
    data: {
      userId: req.userId!,
      exerciseId: exercise.id,
      submittedCode: parsed.data.submittedCode,
      isCorrect: parsed.data.isCorrect,
    },
  })
  res.status(201).json(submission)
})
