'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Sidebar } from './Sidebar'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !token) router.replace('/login')
  }, [loading, token, router])

  if (loading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-pitch-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  )
}
