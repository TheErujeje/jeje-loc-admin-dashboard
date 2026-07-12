'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import { fetchPayouts, triggerSyncAndCalculate, type Payout } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const PENDING_STATUSES = ['calculated', 'pending_approval', 'approved', 'processing']

const STATUS_COLORS: Record<string, string> = {
  calculated: 'text-gray-400',
  pending_approval: 'text-floodlight-gold',
  approved: 'text-electric-cyan',
  processing: 'text-electric-cyan',
  paid: 'text-pitch-green',
  failed: 'text-red-400',
  cancelled: 'text-gray-500',
}

function PayoutRow({ p, showFailure }: { p: Payout; showFailure?: boolean }) {
  return (
    <tr className="border-t border-stadium-800">
      <td className="px-4 py-3">{p.event_id ? `GW${p.event_id}` : 'Season'}</td>
      <td className="px-4 py-3">
        <div>{p.full_name || `#${p.user_id}`}</div>
        {p.fpl_team_name && <div className="text-gray-500 text-xs">{p.fpl_team_name}</div>}
      </td>
      <td className="px-4 py-3 text-gray-400">{p.prize_rule_label || '—'}</td>
      <td className="px-4 py-3">₦{(p.amount_kobo / 100).toLocaleString()}</td>
      <td className={`px-4 py-3 font-bold ${STATUS_COLORS[p.status] || ''}`}>{p.status.replace('_', ' ')}</td>
      {showFailure && <td className="px-4 py-3 text-red-400 text-xs max-w-xs truncate">{p.failure_reason || '—'}</td>}
      <td className="px-4 py-3 text-gray-500">{new Date(p.calculated_at).toLocaleDateString()}</td>
    </tr>
  )
}

function PayoutTable({ payouts, showFailure, emptyLabel }: { payouts: Payout[]; showFailure?: boolean; emptyLabel: string }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-stadium-700">
      <table className="w-full text-sm">
        <thead className="bg-stadium-800 text-gray-400 text-left">
          <tr>
            <th className="px-4 py-3">Gameweek</th>
            <th className="px-4 py-3">Manager</th>
            <th className="px-4 py-3">Prize</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            {showFailure && <th className="px-4 py-3">Reason</th>}
            <th className="px-4 py-3">Calculated</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <PayoutRow key={p.id} p={p} showFailure={showFailure} />
          ))}
          {payouts.length === 0 && (
            <tr>
              <td colSpan={showFailure ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function PayoutsPage() {
  const { token } = useAuth()
  const { seasonId } = useSeason()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = () => {
    if (!token || !seasonId) return
    fetchPayouts(seasonId)
      .then(setPayouts)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load payouts'))
  }

  useEffect(load, [token, seasonId])

  const handleSync = async () => {
    if (!token || !seasonId) return
    setBusy(true)
    setMessage(null)
    try {
      const result = await triggerSyncAndCalculate(seasonId)
      setMessage(
        result.newly_final_gameweeks.length || result.payouts_created
          ? `Synced GW ${result.newly_final_gameweeks.join(', ') || '—'} — ${result.payouts_created} payout(s) created.`
          : 'Nothing new to calculate — no newly finished gameweeks and no new season prizes.'
      )
      load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setBusy(false)
    }
  }

  const pending = payouts.filter((p) => PENDING_STATUSES.includes(p.status))
  const completed = payouts.filter((p) => p.status === 'paid')
  const failed = payouts.filter((p) => p.status === 'failed' || p.status === 'cancelled')

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
        is for manually forcing a check on the season selected above. Approvals happen via the
        emailed link, not from here.
      </p>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-heading text-sm tracking-widest text-floodlight-gold">
          <Clock className="h-4 w-4" /> PENDING ({pending.length})
        </h2>
        <PayoutTable payouts={pending} emptyLabel="No pending payouts for this season." />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-heading text-sm tracking-widest text-pitch-green">
          <CheckCircle2 className="h-4 w-4" /> COMPLETED ({completed.length})
        </h2>
        <PayoutTable payouts={completed} emptyLabel="No completed payouts for this season yet." />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-heading text-sm tracking-widest text-red-400">
          <XCircle className="h-4 w-4" /> FAILED ({failed.length})
        </h2>
        <PayoutTable payouts={failed} showFailure emptyLabel="No failed payouts for this season." />
      </section>
    </AdminLayout>
  )
}
