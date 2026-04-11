'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'

type AuthMode = 'login' | 'signup'

const hasValidSession = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const stored = window.localStorage.getItem('vivid_auth_session')
    if (!stored) return false
    const parsed = JSON.parse(stored) as { token?: string; expiresAt?: number }
    if (!parsed.token || typeof parsed.expiresAt !== 'number') return false
    if (parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem('vivid_auth_session')
      return false
    }
    return true
  } catch {
    return false
  }
}

export default function Home() {
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const textRevealProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut' as const },
    viewport: { once: false, amount: 0.4 },
  }

  useEffect(() => {
    if (hasValidSession()) {
      setIsAuthenticated(true)
    }
  }, [])

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthError(null)
    // If user already has a valid JWT session, go straight to the app
    if (hasValidSession()) {
      router.push('/app-maker')
      return
    }
    setShowAuthModal(true)
  }

  const handleGoogleAuth = async () => {
    setAuthError(null)
    setAuthLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      const user = result.user
      if (user) {
        const idToken = await user.getIdToken()
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000

        const sessionPayload = {
          token: idToken,
          expiresAt,
          email: user.email || null,
          uid: user.uid,
        }

        try {
          window.localStorage.setItem('vivid_auth_session', JSON.stringify(sessionPayload))
        } catch {
          // If localStorage is unavailable, just skip persisting; Firebase still holds the session.
        }
        setIsAuthenticated(true)
      }
      setShowAuthModal(false)
      router.push('/app-maker')
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthError(error?.message || 'Failed to authenticate with Google')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">vivid Ai</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => openAuth('login')}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
            >
              Log in
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="px-4 py-1.5 rounded-full bg-slate-900 text-slate-50 font-medium hover:bg-black transition"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 pt-16 pb-24">
        <div className="flex flex-col gap-12 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Minimal, fast, slide-perfect
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight"
          >
            AI-crafted presentations
            <br />
            with almost no clicks.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-xl text-sm md:text-base text-slate-500"
          >
            vivid ai turns a single idea into a clean, structured slide deck.
            No clutter, no design busywork—just minimal slides that look good anywhere.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="flex flex-wrap items-center gap-3"
          >
            <button
              onClick={() => openAuth('signup')}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-50 shadow-lg shadow-slate-300/40 hover:bg-black transition"
            >
              Start creating
            </button>
            <Link href="/app-maker" className="text-sm text-slate-600 hover:text-slate-900">
              Watch it build a deck →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex flex-wrap gap-4 text-[11px] text-slate-500"
          >
            <span>• Slide structure in seconds</span>
            <span>• Smart tone & length controls</span>
            <span>• Ready for any template</span>
          </motion.div>
          </div>

          {/* Right side: subtle preview card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-10 md:mt-0 flex-1 flex justify-end"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.15)]">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span>Preview</span>
                <span>vivid ai · deck outline</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="rounded-lg bg-slate-900 px-3 py-2">
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-300">
                    Slide 1
                  </div>
                  <div className="text-slate-50 text-sm font-medium">
                    Why minimal slides convert better
                  </div>
                </div>
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                  • Focus attention on one message at a time
                </div>
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                  • Reduce cognitive load with simple layouts
                </div>
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                  • Make every slide feel intentional
                </div>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Slides ready in under 30 seconds</span>
                  <span>▲ Smart structure</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Overview section */}
        <section className="mt-20 border-t border-slate-200 pt-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <motion.h2
              className="text-xl md:text-2xl font-semibold tracking-tight"
              {...textRevealProps}
            >
              Overview
            </motion.h2>
            <motion.p
              className="max-w-md text-xs md:text-sm text-slate-500"
              {...textRevealProps}
            >
              vivid ai is a minimalist AI presentation maker that turns a single idea
              into a polished, structured deck that works with your favorite
              templates.
            </motion.p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <motion.p
                className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1"
                {...textRevealProps}
              >
                01 · Input
              </motion.p>
              <motion.p className="text-slate-800" {...textRevealProps}>
                Drop in a topic, brief, or raw notes.
              </motion.p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <motion.p
                className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1"
                {...textRevealProps}
              >
                02 · Structure
              </motion.p>
              <motion.p className="text-slate-800" {...textRevealProps}>
                vivid ai organizes content into clear slide sections.
              </motion.p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <motion.p
                className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1"
                {...textRevealProps}
              >
                03 · Layout
              </motion.p>
              <motion.p className="text-slate-800" {...textRevealProps}>
                Slides are matched to templates and ready to present.
              </motion.p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
          <div>
            <motion.h2
              className="text-xl md:text-2xl font-semibold tracking-tight mb-3"
              {...textRevealProps}
            >
              How vivid ai creates your presentation
            </motion.h2>
            <motion.p
              className="text-sm text-slate-500 mb-4 max-w-lg"
              {...textRevealProps}
            >
              Under the hood, vivid ai uses GPT‑5.1 powered flows to turn
              unstructured text into a clean outline, then maps each slide to
              a purpose-built layout.
            </motion.p>
            <ol className="space-y-3 text-sm text-slate-700">
              <motion.li {...textRevealProps}>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  1
                </span>
                Understand your topic, audience, and length.
              </motion.li>
              <motion.li {...textRevealProps}>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  2
                </span>
                Generate slide titles and concise talking points.
              </motion.li>
              <motion.li {...textRevealProps}>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  3
                </span>
                Match each slide to a visual layout and images.
              </motion.li>
              <motion.li {...textRevealProps}>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  4
                </span>
                Hand back an editable deck you can refine in minutes.
              </motion.li>
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
            <motion.p className="font-medium text-slate-900" {...textRevealProps}>
              Why this works better than a blank slide:
            </motion.p>
            <motion.p {...textRevealProps}>
              • You start from a clean outline instead of a blinking cursor.
            </motion.p>
            <motion.p {...textRevealProps}>
              • Each slide has one job, so stories stay sharp.
            </motion.p>
            <motion.p {...textRevealProps}>
              • You only tweak details instead of building from scratch.
            </motion.p>
          </div>
        </section>

        {/* Why you need it */}
        <section className="mt-16">
          <motion.h2
            className="text-xl md:text-2xl font-semibold tracking-tight mb-4"
            {...textRevealProps}
          >
            Why you&apos;ll actually use this
          </motion.h2>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <motion.p className="font-medium text-slate-900 mb-1" {...textRevealProps}>
                For founders
              </motion.p>
              <motion.p className="text-slate-600" {...textRevealProps}>
                Turn updates, investor emails, and launch notes into decks you can
                ship the same day.
              </motion.p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <motion.p className="font-medium text-slate-900 mb-1" {...textRevealProps}>
                For teams
              </motion.p>
              <motion.p className="text-slate-600" {...textRevealProps}>
                Keep internal reviews, strategy docs, and training decks consistent
                without a design bottleneck.
              </motion.p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <motion.p className="font-medium text-slate-900 mb-1" {...textRevealProps}>
                For students
              </motion.p>
              <motion.p className="text-slate-600" {...textRevealProps}>
                Quickly outline talks and seminar presentations with clear, short
                bullets instead of walls of text.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <motion.h2
              className="text-xl md:text-2xl font-semibold tracking-tight"
              {...textRevealProps}
            >
              Pricing
            </motion.h2>
            <motion.p
              className="text-xs md:text-sm text-slate-500"
              {...textRevealProps}
            >
              Start free. Upgrade only when vivid ai becomes part of your daily
              workflow.
            </motion.p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <motion.p
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1"
                  {...textRevealProps}
                >
                  Starter
                </motion.p>
                <motion.p
                  className="text-2xl font-semibold text-slate-900 mb-1"
                  {...textRevealProps}
                >
                  Free
                </motion.p>
                <motion.p className="text-slate-600 mb-3" {...textRevealProps}>
                  Best for trying vivid ai on small decks.
                </motion.p>
                <ul className="space-y-1 text-slate-600">
                  <motion.li {...textRevealProps}>• Limited presentations per month</motion.li>
                  <motion.li {...textRevealProps}>• Access to core templates</motion.li>
                  <motion.li {...textRevealProps}>• Export-ready decks</motion.li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900 text-slate-50 p-5 flex flex-col justify-between">
              <div>
                <motion.p
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-300 mb-1"
                  {...textRevealProps}
                >
                  Pro
                </motion.p>
                <motion.p className="text-2xl font-semibold mb-1" {...textRevealProps}>
                  $
                </motion.p>
                <motion.p className="text-slate-200 mb-3" {...textRevealProps}>
                  For people who create decks every week.
                </motion.p>
                <ul className="space-y-1 text-slate-100/90">
                  <motion.li {...textRevealProps}>• Higher presentation limits</motion.li>
                  <motion.li {...textRevealProps}>• All template families</motion.li>
                  <motion.li {...textRevealProps}>• Priority rendering</motion.li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <motion.p
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1"
                  {...textRevealProps}
                >
                  Team
                </motion.p>
                <motion.p
                  className="text-2xl font-semibold text-slate-900 mb-1"
                  {...textRevealProps}
                >
                  Custom
                </motion.p>
                <motion.p className="text-slate-600 mb-3" {...textRevealProps}>
                  For teams that want shared standards.
                </motion.p>
                <ul className="space-y-1 text-slate-600">
                  <motion.li {...textRevealProps}>• Shared templates & styles</motion.li>
                  <motion.li {...textRevealProps}>• Centralized billing</motion.li>
                  <motion.li {...textRevealProps}>• Early access to new layouts</motion.li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-center text-xl font-semibold text-slate-900">
              {authMode === 'login' ? 'Sign in to vivid ai' : 'Create your vivid ai account'}
            </h2>
            <p className="mb-5 text-center text-xs text-slate-500">
              Continue with Google to access the deck builder.
            </p>

            {authError && <p className="mb-3 text-center text-xs text-red-500">{authError}</p>}

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {authLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="mt-1 w-full rounded-full px-4 py-2 text-xs text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} vivid ai. Built for fast, minimal decks.</p>
          <div className="flex flex-wrap gap-4" />
        </div>
      </footer>
    </div>
  )
}
