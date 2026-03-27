"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { puter } from '@heyputer/puter.js'
import { templates } from '@/app/presentation-templates'
import type { TemplateLayoutsWithSettings, TemplateWithData } from '@/app/presentation-templates/utils'
import { usePresentationStore } from '@/store/presentationStore'

interface Slide {
  number: number
  title: string
  content: string[]
}

interface GeneratedPresentationSlide extends Slide {
  imageSrc: string | null
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
                className={`bg-white border rounded-lg cursor-pointer transition-all duration-200 group overflow-hidden ${
                  selectedTemplateId === template.id
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
  const decodedContent = decodeURIComponent(rawContent)
  const slides: Slide[] = []
  
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
          .map((line) =>
            line
              .replace(/^[A-Za-z]+:\s*/, '') // drop leading label "Subtitle:", "Overview:", etc.
              .replace(/^(?:[-*•]\s+|\d+\.|\d+\)|\d+\s+-\s+)/, '') // drop bullet / numbering
              .trim()
          )
          .filter((line) => line.length > 0)

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
          .map(line =>
            line
              // Strip common bullet or numbering prefixes ("• ", "- ", "1.", "2)", etc.)
              .replace(/^(?:[-*•]\s+|\d+\.|\d+\)|\d+\s+-\s+)/, '')
              .trim()
          )
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
  const content = searchParams.get('content')
  const slides = useMemo(() => (content ? parseContent(content) : []), [content])
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [generatedSlides, setGeneratedSlides] = useState<GeneratedPresentationSlide[]>([])
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false)
  const selectedTemplateId = usePresentationStore((state) => state.selectedTemplateId)
  const selectedTemplateGroup = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [selectedTemplateId]
  )

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

        <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 mb-6">No content available</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    )
  }

  const handleGeneratePresentation = async () => {
    if (!selectedTemplateId) {
      alert('Please select a template in the "Select Template" tab first.')
      return
    }

    setIsGeneratingPresentation(true)
    try {
      const generated = await Promise.all(
        slides.map(async (slide) => {
          const prompt = `Create a high-quality 16:9 presentation slide illustration for the topic "${slide.title}" with key points: ${slide.content.join(
            '; '
          )}`

          try {
            const img = await puter.ai.txt2img({
              prompt,
              provider: 'openai-image-generation',
              model: 'dall-e-3',
              ratio: { w: 16, h: 9 },
            })

            return {
              ...slide,
              imageSrc: img?.src ?? null,
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

      setGeneratedSlides(generated)
    } finally {
      setIsGeneratingPresentation(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Presenton
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Tabs Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setSelectedSlideIndex(0)}
            className={`pb-4 px-4 font-medium transition ${
              selectedSlideIndex === 0
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Outline & Content
          </button>
          <button
            onClick={() => setSelectedSlideIndex(slides.length)}
            className={`pb-4 px-4 font-medium transition ${
              selectedSlideIndex === slides.length
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Select Template
          </button>
          <button
            onClick={() => setSelectedSlideIndex(slides.length + 1)}
            className={`pb-4 px-4 font-medium transition ${
              selectedSlideIndex === slides.length + 1
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Presentation
          </button>
        </div>

        {selectedSlideIndex < slides.length ? (
          <>
            {/* Slides Display */}
            <div className="space-y-6">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className="rounded-lg shadow-sm overflow-hidden transition hover:shadow-md bg-white p-8 border border-gray-100"
                >
                  {/* Unified Slide Layout for all slides, including title slide */}
                  <div className="space-y-6">
                    {/* Slide Header */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center font-bold text-blue-600 text-lg">
                        {slide.number}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{slide.title}</h2>
                        <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded"></div>
                      </div>
                      <button
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition"
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
                    <div className="mt-4">
                      <ul className="space-y-2 list-disc list-inside">
                        {slide.content.map((point, idx) => {
                          // Split point by any remaining bullets for multi-part content
                          const subPoints = point
                            .split(/[•*-]/) // Split by any bullet
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0)

                          return (
                            <li key={idx} className="text-gray-700 leading-relaxed">
                              {subPoints[0]}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mt-12">
              <button
                onClick={() => {
                  const text = slides
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
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Outline
              </button>

              <button
                onClick={() => {
                  const text = slides
                    .map((s) => `${s.title}\n${s.content.map((c) => `• ${c}`).join('\n')}`)
                    .join('\n\n')
                  navigator.clipboard.writeText(text)
                  alert('Content copied to clipboard!')
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </button>
            </div>
          </>
        ) : selectedSlideIndex === slides.length ? (
          <AllTemplatesGrid />
        ) : (
          <div className="space-y-10">
            <div className="flex flex-col items-center justify-center py-12">
              <button
                onClick={handleGeneratePresentation}
                disabled={isGeneratingPresentation || !slides.length}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPresentation ? 'Generating presentation slides...' : 'Generate Presentation'}
              </button>
              {!selectedTemplateId && (
                <p className="mt-4 text-sm text-gray-500">
                  Select a template in the "Select Template" tab first.
                </p>
              )}
            </div>

            {generatedSlides.length > 0 && (
              <div className="space-y-8">
                {generatedSlides.map((slide) => {
                  const baseLayout = selectedTemplateGroup?.layouts[0]

                  if (!baseLayout) {
                    return (
                      <div
                        key={slide.number}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid md:grid-cols-2 gap-6"
                      >
                        <div className="flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                                {slide.number}
                              </div>
                              <h3 className="text-xl font-semibold text-gray-900">{slide.title}</h3>
                            </div>
                            <ul className="mt-2 space-y-1 list-disc list-inside text-gray-700 text-sm">
                              {slide.content.map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="relative bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[220px]">
                          {slide.imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={slide.imageSrc}
                              alt={`AI generated illustration for slide ${slide.number}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">Image not available</span>
                          )}
                        </div>
                      </div>
                    )
                  }

                  const LayoutComponent = baseLayout.component
                  const data: any = {
                    ...(baseLayout.sampleData || {}),
                  }

                  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
                    data.title = slide.title
                  }

                  if (Object.prototype.hasOwnProperty.call(data, 'description')) {
                    data.description = slide.content.join(' • ')
                  }

                  if (Object.prototype.hasOwnProperty.call(data, 'image')) {
                    const baseImage = (data.image || {}) as any
                    data.image = {
                      ...baseImage,
                      __image_url__: slide.imageSrc || baseImage.__image_url__,
                      __image_prompt__:
                        baseImage.__image_prompt__ || `Illustration for slide ${slide.number}: ${slide.title}`,
                    }
                  }

                  return (
                    <div
                      key={slide.number}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-center overflow-hidden"
                    >
                      <div className="w-full max-w-[1280px] max-h-[720px] mx-auto">
                        <LayoutComponent data={data} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function Results() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
