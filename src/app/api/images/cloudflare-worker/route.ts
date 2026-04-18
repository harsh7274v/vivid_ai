import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function normalizeWorkerUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return 'https://workers.dev'
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function detectImageMime(buffer: Uint8Array): string | null {
  if (buffer.byteLength < 12) return null

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  // GIF87a / GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'image/gif'
  }

  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const workerUrl = normalizeWorkerUrl(
      process.env.CLOUDFLARE_IMAGE_WORKER_URL?.trim() || 'https://workers.dev'
    )
    const workerToken = process.env.CLOUDFLARE_IMAGE_WORKER_TOKEN?.trim()

    if (!workerToken) {
      return NextResponse.json(
        { error: 'Cloudflare image worker token is not configured.' },
        { status: 500 }
      )
    }

    const body = (await req.json().catch(() => ({}))) as { prompt?: string }
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${workerToken}`,
        'Content-Type': 'application/json',
        Accept: 'image/*',
      },
      body: JSON.stringify({ prompt }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudflare image worker failed:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to generate image', details: errorText },
        { status: response.status }
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    const detectedMime = detectImageMime(bytes)

    if (!detectedMime) {
      let details = `Expected supported image bytes but received content-type: ${contentType || 'unknown'}`
      if (contentType.includes('json') || contentType.includes('text')) {
        const text = new TextDecoder().decode(bytes).slice(0, 500)
        details = `${details}. Payload preview: ${text}`
      }
      return NextResponse.json(
        { error: 'Cloudflare worker did not return a supported image format.', details },
        { status: 502 }
      )
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': detectedMime,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Cloudflare image worker error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}