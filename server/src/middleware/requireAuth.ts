import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/auth.js'

// Module augmentation instead of a custom Request type — every route file
// keeps using Express's own `Request` type and just gets `.userId` for free
// after this middleware runs.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/** Reads `Authorization: Bearer <token>`, verifies it, and sets req.userId.
 * Responds 401 without calling next() if the token is missing or invalid —
 * routes behind this never need to re-check auth themselves. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' })
    return
  }
  try {
    const payload = verifyToken(token)
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
