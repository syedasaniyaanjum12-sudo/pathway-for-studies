import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const progressRouter = Router()

// One summary endpoint the client calls once per page load, rather than
// three separate "am I done with this?" queries per item — the UI needs
// this before it can render checkmarks in the SQL/exercise/project lists.
progressRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.userId!

  const [sqlSolved, exercisesSolved, projectStatuses] = await Promise.all([
    prisma.sqlSubmission.findMany({
      where: { userId, isCorrect: true },
      distinct: ['questionId'],
      select: { questionId: true },
    }),
    prisma.dataAnalyticsSubmission.findMany({
      where: { userId, isCorrect: true },
      distinct: ['exerciseId'],
      select: { exerciseId: true },
    }),
    prisma.userProjectStatus.findMany({
      where: { userId },
      select: { projectId: true, status: true },
    }),
  ])

  res.json({
    solvedSqlQuestionIds: sqlSolved.map((s) => s.questionId),
    solvedExerciseIds: exercisesSolved.map((e) => e.exerciseId),
    projectStatuses: Object.fromEntries(projectStatuses.map((p) => [p.projectId, p.status])),
  })
})
