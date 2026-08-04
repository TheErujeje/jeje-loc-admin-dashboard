'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason, ACTIVE_STATUSES } from '@/lib/season'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { Select } from './ui/Select'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !token) router.replace('/login')
  }, [loading, token, router])

  if (loading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-brand-purple animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-purple" />
            <span className="font-semibold text-ink-900 tracking-tight">LOC Admin</span>
          </div>
          <button onClick={logout} aria-label="Log out" className="text-ink-500 hover:text-status-danger">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 pb-24 sm:py-10 lg:pb-10">
          <div className="max-w-6xl mx-auto space-y-6">
            <SeasonBar />
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}

function SeasonBar() {
  const { seasons, seasonId, setSeasonId, loading, error } = useSeason()

  if (loading || error || seasons.length === 0) return null

  return (
    <div className="flex justify-end">
      <Select
        value={seasonId}
        onChange={(e) => setSeasonId(e.target.value)}
        className="bg-white border border-hairline rounded-lg pl-4 py-2 text-sm font-medium text-ink-900 shadow-sm focus:outline-none focus:border-brand-purple"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label} {ACTIVE_STATUSES.includes(s.status) ? '(active)' : ''}
          </option>
        ))}
      </Select>
    </div>
  )
}
