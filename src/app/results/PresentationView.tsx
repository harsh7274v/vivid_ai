"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TiptapTextReplacer from '../../components/TiptapTextReplacer'
import { ThemeSelector } from '../../components/ThemeSelector'
import type { TemplateWithData } from '@/app/presentation-templates/utils'
import { DEFAULT_THEMES } from '@/constants/themes'
import PresentationMode from './PresentationMode'

interface Slide {
  number: number
  title: string
  content: string[]
}

interface GeneratedSlide extends Slide {
  imageSrc: string | null
}

interface PresentationViewProps {
  generatedSlides: GeneratedSlide[]
  activeIndex: number
  setActiveIndex: (i: number) => void
  isGenerating: boolean
  onGenerate: () => void
  hasTemplate: boolean
  orderedSlides: Slide[]
  templateComponent: any
  buildSlideData: ((slide: GeneratedSlide, layoutIndex?: number) => any) | null
  templateLayouts?: TemplateWithData[] | null
  layoutIndices?: number[]
}

export default function PresentationView({
  generatedSlides,
  activeIndex,
  setActiveIndex,
  isGenerating,
  onGenerate,
  hasTemplate,
  orderedSlides,
  templateComponent: LayoutComponent,
  buildSlideData,
  templateLayouts,
  layoutIndices,
}: PresentationViewProps) {
  const router = useRouter()
  const [sidebarView, setSidebarView] = useState<'grid' | 'list'>('grid')
  const [enableSelectEdit, setEnableSelectEdit] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editableSlides, setEditableSlides] = useState<GeneratedSlide[]>(generatedSlides)
  const [currentThemeId, setCurrentThemeId] = useState<string>('')
  const [isPresentMode, setIsPresentMode] = useState(false)

  useEffect(() => {
    setEditableSlides(generatedSlides)
  }, [generatedSlides])

  const scrollToSlide = (index: number) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(`main-slide-${index}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const safeIndex = Math.min(Math.max(activeIndex, 0), editableSlides.length - 1)
  const currentSlide = editableSlides[safeIndex]

  const handleTitleChange = (index: number, newTitle: string) => {
    setEditableSlides((slides) => {
      const next = [...slides]
      if (!next[index]) return slides
      next[index] = { ...next[index], title: newTitle }
      return next
    })
  }

  const handleBulletChange = (slideIndex: number, bulletIndex: number, newText: string) => {
    setEditableSlides((slides) => {
      const next = [...slides]
      const slide = next[slideIndex]
      if (!slide) return slides
      const content = [...slide.content]
      content[bulletIndex] = newText
      next[slideIndex] = { ...slide, content }
      return next
    })
  }

  const handleImageChange = (index: number) => {
    if (!enableSelectEdit) return
    const current = editableSlides[index]
    if (!current) return
    const url = window.prompt('Enter image URL', current.imageSrc ?? '')
    if (!url) return
    setEditableSlides((slides) => {
      const next = [...slides]
      if (!next[index]) return slides
      next[index] = { ...next[index], imageSrc: url }
      return next
    })
  }

  const handleDeleteSlide = (index: number) => {
    if (!enableSelectEdit) return
    setEditableSlides((slides) => {
      if (slides.length <= 1) return slides
      const next = [...slides]
      next.splice(index, 1)
      const reNumbered = next.map((s, i) => ({ ...s, number: i + 1 }))
      const newIndex = Math.min(index, reNumbered.length - 1)
      setActiveIndex(newIndex)
      return reNumbered
    })
  }

  const handleAddSlideBelow = (index: number) => {
    if (!enableSelectEdit) return
    setEditableSlides((slides) => {
      const next = [...slides]
      const newSlide: GeneratedSlide = {
        number: next.length + 1,
        title: 'New slide',
        content: ['New point'],
        imageSrc: null,
      }
      next.splice(index + 1, 0, newSlide)
      const reNumbered = next.map((s, i) => ({ ...s, number: i + 1 }))
      setActiveIndex(index + 1)
      return reNumbered
    })
  }

  const handleThemeUpdate = (theme: any) => {
    if (!theme) {
      setCurrentThemeId('')
      return
    }
    setCurrentThemeId(theme.id ?? '')
  }

  const handleRichTextChange = (content: string, path: string, slideIndex?: number) => {
    if (typeof slideIndex !== 'number') return

    setEditableSlides((slides) => {
      const next = [...slides]
      const slide = next[slideIndex]
      if (!slide) return slides

      if (path === 'title') {
        next[slideIndex] = { ...slide, title: content }
        return next
      }

      if (path === 'description') {
        const parts = content
          .split(/[•·]/)
          .map((s) => s.trim())
          .filter(Boolean)

        next[slideIndex] = { ...slide, content: parts.length ? parts : [content] }
        return next
      }

      return slides
    })
  }

  const getCurrentTheme = () => {
    if (!currentThemeId) return null
    const theme = (DEFAULT_THEMES as any[]).find((t) => t.id === currentThemeId)
    return theme || null
  }

  const buildPptxModel = () => {
    const theme = getCurrentTheme() as any | null
    const colors = theme?.data?.colors as any | undefined
    const backgroundColor = colors?.background || '#ffffff'
    const textColor = colors?.background_text || '#111827'
    const fontName = theme?.data?.fonts?.textFont?.name || 'Inter'

    return {
      slides: editableSlides.map((slide) => {
        const shapes: any[] = []

        if (slide.imageSrc) {
          shapes.push({
            type: 'image',
            url: slide.imageSrc,
            // Approximate the web grid: image on left, centered vertically
            position: { left: 80, top: 80, width: 448, height: 560 },
            border_radius: 24,
          })
        }

        shapes.push({
          type: 'text',
          // Title in the right column, slightly down from top
          position: { left: 568, top: 120, width: 632, height: 140 },
          paragraphs: [
            {
              runs: [
                {
                  text: slide.title,
                  font_size: 32,
                  color_hex: textColor.replace('#', '') || '111827',
                  bold: true,
                  font_name: fontName,
                },
              ],
            },
          ],
        })

        shapes.push({
          type: 'text',
          // Bullets below the title, staying within right column
          position: { left: 568, top: 280, width: 632, height: 360 },
          is_bullets: true,
          paragraphs: slide.content.map((point) => ({
            runs: [
              {
                text: `• ${point}`,
                font_size: 20,
                color_hex: textColor.replace('#', '') || '111827',
                font_name: fontName,
              },
            ],
          })),
        })

        return {
          background_color: backgroundColor.replace('#', '') || 'FFFFFF',
          shapes,
        }
      }),
    }
  }

  const handleExportPptx = async () => {
    try {
      if (typeof window === 'undefined') return
      const model = buildPptxModel()
      const res = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      })
      if (!res.ok) {
        console.error('Failed to export PPTX')
        return
      }
      const blob = await res.blob()
      if (!blob || blob.size === 0) {
        console.error('Received empty PPTX file')
        return
      }
      console.log('PPTX blob size', blob.size)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'presentation.pptx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Fallback: open in a new tab in case click is blocked
      try {
        window.open(url, '_blank')
      } catch {
        // ignore
      }
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('Error exporting PPTX', err)
    }
  }

  // Pre-generation state
  if (generatedSlides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to Generate</h3>
        <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
          {hasTemplate
            ? 'Click below to generate your presentation slides with the selected template.'
            : 'Please select a template in the "Select Template" tab first.'}
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating || !orderedSlides.length || !hasTemplate}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Presentation'
          )}
        </button>
      </div>
    )
  }

  return (
    <>
    <div className="fixed inset-0 z-50 bg-[#f5f5f5] flex flex-col">
      {/* ─── Top Navbar ─── */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <header className="h-14 bg-white border border-slate-200 flex items-center px-4 gap-3 rounded-2xl shadow-sm">
          {/* Logo and title */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-slate-800 text-lg tracking-tight">vivid Ai</span>
              <span className="text-[11px] text-slate-500 -mt-0.5">Convert Input into Structured Insights</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 mx-3" />

          {/* Title */}
          <span className="text-sm text-slate-600 truncate max-w-[280px]">
            {currentSlide?.title || 'Untitled Presentation'}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme */}
          <ThemeSelector currentThemeId={currentThemeId} onThemeUpdate={handleThemeUpdate} />

          {/* Enable Select Edit Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-medium text-emerald-700">Enable Select Edit</span>
            <button
              onClick={() => setEnableSelectEdit(!enableSelectEdit)}
              className={`relative w-10 h-5 rounded-full transition-colors ${enableSelectEdit ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enableSelectEdit ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
              </svg>
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
              </svg>
            </button>
          </div>

          {/* Present */}
          <button
            onClick={() => setIsPresentMode(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-indigo-200 text-indigo-600 font-medium text-sm rounded-lg hover:bg-indigo-50 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Present
          </button>

          {/* Export */}
          <button
            onClick={handleExportPptx}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export
          </button>

          {/* Dashboard */}
          <button
            onClick={() => router.push('/app-maker')}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>
        </header>
      </div>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden px-4 pt-4 pb-4 relative">
        {/* ─── Left Sidebar ─── */}
        {isSidebarOpen ? (
          <aside className="w-[272px] bg-white border-r border-slate-200 flex flex-col shrink-0 pt-4 pl-4 pr-3 pb-4 rounded-2xl">
          {/* Sidebar header */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">
            <button
              onClick={() => setSidebarView('grid')}
              className={`p-1.5 rounded-lg transition ${sidebarView === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setSidebarView('list')}
              className={`p-1.5 rounded-lg transition ${sidebarView === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm text-slate-500 ml-1">({editableSlides.length})</span>
            <div className="flex-1" />
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close slide list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Slide list / thumbnails */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {sidebarView === 'list'
              ? editableSlides.map((slide, index) => (
                  <button
                    key={slide.number}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index)
                      scrollToSlide(index)
                    }}
                    className={`w-full text-left rounded-2xl border-2 px-5 py-4 text-base font-semibold tracking-tight transition-all ${
                      index === safeIndex
                        ? 'border-violet-500 text-slate-900 shadow-[0_0_0_1px_rgba(124,58,237,0.25)] bg-white'
                        : 'border-slate-200 text-slate-900 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {`Slide ${index + 1}`}
                  </button>
                ))
              : editableSlides.map((slide, index) => (
                  <button
                    key={slide.number}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index)
                      scrollToSlide(index)
                    }}
                    className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${
                      index === safeIndex
                        ? 'border-indigo-500 shadow-md shadow-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="relative bg-slate-50 aspect-[16/9] overflow-hidden">
                      {LayoutComponent && buildSlideData ? (
                        <div className="absolute inset-0 bg-transparent z-10" />
                      ) : null}
                      {slide.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={slide.imageSrc}
                          alt={`Slide ${slide.number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <span className="text-3xl font-bold text-slate-300">{slide.number}</span>
                        </div>
                      )}
                    </div>
                    {/* Slide info */}
                    <div className="p-2.5">
                      <div className="font-semibold text-xs text-slate-800 truncate">{slide.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                        {slide.content.join(' · ')}
                      </div>
                    </div>
                  </button>
                ))}
          </div>
        </aside>
        ) : (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center hover:shadow-lg hover:border-slate-300 transition z-20"
            aria-label="Open slide list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* ─── Main Content ─── */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Slide display area */}
          <div className="flex-1 overflow-auto p-6">
            <div
              id="presentation-slides-wrapper"
              className="w-full max-w-[1120px] mx-auto flex flex-col gap-24"
            >
              {editableSlides.map((slide, index) => {
                const isActive = index === safeIndex

                return (
                  <div
                    key={slide.number}
                    id={`main-slide-${index}`}
                    className="group relative shadow-2xl border aspect-[16/9] overflow-auto rounded-none"
                    style={{
                      backgroundColor: 'var(--background-color, #ffffff)',
                      borderColor: 'var(--stroke, #E5E5E5)',
                      color: 'var(--background-text, #0f172a)',
                      fontFamily: 'var(--body-font-family, inherit)',
                    }}
                  >
                    {/* In-slide controls (only visible in edit mode on hover for active slide) */}
                    {enableSelectEdit && isActive && (
                      <>
                        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm shadow-md hover:bg-indigo-700 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit slide
                          </button>
                          <div className="pointer-events-auto flex items-center gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-slate-50 shadow-sm transition">
                              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              AI edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(index)}
                              className="p-2 bg-white/90 backdrop-blur border border-slate-200 rounded-full text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Add slide button at bottom center on hover */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleAddSlideBelow(index)}
                            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200 text-xs text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add slide below
                          </button>
                        </div>
                      </>
                    )}

                    {(templateLayouts && templateLayouts.length && buildSlideData) || (LayoutComponent && buildSlideData) ? (
                      <div className="w-full h-full">
                        {(() => {
                          const hasLayouts = templateLayouts && templateLayouts.length > 0
                          let layoutIndex = hasLayouts ? index % (templateLayouts as TemplateWithData[]).length : 0

                          // If AI-selected layout indices are provided, prefer them
                          if (hasLayouts && layoutIndices && typeof layoutIndices[index] === 'number') {
                            const rawIndex = layoutIndices[index] as number
                            const maxIndex = (templateLayouts as TemplateWithData[]).length - 1
                            if (rawIndex >= 0 && rawIndex <= maxIndex) {
                              layoutIndex = rawIndex
                            }
                          }
                          const EffectiveLayoutComponent = hasLayouts
                            ? (templateLayouts as TemplateWithData[])[layoutIndex].component
                            : LayoutComponent
                          const slideData = buildSlideData ? buildSlideData(slide, layoutIndex) : null

                          if (!EffectiveLayoutComponent || !slideData) return null

                          return enableSelectEdit ? (
                            <TiptapTextReplacer
                              slideData={slideData}
                              slideIndex={index}
                              onContentChange={handleRichTextChange}
                            >
                              <EffectiveLayoutComponent data={slideData} />
                            </TiptapTextReplacer>
                          ) : (
                            <EffectiveLayoutComponent data={slideData} />
                          )
                        })()}
                      </div>
                    ) : (
                      /* Fallback: rich card layout (used for neo-general) */
                      <div className="w-full h-full grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-stretch">
                        {/* Image side */}
                        <div
                          className="flex items-center justify-center p-8 h-full"
                          onClick={() => enableSelectEdit && handleImageChange(index)}
                        >
                          {slide.imageSrc ? (
                            <div className={`w-full max-w-xl h-full ${enableSelectEdit ? 'cursor-pointer' : ''}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={slide.imageSrc}
                                alt={`Slide ${slide.number}`}
                                className="w-full h-full object-cover rounded-2xl shadow-sm border"
                                style={{ borderColor: 'var(--stroke, #E5E5E5)' }}
                              />
                            </div>
                          ) : (
                            <div
                              className={`text-slate-400 text-5xl font-bold opacity-30 ${enableSelectEdit ? 'cursor-pointer' : ''}`}
                            >
                              {slide.number}
                            </div>
                          )}
                        </div>
                        {/* Content side */}
                        <div
                          className="p-10 flex flex-col justify-center"
                          style={{ color: 'var(--background-text, #0f172a)' }}
                        >
                          <h2
                            className="text-3xl md:text-4xl font-bold tracking-tight mb-3 leading-tight outline-none"
                            contentEditable={enableSelectEdit}
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              handleTitleChange(index, e.currentTarget.textContent ? e.currentTarget.textContent.trim() : '')
                            }
                          >
                            {slide.title}
                          </h2>
                          <div
                            className="w-20 h-1.5 rounded-full mb-6"
                            style={{ background: 'var(--primary-color, #6366f1)' }}
                          />
                          <div className="space-y-4 text-base md:text-lg leading-relaxed">
                            {slide.content.map((point, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div
                                  className="mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: 'var(--background-text, #0f172a)' }}
                                />
                                <p
                                  className="outline-none"
                                  contentEditable={enableSelectEdit}
                                  suppressContentEditableWarning
                                  onBlur={(e) =>
                                    handleBulletChange(
                                      index,
                                      idx,
                                      e.currentTarget.textContent ? e.currentTarget.textContent.trim() : ''
                                    )
                                  }
                                >
                                  {point}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
    {isPresentMode && (
      <PresentationMode
        slides={editableSlides}
        initialSlide={safeIndex}
        onExit={() => setIsPresentMode(false)}
        templateLayouts={templateLayouts}
        layoutIndices={layoutIndices}
        buildSlideData={buildSlideData || undefined}
        templateComponent={LayoutComponent}
      />
    )}
    </>
  )
}
