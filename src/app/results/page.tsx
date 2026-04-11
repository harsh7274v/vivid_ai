"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useMemo, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { puter } from '@heyputer/puter.js'
import { templates } from '@/app/presentation-templates'
import type { TemplateLayoutsWithSettings, TemplateWithData } from '@/app/presentation-templates/utils'
import { usePresentationStore } from '@/store/presentationStore'
import PresentationView from './PresentationView'
import { auth } from '@/lib/firebase'
import { useTheme } from '@/providers/ThemeProvider'

interface Slide {
  number: number
  title: string
  content: string[]
}

interface GeneratedPresentationSlide extends Slide {
  imageSrc: string | null
  layoutData?: any
}

function AllTemplatesGrid() {
  const router = useRouter()
  const selectedTemplateId = usePresentationStore((state) => state.selectedTemplateId)
  const setSelectedTemplateId = usePresentationStore((state) => state.setSelectedTemplateId)

  // Calculate total layouts across all template groups
  const totalStaticLayouts = templates.reduce(
    (acc: number, g: TemplateLayoutsWithSettings) => acc + g.layouts.length,
    0
  )

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">All Templates</h2>
        <p className="text-gray-600 mt-2 text-sm">
          {totalStaticLayouts} layouts across {templates.length} templates
        </p>
      </div>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template: TemplateLayoutsWithSettings) => {
            const previewLayouts = template.layouts.slice(0, 4)

            return (
              <div
                key={template.id}
                className={`bg-white border rounded-lg cursor-pointer transition-all duration-200 group overflow-hidden ${selectedTemplateId === template.id
                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                  : 'hover:shadow-lg'
                  }`}
                onClick={() => {
                  setSelectedTemplateId(template.id)
                }}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 capitalize truncate pr-2">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {template.layouts.length}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/all-templates/${template.id}`)
                        }}
                        className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                        aria-label="Preview template"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                    {template.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {previewLayouts.map((layout: TemplateWithData, index: number) => {
                      const LayoutComponent = layout.component

                      return (
                        <div
                          key={`${template.id}-preview-${index}`}
                          className="relative bg-gray-100 border border-gray-200 overflow-hidden aspect-video rounded"
                        >
                          <div className="absolute inset-0 bg-transparent z-10" />
                          <div
                            className="transform scale-[0.12] origin-top-left"
                            style={{ width: '833.33%', height: '833.33%' }}
                          >
                            <LayoutComponent data={layout.sampleData} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function parseContent(rawContent: string): Slide[] {
  let decodedContent = rawContent
  try {
    decodedContent = decodeURIComponent(rawContent)
  } catch {
    // If it's not URI-encoded or malformed, fall back to the raw string
    decodedContent = rawContent
  }
  const slides: Slide[] = []
  const stripTelemetry = (text: string): string => {
    const markers = ['"refusal":null', '"via_ai_chat_service"', '"billedusage"']
    let cutIndex = text.length
    for (const marker of markers) {
      const idx = text.indexOf(marker)
      if (idx !== -1 && idx < cutIndex) {
        cutIndex = idx
      }
    }
    const cleaned = text.slice(0, cutIndex).trim()
    return cleaned.replace(/[,{]\s*$/, '').trim()
  }

  // Split by slide markers (either "SLIDE #:" or "Slide #:")
  const slideRegex = /(?:SLIDE\s+\d+:|Slide\s+\d+:)([\s\S]*?)(?=(?:SLIDE\s+\d+:|Slide\s+\d+:)|$)/g
  const slideMatches = decodedContent.match(slideRegex)

  // Helper function to clean up newline characters and escape sequences
  const cleanText = (text: string): string => {
    return text
      .replace(/\\\\n/g, '\n')      // Replace \\n with actual newline
      .replace(/\\n/g, '\n')        // Replace \n with actual newline  
      .replace(/\\\\t/g, '\t')      // Replace \\t with actual tab
      .replace(/\\t/g, '\t')        // Replace \t with actual tab
      .replace(/\n\s*n(?=\s)/g, '\n') // Remove stray 'n' characters (like "text n Other text" → "text\nOther text")
      .replace(/\s+n\s+/g, '\n')    // Replace ' n ' patterns with newlines
      .replace(/\\/g, '')           // Remove any remaining backslashes
      .trim()
  }

  if (slideMatches && slideMatches.length > 0) {
    slideMatches.forEach((slideBlock, index) => {
      // Extract slide title and number
      const titleMatch = slideBlock.match(/(?:SLIDE|Slide)\s+(\d+):\s*([^\n]+)/i)
      const slideNumber = titleMatch ? parseInt(titleMatch[1]) : index + 1

      // Separate the main slide title from any inline bullet-style content
      let rawTitle = titleMatch ? titleMatch[2] : `Slide ${slideNumber}`
      let inlineContent = ''

      if (titleMatch) {
        const parts = titleMatch[2].split(/•| - | – | — /)
        rawTitle = parts[0]
        inlineContent = parts.slice(1).join(' • ').trim()
      }

      const slideTitle = cleanText(rawTitle)

      // Extract content - handle both bullet points and line breaks
      let contentSection = slideBlock.replace(/^(?:SLIDE|Slide)\s+\d+:[^\n]*\n?/, '')

      // If there was extra inline content after the title (e.g. "• Point 1 • Point 2"),
      // prepend it to the slide content so it becomes individual bullets.
      if (inlineContent) {
        contentSection = `${inlineContent}\n${contentSection}`
      }

      let contentLines: string[] = []

      // Check if this is a title slide (model often puts everything on the first line)
      if (
        slideNumber === 1 &&
        (
          slideTitle.toLowerCase().includes('title slide') ||
          /title\s*:/i.test(slideTitle) ||
          contentSection.toLowerCase().includes('title slide')
        )
      ) {
        // Normalize similar to regular slides so content bullets match format
        const normalized = cleanText(
          `${slideTitle}\n${contentSection}`
            .replace(/title slide/gi, '')
            .replace(/generated presentation/gi, '')
            .replace(/content to be added/gi, '')
            .replace(/\s+nn\s*/g, '\n\n')
            .replace(/\s+n\s+/g, '\n')
            .replace(/\s*•\s*/g, '\n• ')
            // Ensure labels start on their own lines
            .replace(/\s*Title:\s*/i, '\nTitle: ')
            .replace(/\s*Subtitle:\s*/i, '\nSubtitle: ')
            .replace(/\s*Overview:\s*/i, '\nOverview: ')
        )

        const lines = normalized
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        // Title: use the text after "Title:" as the main heading
        const titleLine = lines.find((line) => /^Title:\s*/i.test(line))
        const resolvedTitle = titleLine
          ? titleLine.replace(/^Title:\s*/i, '').trim()
          : slideTitle

        // Remaining lines become bullets, with same cleaning as other slides
        contentLines = lines
          .filter((line) => line !== titleLine)
          .map((line) => {
            const withoutLabel = line
              .replace(/^[A-Za-z]+:\s*/, '') // drop leading label "Subtitle:", "Overview:", etc.
              .replace(/^(?:[-*•]\s+|\d+\. |\d+\)|\d+\s+-\s+)/, '') // drop bullet / numbering
            return stripTelemetry(withoutLabel).trim()
          })
          .filter((line) => line.length > 0)

        // Ensure the title slide always exposes four bullet points.
        // If the model produced fewer than four lines, reuse existing
        // ones instead of leaving empty boxes in the UI.
        if (contentLines.length > 4) {
          contentLines = contentLines.slice(0, 4)
        } else if (contentLines.length > 0) {
          const baseLines = [...contentLines]
          let i = 0
          while (contentLines.length < 4) {
            contentLines.push(baseLines[i % baseLines.length])
            i += 1
          }
        } else {
          contentLines = ['Content to be added', 'Content to be added', 'Content to be added', 'Content to be added']
        }

        slides.push({
          number: slideNumber,
          title: resolvedTitle,
          content: contentLines,
        })
      } else {
        // Parse regular content slides
        // 1) Normalize escape sequences, stray "n" markers, and turn inline
        //    bullet separators ("•") into separate lines so each becomes a point.
        const normalized = cleanText(
          contentSection
            .replace(/\s+nn\s*/g, '\n\n')   // "nn" → blank line
            .replace(/\s+n\s+/g, '\n')      // " n " → newline
            .replace(/\s*•\s*/g, '\n• ')    // inline "•" → start of new bullet line
        )

        // 2) Split into individual lines (each line becomes a bullet)
        const rawLines = normalized
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)

        // 3) Remove header / meta lines and clean bullet prefixes
        contentLines = rawLines
          .filter(line => {
            const lower = line.toLowerCase()
            return (
              !lower.includes('content point') &&
              !lower.startsWith('slide ') &&
              lower !== 'title slide' &&
              lower !== 'content to be added'
            )
          })
          .map(line => {
            const withoutPrefix = line
              // Strip common bullet or numbering prefixes ("• ", "- ", "1.", "2)", etc.)
              .replace(/^(?:[-*•]\s+|\d+\. |\d+\)|\d+\s+-\s+)/, '')
            return stripTelemetry(withoutPrefix).trim()
          })
          .filter(line => line.length > 0)

        // 4) Fallback: if nothing was parsed, keep a single line of content
        if (contentLines.length === 0 && normalized.length > 0) {
          contentLines = [normalized]
        }

        if (slideTitle || contentLines.length > 0) {
          slides.push({
            number: slideNumber,
            title: slideTitle,
            content: contentLines.length > 0 ? contentLines : ['Content to be added'],
          })
        }
      }
    })
  }

  // If no slides were parsed, create a default one from all content
  if (slides.length === 0) {
    // Pre-process: replace 'n' patterns with actual newlines
    const processedContent = decodedContent
      .replace(/\s+nn\s*/g, '\n\n')  // Replace 'nn' with double newline
      .replace(/\s+n\s+/g, '\n')     // Replace 'n' surrounded by spaces with newline

    const lines = processedContent.split('\n').filter(l => l.trim())
    slides.push({
      number: 1,
      title: 'Presentation Content',
      content: lines.slice(0, 10).map(line => cleanText(line)),
    })
  }

  return slides
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const presentationId = searchParams.get('presentationId')
  const content = searchParams.get('content')
  const slides = useMemo(() => (content ? parseContent(content) : []), [content])
  const [orderedSlides, setOrderedSlides] = useState<Slide[]>(slides)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [bulletDragging, setBulletDragging] = useState<{
    slideIndex: number
    bulletIndex: number
  } | null>(null)
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [generatedSlides, setGeneratedSlides] = useState<GeneratedPresentationSlide[]>([])
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false)
  const [activeGeneratedSlideIndex, setActiveGeneratedSlideIndex] = useState(0)
  const [layoutIndices, setLayoutIndices] = useState<number[]>([])
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [existingError, setExistingError] = useState<string | null>(null)
  const selectedTemplateId = usePresentationStore((state) => state.selectedTemplateId)
  const selectedTemplateGroup = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [selectedTemplateId]
  )

  // Reset ordered slides whenever fresh content is parsed
  useEffect(() => {
    setOrderedSlides(slides)
  }, [slides])

  // When opened from dashboard with a saved presentation id, load its slides
  useEffect(() => {
    if (!presentationId) return

    let isCancelled = false

    const loadPresentation = async () => {
      try {
        setIsLoadingExisting(true)
        setExistingError(null)

        const res = await fetch(`/api/presentations/${presentationId}`)
        if (!res.ok) {
          const message = res.status === 404 ? 'Presentation not found' : 'Failed to load presentation'
          if (!isCancelled) setExistingError(message)
          return
        }

        const data: {
          slides?: {
            title: string
            content: string[]
            imageSrc?: string | null
          }[]
        } = await res.json()

        const loadedSlides: GeneratedPresentationSlide[] = (data.slides || []).map(
          (s, index) => ({
            number: index + 1,
            title: s.title,
            content: Array.isArray(s.content) && s.content.length > 0 ? s.content : [''],
            imageSrc: s.imageSrc ?? null,
          })
        )

        if (!isCancelled) {
          setGeneratedSlides(loadedSlides)
          setActiveGeneratedSlideIndex(0)
          // Jump directly to Presentation view
          setSelectedSlideIndex(1)
        }
      } catch (error) {
        console.error('Failed to load saved presentation for editing:', error)
        if (!isCancelled) setExistingError('Failed to load presentation')
      } finally {
        if (!isCancelled) setIsLoadingExisting(false)
      }
    }

    void loadPresentation()

    return () => {
      isCancelled = true
    }
  }, [presentationId])

  if (!content && !presentationId) {
    return (
      <div
        className={`min-h-screen ${
          theme === 'light'
            ? 'bg-slate-50 text-slate-900'
            : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-slate-50'
        }`}
      >
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center">
            <p
              className={`mb-6 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-300'
              }`}
            >
              No content available
            </p>
            <button
              onClick={() => router.push('/app-maker')}
              className="px-6 py-2 rounded-full bg-slate-900 text-slate-50 font-medium hover:bg-black transition"
            >
              Go back
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (presentationId && isLoadingExisting) {
    return (
      <div
        className={`min-h-screen ${
          theme === 'light'
            ? 'bg-slate-50 text-slate-900'
            : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-slate-50'
        }`}
      >
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center text-sm text-slate-500">
            Loading presentation…
          </div>
        </main>
      </div>
    )
  }

  if (presentationId && existingError) {
    return (
      <div
        className={`min-h-screen ${
          theme === 'light'
            ? 'bg-slate-50 text-slate-900'
            : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-slate-50'
        }`}
      >
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <p className="text-sm text-rose-500">{existingError}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 rounded-full bg-slate-900 text-slate-50 text-sm font-medium hover:bg-black transition"
            >
              Back to dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  const optimizeSlideForTemplate = async (slide: Slide): Promise<{ title: string; description: string }> => {
    try {
      const outlineMarkdown = `# ${slide.title}\n${slide.content.map((c) => `- ${c}`).join('\n')}`
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)

      const systemPrompt = `Generate a single presentation slide payload in JSON that fits within strict length limits.\n\n` +
        `Steps:\n` +
        `1. Analyze the outline.\n` +
        `2. Generate a well-phrased slide title.\n` +
        `3. Generate a concise slide body that reads like a short paragraph or 2–3 compact sentences.\n\n` +
        `Notes:\n` +
        `- Do not mention \\\"this slide\\\" or \\\"this presentation\\\".\n` +
        `- Rephrase and merge points so the content flows naturally.\n` +
        `- Do not include markdown headings; plain text only.\n` +
        `- Strictly keep the title under 60 characters.\n` +
        `- Strictly keep the description under 220 characters.\n` +
        `- Do not add emojis.\n` +
        `- Respond with JSON only, no extra text.\n\n` +
        `JSON shape (required):\n` +
        `{\n` +
        `  \"title\": \"short slide title (<= 60 characters)\",\n` +
        `  \"description\": \"concise slide body (<= 220 characters)\"\n` +
        `}`

      const userPrompt = `## Current Date and Time\n${timestamp}\n\n## Slide Outline\n${outlineMarkdown}`

      const prompt = `${systemPrompt}\n\n${userPrompt}`

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano' })
      const responseText = typeof response === 'string' ? response : JSON.stringify(response)

      let parsed: any
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
      } catch {
        return {
          title: slide.title,
          description: slide.content.join(' '),
        }
      }

      let optimizedTitle = typeof parsed.title === 'string' && parsed.title.trim().length
        ? parsed.title.trim()
        : slide.title
      let optimizedDescription = typeof parsed.description === 'string' && parsed.description.trim().length
        ? parsed.description.trim()
        : slide.content.join(' ')

      optimizedTitle = optimizedTitle.slice(0, 60)
      optimizedDescription = optimizedDescription.slice(0, 220)

      return { title: optimizedTitle, description: optimizedDescription }
    } catch {
      return {
        title: slide.title,
        description: slide.content.join(' '),
      }
    }
  }

  const determineNeoGeneralLayoutIndices = async (
    inputSlides: Slide[],
    layouts: TemplateWithData[]
  ): Promise<number[]> => {
    if (!inputSlides.length || !layouts.length) {
      return inputSlides.map((_, i) => (layouts.length ? i % layouts.length : 0))
    }

    try {
      const layoutSummaries = layouts.map((layout, index) => ({
        index,
        name: layout.layoutName,
        description: layout.layoutDescription,
        fileName: layout.fileName,
        templateName: layout.templateName,
      }))

      const slidesSummary = inputSlides
        .map((slide, index) => {
          const bullets = slide.content.map((c) => `- ${c}`).join('\n')
          return `Slide ${index} (title: "${slide.title}")\n${bullets}`
        })
        .join('\n\n')

      const systemPrompt =
        'You are selecting slide layouts for a business presentation built from an outline. ' +
        'You are given a list of available layouts and the outline bullets for each slide. ' +
        'For each slide, choose the single most appropriate layout index based on structure (headline, bullets, metrics, timeline, team, thank-you, etc.) and intent. ' +
        'Prefer layouts that naturally fit the content type (e.g., metrics-heavy bullets -> metrics layouts, sequential steps -> timeline, team info -> team layouts, closing notes -> thank-you/contact). ' +
        'Keep some variety across the deck, but do not over-rotate if several slides are clearly of the same type. ' +
        'Respond with JSON only and no additional commentary.'

      const userPrompt =
        'Available layouts (with indices):\n' +
        layoutSummaries
          .map(
            (l) =>
              `- Index ${l.index}: ${l.name} [${l.fileName}] — ${l.description} (template: ${l.templateName})`
          )
          .join('\n') +
        '\n\nSlides outline to map:\n' +
        slidesSummary +
        '\n\nReturn JSON in this shape (indices are 0-based):\n' +
        '{"layout_indices": [0, 1, 2, ...]}'

      const prompt = `${systemPrompt}\n\n${userPrompt}`

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano' })
      const responseText = typeof response === 'string' ? response : JSON.stringify(response)

      let parsed: any
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
      } catch {
        return inputSlides.map((_, i) => i % layouts.length)
      }

      const raw = parsed?.layout_indices
      if (!Array.isArray(raw)) {
        return inputSlides.map((_, i) => i % layouts.length)
      }

      const maxIndex = layouts.length - 1
      const cleaned = inputSlides.map((_, i) => {
        const v = raw[i]
        const n = typeof v === 'number' ? v : Number(v)
        if (!Number.isFinite(n)) return i % layouts.length
        if (n < 0) return 0
        if (n > maxIndex) return maxIndex
        return Math.floor(n)
      })

      // Ensure the first slide uses a layout that actually supports an image,
      // so the hero picture is visible on the opening slide.
      if (cleaned.length > 0 && layouts.length > 0) {
        const hasImageAt = (idx: number) => {
          const sample = layouts[idx]?.sampleData as any
          if (!sample || typeof sample !== 'object') return false
          return (
            Object.prototype.hasOwnProperty.call(sample, 'image') ||
            Object.prototype.hasOwnProperty.call(sample, 'firstImage') ||
            Object.prototype.hasOwnProperty.call(sample, 'heroImage')
          )
        }

        const currentFirst = cleaned[0]
        const currentHasImage = currentFirst >= 0 && currentFirst <= maxIndex && hasImageAt(currentFirst)

        if (!currentHasImage) {
          const fallbackWithImage = layouts.findIndex((_, idx) => hasImageAt(idx))
          if (fallbackWithImage >= 0) {
            cleaned[0] = fallbackWithImage
          }
        }
      }

      return cleaned
    } catch (error) {
      console.error('Failed to determine neo-general layout indices via AI', error)
      return inputSlides.map((_, i) => i % layouts.length)
    }
  }

  const fitSlideToLayout = async (slide: Slide, layout: TemplateWithData): Promise<any | null> => {
    try {
      const outlineMarkdown = `# ${slide.title}\n${slide.content.map((c) => `- ${c}`).join('\n')}`

      const systemPrompt =
        'You are filling in JSON data for a pre-defined slide layout used in a business presentation. ' +
        'You will receive the JSON schema of the layout, an example of default data for that layout, and an outline for a single slide. ' +
        'Generate concise, presentation-ready copy that fits the layout intent and the outline. ' +
        'Keep text punchy and business-focused. Do not add emojis. Respond with JSON only, no commentary.'

      const schemaJson = JSON.stringify(layout.schemaJSON, null, 2)
      const sampleJson = JSON.stringify(layout.sampleData || {}, null, 2)

      const userPrompt =
        `Layout schema (JSON):\n${schemaJson}\n\n` +
        `Layout default data example (JSON):\n${sampleJson}\n\n` +
        `Slide outline (markdown):\n${outlineMarkdown}\n\n` +
        'Return a single JSON object that matches the layout schema keys. Use the outline to decide which fields to fill (title, description, bullets, metrics, quotes, etc.). '

      const prompt = `${systemPrompt}\n\n${userPrompt}`

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano' })
      const responseText = typeof response === 'string' ? response : JSON.stringify(response)

      let parsed: any
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
      } catch {
        return null
      }

      if (!parsed || typeof parsed !== 'object') return null
      return parsed
    } catch (error) {
      // Soft-fail: if the AI helper throws for any reason, just
      // skip layout-specific data and let the existing heuristics
      // handle mapping. Log as a warning to avoid noisy overlays.
      console.warn('Failed to fit slide to layout via AI:', error)
      return null
    }
  }

  const handleGeneratePresentation = async () => {
    if (!selectedTemplateId) {
      alert('Please select a template in the "Select Template" tab first.')
      return
    }

    setIsGeneratingPresentation(true)
    try {
      const isNeoGeneral = selectedTemplateGroup?.id === 'neo-general'

      let neoGeneralLayoutIndices: number[] | null = null
      if (isNeoGeneral && selectedTemplateGroup?.layouts?.length) {
        try {
          neoGeneralLayoutIndices = await determineNeoGeneralLayoutIndices(
            orderedSlides,
            selectedTemplateGroup.layouts
          )
        } catch (error) {
          console.error('AI layout selection failed, falling back to rotation', error)
          neoGeneralLayoutIndices = null
        }
      }

      const generated = await Promise.all(
        orderedSlides.map(async (slide, index) => {
          try {
            const response = await fetch('/api/images/pexels', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: `${slide.title} ${slide.content.join(' ')}`.slice(0, 200),
                perPage: 1,
                orientation: 'landscape',
              }),
            })

            if (!response.ok) {
              console.error('Pexels API error for slide', slide.number, await response.text())
              return {
                ...slide,
                imageSrc: null,
              }
            }

            const data = (await response.json()) as {
              photos?: Array<{
                src?: Record<string, string>
              }>
            }

            const photo = data.photos?.[0]
            const src = photo?.src
            const imageUrl =
              src?.landscape ||
              src?.large2x ||
              src?.large ||
              src?.medium ||
              src?.original ||
              null

            // For neo-general templates, keep the original outline points
            // so they can be rendered as bullets in the slide layouts,
            // while still allowing an optimized title and optional
            // layout-specific AI-filled data.
            if (isNeoGeneral) {
              let optimized: { title: string; description: string } | null = null
              try {
                optimized = await optimizeSlideForTemplate(slide)
              } catch {
                optimized = null
              }

              let layoutData: any | null = null
              const layouts = selectedTemplateGroup?.layouts || []
              if (layouts.length) {
                const fallbackIndex = index % layouts.length
                const rawIndex = neoGeneralLayoutIndices && typeof neoGeneralLayoutIndices[index] === 'number'
                  ? (neoGeneralLayoutIndices[index] as number)
                  : fallbackIndex
                const safeIndex = rawIndex >= 0 && rawIndex < layouts.length ? rawIndex : fallbackIndex
                const layout = layouts[safeIndex]

                if (layout) {
                  try {
                    layoutData = await fitSlideToLayout(
                      {
                        number: slide.number,
                        title: optimized?.title || slide.title,
                        content: slide.content,
                      },
                      layout
                    )
                  } catch {
                    layoutData = null
                  }
                }
              }

              return {
                ...slide,
                title: optimized?.title || slide.title,
                // Preserve full outline points for neo-general
                content: slide.content,
                imageSrc: imageUrl,
                layoutData: layoutData || undefined,
              }
            }

            const optimized = await optimizeSlideForTemplate(slide)

            return {
              ...slide,
              title: optimized.title,
              // Non neo-general templates use a concise paragraph description
              content: [optimized.description],
              imageSrc: imageUrl,
            }
          } catch (error) {
            console.error('Image generation failed for slide', slide.number, error)
            return {
              ...slide,
              imageSrc: null,
            }
          }
        })
      )

      // Persist generated presentation for the current user (best-effort)
      if (typeof window !== 'undefined') {
        try {
          let email: string | null = null
          const sessionRaw = window.localStorage.getItem('vivid_auth_session')

          if (sessionRaw) {
            try {
              const session = JSON.parse(sessionRaw) as { email?: string | null }
              email = session?.email ?? null
            } catch {
              email = null
            }
          }

          // Fallback: use Firebase currentUser email if session payload lacks it
          if (!email && auth?.currentUser?.email) {
            email = auth.currentUser.email
            try {
              const base = sessionRaw ? JSON.parse(sessionRaw) : {}
              window.localStorage.setItem(
                'vivid_auth_session',
                JSON.stringify({ ...base, email })
              )
            } catch {
              // ignore patch errors
            }
          }

          if (email) {
            const title = generated[0]?.title || 'Generated Presentation'
            const description = orderedSlides[0]?.content?.join(' ').slice(0, 160) || null

            await fetch('/api/presentations/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userEmail: email,
                title,
                description,
                slides: generated.map((g) => ({
                  title: g.title,
                  content: g.content,
                  imageSrc: g.imageSrc,
                })),
              }),
            })
          }
        } catch (error) {
          console.error('Failed to save presentation history', error)
        }
      }

      setGeneratedSlides(generated)
      setActiveGeneratedSlideIndex(0)

      // Store AI-selected layout indices (currently for neo-general only)
        setLayoutIndices(isNeoGeneral && neoGeneralLayoutIndices ? neoGeneralLayoutIndices : [])

      // After slides are generated, switch to the Presentation view
      setSelectedSlideIndex(orderedSlides.length + 1)
    } finally {
      setIsGeneratingPresentation(false)
    }
  }

  const handleTitleChange = (index: number, newTitle: string) => {
    setOrderedSlides((prev) =>
      prev.map((slide, i) => (i === index ? { ...slide, title: newTitle } : slide))
    )
  }

  const handleBulletChange = (
    slideIndex: number,
    bulletIndex: number,
    newText: string
  ) => {
    setOrderedSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide
        const newContent = [...slide.content]
        newContent[bulletIndex] = newText
        return { ...slide, content: newContent }
      })
    )
  }

  const handleDeleteSlide = (index: number) => {
    setOrderedSlides((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((slide, idx) => ({ ...slide, number: idx + 1 }))
    })
  }

  const handleAddBullet = (slideIndex: number, bulletIndex: number) => {
    setOrderedSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide
        const newContent = [...slide.content]
        newContent.splice(bulletIndex + 1, 0, 'New point')
        return { ...slide, content: newContent }
      })
    )
  }

  const handleDeleteBullet = (slideIndex: number, bulletIndex: number) => {
    setOrderedSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide
        const newContent = slide.content.filter((_, idx) => idx !== bulletIndex)
        return { ...slide, content: newContent.length > 0 ? newContent : [''] }
      })
    )
  }

  const handleBulletDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    slideIndex: number,
    bulletIndex: number
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${slideIndex}:${bulletIndex}`)
    setBulletDragging({ slideIndex, bulletIndex })
  }

  const handleBulletDragOver = (event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault()
  }

  const handleBulletDrop = (
    event: React.DragEvent<HTMLLIElement>,
    slideIndex: number,
    targetBulletIndex: number
  ) => {
    event.preventDefault()
    if (!bulletDragging) return
    if (bulletDragging.slideIndex !== slideIndex) {
      setBulletDragging(null)
      return
    }
    if (bulletDragging.bulletIndex === targetBulletIndex) {
      setBulletDragging(null)
      return
    }

    setOrderedSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide
        const newContent = [...slide.content]
        const [moved] = newContent.splice(bulletDragging.bulletIndex, 1)
        newContent.splice(targetBulletIndex, 0, moved)
        return { ...slide, content: newContent }
      })
    )

    setBulletDragging(null)
  }

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    // Required in some browsers to initiate drag
    event.dataTransfer.setData('text/plain', String(index))
    setDraggingIndex(index)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    event.preventDefault()
    if (draggingIndex === null || draggingIndex === targetIndex) return
    setOrderedSlides((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(draggingIndex, 1)
      updated.splice(targetIndex, 0, moved)
      // Re-number slides based on new order
      return updated.map((s, idx) => ({ ...s, number: idx + 1 }))
    })
    setDraggingIndex(null)
  }

  const handleDragEnd = () => {
    setDraggingIndex(null)
  }

  // Reset layout mapping when source slides or template changes
  useEffect(() => {
    setLayoutIndices([])
  }, [slides.length, selectedTemplateId])

  return (
    <div
      className={`min-h-screen ${
        theme === 'light'
          ? 'bg-slate-50 text-slate-900'
          : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-slate-50'
      }`}
    >
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <button
            onClick={() => {
              if (presentationId) {
                router.push('/dashboard')
              } else if (selectedSlideIndex === slides.length) {
                setSelectedSlideIndex(0)
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              } else if (selectedSlideIndex === slides.length + 1) {
                setSelectedSlideIndex(orderedSlides.length)
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              } else {
                router.push('/app-maker')
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition text-sm ${
              theme === 'light'
                ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'border-slate-600 text-slate-100 hover:bg-slate-900'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Section label */}
        <div
          className={`mb-8 border-b ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-700'
          }`}
        >
          <p
            className={`pb-4 px-1 text-sm font-medium ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-300'
            }`}
          >
            {selectedSlideIndex < orderedSlides.length
              ? 'Outline & Content'
              : selectedSlideIndex === slides.length
              ? 'Select Template'
              : 'Presentation'}
          </p>
        </div>

        {selectedSlideIndex < orderedSlides.length ? (
          <>
            {/* Slides Display */}
            <div className="space-y-5">
              {orderedSlides.map((slide, index) => (
                <div
                  key={index}
                  className="flex items-stretch gap-3"
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDrop(event, index)}
                >
                  {/* Drag handle */}
                  <div
                    draggable
                    onDragStart={(event) => handleDragStart(event, index)}
                    onDragEnd={handleDragEnd}
                    className={`mt-6 flex h-9 w-7 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-400 cursor-grab active:cursor-grabbing shadow-sm ${draggingIndex === index ? 'ring-2 ring-slate-300/80 shadow-md' : ''
                      }`}
                    title="Drag to reorder slide"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 6h12M4 10h12M4 14h12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div
                    className={`flex-1 rounded-3xl overflow-hidden transition backdrop-blur-sm p-7 border shadow-sm ${
                      theme === 'light'
                        ? 'bg-white/80 border-slate-200/70'
                        : 'bg-neutral-900/80 border-neutral-700/70'
                    } ${
                      draggingIndex === index
                        ? 'ring-2 ring-slate-300/80 shadow-md translate-y-0'
                        : 'hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Unified Slide Layout for all slides, including title slide */}
                    <div className="space-y-6">
                      {/* Slide Header */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center font-semibold text-slate-50 text-base shadow-sm">
                          {slide.number}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => handleTitleChange(index, e.target.value)}
                            className={`w-full bg-transparent border-b focus:outline-none text-xl font-semibold mb-1 ${
                              theme === 'light'
                                ? 'border-slate-200/70 focus:border-slate-400 text-slate-900'
                                : 'border-slate-600/70 focus:border-slate-300 text-slate-50'
                            }`}
                          />
                          <div className="h-1 w-10 bg-slate-900 rounded-full mt-1"></div>
                        </div>
                        <button
                          onClick={() => handleDeleteSlide(index)}
                          className="flex-shrink-0 p-2 text-slate-300 hover:text-slate-500 transition rounded-full hover:bg-slate-50"
                          title="Delete slide"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Slide Content - Structured Bulleted List */}
                      <div className="mt-3">
                        <ul className="space-y-1.5 list-none">
                          {slide.content.map((point, idx) => (
                            <li
                              key={idx}
                              className={`flex items-center gap-2 leading-relaxed ${
                                theme === 'light' ? 'text-slate-700' : 'text-slate-100'
                              }`}
                              onDragOver={handleBulletDragOver}
                              onDrop={(event) => handleBulletDrop(event, index, idx)}
                            >
                              {/* Bullet drag handle */}
                              <div
                                draggable
                                onDragStart={(event) =>
                                  handleBulletDragStart(event, index, idx)
                                }
                                className={`flex h-7 w-5 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-400 cursor-grab active:cursor-grabbing shadow-sm ${bulletDragging &&
                                  bulletDragging.slideIndex === index &&
                                  bulletDragging.bulletIndex === idx
                                  ? 'ring-2 ring-slate-300/80 shadow-md'
                                  : ''
                                  }`}
                                title="Drag to reorder point"
                              >
                                <svg
                                  className="h-3 w-3"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M4 6h12M4 10h12M4 14h12"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>

                              <input
                                type="text"
                                value={point}
                                onChange={(e) =>
                                  handleBulletChange(index, idx, e.target.value)
                                }
                                className={`flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none ${
                                  theme === 'light'
                                    ? 'bg-slate-50/80 border border-slate-200/70 focus:border-slate-400 focus:bg-white'
                                    : 'bg-neutral-900/80 border border-neutral-700/70 focus:border-neutral-400 focus:bg-neutral-900'
                                }`}
                              />

                              {/* Bullet actions: add & delete */}
                              <button
                                type="button"
                                onClick={() => handleAddBullet(index, idx)}
                                className="p-1.5 text-slate-300 hover:text-slate-600 transition rounded-full hover:bg-slate-50"
                                title="Add bullet below"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBullet(index, idx)}
                                className="p-1.5 text-slate-300 hover:text-slate-600 transition rounded-full hover:bg-slate-50"
                                title="Delete bullet"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mt-12 mb-24">
              <button
                onClick={() => {
                  const text = orderedSlides
                    .map((s) => `${s.title}\n${s.content.map((c) => `• ${c}`).join('\n')}`)
                    .join('\n\n')
                  const element = document.createElement('a')
                  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
                  element.setAttribute('download', 'presentation-outline.txt')
                  element.style.display = 'none'
                  document.body.appendChild(element)
                  element.click()
                  document.body.removeChild(element)
                }}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-slate-50 font-semibold rounded-full hover:bg-black transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Outline
              </button>

              <button
                onClick={() => {
                  const text = orderedSlides
                    .map((s) => `${s.title}\n${s.content.map((c) => `• ${c}`).join('\n')}`)
                    .join('\n\n')
                  navigator.clipboard.writeText(text)
                  alert('Content copied to clipboard!')
                }}
                className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-full transition ${
                  theme === 'light'
                    ? 'border border-slate-300 text-slate-800 hover:bg-slate-100'
                    : 'border border-slate-600 text-slate-100 hover:bg-slate-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </button>
            </div>

            {/* Persistent bottom-center Select Template button */}
            <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-30">
              <button
                type="button"
                onClick={() => {
                  setSelectedSlideIndex(orderedSlides.length)
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-slate-50 font-semibold shadow-lg hover:bg-black transition"
             >
                <span>Select Template</span>
              </button>
            </div>
          </>
        ) : selectedSlideIndex === slides.length ? (
          <>
            <AllTemplatesGrid />

            {/* Persistent bottom-center Generate Presentation button on Select Template tab */}
            <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-30">
              <button
                type="button"
                onClick={() => {
                  handleGeneratePresentation()
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                disabled={isGeneratingPresentation || !orderedSlides.length || !selectedTemplateId}
                className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-slate-50 font-semibold shadow-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPresentation ? 'Generating presentation slides...' : 'Generate Presentation'}
              </button>
            </div>
          </>
        ) : (
          (() => {
            const isNeoGeneralGroup = selectedTemplateGroup?.id === 'neo-general'
            const layouts = isNeoGeneralGroup ? [] : (selectedTemplateGroup?.layouts || [])
            const LayoutComp = !isNeoGeneralGroup && layouts[0]?.component ? layouts[0].component : null

            const buildSlideDataFn = !isNeoGeneralGroup && layouts.length
              ? (slide: GeneratedPresentationSlide, layoutIndex = 0) => {
                  const effectiveIndex = layoutIndex % layouts.length
                  const layout = layouts[effectiveIndex]
                  const baseData: any = { ...(layout.sampleData || {}) }
                  const sampleData: any = layout.sampleData || {}
                  const data: any = { ...baseData }

                  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
                    data.title = slide.title
                  }

                  if (Object.prototype.hasOwnProperty.call(data, 'description')) {
                    const isNeoGeneral = selectedTemplateGroup?.id === 'neo-general'
                    data.description = isNeoGeneral
                      ? slide.content.join(' ')
                      : slide.content.join(' · ')
                  }

                  // Common primary image mapping
                  if (Object.prototype.hasOwnProperty.call(data, 'image')) {
                    const baseImage = (data.image || {}) as any
                    data.image = {
                      ...baseImage,
                      __image_url__: slide.imageSrc || baseImage.__image_url__,
                      __image_prompt__:
                        baseImage.__image_prompt__ || `Illustration for slide ${slide.number}: ${slide.title}`,
                    }
                  }

                  // Neo-general specific: previous layout-aware mapping logic lived here.
                  // We now render neo-general slides using the generic fallback card
                  // layout in PresentationView, so this branch is not used anymore.
                  if (selectedTemplateGroup?.id === 'neo-general') {
                    const layoutFile = layout.fileName || ''

                    // Helper: split a bullet into title/description parts
                    const splitBullet = (text: string) => {
                      const trimmed = text.trim()
                      if (!trimmed) return { title: '', description: '' }

                      // Try to split on colon or dash first
                      const colonIdx = trimmed.indexOf(':')
                      if (colonIdx > 0 && colonIdx < trimmed.length - 1) {
                        return {
                          title: trimmed.slice(0, colonIdx).trim(),
                          description: trimmed.slice(colonIdx + 1).trim(),
                        }
                      }

                      const dashIdx = trimmed.indexOf(' - ')
                      if (dashIdx > 0 && dashIdx < trimmed.length - 1) {
                        return {
                          title: trimmed.slice(0, dashIdx).trim(),
                          description: trimmed.slice(dashIdx + 3).trim(),
                        }
                      }

                      // Fallback: first sentence vs rest
                      const sentenceMatch = trimmed.match(/^(.*?[.!?])\s+(.*)$/)
                      if (sentenceMatch) {
                        return {
                          title: sentenceMatch[1].trim(),
                          description: sentenceMatch[2].trim(),
                        }
                      }

                      // Short text → title only
                      if (trimmed.length <= 60) {
                        return { title: trimmed, description: '' }
                      }

                      return {
                        title: trimmed.slice(0, 60).trim(),
                        description: trimmed.slice(60).trim(),
                      }
                    }

                    // Start from all outline points, then adjust per layout type
                    const allBullets = [...slide.content]
                    let bullets = [...allBullets]

                    // Layout-specific shaping of bullets vs description
                    // so that content fits the visual emphasis of each layout.
                    if (layoutFile === 'BulletWithIconsSlideLayout') {
                      // Use the first point as the main description paragraph,
                      // and the remaining points as icon bullets.
                      if (bullets.length && Object.prototype.hasOwnProperty.call(data, 'description')) {
                        ;(data as any).description = bullets[0]
                        bullets = bullets.slice(1)
                      }
                    } else if (layoutFile === 'ChartWithBulletsSlideLayout') {
                      // Treat the first point as an intro above the chart,
                      // and the remaining points as supporting bullet cards.
                      if (bullets.length && Object.prototype.hasOwnProperty.call(data, 'description')) {
                        ;(data as any).description = bullets[0]
                        bullets = bullets.slice(1)
                      }
                    } else if (layoutFile === 'HeadlineTextWithBulletsAndStatsLayout') {
                      // Keep all bullets for the numbered list on the left;
                      // if there is a description field, use a compact summary.
                      if (Object.prototype.hasOwnProperty.call(data, 'description') && bullets.length) {
                        ;(data as any).description = bullets.join(' ')
                      }
                    } else if (
                      layoutFile === 'HeadlineDescriptionWithImageLayout' ||
                      layoutFile === 'HeadlineDescriptionWithDoubleImageLayout'
                    ) {
                      // These are primarily title + paragraph + image; join
                      // all bullets into a single flowing paragraph.
                      if (Object.prototype.hasOwnProperty.call(data, 'description') && bullets.length) {
                        ;(data as any).description = bullets.join(' ')
                      }
                    }

                    // Map bullet arrays (bulletPoints, bullets, etc.) from bullets
                    Object.keys(data).forEach((key) => {
                      const lower = key.toLowerCase()
                      if (!lower.includes('bullet')) return

                      const value = data[key]
                      if (!Array.isArray(value) || value.length === 0) return

                      // Simple string bullets: show ALL outline points
                      if (typeof value[0] === 'string') {
                        data[key] = bullets.length ? [...bullets] : [...value]
                        return
                      }

                      // Object bullets (e.g., bulletPoints with title/description):
                      // expand or shrink to cover all outline points, reusing the
                      // sample items as a visual template.
                      if (typeof value[0] === 'object' && value[0] !== null) {
                        const templateItems = value as any[]
                        const sourceTexts = bullets.length ? bullets : templateItems.map(() => '')

                        data[key] = sourceTexts.map((text, idx) => {
                          const base = templateItems[idx % templateItems.length] || {}
                          const next: any = { ...base }

                          if (!text) return next

                          const parts = splitBullet(text)

                          if (Object.prototype.hasOwnProperty.call(base, 'title')) {
                            next.title = parts.title || text
                          }
                          if (Object.prototype.hasOwnProperty.call(base, 'description')) {
                            next.description = parts.description || text
                          }

                          return next
                        })
                      }
                    })

                    // If this layout already has a bullet array field, keep the
                    // main description compact (e.g., first point only) so the
                    // slide doesn't repeat the same text as both paragraph and bullets.
                    const hasBulletArrayField = Object.keys(data).some((key) => {
                      const lower = key.toLowerCase()
                      const value = (data as any)[key]
                      return lower.includes('bullet') && Array.isArray(value) && value.length > 0
                    })

                    if (hasBulletArrayField && Object.prototype.hasOwnProperty.call(data, 'description')) {
                      ;(data as any).description = allBullets[0] || (data as any).description
                    }

                    // TextSplitWithEmphasisBlock and similar layouts use
                    // insightTitle / insightDescription instead of bullet arrays.
                    if (Object.prototype.hasOwnProperty.call(data, 'insightTitle')) {
                      const firstPoint = bullets[0]
                      if (firstPoint) {
                        data.insightTitle = firstPoint
                      }
                    }
                    if (Object.prototype.hasOwnProperty.call(data, 'insightDescription')) {
                      const rest = bullets.slice(1)
                      if (rest.length) {
                        data.insightDescription = rest.join(' ')
                      }
                    }

                    // Layouts with metrics (e.g., MetricsWithImageSlideLayout)
                    if (Array.isArray((data as any).metrics)) {
                      const metrics = (data as any).metrics as any[]
                      ;(data as any).metrics = metrics.map((metric, idx) => {
                        const text = bullets[idx] || ''
                        if (!text) return metric

                        const numberMatch = text.match(/(\d[\d,.%+]*)/)
                        const value = numberMatch ? numberMatch[1].trim() : metric.value
                        const labelSource = numberMatch
                          ? text.replace(numberMatch[1], '').replace(/[\-–:]/, '').trim()
                          : text.trim()

                        return {
                          ...metric,
                          label: labelSource || metric.label,
                          value: value || metric.value,
                        }
                      })
                    }

                    // Additional image slots for neo-general (e.g., firstImage, secondImage)
                    const imageKeys = ['firstImage', 'secondImage', 'thirdImage']
                    imageKeys.forEach((key) => {
                      if (!Object.prototype.hasOwnProperty.call(data, key)) return
                      const baseImage = (data[key] || {}) as any
                      data[key] = {
                        ...baseImage,
                        __image_url__: slide.imageSrc || baseImage.__image_url__,
                        __image_prompt__:
                          baseImage.__image_prompt__ || `Illustration for slide ${slide.number}: ${slide.title}`,
                      }
                    })

                    // Generic pass: replace any leftover sample marketing copy
                    // with outline-driven text for neo-general templates.
                    const tailorStrings = (node: any, sampleNode: any, parentKey = '') => {
                      if (Array.isArray(node)) {
                        node.forEach((item, idx) => {
                          const sampleItem = Array.isArray(sampleNode) ? sampleNode[idx] : undefined
                          tailorStrings(item, sampleItem, parentKey)
                        })
                        return
                      }

                      if (!node || typeof node !== 'object') return

                      Object.keys(node).forEach((key) => {
                        const value = (node as any)[key]
                        const sampleValue = sampleNode ? (sampleNode as any)[key] : undefined

                        if (typeof value === 'string') {
                          const lowerKey = key.toLowerCase()
                          const isStructural =
                            key.startsWith('__') || key === 'layoutId' || key === 'slideNumber'

                          if (isStructural) return

                          const wasSample = typeof sampleValue === 'string' && value === sampleValue
                          if (!wasSample) return

                          const hasBullets = bullets.length > 0
                          const fullText = hasBullets ? bullets.join(' ') : slide.title

                          if (/(title|heading)/i.test(lowerKey)) {
                            ;(node as any)[key] = hasBullets ? bullets[0] : slide.title
                          } else if (/(subtitle|description|body|text|summary|copy)/i.test(lowerKey)) {
                            ;(node as any)[key] = fullText
                          }
                        } else if (typeof value === 'object' && value !== null) {
                          tailorStrings(value, sampleValue, key)
                        }
                      })
                    }

                    tailorStrings(data, sampleData)

                    // Final scrub: remove any remaining sample strings that do not
                    // overlap with the outline or slide title. This clears chart
                    // labels (Revenue, Jan, Feb, etc.), demo bios, and other
                    // marketing text that isn't part of the user's outline.
                    const outlineStrings = [slide.title, ...allBullets]
                      .map((s) => (s || '').toLowerCase())
                      .filter((s) => s.length > 0)

                    const scrubNonOutlineStrings = (node: any) => {
                      if (Array.isArray(node)) {
                        node.forEach((item) => scrubNonOutlineStrings(item))
                        return
                      }

                      if (!node || typeof node !== 'object') return

                      Object.keys(node).forEach((key) => {
                        const value = (node as any)[key]
                        if (typeof value === 'string') {
                          const isStructural =
                            key.startsWith('__') || key === 'layoutId' || key === 'slideNumber'
                          if (isStructural) return

                          const lowerValue = value.toLowerCase().trim()
                          if (!lowerValue) return

                          const matchesOutline = outlineStrings.some((src) => {
                            if (!src) return false
                            return src.includes(lowerValue) || lowerValue.includes(src)
                          })

                          if (!matchesOutline) {
                            ;(node as any)[key] = ''
                          }
                        } else if (value && typeof value === 'object') {
                          scrubNonOutlineStrings(value)
                        }
                      })
                    }

                    scrubNonOutlineStrings(data)
                  }

                  return data
                }
              : null

            return (
              <PresentationView
                generatedSlides={generatedSlides}
                activeIndex={activeGeneratedSlideIndex}
                setActiveIndex={setActiveGeneratedSlideIndex}
                isGenerating={isGeneratingPresentation}
                onGenerate={handleGeneratePresentation}
                hasTemplate={!!selectedTemplateId}
                orderedSlides={orderedSlides}
                templateComponent={LayoutComp}
                buildSlideData={buildSlideDataFn}
                templateLayouts={layouts}
                layoutIndices={layoutIndices}
              />
            )
          })()
        )}
      </main>
    </div>
  )
}

export default function Results() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4" />
            <p className="text-slate-500">Loading content...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
