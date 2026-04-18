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
