import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function extractText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'text' in item)
          return String((item as { text?: unknown }).text ?? '')
        return ''
      })
      .join('')
  }
  return content == null ? '' : typeof content === 'object' ? JSON.stringify(content) : String(content)
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'Server is missing OPENROUTER_API_KEY' }, { status: 500 })
    }

    const body = (await req.json()) as {
      prompt?: string
      systemPrompt?: string
      model?: string
      stream?: boolean
    }

    const prompt = body.prompt?.trim()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const useStream = !!body.stream

    const openRouterRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          process.env.OPENROUTER_HTTP_REFERER ||
          process.env.NEXT_PUBLIC_APP_URL ||
          'http://localhost:3000',
        'X-OpenRouter-Title': process.env.OPENROUTER_APP_TITLE || 'Presenton',
      },
      body: JSON.stringify({
        model: body.model || process.env.OPENROUTER_MODEL,
        messages: [
          ...(body.systemPrompt ? [{ role: 'system' as const, content: body.systemPrompt }] : []),
          { role: 'user' as const, content: prompt },
        ],
        stream: useStream,
      }),
    })

    if (!openRouterRes.ok) {
      const errorBody = await openRouterRes.text()
      console.error('OpenRouter error:', openRouterRes.status, errorBody)
      return NextResponse.json(
        { error: 'Failed to generate content', details: errorBody },
        { status: openRouterRes.status }
      )
    }

    // ── STREAMING MODE ────────────────────────────────────────────────────────
    if (useStream && openRouterRes.body) {
      const encoder = new TextEncoder()
      const upstreamReader = openRouterRes.body.getReader()
      const decoder = new TextDecoder()

      const outStream = new ReadableStream({
        async start(controller) {
          let buffer = ''
          try {
            while (true) {
              const { done, value } = await upstreamReader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })

              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                const trimmed = line.trim()
                if (trimmed === 'data: [DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  continue
                }
                if (!trimmed.startsWith('data: ')) continue

                try {
                  const parsed = JSON.parse(trimmed.slice(6))
                  const delta: string = parsed?.choices?.[0]?.delta?.content ?? ''
                  if (delta) {
                    const event = `data: ${JSON.stringify({ t: delta })}\n\n`
                    controller.enqueue(encoder.encode(event))
                  }
                } catch {
                  // Ignore partial json
                }
              }
            }
          } catch (err) {
            controller.error(err)
          } finally {
            controller.close()
          }
        },
        cancel() {
          upstreamReader.cancel()
        },
      })

      return new Response(outStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // ── NON-STREAMING MODE ────────────────────────────────────────────────────
    const result = (await openRouterRes.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }
    const text = extractText(result.choices?.[0]?.message?.content)
    return NextResponse.json({ text })
  } catch (error) {
    console.error('OpenRouter generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
