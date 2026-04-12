import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    DATABASE_URL_exists: !!dbUrl,
    DATABASE_URL_length: dbUrl?.length ?? 0,
    DATABASE_URL_prefix: dbUrl?.substring(0, 20) ?? 'NOT SET',
    DATABASE_URL_has_quotes: dbUrl?.startsWith('"') || dbUrl?.startsWith("'"),
    DIRECT_URL_exists: !!directUrl,
    NODE_ENV: process.env.NODE_ENV,
    all_db_related_keys: Object.keys(process.env).filter(
      (k) =>
        k.includes('DATABASE') ||
        k.includes('POSTGRES') ||
        k.includes('NEON') ||
        k.includes('DB') ||
        k.includes('DIRECT')
    ),
  })
}
