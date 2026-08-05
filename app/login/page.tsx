'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, ArrowRight, Wallet, Swords, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth'

const BULLETS = [
  { icon: Wallet, title: 'Payout approvals', sub: 'Review, approve, retry, or settle manually.' },
  { icon: Swords, title: 'Challenge arbitration', sub: 'Confirm winners or refund stakes with confidence.' },
  { icon: Users, title: 'Manager oversight', sub: 'See every registered manager and their status.' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      router.push('/payouts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Desktop brand panel */}
      <aside className="auth-brand relative hidden flex-col overflow-hidden p-10 lg:flex xl:p-12">
        <div className="auth-brand-mesh" aria-hidden="true" />
        <div className="auth-brand-grid" aria-hidden="true" />

        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-white" />
            <span className="font-semibold text-white tracking-tight">LOC Admin</span>
          </span>
          <span className="text-[12.5px] font-medium text-white/70">Welcome back.</span>
        </div>

        <div className="relative flex flex-1 flex-col justify-center">
          <h2 className="max-w-[15ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-white xl:text-[40px]">
            Every season, fully under control.
          </h2>
          <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-white/70">
            Approve payouts, arbitrate challenges, and keep the league running — all from one dashboard.
          </p>
          <ul className="mt-9 space-y-4">
            {BULLETS.map((b) => {
              const Icon = b.icon
              return (
                <li key={b.title} className="flex items-start gap-3.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-white/12 text-white backdrop-blur">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium text-white">{b.title}</span>
                    <span className="mt-0.5 block text-[12.5px] text-white/60">{b.sub}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex min-h-screen flex-col bg-white">
        {/* Mobile brand strip */}
        <div className="auth-strip relative flex items-center justify-between overflow-hidden px-5 py-4 lg:hidden">
          <div className="auth-strip-mesh" aria-hidden="true" />
          <span className="relative flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-white" />
            <span className="font-semibold text-white tracking-tight">LOC Admin</span>
          </span>
          <span className="relative text-[11.5px] font-medium text-white/70">Welcome back.</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-6">
              <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900 sm:text-[27px]">
                Sign in
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink-700">Email</span>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-hairline bg-ink-100 px-3.5 text-[13.5px] text-ink-900 transition-colors placeholder:text-ink-400 focus:bg-white focus:outline-none focus:border-brand-purple"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink-700">Password</span>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-hairline bg-ink-100 px-3.5 text-[13.5px] text-ink-900 transition-colors placeholder:text-ink-400 focus:bg-white focus:outline-none focus:border-brand-purple"
                />
              </label>

              {error && <p className="text-status-danger text-sm">{error}</p>}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-brand-purple text-white font-medium text-[13.5px] hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      Sign in
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <footer className="px-6 py-4 text-center text-[11.5px] text-ink-400">
          © {new Date().getFullYear()} Jeje&apos;s <span className="font-semibold">League of Champions</span>
        </footer>
      </main>
    </div>
  )
}
