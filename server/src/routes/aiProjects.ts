import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const aiProjectsRouter = Router()

aiProjectsRouter.get('/', async (_req, res) => {
  const projects = await prisma.aiProject.findMany({ orderBy: { id: 'asc' } })
  res.json(projects)
})
