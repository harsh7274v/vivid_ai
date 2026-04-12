'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, LogOut, ChevronDown } from 'lucide-react'
import { templates } from '@/app/presentation-templates'
import type {
  TemplateLayoutsWithSettings,
  TemplateWithData,
} from '@/app/presentation-templates/utils'
import { usePresentationStore } from '@/store/presentationStore'
import { useTheme } from '@/providers/ThemeProvider'
import AuthLoadingBar from '@/components/AuthLoadingBar'

interface PresentationSummary {
  id: string
  title: string
  description: string | null
  createdAt: string
  slideCount: number
  design: string
  language: string
}

interface HistoryResponse {
  presentations: PresentationSummary[]
}

interface ActivityItem {
  id: string
  type: 'created' | 'updated' | 'exported'
  title: string
  timestamp: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'templates' | 'presentations'>('overview')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [showLoadingBar, setShowLoadingBar] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const selectedTemplateId = usePresentationStore((state) => state.selectedTemplateId)
  const setSelectedTemplateId = usePresentationStore(
    (state) => state.setSelectedTemplateId
  )
  const queryClient = useQueryClient()

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this presentation?')) return
    
    try {
      const res = await fetch(`/api/presentations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      
      await queryClient.invalidateQueries({ queryKey: ['presentations-history'] })
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete presentation')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('vivid_auth_session')
      if (!stored) {
        router.replace('/')
        return
      }
      const parsed = JSON.parse(stored) as {
        token?: string
        expiresAt?: number
        email?: string | null
      }
      if (!parsed.token || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) {
        window.localStorage.removeItem('vivid_auth_session')
        router.replace('/')
        return
      }
      setUserEmail(parsed.email || null)
      if (parsed.email) {
        const nameFromEmail = parsed.email.split('@')[0]
        setUserName(nameFromEmail)
      }
    } catch {
      router.replace('/')
    }
  }, [router])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem('vivid_auth_session')
    setProfileDropdownOpen(false)
    router.replace('/')
  }, [router])

  const { data, isLoading } = useQuery<PresentationSummary[]>({
    queryKey: ['presentations-history', userEmail],
    queryFn: async () => {
      if (!userEmail) return []
      const res = await fetch(
        `/api/presentations/history?userEmail=${encodeURIComponent(userEmail)}`
      )
      if (!res.ok) {
        throw new Error('Failed to load presentations history')
      }
      const json = (await res.json()) as HistoryResponse
      return json.presentations || []
    },
    enabled: !!userEmail,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  const presentations = data || []

  const totalPresentations = presentations.length
  const totalSlides = presentations.reduce((acc, p) => acc + (p.slideCount || 0), 0)

  const recentActivity: ActivityItem[] = useMemo(
    () =>
      presentations.slice(0, 6).map((p, index) => ({
        id: `${p.id}-${index}`,
        type: index === 0 ? 'created' : 'updated',
        title: p.title,
        timestamp: p.createdAt,
      })),
    [presentations]
  )

  const activeJobsCount = 0

  const creditsUsed = totalSlides
  const creditsTotal = 200
  const creditsRemaining = Math.max(creditsTotal - creditsUsed, 0)
  const creditsProgress = Math.min((creditsUsed / creditsTotal) * 100, 100)

  const emptyState = !isLoading && presentations.length === 0

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  const totalStaticLayouts = templates.reduce(
    (acc: number, g: TemplateLayoutsWithSettings) => acc + g.layouts.length,
    0
  )

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-slate-50 text-slate-900'
          : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-slate-50'
      }`}
    >
      {/* Top navbar */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-0">
        <header
          className={`h-14 flex items-center px-4 gap-3 rounded-2xl shadow-sm border ${
            theme === 'light'
              ? 'bg-white border-slate-200'
              : 'bg-gradient-to-r from-black via-neutral-900 to-neutral-800 border-neutral-700'
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
              <span className="text-[11px] text-slate-500 -mt-0.5">Dashboard</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 text-xs">
            <div
              className={`hidden md:flex items-center gap-2 rounded-full border px-2 py-1 ${
                theme === 'light'
                  ? 'border-slate-200 bg-slate-50 text-slate-500'
                  : 'border-neutral-700 bg-gradient-to-r from-black via-neutral-900 to-neutral-800 text-slate-200'
              }`}
            >
              <span className="text-[11px]">Credits</span>
              <span className="font-medium text-[11px]">
                {creditsRemaining}/{creditsTotal}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`flex items-center justify-center rounded-full border px-2 py-1 ${
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

            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full border px-2 py-1 transition-colors ${
                  theme === 'light'
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-neutral-700 bg-gradient-to-r from-black via-neutral-900 to-neutral-800 hover:border-neutral-500'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    theme === 'light'
                      ? 'bg-slate-900 text-slate-50'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-[11px] font-medium">
                    {userName || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-500">Free plan</span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  } ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}
                />
              </button>

              {/* Profile dropdown */}
              {profileDropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 shadow-slate-200/60'
                      : 'bg-neutral-900 border-neutral-700 shadow-black/60'
                  }`}
                >
                  {/* User info header */}
                  <div
                    className={`px-4 py-3 border-b ${
                      theme === 'light' ? 'border-slate-100' : 'border-neutral-800'
                    }`}
                  >
                    <p className="text-xs font-medium truncate">
                      {userName || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {userEmail || ''}
                    </p>
                    <span
                      className={`inline-flex items-center mt-1.5 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                        theme === 'light'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      Free plan
                    </span>
                  </div>

                  {/* Logout button */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        theme === 'light'
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-rose-400 hover:bg-rose-500/10'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Quick actions + profile/usage summary */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className={`lg:col-span-2 rounded-2xl border p-5 ${
              theme === 'light'
                ? 'border-slate-200 bg-white shadow-sm'
                : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800 shadow-[0_18px_60px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-base font-semibold tracking-tight">Welcome back</h1>
                <p
                  className={`text-xs mt-1 ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Control center for everything you create with vivid ai.
                </p>
              </div>
              <button
                type="button"
                className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
                  theme === 'light'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                }`}
              >
                Free Trial
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowLoadingBar(true)}
                className={`rounded-full px-4 py-2 text-xs font-medium shadow-sm transition ${
                  theme === 'light'
                    ? 'bg-slate-900 text-slate-50 hover:bg-black'
                    : 'bg-slate-100 text-slate-900 hover:bg-white'
                }`}
              >
                Generate new presentation
              </button>
              <button
                type="button"
                onClick={() => setActiveView('templates')}
                className={`rounded-full px-4 py-2 text-xs font-medium border transition ${
                  theme === 'light'
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'border-slate-700 text-slate-100 hover:bg-slate-900'
                }`}
              >
                Browse templates
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-medium border border-dashed ${
                  theme === 'light'
                    ? 'border-slate-300 text-slate-500 hover:bg-slate-50'
                    : 'border-slate-700 text-slate-400 hover:bg-slate-900'
                }`}
              >
                Use last topic
              </button>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 flex flex-col justify-between ${
              theme === 'light'
                ? 'border-slate-200 bg-white shadow-sm'
                : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800 shadow-[0_18px_60px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium">Usage</span>
              <span className="text-[10px] text-slate-500">Free Trial</span>
            </div>
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px]">
                <span>Credits used</span>
                <span>
                  {creditsUsed}/{creditsTotal}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500"
                  style={{ width: `${creditsProgress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Presentations</span>
              <span className="font-medium">{totalPresentations}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-500">Slides generated</span>
              <span className="font-medium">{totalSlides}</span>
            </div>
          </div>
        </section>
        {activeView === 'overview' ? (
          <>
            {/* Recent presentations */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-tight">Recent presentations</h2>
                <button
                  type="button"
                  onClick={() => setActiveView('presentations')}
                  className={`text-[11px] underline-offset-4 hover:underline ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  View all
                </button>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white'
                    : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                }`}
              >
                {isLoading ? (
                  <div className="text-xs text-slate-500">Loading your presentations…</div>
                ) : emptyState ? (
                  <div className="flex flex-col items-start gap-2 text-xs text-slate-500">
                    <span>No presentations yet.</span>
                    <button
                      type="button"
                      onClick={() => setShowLoadingBar(true)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-medium shadow-sm ${
                        theme === 'light'
                          ? 'bg-slate-900 text-slate-50 hover:bg-black'
                          : 'bg-slate-100 text-slate-900 hover:bg-white'
                      }`}
                    >
                      Generate your first one
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {presentations.slice(0, 6).map((p) => (
                      <div
                        key={p.id}
                        className={`group rounded-xl border p-3 flex flex-col justify-between ${
                          theme === 'light'
                            ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                            : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        <div className="mb-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-medium truncate">{p.title}</h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                                theme === 'light'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-emerald-500/10 text-emerald-300'
                              }`}
                            >
                              Completed
                            </span>
                          </div>
                          <p
                            className={`text-[11px] line-clamp-2 ${
                              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            {p.description || 'AI generated presentation'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>
                            {p.slideCount} slides · {p.language}
                          </span>
                          <span>{formatDate(p.createdAt)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/results?presentationId=${encodeURIComponent(p.id)}`
                              )
                            }
                            className={`rounded-full px-2.5 py-1 font-medium ${
                              theme === 'light'
                                ? 'bg-slate-900 text-slate-50'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(p.id, e)}
                            className="rounded-full px-2.5 py-1 text-rose-500 hover:text-rose-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* AI jobs + analytics + activity */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AI Job Status */}
              <div
                className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white'
                    : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">AI job status</span>
                  <span className="text-[10px] text-slate-500">Live</span>
                </div>
                {activeJobsCount === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    No active generations. Start a new presentation to see progress here.
                  </p>
                ) : (
                  <div className="space-y-2 text-[11px]">
                    {/* Placeholder for future active job list */}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowLoadingBar(true)}
                  className={`mt-auto w-full rounded-full px-3 py-1.5 text-[11px] font-medium shadow-sm ${
                    theme === 'light'
                      ? 'bg-slate-900 text-slate-50 hover:bg-black'
                      : 'bg-slate-100 text-slate-900 hover:bg-white'
                  }`}
                >
                  Start new generation
                </button>
              </div>

              {/* Usage analytics */}
              <div
                className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white'
                    : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Usage analytics</span>
                  <span className="text-[10px] text-slate-500">Overview</span>
                </div>
                <div className="flex gap-3 text-[11px]">
                  <div
                    className={`flex-1 rounded-xl border px-3 py-2 ${
                      theme === 'light'
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                    }`}
                  >
                    <span className="block text-slate-500">Presentations</span>
                    <span className="block text-sm font-semibold">{totalPresentations}</span>
                  </div>
                  <div
                    className={`flex-1 rounded-xl border px-3 py-2 ${
                      theme === 'light'
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                    }`}
                  >
                    <span className="block text-slate-500">Slides</span>
                    <span className="block text-sm font-semibold">{totalSlides}</span>
                  </div>
                </div>
                <div className="mt-2 h-16 w-full rounded-xl bg-gradient-to-r from-slate-900/10 via-slate-500/10 to-slate-300/10 dark:from-slate-100/10 dark:via-slate-500/15 dark:to-slate-700/20" />
              </div>

              {/* Activity feed */}
              <div
                className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white'
                    : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Recent activity</span>
                  <span className="text-[10px] text-slate-500">Last updates</span>
                </div>
                {recentActivity.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No activity yet.</p>
                ) : (
                  <ul className="space-y-2 text-[11px]">
                    {recentActivity.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {item.type === 'created'
                              ? `Presentation created`
                              : item.type === 'exported'
                              ? `Presentation exported`
                              : `Slides updated`}
                          </span>
                          <span className="text-slate-500">{item.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(item.timestamp)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Drafts & templates */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drafts */}
              <div
                className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white'
                    : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Drafts</span>
                  <span className="text-[10px] text-slate-500">Coming soon</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Save unfinished decks here and pick them up later.
                </p>
              </div>

              {/* Templates */}
              <div
                className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white'
                    : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Templates</span>
                  <span className="text-[10px] text-slate-500">High value</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 border ${
                      theme === 'light'
                        ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'border-slate-700 text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Startup pitch
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 border ${
                      theme === 'light'
                        ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'border-slate-700 text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Education deck
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 border ${
                      theme === 'light'
                        ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'border-slate-700 text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Investor update
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : activeView === 'templates' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-sm font-medium tracking-tight ${
                    theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                  }`}
                >
                  Templates
                </h2>
                <p
                  className={`text-[11px] mt-1 ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-100'
                  }`}
                >
                  Pick a starting point and jump straight into the builder.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className={`rounded-full px-3 py-1.5 text-[11px] border ${
                  theme === 'light'
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'border-slate-700 text-slate-100 hover:bg-slate-900'
                }`}
              >
                Back to dashboard
              </button>
            </div>
            <div
              className={`rounded-2xl border p-4 ${
                theme === 'light'
                  ? 'border-slate-200 bg-white'
                  : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
              }`}
            >
              <div
                className={`rounded-lg p-6 md:p-8 ${
                  theme === 'light'
                    ? 'bg-white shadow-sm border border-slate-200'
                    : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 border border-neutral-700 shadow-[0_18px_60px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="text-center mb-6 md:mb-8">
                  <h3
                    className={`text-base md:text-lg font-semibold ${
                      theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                    }`}
                  >
                    All templates
                  </h3>
                  <p
                    className={`text-[11px] md:text-xs mt-1 ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-100'
                    }`}
                  >
                    {totalStaticLayouts} layouts across {templates.length} templates
                  </p>
                </div>
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                    {templates.map((template: TemplateLayoutsWithSettings) => {
                      const previewLayouts = template.layouts.slice(0, 4)

                      return (
                        <div
                          key={template.id}
                          className={`border rounded-lg cursor-pointer transition-all duration-200 group overflow-hidden ${
                            selectedTemplateId === template.id
                              ? theme === 'light'
                                ? 'bg-white border-slate-900 ring-2 ring-slate-300 shadow-lg'
                                : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 border-neutral-400 ring-2 ring-neutral-600/80 shadow-[0_18px_60px_rgba(0,0,0,1)]'
                              : theme === 'light'
                              ? 'bg-white border-slate-200 hover:shadow-md'
                              : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 border-neutral-800 hover:shadow-md'
                          }`}
                          onClick={() => {
                            setSelectedTemplateId(template.id)
                          }}
                        >
                          <div className="p-4 md:p-5">
                            <div className="flex items-center justify-between mb-2">
                              <h4
                                className={`text-sm md:text-base font-semibold capitalize truncate pr-2 ${
                                  theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                                }`}
                              >
                                {template.name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-200">
                                  {template.layouts.length}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/all-templates/${template.id}`)
                                  }}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                                  aria-label="Preview template"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-300 mb-3 line-clamp-2 h-8">
                              {template.description}
                            </p>

                            <div className="grid grid-cols-2 gap-1.5">
                              {previewLayouts.map((layout: TemplateWithData, index: number) => {
                                const LayoutComponent = layout.component

                                return (
                                  <div
                                    key={`${template.id}-preview-${index}`}
                                    className="relative overflow-hidden aspect-video rounded border bg-slate-100 border-slate-200 dark:bg-neutral-900 dark:border-neutral-700"
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
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium tracking-tight">All presentations</h2>
                <p
                  className={`text-[11px] mt-1 ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Browse every deck you&apos;ve generated with vivid ai.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className={`rounded-full px-3 py-1.5 text-[11px] border ${
                  theme === 'light'
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'border-slate-700 text-slate-100 hover:bg-slate-900'
                }`}
              >
                Back to dashboard
              </button>
            </div>
            <div
              className={`rounded-2xl border p-4 ${
                theme === 'light'
                  ? 'border-slate-200 bg-white'
                  : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
              }`}
            >
              {isLoading ? (
                <div className="text-xs text-slate-500">Loading your presentations…</div>
              ) : presentations.length === 0 ? (
                <div className="flex flex-col items-start gap-2 text-xs text-slate-500">
                  <span>No presentations yet.</span>
                  <button
                    type="button"
                    onClick={() => setShowLoadingBar(true)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium shadow-sm ${
                      theme === 'light'
                        ? 'bg-slate-900 text-slate-50 hover:bg-black'
                        : 'bg-slate-100 text-slate-900 hover:bg-white'
                    }`}
                  >
                    Generate your first one
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {presentations.map((p) => (
                    <div
                      key={p.id}
                      className={`group rounded-xl border p-3 flex flex-col justify-between ${
                        theme === 'light'
                          ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                          : 'border-neutral-800 bg-gradient-to-b from-black via-neutral-900 to-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-medium truncate">{p.title}</h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                              theme === 'light'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-emerald-500/10 text-emerald-300'
                            }`}
                          >
                            Completed
                          </span>
                        </div>
                        <p
                          className={`text-[11px] line-clamp-2 ${
                            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {p.description || 'AI generated presentation'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          {p.slideCount} slides · {p.language}
                        </span>
                        <span>{formatDate(p.createdAt)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => router.push(`/results?presentationId=${encodeURIComponent(p.id)}`)}
                          className={`rounded-full px-2.5 py-1 font-medium ${
                            theme === 'light'
                              ? 'bg-slate-900 text-slate-50'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(p.id, e)}
                          className="rounded-full px-2.5 py-1 text-rose-500 hover:text-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {showLoadingBar && (
        <AuthLoadingBar 
          userEmail={null} 
          onComplete={() => router.push('/app-maker')} 
        />
      )}
    </div>
  )
}
