export async function generateOpenRouterText(options: {
  prompt: string
  systemPrompt?: string
  model?: string
}): Promise<string> {
  const response = await fetch('/api/openrouter/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })

  const data = (await response.json()) as {
    text?: string
    error?: string
    details?: string
  }

  if (!response.ok) {
    const errorMessage = [data.error, data.details]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(' | ')

    throw new Error(errorMessage || 'Failed to generate content')
  }

  return data.text || ''
}

export async function generateOpenRouterTextStream(
  options: {
    prompt: string
    systemPrompt?: string
    model?: string
  },
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/openrouter/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...options, stream: true }),
    signal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.details || 'Stream connection failed')
  }

  if (!response.body) throw new Error('ReadableStream not supported')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue
        const dataStr = line.replace(/^data:\s*/, '').trim()
        if (dataStr === '[DONE]') return

        try {
          const parsed = JSON.parse(dataStr)
          if (typeof parsed.t === 'string' && parsed.t) {
            onChunk(parsed.t)
          } else if (parsed.t === 'content' && parsed.c) {
            onChunk(parsed.c)
          }
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
