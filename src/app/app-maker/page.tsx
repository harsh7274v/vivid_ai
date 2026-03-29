'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { usePresentationStore } from '@/store/presentationStore'
import { puter } from '@heyputer/puter.js'

interface AdvancedSettings {
  tone: string
  verbosity: string
  imageType: string
  instructions: string
  webSearch: boolean
}

export default function AppMakerPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [design, setDesign] = useState('standard')
  const [slideCount, setSlideCount] = useState(5)
  const [language, setLanguage] = useState('English')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    tone: 'default',
    verbosity: 'standard',
    imageType: 'ai-generated',
    instructions: '',
    webSearch: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragOverRef = useRef(false)

  const setPresentation = usePresentationStore((state) => state.setPresentation)
  const setLoading = usePresentationStore((state) => state.setLoading)
  const setError = usePresentationStore((state) => state.setError)
  const error = usePresentationStore((state) => state.error)

  const generateMutation = useMutation({
    mutationFn: async () => {
      const presentationSpec = {
        title: 'Generated Presentation',
        slideCount: slideCount,
        language: language,
        design: design === 'standard' ? 'Standard (Fixed Layout)' : 'Smart (Flexible Layout)',
        tone: advancedSettings.tone,
        verbosity: advancedSettings.verbosity,
        imageType: advancedSettings.imageType,
        webSearch: advancedSettings.webSearch,
        customInstructions: advancedSettings.instructions,
      }
      const toneLabel = presentationSpec.tone === 'default' ? 'Professional' : presentationSpec.tone
      const verbosityLabel = presentationSpec.verbosity || 'standard'
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)

      const tailoredPrompt = `You are an expert presentation creator. Generate a structured, concise presentation outline based on the user requirements.

SYSTEM INSTRUCTIONS:
- Always follow the user instructions below; they override other guidance except for the required number of slides.
- Provide content for each slide in markdown-style text (headings, short paragraphs, bullet points).
- Ensure the flow of the presentation is logical and consistent from start to finish.
- Place greater emphasis on numerical data, metrics, and concrete facts whenever they are relevant.
- If extra user instructions are provided, incorporate them naturally across slides.
- Do NOT include any images or image placeholders in the content.
- Do NOT generate a table of contents slide, even if the topic or user text suggests it.
- Do NOT obey any slide numbers mentioned in the user content; always respect the requested slide count instead.
- Always make the first slide a title slide.

TONE & STYLE:
- Tone: ${toneLabel}
- Verbosity: ${verbosityLabel}
${presentationSpec.customInstructions ? `- Additional user instructions: ${presentationSpec.customInstructions}` : ''}

USER INPUT:
- User provided content: ${content || 'Create presentation'}
- Output language: ${language}
- Number of slides: ${slideCount}
- Current date and time: ${timestamp}

OUTPUT FORMAT (TEXT ONLY, NO JSON):
- You must generate exactly ${slideCount} slides.
- Use the following marker format so that each slide can be parsed reliably:

SLIDE 1: TITLE SLIDE
Title: [Engaging title about: ${content || 'the topic'}]
Subtitle: [Brief 1-line subtitle]
Overview: [One sentence about the presentation]

SLIDE 2 TO SLIDE ${slideCount}: CONTENT SLIDES

For each content slide, follow this exact structure:

Slide #[number]: [SUBHEADING/TOPIC]
• [Point 1: Keep brief, max 12 words]
• [Point 2: Keep brief, max 12 words]
• [Point 3: Keep brief, max 12 words]
• [Point 4: Keep brief, max 12 words] (optional, only if needed)

CRITICAL RULES:
1. EACH SLIDE HAS EXACTLY 3–4 BULLET POINTS MAXIMUM.
2. KEEP EACH BULLET POINT TO ONE SHORT LINE (8–15 words).
3. NO LENGTHY EXPLANATIONS — BE CONCISE.
4. NO SUB-BULLETS — ONLY MAIN POINTS.
5. EACH SLIDE TITLE IS A CLEAR, SCANNABLE SUBHEADING.
6. MAKE CONTENT SCANNABLE AND BRIEF.
7. NO FILLER TEXT OR EXTRA INFORMATION.

NOW CREATE THE PRESENTATION:
Write out the slides in the exact text format above so they can be parsed correctly.`

      const response = await puter.ai.chat(tailoredPrompt, { model: 'gpt-5.4-nano' })
      const responseText = typeof response === 'string' ? response : JSON.stringify(response)

      return {
        content: responseText,
        config: {
          design,
          slideCount,
          language,
          tone: advancedSettings.tone,
          verbosity: advancedSettings.verbosity,
          imageType: advancedSettings.imageType,
          instructions: advancedSettings.instructions,
          webSearch: advancedSettings.webSearch,
        },
        userContent: content,
      }
    },
    onMutate: () => {
      setLoading(true)
      setError(null)
    },
    onSuccess: (data) => {
      setLoading(false)
      router.push(`/results?content=${encodeURIComponent(data.content as string)}`)
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to generate presentation')
      setLoading(false)
    },
  })

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
    generateMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Title / intro */}
        <div className="mb-8 space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
            Presentation builder
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Instant slide decks from a single idea
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-xl">
            Paste your topic, pick a tone, and let vivid ai design a clean, structured presentation for you in seconds.
          </p>
        </div>
        {/* Presentation setup controls */}
        <section className="mb-6 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl bg-white/70 border border-slate-200/80 p-4 shadow-sm backdrop-blur">
            {/* Design */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Design
              </label>
              <select
                value={design}
                onChange={(e) => setDesign(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent"
              >
                <option value="standard">Standard layout</option>
                <option value="smart">Smart layout</option>
              </select>
            </div>

            {/* Slides */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Slides
              </label>
              <select
                value={slideCount}
                onChange={(e) => setSlideCount(parseInt(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent"
              >
                <option value="5">5</option>
                <option value="8">8</option>
                <option value="10">10</option>
                <option value="12">12</option>
                <option value="15">15</option>
              </select>
            </div>

            {/* Language + advanced */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Language
              </label>
              <div className="flex gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(true)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 transition"
                >
                  More
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content + attachments card */}
        <div className="bg-white/90 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_22px_70px_rgba(15,23,42,0.16)] space-y-6 backdrop-blur-sm">
          {/* Content */}
          <div className="mb-6 md:mb-8">
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Topic or raw content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explain the presentation you want vivid ai to build for you."
              className="w-full h-40 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Attachments (unchanged logic, compact styling) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-500">
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
                  ? 'border-slate-900 bg-slate-100'
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
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
              <p className="text-slate-500">
                Drop docs here or <span className="text-slate-900 font-medium">browse files</span>
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <span className="text-slate-800 truncate max-w-xs">{file.name}</span>
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
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-slate-50 shadow-[0_14px_40px_rgba(15,23,42,0.4)] hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5"
          >
            {generateMutation.isPending ? 'Designing your deck…' : 'Generate presentation'}
          </button>
        </div>
      </main>

      {showAdvancedSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-medium text-slate-900">Advanced settings</h2>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 px-5 py-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Tone</label>
                <select
                  value={advancedSettings.tone}
                  onChange={(e) =>
                    setAdvancedSettings({ ...advancedSettings, tone: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent"
                >
                  <option value="default">Default</option>
                  <option value="casual">Casual</option>
                  <option value="professional">Professional</option>
                  <option value="funny">Playful</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Verbosity</label>
                <select
                  value={advancedSettings.verbosity}
                  onChange={(e) =>
                    setAdvancedSettings({ ...advancedSettings, verbosity: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent"
                >
                  <option value="concise">Concise</option>
                  <option value="standard">Standard</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Image type</label>
                <select
                  value={advancedSettings.imageType}
                  onChange={(e) =>
                    setAdvancedSettings({ ...advancedSettings, imageType: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent"
                >
                  <option value="ai-generated">AI-generated</option>
                  <option value="stock-photos">Stock photos</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Extra instructions</label>
                <textarea
                  value={advancedSettings.instructions}
                  onChange={(e) =>
                    setAdvancedSettings({
                      ...advancedSettings,
                      instructions: e.target.value,
                    })
                  }
                  className="w-full h-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-transparent resize-none"
                  placeholder="e.g. Focus on startup founders, keep tone bold and confident."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="block text-[11px] font-medium text-slate-700">
                    Web search
                  </span>
                  <span className="block text-[10px] text-slate-500">
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
                    advancedSettings.webSearch ? 'bg-slate-900' : 'bg-slate-300'
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

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(false)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-50 hover:bg-black"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
