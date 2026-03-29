import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'pexels'

// Ensure this route runs in the Node.js runtime so process.env is available
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PEXELS_API_KEY

    if (!apiKey) {
      console.warn('PEXELS_API_KEY is not set. Pexels image search API route will return 500 errors.')
      return NextResponse.json(
        { error: 'Pexels API key is not configured on the server.' },
        { status: 500 },
      )
    }

    const client = createClient(apiKey)

    const body = await req.json().catch(() => ({}))
    const { query, perPage = 1, orientation = 'landscape' } = body as {
      query?: string
      perPage?: number
      orientation?: 'landscape' | 'portrait' | 'square'
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing required "query" field in request body.' },
        { status: 400 },
      )
    }

    // Use Pexels photos.search API
    const result = await (client as any).photos.search({
      query,
      per_page: Math.min(perPage || 1, 5),
      orientation,
    })

    const photos = (result?.photos ?? []).map((p: any) => ({
      id: p.id,
      url: p.url as string,
      photographer: p.photographer as string,
      photographerUrl: p.photographer_url as string,
      alt: p.alt as string,
      src: p.src as Record<string, string>,
    }))

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Error fetching images from Pexels:', error)

    // If Pexels is temporarily unreachable (network timeout, etc.),
    // degrade gracefully by returning an empty photo list instead of 500.
    return NextResponse.json({ photos: [] })
  }
}
