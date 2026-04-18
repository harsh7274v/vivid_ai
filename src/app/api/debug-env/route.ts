import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL
  const openRouterKey = process.env.OPENROUTER_API_KEY
  const openRouterModel = process.env.OPENROUTER_MODEL
  const pexelsKey = process.env.PEXELS_API_KEY
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    DATABASE_URL_exists: !!dbUrl,
    DATABASE_URL_length: dbUrl?.length ?? 0,
    DATABASE_URL_prefix: dbUrl?.substring(0, 20) ?? 'NOT SET',
    DATABASE_URL_has_quotes: dbUrl?.startsWith('"') || dbUrl?.startsWith("'"),
    DIRECT_URL_exists: !!directUrl,
    OPENROUTER_API_KEY_exists: !!openRouterKey,
    OPENROUTER_API_KEY_length: openRouterKey?.length ?? 0,
    OPENROUTER_MODEL: openRouterModel || 'NOT SET',
    PEXELS_API_KEY_exists: !!pexelsKey,
    NEXT_PUBLIC_FIREBASE_API_KEY_exists: !!firebaseApiKey,
    NODE_ENV: process.env.NODE_ENV,
    all_db_related_keys: Object.keys(process.env).filter(
      (k) =>
        k.includes('DATABASE') ||
        k.includes('POSTGRES') ||
        k.includes('NEON') ||
        k.includes('DB') ||
        k.includes('DIRECT')
    ),
    all_openrouter_keys: Object.keys(process.env).filter((k) => k.includes('OPENROUTER')),
  })
}
