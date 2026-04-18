'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePresentationStore } from '@/store/presentationStore'
import { useTheme } from '@/providers/ThemeProvider'
import AuthLoadingBar from '@/components/AuthLoadingBar'

const PENDING_OUTLINE_STORAGE_KEY = 'vivid_pending_outline_generation'

interface AdvancedSettings {
  tone: string
  verbosity: string
  imageType: string
  instructions: string
  webSearch: boolean
}

type GenerationProvider = 'gpt' | 'open-model'

interface PendingOutlineGenerationPayload {
  content: string
  design: string
  slideCount: number
  language: string
  advancedSettings: AdvancedSettings
  generationProvider: GenerationProvider
}

export default function AppMakerPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [design, setDesign] = useState('standard')
  const [slideCount, setSlideCount] = useState(5)
  const [language, setLanguage] = useState('English')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [isRoutingToDashboard, setIsRoutingToDashboard] = useState(false)
  const [isRoutingToResults, setIsRoutingToResults] = useState(false)
  const [generationProvider, setGenerationProvider] = useState<GenerationProvider>('gpt')
  const [showGenerationConfig, setShowGenerationConfig] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    tone: 'default',
    verbosity: 'standard',
    imageType: 'ai-generated',
    instructions: '',
    webSearch: false,
  })
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragOverRef = useRef(false)

  const setError = usePresentationStore((state) => state.setError)
  const error = usePresentationStore((state) => state.error)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('vivid_auth_session')
      if (!stored) {
        router.replace('/')
        return
      }
      const parsed = JSON.parse(stored) as { token?: string; expiresAt?: number }
      if (!parsed.token || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) {
        window.localStorage.removeItem('vivid_auth_session')
        router.replace('/')
      }
    } catch {
      router.replace('/')
    }
  }, [router])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverRef.current = true
  }

  const handleDragLeave = () => {
    dragOverRef.current = false
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverRef.current = false
    const files = Array.from(e.dataTransfer.files)
    setAttachments((prev) => [...prev, ...files])
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = () => {
    if (!content.trim()) {
      setError('Please enter content for your presentation')
      return
    }

    const payload: PendingOutlineGenerationPayload = {
      content,
      design,
      slideCount,
      language,
      advancedSettings,
      generationProvider,
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PENDING_OUTLINE_STORAGE_KEY, JSON.stringify(payload))
    }

    setError(null)
    setIsRoutingToResults(true)
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-slate-50 text-slate-900'
          : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-slate-50'
      }`}
    >
      {/* Top navbar matching presentation view */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-0">
        <header
          className={`h-14 flex items-center px-4 gap-3 rounded-2xl shadow-sm border ${
            theme === 'light'
              ? 'bg-white border-slate-200'
              : 'bg-gradient-to-r from-black via-neutral-900 to-neutral-800 border-neutral-800'
          }`}
        >
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              <span className="font-bold text-sm">V</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg tracking-tight">vivid Ai</span>
              <span className="text-[11px] text-slate-500 -mt-0.5">
                Convert Input into Structured Insights
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRoutingToDashboard(true)}
              className={`hidden sm:inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                theme === 'light'
                  ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'border-slate-600 text-slate-100 hover:bg-slate-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`flex items-center justify-center rounded-full border px-2 py-1 text-xs transition ${
                theme === 'light'
                  ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'border-slate-500 bg-slate-100 text-slate-900 hover:bg-white'
              }`}
            >
              {theme === 'light' ? (
                <img
                  src="/light_mode.png"
                  alt="Light mode"
                  className="h-4 w-4 object-contain"
                />
              ) : (
                <img
                  src="/dark_mode.png"
                  alt="Dark mode"
                  className="h-4 w-4 object-contain"
                />
              )}
            </button>
          </div>
        </header>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Title / intro */}
        <div className="mb-8 space-y-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${
              theme === 'light'
                ? 'border-slate-200 bg-white text-slate-500'
                : 'border-neutral-800 bg-gradient-to-r from-black via-neutral-900 to-neutral-800 text-slate-300'
            }`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
            Presentation builder
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Instant slide decks from a single idea
          </h1>
          <p
            className={`text-sm md:text-base max-w-xl ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-300'
            }`}
          >
            Paste your topic, pick a tone, and let vivid ai design a clean, structured presentation for you in seconds.
          </p>
        </div>
        {/* Presentation setup controls */}
        <section className="mb-6 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Design */}
            <div className="flex flex-col gap-1">
              <label
                className={`block text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                Design
              </label>
              <div className="relative">
                <select
                  value={design}
                  onChange={(e) => setDesign(e.target.value)}
                  className={`w-full appearance-none rounded-2xl border px-3 pr-8 py-1.5 text-xs outline-none transition focus:ring-2 focus:ring-slate-900/70 focus:border-transparent ${
                    theme === 'light'
                      ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                      : 'border-slate-600 bg-slate-900 text-slate-50 shadow-sm'
                  }`}
                >
                  <option value="standard">Standard layout</option>
                  <option value="smart">Smart layout</option>
                </select>
                <span
                  className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  ▾
                </span>
              </div>
            </div>

            {/* Slides */}
            <div className="flex flex-col gap-1">
              <label
                className={`block text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                Slides
              </label>
              <div className="relative">
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(parseInt(e.target.value))}
                  className={`w-full appearance-none rounded-2xl border px-3 pr-8 py-1.5 text-xs outline-none transition focus:ring-2 focus:ring-slate-900/70 focus:border-transparent ${
                    theme === 'light'
                      ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                      : 'border-slate-600 bg-slate-900 text-slate-50 shadow-sm'
                  }`}
                >
                  <option value="5">5</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                  <option value="12">12</option>
                  <option value="15">15</option>
                </select>
                <span
                  className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  ▾
                </span>
              </div>
            </div>

            {/* Language + advanced */}
            <div className="flex flex-col gap-1">
              <label
                className={`block text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                Language
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`w-full appearance-none rounded-2xl border px-3 pr-8 py-1.5 text-xs outline-none transition focus:ring-2 focus:ring-slate-900/70 focus:border-transparent ${
                      theme === 'light'
                        ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                        : 'border-slate-600 bg-slate-900 text-slate-50 shadow-sm'
                    }`}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                  </select>
                  <span
                    className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    ▾
                  </span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(true)}
                    className={`inline-flex items-center justify-start rounded-2xl border px-3 pr-8 py-1.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-slate-900/70 focus:border-transparent ${
                      theme === 'light'
                        ? 'border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400'
                        : 'border-slate-600 bg-slate-900 text-slate-50 shadow-sm hover:border-slate-500'
                    }`}
                  >
                    More
                  </button>
                  <span
                    className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content + attachments section */}
        <div className="space-y-6 md:space-y-8">
          {/* Content */}
          <div className="mb-6 md:mb-8">
            <label
              className={`block text-xs font-medium mb-2 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-300'
              }`}
            >
              Topic or raw content
            </label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Explain the presentation you want vivid ai to build for you."
                className={`w-full h-40 rounded-xl border px-4 py-3 pr-28 pb-12 text-sm outline-none shadow-inner focus:ring-2 focus:ring-slate-900/70 focus:border-transparent placeholder:text-slate-400 resize-none ${
                  theme === 'light'
                    ? 'border-slate-300 bg-white text-slate-900'
                    : 'border-neutral-800 bg-black text-slate-50'
                }`}
              />

              <div className="absolute bottom-3 right-3 z-10">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGenerationConfig((prev) => !prev)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-sm transition ${
                      theme === 'light'
                        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    Config
                    <span className="text-[10px] opacity-70">▾</span>
                  </button>

                  {showGenerationConfig && (
                    <div
                      className={`absolute right-0 bottom-10 w-44 rounded-xl border p-2 shadow-xl ${
                        theme === 'light'
                          ? 'border-slate-200 bg-white'
                          : 'border-neutral-700 bg-neutral-950'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setGenerationProvider('gpt')
                          setShowGenerationConfig(false)
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                          generationProvider === 'gpt'
                            ? theme === 'light'
                              ? 'bg-slate-100 text-slate-900'
                              : 'bg-neutral-800 text-slate-50'
                            : theme === 'light'
                            ? 'text-slate-700 hover:bg-slate-50'
                            : 'text-slate-300 hover:bg-neutral-900'
                        }`}
                      >
                        use gpt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGenerationProvider('open-model')
                          setShowGenerationConfig(false)
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                          generationProvider === 'open-model'
                            ? theme === 'light'
                              ? 'bg-slate-100 text-slate-900'
                              : 'bg-neutral-800 text-slate-50'
                            : theme === 'light'
                            ? 'text-slate-700 hover:bg-slate-50'
                            : 'text-slate-300 hover:bg-neutral-900'
                        }`}
                      >
                        use open-model
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments (unchanged logic, compact styling) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label
                className={`block text-xs font-medium ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                Attach supporting files (optional)
              </label>
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileClick}
              className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center text-xs cursor-pointer transition ${
                dragOverRef.current
                  ? theme === 'light'
                    ? 'border-slate-900 bg-slate-100'
                    : 'border-neutral-100 bg-neutral-900'
                  : theme === 'light'
                  ? 'border-slate-300 bg-slate-50 hover:border-slate-400'
                  : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800 hover:border-neutral-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
              />
              <p className={theme === 'light' ? 'text-slate-500' : 'text-slate-300'}>
                Drop docs here or{' '}
                <span
                  className={theme === 'light' ? 'text-slate-900 font-medium' : 'text-slate-50 font-medium'}
                >
                  browse files
                </span>
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                      theme === 'light'
                        ? 'border-slate-200 bg-white'
                        : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                    }`}
                  >
                    <span
                      className={`truncate max-w-xs ${
                        theme === 'light' ? 'text-slate-800' : 'text-slate-100'
                      }`}
                    >
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-rose-500 hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isRoutingToResults}
            className={`w-full rounded-full py-3 text-sm font-semibold shadow-[0_14px_40px_rgba(15,23,42,0.4)] disabled:opacity-60 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5 ${
              theme === 'light'
                ? 'bg-slate-900 text-slate-50 hover:bg-black'
                : 'bg-slate-100 text-slate-900 hover:bg-white shadow-[0_14px_40px_rgba(0,0,0,0.7)]'
            }`}
          >
            {isRoutingToResults ? 'Opening outline workspace…' : 'Generate presentation'}
          </button>
        </div>
      </main>

      {showAdvancedSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl ${
              theme === 'light'
                ? 'border-slate-200 bg-white'
                : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b px-5 py-3 ${
                theme === 'light' ? 'border-slate-200' : 'border-neutral-800'
              }`}
            >
              <h2
                className={
                  theme === 'light'
                    ? 'text-sm font-medium text-slate-900'
                    : 'text-sm font-medium text-slate-50'
                }
              >
                Advanced settings
              </h2>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className={`text-sm ${
                  theme === 'light'
                    ? 'text-slate-500 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                ✕
              </button>
            </div>
            <div
              className={`space-y-4 px-5 py-4 text-xs ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Tone
                </label>
                <div className="relative">
                  <select
                    value={advancedSettings.tone}
                    onChange={(e) =>
                      setAdvancedSettings({ ...advancedSettings, tone: e.target.value })
                    }
                    className={`w-full appearance-none rounded-2xl border px-3 pr-8 py-1.5 text-xs outline-none transition focus:ring-2 focus:ring-slate-900/70 focus:border-transparent ${
                      theme === 'light'
                        ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                        : 'border-slate-600 bg-slate-900 text-slate-50 shadow-sm'
                    }`}
                  >
                    <option value="default">Default</option>
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="funny">Playful</option>
                  </select>
                  <span
                    className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    ▾
                  </span>
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Verbosity
                </label>
                <div className="relative">
                  <select
                    value={advancedSettings.verbosity}
                    onChange={(e) =>
                      setAdvancedSettings({ ...advancedSettings, verbosity: e.target.value })
                    }
                    className={`w-full appearance-none rounded-2xl border px-3 pr-8 py-1.5 text-xs outline-none transition focus:ring-2 focus:ring-slate-900/70 focus:border-transparent ${
                      theme === 'light'
                        ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                        : 'border-slate-600 bg-slate-900 text-slate-50 shadow-sm'
                    }`}
                  >
                    <option value="concise">Concise</option>
                    <option value="standard">Standard</option>
                    <option value="detailed">Detailed</option>
                  </select>
                  <span
                    className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    ▾
                  </span>
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Image type
                </label>
                <div className="relative">
                  <select
                    value={advancedSettings.imageType}
                    onChange={(e) =>
                      setAdvancedSettings({ ...advancedSettings, imageType: e.target.value })
                    }
                    className={`w-full appearance-none rounded-2xl border px-3 pr-8 py-1.5 text-xs outline-none transition focus:ring-2 focus:ring-slate-900/70 focus:border-transparent ${
                      theme === 'light'
                        ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                        : 'border-slate-600 bg-slate-900 text-slate-50 shadow-sm'
                    }`}
                  >
                    <option value="ai-generated">AI-generated</option>
                    <option value="stock-photos">Stock photos</option>
                  </select>
                  <span
                    className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    ▾
                  </span>
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Extra instructions
                </label>
                <textarea
                  value={advancedSettings.instructions}
                  onChange={(e) =>
                    setAdvancedSettings({
                      ...advancedSettings,
                      instructions: e.target.value,
                    })
                  }
                  className={`w-full h-20 rounded-xl border px-3 py-2 text-xs outline-none shadow-inner focus:ring-2 focus:ring-slate-900/70 focus:border-transparent resize-none placeholder:text-slate-400 ${
                    theme === 'light'
                      ? 'border-slate-200 bg-white text-slate-900'
                      : 'border-neutral-800 bg-black text-slate-50'
                  }`}
                  placeholder="e.g. Focus on startup founders, keep tone bold and confident."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span
                    className={`block text-[11px] font-medium ${
                      theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    Web search
                  </span>
                  <span
                    className={`block text-[10px] ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Allow vivid ai to pull fresher facts when needed.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAdvancedSettings({
                      ...advancedSettings,
                      webSearch: !advancedSettings.webSearch,
                    })
                  }
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    advancedSettings.webSearch
                      ? 'bg-slate-900'
                      : theme === 'light'
                      ? 'bg-slate-300'
                      : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      advancedSettings.webSearch ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div
              className={`flex justify-end gap-2 border-t px-5 py-3 ${
                theme === 'light' ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(false)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  theme === 'light'
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(false)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  theme === 'light'
                    ? 'bg-slate-900 text-slate-50 hover:bg-black'
                    : 'bg-slate-100 text-slate-900 hover:bg-white'
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {isRoutingToResults && (
        <AuthLoadingBar
          title="Preparing the Outline Content"
          userEmail={null}
          onComplete={() =>
            router.push(`/results?pendingOutline=1&imageType=${encodeURIComponent(advancedSettings.imageType)}`)
          }
        />
      )}

      {isRoutingToDashboard && (
        <AuthLoadingBar
          userEmail={null}
          onComplete={() => router.push('/dashboard')}
        />
      )}
    </div>
  )
}
