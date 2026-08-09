import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Reading into a function and annotating the return type gives JWT_SECRET a
// definite `string` type below — TS can't narrow a module-level `const`
// across the whole file just from an `if (!x) throw` a few lines up.
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    // Fail loudly at startup rather than silently signing tokens with
    // `undefined` — a mistake that's invisible until someone forges a token.
    throw new Error(`${name} environment variable is required (see .env.example).`)
  }
  return value
}

const JWT_SECRET = requireEnv('JWT_SECRET')
const TOKEN_EXPIRY = '7d'

export interface TokenPayload {
  userId: string
}

function isTokenPayload(value: unknown): value is TokenPayload {
  return typeof value === 'object' && value !== null && typeof (value as { userId?: unknown }).userId === 'string'
}

// bcryptjs (pure JS) instead of native bcrypt — no node-gyp/native build
// step, which matters on a learning machine that may not have build tools
// installed. Slower per-hash, irrelevant at this scale.
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET)
  if (!isTokenPayload(decoded)) {
    throw new Error('Token payload missing userId')
  }
  return decoded
}
