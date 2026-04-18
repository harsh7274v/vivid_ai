import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function extractText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as { text?: unknown }).text ?? '')
        }

        return ''
      })
      .join('')
  }

  return content == null ? '' : String(content)
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server is missing OPENROUTER_API_KEY' },
        { status: 500 }
      )
    }

    const body = (await req.json()) as {
      prompt?: string
      systemPrompt?: string
      model?: string
    }

    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-OpenRouter-Title': process.env.OPENROUTER_APP_TITLE || 'Presenton',
      },
      body: JSON.stringify({
        model: body.model || process.env.OPENROUTER_MODEL || 'openrouter/elephant-alpha',
        messages: [
          ...(body.systemPrompt
            ? [{ role: 'system' as const, content: body.systemPrompt }]
            : []),
          { role: 'user' as const, content: prompt },
        ],
        stream: false,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('OpenRouter generation failed:', response.status, errorBody)
      return NextResponse.json(
        { error: 'Failed to generate content', details: errorBody },
        { status: response.status }
      )
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }

    const text = extractText(result.choices?.[0]?.message?.content)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('OpenRouter generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
