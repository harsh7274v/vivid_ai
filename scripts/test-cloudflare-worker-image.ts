import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const workerUrl = process.env.CLOUDFLARE_IMAGE_WORKER_URL?.trim()
const workerToken = process.env.CLOUDFLARE_IMAGE_WORKER_TOKEN?.trim()

const prompt = process.argv.slice(2).join(' ').trim() || 'A futuristic city in the clouds'

function guessExtensionFromMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'bin'
}

function guessTextExtensionFromMime(mime: string): string {
  if (mime.includes('html')) return 'html'
  if (mime.includes('json')) return 'json'
  if (mime.includes('plain')) return 'txt'
  return 'txt'
}

function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'prompt'
}

function normalizeWorkerUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return trimmed
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

async function saveFromJsonPayload(json: unknown, outputDir: string, baseName: string) {
  if (!json || typeof json !== 'object') {
    throw new Error('Worker returned JSON without image fields')
  }

  const payload = json as Record<string, unknown>
  const candidates = [payload.image, payload.imageUrl, payload.image_url, payload.url, payload.data]

  const value = candidates.find((item) => typeof item === 'string' && item.trim().length > 0) as
    | string
    | undefined

  if (!value) {
    throw new Error('Worker JSON did not include image/url/data fields')
  }

  const trimmed = value.trim()

  if (trimmed.startsWith('data:image/')) {
    const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) {
      throw new Error('Invalid data URL format in worker JSON payload')
    }

    const mime = match[1]
    const base64 = match[2]
    const ext = guessExtensionFromMime(mime)
    const outputPath = path.join(outputDir, `${baseName}.${ext}`)
    const buffer = Buffer.from(base64, 'base64')
    const detectedMime = detectImageMime(buffer)

    if (!detectedMime) {
      throw new Error(`Worker JSON payload is not a supported image format (mime: ${mime})`)
    }

    await fs.writeFile(outputPath, buffer)
    return { outputPath, mime: detectedMime, bytes: buffer.byteLength }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const imageRes = await fetch(trimmed)
    if (!imageRes.ok) {
      throw new Error(`Failed to download worker-provided image URL: ${imageRes.status}`)
    }
    const mime = imageRes.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await imageRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const detectedMime = detectImageMime(buffer)

    if (!detectedMime) {
      throw new Error(`Worker-provided image URL is not a supported image format (mime: ${mime})`)
    }

    const ext = guessExtensionFromMime(detectedMime)
    const outputPath = path.join(outputDir, `${baseName}.${ext}`)

    await fs.writeFile(outputPath, buffer)
    return { outputPath, mime: detectedMime, bytes: buffer.byteLength }
  }

  throw new Error('Unsupported worker JSON image format')
}

async function main() {
  if (!workerUrl) {
    throw new Error('Missing CLOUDFLARE_IMAGE_WORKER_URL in .env.local')
  }

  if (!workerToken) {
    throw new Error('Missing CLOUDFLARE_IMAGE_WORKER_TOKEN in .env.local')
  }

  const outputDir = path.join(process.cwd(), 'tmp', 'ai-images')
  await fs.mkdir(outputDir, { recursive: true })

  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const baseName = `${now}-${sanitizeFilename(prompt)}`

  console.log('Generating image from Cloudflare Worker...')
  console.log(`Prompt: ${prompt}`)

  const resolvedWorkerUrl = normalizeWorkerUrl(workerUrl)

  const res = await fetch(resolvedWorkerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${workerToken}`,
      'Content-Type': 'application/json',
      Accept: 'image/*',
    },
    body: JSON.stringify({ prompt }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Worker request failed (${res.status}): ${text}`)
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase()

  if (contentType.includes('application/json')) {
    const json = await res.json()
    const result = await saveFromJsonPayload(json, outputDir, baseName)
    console.log('Image generated successfully')
    console.log(`Saved: ${result.outputPath}`)
    console.log(`MIME: ${result.mime}`)
    console.log(`Bytes: ${result.bytes}`)
    return
  }

  if (!contentType.startsWith('image/')) {
    const debugExt = guessTextExtensionFromMime(contentType)
    const debugPath = path.join(outputDir, `${baseName}-debug.${debugExt}`)
    const text = await res.text()
    await fs.writeFile(debugPath, text, 'utf8')
    throw new Error(
      `Worker returned non-image response (${contentType || 'unknown'}). Debug payload saved at ${debugPath}`
    )
  }

  const mime = contentType || 'application/octet-stream'
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const detectedMime = detectImageMime(buffer)

  if (!detectedMime) {
    const debugPath = path.join(outputDir, `${baseName}-debug.bin`)
    await fs.writeFile(debugPath, buffer)
    throw new Error(`Worker returned unsupported binary payload (mime: ${mime}). Saved debug payload to ${debugPath}`)
  }

  const ext = guessExtensionFromMime(detectedMime)
  const outputPath = path.join(outputDir, `${baseName}.${ext}`)

  await fs.writeFile(outputPath, buffer)

  console.log('Image generated successfully')
  console.log(`Saved: ${outputPath}`)
  console.log(`MIME: ${detectedMime}`)
  console.log(`Bytes: ${buffer.byteLength}`)
}

main().catch((error) => {
  console.error('Image generation test failed:')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
