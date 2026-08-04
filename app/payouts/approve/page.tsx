'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { approvePayoutByToken, previewPayoutApproval } from '@/lib/api'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`
}

/**
 * This is the page an admin lands on after clicking the "Approve payout"
 * link in the email — no admin login required, the token in the URL is the
 * credential (validated server-side: unused + not expired). Loading this
 * page only *previews* the payout — it takes no action, so an email
 * security scanner prefetching the link can't burn the token. The transfer
 * only fires once the admin explicitly clicks "Confirm & Approve".
 */
export default function ApprovePayoutPage() {
  const params = useSearchParams()
  const token = params.get('token')

  const [state, setState] = useState<'loading' | 'preview' | 'confirming' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<{
    recipient_name: string | null
    label: string | null
    amount_kobo: number
    event_id: number | null
  } | null>(null)

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Missing approval token.')
      return
    }
    previewPayoutApproval(token)
      .then((res) => {
        setPreview(res)
        setState('preview')
      })
      .catch((err) => {
        setState('error')
        setMessage(err instanceof Error ? err.message : 'Could not load this payout.')
      })
  }, [token])

  const handleConfirm = async () => {
    if (!token) return
    setState('confirming')
    try {
      const res = await approvePayoutByToken(token)
      setState('success')
      setMessage(res.message)
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Could not approve this payout.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-white dark:bg-ink-900">
      {state === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 text-brand-purple animate-spin mb-4" />
          <p className="text-ink-500">Loading payout details…</p>
        </>
      )}
      {state === 'preview' && preview && (
        <div className="w-full max-w-sm rounded-card border border-hairline shadow-sm p-6">
          <h1 className="text-xl font-semibold text-ink-900 mb-4">Approve this payout?</h1>
          <div className="text-left space-y-2 text-sm mb-6">
            <p><span className="text-ink-500">Recipient:</span> <span className="font-medium text-ink-900">{preview.recipient_name || '—'}</span></p>
            <p><span className="text-ink-500">Prize:</span> <span className="font-medium text-ink-900">{preview.label || '—'}</span></p>
            <p><span className="text-ink-500">Amount:</span> <span className="font-medium text-ink-900">{formatNaira(preview.amount_kobo)}</span></p>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full bg-brand-purple hover:opacity-90 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Confirm &amp; Approve
          </button>
        </div>
      )}
      {state === 'confirming' && (
        <>
          <Loader2 className="h-12 w-12 text-brand-purple animate-spin mb-4" />
          <p className="text-ink-500">Approving payout and initiating transfer…</p>
        </>
      )}
      {state === 'success' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-status-success mb-4" />
          <h1 className="text-2xl font-semibold text-ink-900 tracking-tight mb-2">Payout approved</h1>
          <p className="text-ink-500">{message}</p>
        </>
      )}
      {state === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-status-danger mb-4" />
          <h1 className="text-2xl font-semibold text-ink-900 tracking-tight mb-2">Could not approve</h1>
          <p className="text-ink-500">{message}</p>
        </>
      )}
    </div>
  )
}
