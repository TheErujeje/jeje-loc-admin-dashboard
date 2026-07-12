'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason, ACTIVE_STATUSES } from '@/lib/season'
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
        <div className="max-w-6xl mx-auto space-y-6">
          <SeasonBar />
          {children}
        </div>
      </main>
    </div>
  )
}

function SeasonBar() {
  const { seasons, seasonId, setSeasonId, loading, error } = useSeason()

  if (loading || error || seasons.length === 0) return null

  return (
    <div className="flex justify-end">
      <select
        value={seasonId}
        onChange={(e) => setSeasonId(e.target.value)}
        className="bg-stadium-800 border border-stadium-700 rounded-sm px-4 py-2 text-sm font-heading tracking-wide"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label} {ACTIVE_STATUSES.includes(s.status) ? '(active)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
