import { EventEmitter } from 'node:events'
import { OpenRouter } from '@openrouter/sdk'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OpenRouterAgentOptions {
  apiKey: string
  model?: string
  systemPrompt?: string
  httpReferer?: string
  appTitle?: string
}

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

  if (content === null || content === undefined) {
    return ''
  }

  return String(content)
}

export class OpenRouterAgent extends EventEmitter {
  private readonly client: OpenRouter

  private readonly model: string

  private systemPrompt: string

  private history: AgentMessage[] = []

  constructor(options: OpenRouterAgentOptions) {
    super()

    this.client = new OpenRouter({
      apiKey: options.apiKey,
      httpReferer: options.httpReferer,
      appTitle: options.appTitle,
    })

    this.model = options.model ?? 'openrouter/auto'
    this.systemPrompt = options.systemPrompt ?? 'You are a helpful assistant.'
  }

  getMessages(): AgentMessage[] {
    return [...this.history]
  }

  clearHistory(): void {
    this.history = []
  }

  setSystemPrompt(systemPrompt: string): void {
    this.systemPrompt = systemPrompt
  }

  private buildMessages(userInput?: string) {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []

    if (this.systemPrompt.trim()) {
      messages.push({ role: 'system', content: this.systemPrompt.trim() })
    }

    messages.push(...this.history)

    if (userInput) {
      messages.push({ role: 'user', content: userInput })
    }

    return messages
  }

  async send(content: string): Promise<string> {
    const userMessage: AgentMessage = { role: 'user', content }
    this.history.push(userMessage)
    this.emit('message:user', userMessage)
    this.emit('thinking:start')

    try {
      const result = await this.client.chat.send({
        model: this.model,
        messages: this.buildMessages(),
        stream: true,
      })

      this.emit('stream:start')

      let assistantText = ''
      for await (const chunk of result as AsyncIterable<{ choices?: Array<{ delta?: { content?: unknown } }> }>) {
        const delta = extractText(chunk.choices?.[0]?.delta?.content)

        if (delta) {
          assistantText += delta
          this.emit('stream:delta', delta, assistantText)
        }
      }

      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: assistantText.trim(),
      }

      this.history.push(assistantMessage)
      this.emit('message:assistant', assistantMessage)
      this.emit('stream:end', assistantMessage.content)

      return assistantMessage.content
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error))
      this.emit('error', normalizedError)
      throw normalizedError
    } finally {
      this.emit('thinking:end')
    }
  }

  async sendSync(content: string): Promise<string> {
    const userMessage: AgentMessage = { role: 'user', content }
    this.history.push(userMessage)
    this.emit('message:user', userMessage)
    this.emit('thinking:start')

    try {
      const result = await this.client.chat.send({
        model: this.model,
        messages: this.buildMessages(),
        stream: false,
      }) as {
        choices?: Array<{ message?: { content?: unknown } }>
      }

      const assistantText = extractText(result.choices?.[0]?.message?.content).trim()

      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: assistantText,
      }

      this.history.push(assistantMessage)
      this.emit('message:assistant', assistantMessage)

      return assistantText
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error))
      this.emit('error', normalizedError)
      throw normalizedError
    } finally {
      this.emit('thinking:end')
    }
  }
}
