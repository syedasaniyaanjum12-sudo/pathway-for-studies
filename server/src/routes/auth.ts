import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const authRouter = Router()

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

authRouter.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const { email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'An account with that email already exists' })
    return
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({ data: { email, passwordHash } })
  const token = signToken({ userId: user.id })
  res.status(201).json({ token, user: { id: user.id, email: user.email } })
})

authRouter.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  // Same error for "no such user" and "wrong password" — distinguishing
  // them tells an attacker which emails have accounts.
  const invalidCredentials = () => res.status(401).json({ error: 'Invalid email or password' })
  if (!user) {
    invalidCredentials()
    return
  }
  const passwordMatches = await verifyPassword(password, user.passwordHash)
  if (!passwordMatches) {
    invalidCredentials()
    return
  }

  const token = signToken({ userId: user.id })
  res.json({ token, user: { id: user.id, email: user.email } })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ id: user.id, email: user.email })
})
