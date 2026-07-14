import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Prisma 7 requires a driver adapter instead of a raw connection string.
// PrismaNeon wraps Neon's serverless HTTP transport, which is better for
// serverless/edge environments like Vercel than a persistent TCP connection.
// We also cache the instance on globalThis to avoid new connections on every
// hot-reload in dev.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
