import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { gradeSqlServerSide } from '../lib/sqlEngine.js'
import type { SubmissionResult } from '../../../shared/types.js'

export const sqlQuestionsRouter = Router()

sqlQuestionsRouter.get('/', async (_req, res) => {
  const questions = await prisma.sqlQuestion.findMany({ orderBy: { id: 'asc' } })
  res.json(questions)
})

const submitSchema = z.object({
  submittedQuery: z.string().min(1),
  isCorrect: z.boolean(),
})

// For Easy/Medium/Hard, this records the *result* of a grading run the
// client already performed in-browser (see client/src/lib/sqlEngine.ts)
// without re-checking it — a client could self-report isCorrect: true
// without actually solving it, an acceptable trade-off for a learning tool
// with no certification value at stake (see docs/PLAN.md's Phase 5 note).
//
// For Interview-tier questions (Phase 6), that trust boundary is closed:
// the server re-runs the submission itself via sql.js and its own
// isCorrect is authoritative — the client-reported value is only used as a
// fallback if server-side grading itself fails to run.
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

  let isCorrect = parsed.data.isCorrect
  let gradedBy: SubmissionResult['gradedBy'] = 'client'
  let serverNote: string | undefined

  if (question.difficulty === 'Interview') {
    try {
      const graded = await gradeSqlServerSide(
        question.solutionQuery,
        question.orderMatters,
        parsed.data.submittedQuery,
      )
      isCorrect = graded.isCorrect
      gradedBy = 'server'
    } catch (err) {
      // Genuine infra failure (see gradeSqlServerSide's doc comment) —
      // fall back to the client's self-reported result rather than
      // blocking the learner from seeing any result at all.
      serverNote = err instanceof Error ? err.message : String(err)
    }
  }

  const submission = await prisma.sqlSubmission.create({
    data: {
      userId: req.userId!,
      questionId: question.id,
      submittedQuery: parsed.data.submittedQuery,
      isCorrect,
    },
  })

  const result: SubmissionResult = { id: submission.id, isCorrect, gradedBy, serverNote }
  res.status(201).json(result)
})
