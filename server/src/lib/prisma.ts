import { PrismaClient } from '@prisma/client'

// One client for the whole process. Re-instantiating PrismaClient per
// request would open a new connection pool each time — this is the standard
// Prisma pattern for a long-running server.
export const prisma = new PrismaClient()
