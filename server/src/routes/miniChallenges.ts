import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import type { MiniChallengeAttemptResult } from '../../../shared/types.js'

export const miniChallengesRouter = Router()

// No answer key to strip here — a Mini Challenge is just an existing
// SqlQuestion/DataAnalyticsExercise (by refId) plus a time limit; the
// client already fetches that question/exercise (and its own grading)
// separately via the normal SQL Practice / Data Analytics endpoints.
miniChallengesRouter.get('/', async (_req, res) => {
  const challenges = await prisma.miniChallenge.findMany({ orderBy: { id: 'asc' } })
  res.json(challenges)
})

const attemptSchema = z.object({
  elapsedSeconds: z.number().int().nonnegative(),
  isCorrect: z.boolean(),
})

// `isCorrect` here is the same client-reported trust boundary as
// Easy/Medium/Hard SQL/DA submissions (see docs/PLAN.md's Phase 5 note) —
// this endpoint doesn't re-grade the underlying question itself (that
// already happened via the normal submission flow), it just adds the
// timing check on top: succeeded requires both a correct answer AND
// finishing within timeLimitSeconds.
miniChallengesRouter.post('/:id/attempts', requireAuth, async (req, res) => {
  const { id } = req.params as { id: string }
  const parsed = attemptSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const challenge = await prisma.miniChallenge.findUnique({ where: { id } })
  if (!challenge) {
    res.status(404).json({ error: 'Mini Challenge not found' })
    return
  }

  const { elapsedSeconds, isCorrect } = parsed.data
  const succeeded = isCorrect && elapsedSeconds <= challenge.timeLimitSeconds

  const attempt = await prisma.miniChallengeAttempt.create({
    data: { userId: req.userId!, challengeId: challenge.id, elapsedSeconds, succeeded },
  })

  const result: MiniChallengeAttemptResult = {
    id: attempt.id,
    succeeded,
    elapsedSeconds,
    timeLimitSeconds: challenge.timeLimitSeconds,
  }
  res.status(201).json(result)
})
