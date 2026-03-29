'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()

  const handleGoToApp = () => {
    router.push('/app-maker')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">vivid Ai</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={handleGoToApp}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
            >
              Log in
            </button>
            <button
              onClick={handleGoToApp}
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
              onClick={handleGoToApp}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-50 shadow-lg shadow-slate-300/40 hover:bg-black transition"
            >
              Start creating
            </button>
            <Link
              href="/app-maker"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
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
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Overview</h2>
            <p className="max-w-md text-xs md:text-sm text-slate-500">
              vivid ai is a minimalist AI presentation maker that turns a single idea
              into a polished, structured deck that works with your favorite
              templates.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                01 · Input
              </p>
              <p className="text-slate-800">Drop in a topic, brief, or raw notes.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                02 · Structure
              </p>
              <p className="text-slate-800">vivid ai organizes content into clear slide sections.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                03 · Layout
              </p>
              <p className="text-slate-800">Slides are matched to templates and ready to present.</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
              How vivid ai creates your presentation
            </h2>
            <p className="text-sm text-slate-500 mb-4 max-w-lg">
              Under the hood, vivid ai uses GPT‑5.1 powered flows to turn
              unstructured text into a clean outline, then maps each slide to
              a purpose-built layout.
            </p>
            <ol className="space-y-3 text-sm text-slate-700">
              <li>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  1
                </span>
                Understand your topic, audience, and length.
              </li>
              <li>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  2
                </span>
                Generate slide titles and concise talking points.
              </li>
              <li>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  3
                </span>
                Match each slide to a visual layout and images.
              </li>
              <li>
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-slate-50">
                  4
                </span>
                Hand back an editable deck you can refine in minutes.
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
            <p className="font-medium text-slate-900">Why this works better than a blank slide:</p>
            <p>• You start from a clean outline instead of a blinking cursor.</p>
            <p>• Each slide has one job, so stories stay sharp.</p>
            <p>• You only tweak details instead of building from scratch.</p>
          </div>
        </section>

        {/* Why you need it */}
        <section className="mt-16">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
            Why you&apos;ll actually use this
          </h2>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900 mb-1">For founders</p>
              <p className="text-slate-600">
                Turn updates, investor emails, and launch notes into decks you can
                ship the same day.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900 mb-1">For teams</p>
              <p className="text-slate-600">
                Keep internal reviews, strategy docs, and training decks consistent
                without a design bottleneck.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900 mb-1">For students</p>
              <p className="text-slate-600">
                Quickly outline talks and seminar presentations with clear, short
                bullets instead of walls of text.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Pricing</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Start free. Upgrade only when vivid ai becomes part of your daily
              workflow.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                  Starter
                </p>
                <p className="text-2xl font-semibold text-slate-900 mb-1">Free</p>
                <p className="text-slate-600 mb-3">Best for trying vivid ai on small decks.</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• Limited presentations per month</li>
                  <li>• Access to core templates</li>
                  <li>• Export-ready decks</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900 text-slate-50 p-5 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-300 mb-1">
                  Pro
                </p>
                <p className="text-2xl font-semibold mb-1">$</p>
                <p className="text-slate-200 mb-3">For people who create decks every week.</p>
                <ul className="space-y-1 text-slate-100/90">
                  <li>• Higher presentation limits</li>
                  <li>• All template families</li>
                  <li>• Priority rendering</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                  Team
                </p>
                <p className="text-2xl font-semibold text-slate-900 mb-1">Custom</p>
                <p className="text-slate-600 mb-3">For teams that want shared standards.</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• Shared templates & styles</li>
                  <li>• Centralized billing</li>
                  <li>• Early access to new layouts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

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
