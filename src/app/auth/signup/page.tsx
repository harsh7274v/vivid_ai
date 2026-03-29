'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/app-maker')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <p className="text-white text-sm">Redirecting to the app maker...</p>
    </div>
  )
}
