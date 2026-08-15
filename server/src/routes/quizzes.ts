import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import type { Quiz, QuizAttemptResult } from '../../../shared/types.js'

export const quizzesRouter = Router()

// Same trust model as SqlQuestion/DataAnalyticsExercise: the full answer
// key ships to the client upfront, so a quiz is instantly gradeable
// client-side — including for a signed-out learner just trying it, with
// nothing to persist. POST .../attempts (below) is where a signed-in
// learner's attempt is independently re-graded and actually saved for XP.
quizzesRouter.get('/', async (_req, res) => {
  const quizzes = await prisma.quiz.findMany({ orderBy: { id: 'asc' } })
  const result: Quiz[] = quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    questions: quiz.questions as unknown as Quiz['questions'],
  }))
  res.json(result)
})

const attemptSchema = z.object({
  choices: z.record(z.string(), z.string()),
})

// Authoritative server-side grading (comparing against the same DB-stored
// answer key the client already has) rather than trusting the client's own
// report — cheap enough to just always do properly, unlike SQL/Python
// grading where re-execution is the expensive part reserved for
// Interview-tier only (see docs/PLAN.md's Phase 5/6 notes).
quizzesRouter.post('/:id/attempts', requireAuth, async (req, res) => {
  const { id } = req.params as { id: string }
  const parsed = attemptSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const quiz = await prisma.quiz.findUnique({ where: { id } })
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' })
    return
  }
  const questions = quiz.questions as unknown as Quiz['questions']

  const review: QuizAttemptResult['review'] = {}
  let correctCount = 0
  for (const question of questions) {
    const submitted = parsed.data.choices[question.id]
    const correct = submitted === question.correctChoiceId
    if (correct) correctCount += 1
    review[question.id] = {
      correct,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
    }
  }
  const totalCount = questions.length
  const passed = totalCount > 0 && correctCount / totalCount >= 0.75

  const attempt = await prisma.quizAttempt.create({
    data: { userId: req.userId!, quizId: quiz.id, correctCount, totalCount, passed },
  })

  const result: QuizAttemptResult = {
    id: attempt.id,
    quizId: quiz.id,
    correctCount,
    totalCount,
    passed,
    review,
  }
  res.status(201).json(result)
})
