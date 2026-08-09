import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const dataAnalyticsExercisesRouter = Router()

dataAnalyticsExercisesRouter.get('/', async (_req, res) => {
  const exercises = await prisma.dataAnalyticsExercise.findMany({ orderBy: { id: 'asc' } })
  res.json(exercises)
})
