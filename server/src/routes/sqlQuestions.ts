import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const sqlQuestionsRouter = Router()

sqlQuestionsRouter.get('/', async (_req, res) => {
  const questions = await prisma.sqlQuestion.findMany({ orderBy: { id: 'asc' } })
  res.json(questions)
})
