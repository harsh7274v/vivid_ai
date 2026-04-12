import { PrismaClient } from '../generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('[Prisma] DATABASE_URL is NOT SET. Available env keys:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NEON') || k.includes('DB')))
    throw new Error('DATABASE_URL environment variable is not set. Please add it to your Vercel project settings.')
  }

  console.log('[Prisma] Connecting to:', databaseUrl.replace(/\/\/.*@/, '//***@'))

  const pool = new pg.Pool({
    connectionString: databaseUrl,
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
