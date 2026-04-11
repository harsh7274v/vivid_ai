import { PrismaClient } from '../generated/prisma'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Use HTTP adapter — more reliable in serverless/Vercel environments
  // than WebSocket-based PrismaNeon which fails with ErrorEvent on Vercel
  const adapter = new PrismaNeonHttp(databaseUrl, {
    arrayMode: false,
    fullResults: true,
  })

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
