'use client'

import { useState, useRef } from 'react'
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

export default function Home() {
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
      // Build a comprehensive, tailored prompt for the AI model
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

      // Create a professional, concise prompt for the LLM
      const tailoredPrompt = `You are a professional presentation designer. Create a CONCISE and STRUCTURED presentation.

TOPIC: ${content}

PRESENTATION SPECIFICATIONS:
- Total Slides: ${slideCount}
- Language: ${language}
- Tone: ${presentationSpec.tone === 'default' ? 'Professional' : presentationSpec.tone}
${presentationSpec.customInstructions ? `- Instructions: ${presentationSpec.customInstructions}` : ''}

CRITICAL FORMAT - FOLLOW EXACTLY:

SLIDE 1: TITLE SLIDE
Title: [Engaging title about: ${content}]
Subtitle: [Brief 1-line subtitle]
Overview: [One sentence about the presentation]

SLIDE 2 TO SLIDE ${slideCount}: CONTENT SLIDES

Each content slide must have exactly this structure:

Slide #[number]: [SUBHEADING/TOPIC]
• [Point 1: Keep brief, max 12 words]
• [Point 2: Keep brief, max 12 words]
• [Point 3: Keep brief, max 12 words]
• [Point 4: Keep brief, max 12 words] (optional, only if needed)

CRITICAL RULES:
1. EACH SLIDE HAS EXACTLY 3-4 BULLET POINTS MAXIMUM
2. KEEP EACH BULLET POINT TO ONE SHORT LINE (8-15 words)
3. NO LENGTHY EXPLANATIONS - BE CONCISE
4. NO SUB-BULLETS - ONLY MAIN POINTS
5. EACH SLIDE TITLE IS A CLEAR SUBHEADING
6. MAKE CONTENT SCANNABLE AND BRIEF
7. NO FILLER TEXT OR EXTRA INFORMATION

NOW CREATE THE PRESENTATION:
Generate exactly ${slideCount} slides with this structure. Each slide must be brief and focused.`

      // Call puter.ai.chat with the tailored prompt
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
      // Navigate to results page
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Presenton
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Create Presentations with AI
          </h1>
          <p className="text-xl text-gray-600">
            Choose a design, set preferences, and generate polished slides in minutes.
          </p>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Configuration</h2>
            <p className="text-gray-600 mb-6">Choose slides, tone, and language preferences.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Design Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Style
                </label>
                <select
                  value={design}
                  onChange={(e) => setDesign(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="standard">Standard (Fixed Layout)</option>
                  <option value="smart">Smart (Flexible Layout)</option>
                </select>
              </div>

              {/* Slide Count Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Slides
                </label>
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="5">5 slides</option>
                  <option value="8">8 slides</option>
                  <option value="9">9 slides</option>
                  <option value="10">10 slides</option>
                  <option value="11">11 slides</option>
                  <option value="12">12 slides</option>
                  <option value="13">13 slides</option>
                  <option value="15">15 slides</option>
                </select>
              </div>

              {/* Language Selector with More Controls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <div className="flex gap-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
                    title="More Controls"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 010 4m0-2a2 2 0 100 4m0-4a2 2 0 010 4m6-6h.01m0 2h-.01m0 2h.01m0-2h-.01"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Textarea */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us about your presentation"
              className="w-full h-40 px-4 py-3 border-2 border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Attachments Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Attachments (optional)
            </h2>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileClick}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                dragOverRef.current
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
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
              <div className="flex flex-col items-center">
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                <p className="text-gray-600">
                  Drag and drop PDF, TXT, Word, PowerPoint, Excel/CSV, or{' '}
                  <span className="text-blue-500 font-medium">click to browse</span>
                </p>
              </div>
            </div>

            {/* Attached Files */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {attachments.length} file(s) attached:
                </p>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0zM15 7H4v5a4 4 0 008 0V7z" />
                        </svg>
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Presentation'}
          </button>
        </div>
      </main>

      {/* Advanced Settings Modal */}
      {showAdvancedSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">Advanced settings</h2>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tone
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Controls the writing style (e.g., casual, professional, funny)
                </p>
                <select
                  value={advancedSettings.tone}
                  onChange={(e) =>
                    setAdvancedSettings({ ...advancedSettings, tone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="default">Default</option>
                  <option value="casual">Casual</option>
                  <option value="professional">Professional</option>
                  <option value="funny">Funny</option>
                </select>
              </div>

              {/* Verbosity */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Verbosity
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Controls how detailed slide descriptions are (concise, standard, or text-heavy)
                </p>
                <select
                  value={advancedSettings.verbosity}
                  onChange={(e) =>
                    setAdvancedSettings({ ...advancedSettings, verbosity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="concise">Concise</option>
                  <option value="standard">Standard</option>
                  <option value="detailed">Text-Heavy</option>
                </select>
              </div>

              {/* Image Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Image type
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Choose whether images should be stock photos or AI-generated
                </p>
                <select
                  value={advancedSettings.imageType}
                  onChange={(e) =>
                    setAdvancedSettings({ ...advancedSettings, imageType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ai-generated">AI-Generated</option>
                  <option value="stock-photos">Stock Photos</option>
                </select>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Instructions
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Optional guidance for the AI. These override defaults except format constraints.
                </p>
                <textarea
                  value={advancedSettings.instructions}
                  onChange={(e) =>
                    setAdvancedSettings({
                      ...advancedSettings,
                      instructions: e.target.value,
                    })
                  }
                  placeholder="Example: Focus on enterprise buyers, emphasize ROI and security compliance. Keep slides data-driven, avoid jargon, and include a short call-to-action on the final slide."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                />
              </div>

              {/* Web Search Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Web search
                  </label>
                  <p className="text-xs text-gray-500">
                    Allow the model to consult the web for fresher facts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAdvancedSettings({
                      ...advancedSettings,
                      webSearch: !advancedSettings.webSearch,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    advancedSettings.webSearch ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      advancedSettings.webSearch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Don't show this again */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="dontShowAgain" className="text-sm text-gray-600">
                  Don't show this again
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
