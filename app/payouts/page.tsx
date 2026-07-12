'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchPayouts, fetchCurrentSeason, triggerSyncAndCalculate, type Payout } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const STATUS_COLORS: Record<string, string> = {
  calculated: 'text-gray-400',
  pending_approval: 'text-floodlight-gold',
  approved: 'text-electric-cyan',
  processing: 'text-electric-cyan',
  paid: 'text-pitch-green',
  failed: 'text-red-400',
  cancelled: 'text-gray-500',
}

export default function PayoutsPage() {
  const { token } = useAuth()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = () => {
    if (!token) return
    fetchPayouts(token)
      .then(setPayouts)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load payouts'))
  }

  useEffect(load, [token])

  const handleSync = async () => {
    if (!token) return
    setBusy(true)
    setMessage(null)
    try {
      const season = await fetchCurrentSeason()
      const result = await triggerSyncAndCalculate(token, season.id)
      setMessage(
        result.newly_final_gameweeks.length
          ? `Synced GW ${result.newly_final_gameweeks.join(', ')} — ${result.payouts_created} payout(s) created.`
          : 'No newly finished gameweeks yet.'
      )
      load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-heading font-bold">Payouts</h1>
        <button
          onClick={handleSync}
          disabled={busy}
          className="flex items-center gap-2 bg-stadium-800 border border-stadium-700 hover:border-pitch-green px-4 py-2 rounded-sm text-sm font-heading tracking-wide disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sync &amp; Calculate Now
        </button>
      </div>

      {message && <p className="text-sm text-gray-400">{message}</p>}

      <p className="text-sm text-gray-500">
        This normally runs automatically every 15 minutes via the backend scheduler — this button
        is for manually forcing a check. Approvals happen via the emailed link, not from here.
      </p>

      <div className="overflow-x-auto rounded-sm border border-stadium-700">
        <table className="w-full text-sm">
          <thead className="bg-stadium-800 text-gray-400 text-left">
            <tr>
              <th className="px-4 py-3">Gameweek</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Calculated</th>
              <th className="px-4 py-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-t border-stadium-800">
                <td className="px-4 py-3">{p.event_id ?? 'Season'}</td>
                <td className="px-4 py-3">{p.user_id}</td>
                <td className="px-4 py-3">₦{(p.amount_kobo / 100).toLocaleString()}</td>
                <td className={`px-4 py-3 font-bold ${STATUS_COLORS[p.status] || ''}`}>{p.status}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(p.calculated_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No payouts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
