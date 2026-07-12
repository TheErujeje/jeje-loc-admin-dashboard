'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Clock, CheckCircle2, XCircle, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import { fetchPayouts, triggerSyncAndCalculate, approvePayoutDirect, type Payout } from '@/lib/api'
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

function PayoutRow({
  p,
  showFailure,
  onApprove,
  approvingId,
}: {
  p: Payout
  showFailure?: boolean
  onApprove?: (p: Payout) => void
  approvingId?: string | null
}) {
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
      {onApprove && (
        <td className="px-4 py-3">
          {p.status === 'pending_approval' && (
            <button
              onClick={() => onApprove(p)}
              disabled={approvingId === p.id}
              className="flex items-center gap-1.5 bg-pitch-green text-stadium-900 font-heading font-bold text-xs px-3 py-1.5 rounded-sm disabled:opacity-50"
            >
              {approvingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Approve
            </button>
          )}
        </td>
      )}
    </tr>
  )
}

function PayoutTable({
  payouts,
  showFailure,
  showAction,
  emptyLabel,
  onApprove,
  approvingId,
}: {
  payouts: Payout[]
  showFailure?: boolean
  showAction?: boolean
  emptyLabel: string
  onApprove?: (p: Payout) => void
  approvingId?: string | null
}) {
  const colCount = 6 + (showFailure ? 1 : 0) + (showAction ? 1 : 0)
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
            {showAction && <th className="px-4 py-3">Action</th>}
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <PayoutRow key={p.id} p={p} showFailure={showFailure} onApprove={showAction ? onApprove : undefined} approvingId={approvingId} />
          ))}
          {payouts.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-gray-500">
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
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Payout | null>(null)

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

  const confirmApprove = async () => {
    const p = confirmTarget
    if (!p) return
    const label = p.event_id ? `GW${p.event_id}` : 'Season'
    setConfirmTarget(null)
    setApprovingId(p.id)
    setMessage(null)
    try {
      const result = await approvePayoutDirect(p.id)
      setMessage(`${label} — ${p.full_name || p.user_id}: ${result.message}`)
      load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApprovingId(null)
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
        is for manually forcing a check on the season selected above. Approve a pending payout
        below, or via the emailed link — either way fires the same Paystack transfer.
      </p>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-heading text-sm tracking-widest text-floodlight-gold">
          <Clock className="h-4 w-4" /> PENDING ({pending.length})
        </h2>
        <PayoutTable
          payouts={pending}
          showAction
          onApprove={setConfirmTarget}
          approvingId={approvingId}
          emptyLabel="No pending payouts for this season."
        />
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

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-stadium-800 border border-stadium-700 rounded-sm p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-floodlight-gold">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <h3 className="font-heading font-bold text-lg">Approve this payout?</h3>
            </div>
            <div className="text-sm text-gray-300 space-y-1 bg-stadium-900 border border-stadium-700 rounded-sm p-4">
              <p>
                {confirmTarget.event_id ? `GW${confirmTarget.event_id}` : 'Season'} —{' '}
                {confirmTarget.prize_rule_label || 'Prize'}
              </p>
              <p>{confirmTarget.full_name || confirmTarget.user_id}</p>
              <p className="font-bold text-white">₦{(confirmTarget.amount_kobo / 100).toLocaleString()}</p>
            </div>
            <p className="text-gray-500 text-xs">This fires the Paystack transfer immediately and can&apos;t be undone from here.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-sm text-sm font-heading tracking-wide text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="flex items-center gap-2 bg-pitch-green text-stadium-900 font-heading font-bold px-4 py-2 rounded-sm text-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                Approve &amp; Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
