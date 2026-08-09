import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const sqlQuestionsRouter = Router()

sqlQuestionsRouter.get('/', async (_req, res) => {
  const questions = await prisma.sqlQuestion.findMany({ orderBy: { id: 'asc' } })
  res.json(questions)
})

const submitSchema = z.object({
  submittedQuery: z.string().min(1),
  isCorrect: z.boolean(),
})

// Records the *result* of a grading run the client already performed
// in-browser (see client/src/lib/sqlEngine.ts) — this endpoint never
// re-executes SQL itself. That means a client could report isCorrect: true
// without actually solving it; for a learning tool with no certification
// value at stake, that trust boundary is an acceptable trade-off, the same
// one made in Phase 4 when solutionQuery was exposed to the client at all.
sqlQuestionsRouter.post('/:id/submissions', requireAuth, async (req, res) => {
  const { id } = req.params as { id: string }
  const parsed = submitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const question = await prisma.sqlQuestion.findUnique({ where: { id } })
  if (!question) {
    res.status(404).json({ error: 'Question not found' })
    return
  }
  const submission = await prisma.sqlSubmission.create({
    data: {
      userId: req.userId!,
      questionId: question.id,
      submittedQuery: parsed.data.submittedQuery,
      isCorrect: parsed.data.isCorrect,
    },
  })
  res.status(201).json(submission)
})
