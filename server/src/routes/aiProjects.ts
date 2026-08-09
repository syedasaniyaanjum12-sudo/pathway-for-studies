import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const aiProjectsRouter = Router()

aiProjectsRouter.get('/', async (_req, res) => {
  const projects = await prisma.aiProject.findMany({ orderBy: { id: 'asc' } })
  res.json(projects)
})

const statusSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'done']),
})

aiProjectsRouter.put('/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params as { id: string }
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const project = await prisma.aiProject.findUnique({ where: { id } })
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  const result = await prisma.userProjectStatus.upsert({
    where: { userId_projectId: { userId: req.userId!, projectId: project.id } },
    create: { userId: req.userId!, projectId: project.id, status: parsed.data.status },
    update: { status: parsed.data.status },
  })
  res.json(result)
})
