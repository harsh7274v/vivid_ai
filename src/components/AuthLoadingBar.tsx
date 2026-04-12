'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/providers/ThemeProvider'
import { queryClient } from '@/providers/QueryProvider'

interface AuthLoadingBarProps {
  userEmail?: string | null
  title?: string
  isReady?: boolean
  onComplete: () => void
}

interface HistoryResponse {
  presentations: Array<{
    id: string
    title: string
    description: string | null
    createdAt: string
    slideCount: number
    design: string
    language: string
  }>
}

const STAGES = [
  { percent: 5, label: 'Authenticating…', color: '#f63a0f' },
  { percent: 25, label: 'Verifying session…', color: '#f27011' },
  { percent: 50, label: 'Loading your workspace…', color: '#f2b01e' },
  { percent: 75, label: 'Preparing dashboard…', color: '#f2d31b' },
  { percent: 100, label: 'Ready!', color: '#86e01e' },
]

export default function AuthLoadingBar({ userEmail, title, isReady, onComplete }: AuthLoadingBarProps) {
  const { theme } = useTheme()
  const [stageIndex, setStageIndex] = useState(0)
  const animationDoneRef = useRef(false)
  const dataFetchedRef = useRef(false)
  const completedRef = useRef(false)

  // Try to complete: only fires onComplete when BOTH animation + data are ready
  const tryComplete = () => {
    const dataIsReady = isReady !== undefined ? isReady : dataFetchedRef.current
    if (animationDoneRef.current && dataIsReady && !completedRef.current) {
      completedRef.current = true
      // Small delay so user sees the 100% green state
      setTimeout(onComplete, 400)
    }
  }

  // Effect to trigger completion when external isReady changes to true
  useEffect(() => {
    if (isReady) {
      tryComplete()
    }
  }, [isReady])

  // Pre-fetch dashboard data into React Query cache
  useEffect(() => {
    if (!userEmail) {
      // No email — skip prefetch, mark as done immediately
      dataFetchedRef.current = true
      return
    }

    queryClient
      .prefetchQuery({
        queryKey: ['presentations-history', userEmail],
        queryFn: async () => {
          const res = await fetch(
            `/api/presentations/history?userEmail=${encodeURIComponent(userEmail)}`
          )
          if (!res.ok) throw new Error('Failed to load presentations history')
          const json = (await res.json()) as HistoryResponse
          return json.presentations || []
        },
        staleTime: 60_000,
      })
      .then(() => {
        dataFetchedRef.current = true
        tryComplete()
      })
      .catch(() => {
        // Even if fetch fails, don't block the user — let them through
        dataFetchedRef.current = true
        tryComplete()
      })
  }, [userEmail])

  // Animate through progress stages
  useEffect(() => {
    const delays = [400, 700, 800, 600, 500]
    let timeout: NodeJS.Timeout

    const advance = (idx: number) => {
      if (idx >= STAGES.length) return
      timeout = setTimeout(() => {
        setStageIndex(idx)
        if (idx < STAGES.length - 1) {
          advance(idx + 1)
        } else {
          // Animation reached 100%
          animationDoneRef.current = true
          tryComplete()
        }
      }, delays[idx])
    }

    advance(0)

    return () => clearTimeout(timeout)
  }, [])

  const stage = STAGES[stageIndex]

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-slate-50'
          : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
      }`}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-md px-6">
        {/* Title or Logo */}
        {title ? (
          <h2
            className={`text-2xl font-semibold tracking-tight text-center mb-2 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-50'
            }`}
          >
            {title}
          </h2>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                theme === 'light' ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              <span className="font-bold text-lg">V</span>
            </div>
            <span
              className={`text-2xl font-semibold tracking-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-50'
              }`}
            >
              vivid Ai
            </span>
          </div>
        )}

        {/* Progress bar container */}
        <div className="w-full">
          <div
            className="progress-bar-track"
            style={{
              padding: '4px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '6px',
              boxShadow:
                'inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 1px rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              className="progress-bar-fill"
              style={{
                height: '16px',
                width: `${stage.percent}%`,
                backgroundColor: stage.color,
                borderRadius: '4px',
                backgroundImage:
                  'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05))',
                transition: 'width 0.4s linear, background-color 0.4s linear',
                boxShadow:
                  '0 0 1px 1px rgba(0, 0, 0, 0.25), inset 0 1px rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </div>

        {/* Stage label + percentage */}
        <div className="flex items-center justify-between w-full">
          <span
            className={`text-sm font-medium transition-all duration-300 ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            {stage.label}
          </span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: stage.color, transition: 'color 0.4s linear' }}
          >
            {stage.percent}%
          </span>
        </div>

        {/* Subtle dots */}
        <div className="flex items-center gap-2 mt-2">
          {STAGES.map((s, i) => (
            <div
              key={s.percent}
              className="rounded-full transition-all duration-300"
              style={{
                width: i <= stageIndex ? '8px' : '6px',
                height: i <= stageIndex ? '8px' : '6px',
                backgroundColor: i <= stageIndex ? s.color : theme === 'light' ? '#cbd5e1' : '#475569',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
