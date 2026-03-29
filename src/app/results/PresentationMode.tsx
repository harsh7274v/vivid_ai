"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react'
import type { TemplateWithData } from '@/app/presentation-templates/utils'

interface Slide {
  number: number
  title: string
  content: string[]
  imageSrc: string | null
}

interface PresentationModeProps {
  slides: Slide[]
  initialSlide?: number
  onExit: () => void
  templateLayouts?: TemplateWithData[] | null
  layoutIndices?: number[]
  buildSlideData?: ((slide: Slide, layoutIndex?: number) => any) | null
  templateComponent?: any
}

const SlideRenderer: React.FC<{
  slide: Slide
  index: number
  templateLayouts?: TemplateWithData[] | null
  layoutIndices?: number[]
  buildSlideData?: ((slide: Slide, layoutIndex?: number) => any) | null
  templateComponent?: any
}> = ({ slide, index, templateLayouts, layoutIndices, buildSlideData, templateComponent: LayoutComponent }) => {
  const hasLayouts = templateLayouts && templateLayouts.length > 0 && !!buildSlideData

  const renderTemplate = () => {
    if (!hasLayouts && !(LayoutComponent && buildSlideData)) return null

    const layouts = (templateLayouts || []) as TemplateWithData[]
    let layoutIndex = hasLayouts ? index % layouts.length : 0

    if (hasLayouts && layoutIndices && typeof layoutIndices[index] === 'number') {
      const rawIndex = layoutIndices[index] as number
      const maxIndex = layouts.length - 1
      if (rawIndex >= 0 && rawIndex <= maxIndex) {
        layoutIndex = rawIndex
      }
    }

    const EffectiveLayoutComponent = hasLayouts ? layouts[layoutIndex].component : LayoutComponent
    const slideData = buildSlideData ? buildSlideData(slide, layoutIndex) : null

    if (!EffectiveLayoutComponent || !slideData) return null

    return <EffectiveLayoutComponent data={slideData} />
  }

  const templateRendered = renderTemplate()

  return (
    <div
      className="w-full h-full shadow-2xl border aspect-[16/9] overflow-hidden rounded-none"
      style={{
        backgroundColor: 'var(--background-color, #ffffff)',
        borderColor: 'var(--stroke, #E5E5E5)',
        color: 'var(--background-text, #0f172a)',
        fontFamily: 'var(--body-font-family, inherit)',
      }}
    >
      {templateRendered ? (
        templateRendered
      ) : (
        <div className="w-full h-full grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-stretch">
          {/* Image side */}
          <div className="flex items-center justify-center p-8 h-full">
            {slide.imageSrc ? (
              <div className="w-full max-w-xl h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageSrc}
                  alt={`Slide ${slide.number}`}
                  className="w-full h-full object-cover rounded-2xl shadow-sm border"
                  style={{ borderColor: 'var(--stroke, #E5E5E5)' }}
                />
              </div>
            ) : (
              <div className="text-slate-400 text-5xl font-bold opacity-30">
                {slide.number}
              </div>
            )}
          </div>
          {/* Content side */}
          <div
            className="p-10 flex flex-col justify-center"
            style={{ color: 'var(--background-text, #0f172a)' }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 leading-tight">
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
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PresentationMode: React.FC<PresentationModeProps> = ({
  slides,
  initialSlide = 0,
  onExit,
  templateLayouts,
  layoutIndices,
  buildSlideData,
  templateComponent,
}) => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else if (document.exitFullscreen) {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
        event.preventDefault()
      }
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': {
          setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev))
          break
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
          break
        }
        case 'Escape': {
          if (typeof document !== 'undefined' && !document.fullscreenElement) onExit()
          break
        }
        case 'f':
        case 'F': {
          toggleFullscreen()
          break
        }
      }
    },
    [slides.length, onExit]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900 z-[9999]" tabIndex={0}>
      {!isFullscreen && (
        <>
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:bg-white/20 rounded-md"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
            <button onClick={onExit} className="p-2 text-white hover:bg-white/20 rounded-md">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50 bg-black/50 px-4 py-2 rounded-full">
            <button
              onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))}
              disabled={currentSlide === 0}
              className="text-white disabled:opacity-30 hover:bg-white/20 p-1 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="text-white text-sm font-medium tracking-widest">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev))
              }
              disabled={currentSlide === slides.length - 1}
              className="text-white disabled:opacity-30 hover:bg-white/20 p-1 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </>
      )}

      <div
        className={`flex-1 min-h-0 flex items-center justify-center ${
          isFullscreen ? 'px-4 py-4' : 'p-12'
        }`}
      >
        <div
          className="relative transition-all duration-300"
          style={{
            aspectRatio: '16 / 9',
            width: isFullscreen
              ? 'min(100vw, calc(100vh * 16 / 9))'
              : 'min(calc(100vw - 6rem), calc((100vh - 6rem) * 16 / 9))',
            maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 6rem)',
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.number}
              className={`absolute inset-0 transition-opacity duration-300 ${
                index === currentSlide
                  ? 'opacity-100 z-10'
                  : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <SlideRenderer
                slide={slide}
                index={index}
                templateLayouts={templateLayouts}
                layoutIndices={layoutIndices}
                buildSlideData={buildSlideData}
                templateComponent={templateComponent}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PresentationMode
