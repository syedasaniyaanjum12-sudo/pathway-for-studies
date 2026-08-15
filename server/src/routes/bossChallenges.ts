import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import type { BossChallenge, BossChallengeAttemptResult } from '../../../shared/types.js'

export const bossChallengesRouter = Router()

// Same trust model as SqlQuestion/DataAnalyticsExercise: each part's
// solution ships to the client upfront, so a Boss Challenge is gradeable
// (by the client's own sql.js/Pyodide engine, same as every other question)
// even for a signed-out learner. POST .../attempts (below) is where a
// signed-in learner's attempt is checked and persisted.
bossChallengesRouter.get('/', async (_req, res) => {
  const challenges = await prisma.bossChallenge.findMany({ orderBy: { id: 'asc' } })
  const result: BossChallenge[] = challenges.map((c) => ({
    id: c.id,
    track: c.track as BossChallenge['track'],
    title: c.title,
    introText: c.introText,
    parts: c.parts as unknown as BossChallenge['parts'],
  }))
  res.json(result)
})

const attemptSchema = z.object({
  correctPartIds: z.array(z.string()),
})

// The server can't re-execute SQL/Python itself (no Interview-tier-style
// sandbox wired up for Boss Challenges), so it can't independently confirm
// *which* parts were actually solved correctly — but it can and does check
// that the reported correctPartIds structurally cover every real part of
// this challenge (right count, right ids, no duplicates padding the count)
// before marking it defeated, rather than blindly trusting a single
// isCorrect-style boolean the way a naive re-implementation might.
bossChallengesRouter.post('/:id/attempts', requireAuth, async (req, res) => {
  const { id } = req.params as { id: string }
  const parsed = attemptSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const challenge = await prisma.bossChallenge.findUnique({ where: { id } })
  if (!challenge) {
    res.status(404).json({ error: 'Boss Challenge not found' })
    return
  }
  const parts = challenge.parts as unknown as BossChallenge['parts']
  const realPartIds = new Set(parts.map((p) => p.id))

  const correctPartIds = new Set(parsed.data.correctPartIds.filter((partId) => realPartIds.has(partId)))
  const correctCount = correctPartIds.size
  const totalCount = parts.length
  const defeated = totalCount > 0 && correctCount === totalCount

  const attempt = await prisma.bossChallengeAttempt.create({
    data: { userId: req.userId!, challengeId: challenge.id, correctCount, totalCount, defeated },
  })

  const result: BossChallengeAttemptResult = {
    id: attempt.id,
    defeated,
    correctCount,
    totalCount,
  }
  res.status(201).json(result)
})
