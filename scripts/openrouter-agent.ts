import { config as loadEnv } from 'dotenv'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { OpenRouterAgent } from '../src/lib/openrouter/agent'

loadEnv({ path: '.env.local' })

const apiKey = process.env.OPENROUTER_API_KEY

if (!apiKey) {
  throw new Error('OPENROUTER_API_KEY is required. Add it to .env.local before running this script.')
}

const agent = new OpenRouterAgent({
  apiKey,
  model: process.env.OPENROUTER_MODEL ?? 'openrouter/elephant-alpha',
  systemPrompt:
    process.env.OPENROUTER_SYSTEM_PROMPT ??
    'You are a concise, helpful assistant.',
  httpReferer: process.env.OPENROUTER_HTTP_REFERER,
  appTitle: process.env.OPENROUTER_APP_TITLE ?? 'Presenton',
})

agent.on('message:user', (message: { content: string }) => {
  console.log(`\nYou: ${message.content}`)
})

agent.on('stream:start', () => {
  process.stdout.write('Assistant: ')
})

agent.on('stream:delta', (delta: string) => {
  process.stdout.write(delta)
})

agent.on('stream:end', () => {
  process.stdout.write('\n')
})

agent.on('error', (error: Error) => {
  console.error('\nOpenRouter agent error:', error.message)
})

async function main() {
  const rl = createInterface({ input, output })

  console.log('OpenRouter agent ready.')
  console.log('Type a message and press Enter. Use /reset to clear history or /exit to quit.\n')

  while (true) {
    const inputText = await rl.question('> ')
    const trimmed = inputText.trim()

    if (!trimmed) {
      continue
    }

    if (trimmed === '/exit' || trimmed === '/quit') {
      break
    }

    if (trimmed === '/reset') {
      agent.clearHistory()
      console.log('History cleared.')
      continue
    }

    await agent.send(trimmed)
  }

  rl.close()
}

main().catch((error: unknown) => {
  const normalizedError = error instanceof Error ? error : new Error(String(error))
  console.error(normalizedError.message)
  process.exitCode = 1
})
