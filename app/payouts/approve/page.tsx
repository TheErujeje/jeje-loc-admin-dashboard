'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { approvePayoutByToken } from '@/lib/api'

/**
 * This is the page an admin lands on after clicking the "Approve payout"
 * link in the email — no admin login required, the token in the URL is the
 * credential (validated server-side: unused + not expired). Approving here
 * immediately fires the Paystack transfer.
 */
export default function ApprovePayoutPage() {
  const params = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Missing approval token.')
      return
    }
    approvePayoutByToken(token)
      .then((res) => {
        setState('success')
        setMessage(res.message)
      })
      .catch((err) => {
        setState('error')
        setMessage(err instanceof Error ? err.message : 'Could not approve this payout.')
      })
  }, [token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {state === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 text-pitch-green animate-spin mb-4" />
          <p className="text-gray-400">Approving payout and initiating transfer…</p>
        </>
      )}
      {state === 'success' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-pitch-green mb-4" />
          <h1 className="text-2xl font-heading font-bold mb-2">Payout approved</h1>
          <p className="text-gray-400">{message}</p>
        </>
      )}
      {state === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-red-400 mb-4" />
          <h1 className="text-2xl font-heading font-bold mb-2">Could not approve</h1>
          <p className="text-gray-400">{message}</p>
        </>
      )}
    </div>
  )
}
