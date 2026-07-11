'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck className="h-10 w-10 text-pitch-green mb-3" />
          <h1 className="font-heading font-bold text-2xl tracking-wider">LOC ADMIN</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-stadium-800 border border-stadium-700 rounded-sm p-8 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-heading tracking-wide text-gray-300">EMAIL</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-pitch-green"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-heading tracking-wide text-gray-300">PASSWORD</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-pitch-green"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-pitch-green text-stadium-900 font-heading font-bold py-3 rounded-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'LOG IN'}
          </button>
        </form>
      </div>
    </div>
  )
}
