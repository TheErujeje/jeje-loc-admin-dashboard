'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Clock, CheckCircle2, XCircle, ShieldCheck, AlertTriangle, RotateCcw, HandCoins } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import {
  fetchPayouts,
  fetchPayoutStats,
  triggerSyncAndCalculate,
  approvePayoutDirect,
  retryPayout,
  settlePayoutManually,
  type Payout,
  type PayoutStats,
} from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'
import { StatRow, StatTile } from '@/components/StatTile'

type PayoutAction = 'approve' | 'retry' | 'settle_manual'

const PENDING_STATUSES = ['calculated', 'pending_approval', 'approved', 'processing']

const STATUS_COLORS: Record<string, string> = {
  calculated: 'text-ink-500',
  pending_approval: 'text-status-warning',
  approved: 'text-brand-purple',
  processing: 'text-brand-purple',
  paid: 'text-status-success',
  failed: 'text-status-danger',
  cancelled: 'text-ink-500',
}

function PayoutRow({
  p,
  showFailure,
  showAction,
  onAction,
  busyId,
}: {
  p: Payout
  showFailure?: boolean
  showAction?: boolean
  onAction?: (p: Payout, action: PayoutAction) => void
  busyId?: string | null
}) {
  const busy = busyId === p.id
  return (
    <tr className="border-t border-hairline dark:border-ink-700 dark:bg-ink-800">
      <td className="px-4 py-3 dark:text-ink-100">{p.event_id ? `GW${p.event_id}` : 'Season'}</td>
      <td className="px-4 py-3 dark:text-ink-100">
        <div>{p.full_name || `#${p.user_id}`}</div>
        {p.fpl_team_name && <div className="text-ink-500 text-xs dark:text-ink-400">{p.fpl_team_name}</div>}
        {p.bank_account_name && (
          <div className="text-ink-500 text-xs dark:text-ink-400">
            {p.bank_account_name} · {p.bank_name || 'Bank'} · {p.bank_account_number}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{p.prize_rule_label || '—'}</td>
      <td className="px-4 py-3 tnum dark:text-ink-100">₦{(p.amount_kobo / 100).toLocaleString()}</td>
      <td className={`px-4 py-3 font-semibold ${STATUS_COLORS[p.status] || ''}`}>{p.status.replace('_', ' ')}</td>
      {showFailure && <td className="px-4 py-3 text-status-danger text-xs max-w-xs truncate">{p.failure_reason || '—'}</td>}
      <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{new Date(p.calculated_at).toLocaleDateString()}</td>
      {showAction && (
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {p.status === 'pending_approval' && onAction && (
              <button
                onClick={() => onAction(p, 'approve')}
                disabled={busy}
                className="flex items-center gap-1.5 bg-brand-purple text-white font-medium text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Approve
              </button>
            )}
            {p.status === 'failed' && onAction && (
              <>
                <button
                  onClick={() => onAction(p, 'retry')}
                  disabled={busy}
                  className="flex items-center gap-1.5 bg-brand-purple text-white font-medium text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Retry
                </button>
                <button
                  onClick={() => onAction(p, 'settle_manual')}
                  disabled={busy}
                  className="flex items-center gap-1.5 border border-hairline text-ink-600 hover:text-ink-900 font-medium text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HandCoins className="h-3.5 w-3.5" />}
                  Settle Manually
                </button>
              </>
            )}
          </div>
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
  onAction,
  busyId,
}: {
  payouts: Payout[]
  showFailure?: boolean
  showAction?: boolean
  emptyLabel: string
  onAction?: (p: Payout, action: PayoutAction) => void
  busyId?: string | null
}) {
  const colCount = 6 + (showFailure ? 1 : 0) + (showAction ? 1 : 0)
  return (
    <div className="overflow-x-auto rounded-card border border-hairline shadow-sm dark:border-ink-700">
      <table className="w-full text-sm">
        <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
          <tr>
            <th className="px-4 py-3 font-medium">Gameweek</th>
            <th className="px-4 py-3 font-medium">Manager</th>
            <th className="px-4 py-3 font-medium">Prize</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {showFailure && <th className="px-4 py-3 font-medium">Reason</th>}
            <th className="px-4 py-3 font-medium">Calculated</th>
            {showAction && <th className="px-4 py-3 font-medium">Action</th>}
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <PayoutRow key={p.id} p={p} showFailure={showFailure} showAction={showAction} onAction={onAction} busyId={busyId} />
          ))}
          {payouts.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
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
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ payout: Payout; action: PayoutAction } | null>(null)

  const load = () => {
    if (!token || !seasonId) return
    fetchPayouts(seasonId)
      .then(setPayouts)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load payouts'))
  }

  const loadStats = () => {
    if (!token || !seasonId) return
    fetchPayoutStats(seasonId)
      .then(setStats)
      .catch(() => setStats(null))
  }

  useEffect(load, [token, seasonId])
  useEffect(loadStats, [token, seasonId])

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
      loadStats()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setBusy(false)
    }
  }

  const ACTION_FN: Record<PayoutAction, (id: string) => Promise<{ message: string }>> = {
    approve: approvePayoutDirect,
    retry: retryPayout,
    settle_manual: settlePayoutManually,
  }

  const ACTION_FAIL_MESSAGE: Record<PayoutAction, string> = {
    approve: 'Approval failed',
    retry: 'Retry failed',
    settle_manual: 'Could not mark as paid',
  }

  const confirmAction = async () => {
    const target = confirmTarget
    if (!target) return
    const { payout: p, action } = target
    const label = p.event_id ? `GW${p.event_id}` : 'Season'
    setConfirmTarget(null)
    setActioningId(p.id)
    setMessage(null)
    try {
      const result = await ACTION_FN[action](p.id)
      setMessage(`${label} — ${p.full_name || p.user_id}: ${result.message}`)
      load()
      loadStats()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : ACTION_FAIL_MESSAGE[action])
    } finally {
      setActioningId(null)
    }
  }

  const pending = payouts.filter((p) => PENDING_STATUSES.includes(p.status))
  const completed = payouts.filter((p) => p.status === 'paid')
  const failed = payouts.filter((p) => p.status === 'failed' || p.status === 'cancelled')

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Payouts</h1>
        <button
          onClick={handleSync}
          disabled={busy}
          className="flex items-center gap-2 bg-white border border-hairline hover:border-brand-purple px-4 py-2 rounded-lg text-sm text-ink-700 disabled:opacity-50 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-300 dark:hover:border-brand-lilac"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sync &amp; Calculate Now
        </button>
      </div>

      {stats && (
        <StatRow>
          <StatTile
            label="Total paid out"
            value={`₦${(stats.total_paid_out_kobo / 100).toLocaleString()}`}
            icon={HandCoins}
            tone="success"
          />
          <StatTile
            label="Pending approval"
            value={stats.pending_approval_count.toLocaleString()}
            icon={Clock}
            tone={stats.pending_approval_count > 0 ? 'warning' : 'default'}
          />
          <StatTile label="Processing" value={stats.processing_count.toLocaleString()} icon={RefreshCw} />
          <StatTile
            label="Failed"
            value={stats.failed_count.toLocaleString()}
            icon={XCircle}
            tone={stats.failed_count > 0 ? 'danger' : 'default'}
          />
        </StatRow>
      )}

      {message && <p className="text-sm text-ink-500 dark:text-ink-400">{message}</p>}

      <p className="text-sm text-ink-500 dark:text-ink-400">
        This normally runs automatically every 15 minutes via the backend scheduler — this button
        is for manually forcing a check on the season selected above. Approve a pending payout
        below, or via the emailed link — either way fires the same Paystack transfer.
      </p>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 label-eyebrow text-status-warning">
          <Clock className="h-4 w-4" /> Pending ({pending.length})
        </h2>
        <PayoutTable
          payouts={pending}
          showAction
          onAction={(p, action) => setConfirmTarget({ payout: p, action })}
          busyId={actioningId}
          emptyLabel="No pending payouts for this season."
        />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 label-eyebrow text-status-success">
          <CheckCircle2 className="h-4 w-4" /> Completed ({completed.length})
        </h2>
        <PayoutTable payouts={completed} emptyLabel="No completed payouts for this season yet." />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 label-eyebrow text-status-danger">
          <XCircle className="h-4 w-4" /> Failed ({failed.length})
        </h2>
        <PayoutTable
          payouts={failed}
          showFailure
          showAction
          onAction={(p, action) => setConfirmTarget({ payout: p, action })}
          busyId={actioningId}
          emptyLabel="No failed payouts for this season."
        />
      </section>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-hairline rounded-card shadow-sm p-6 max-w-md w-full space-y-4 dark:bg-ink-800 dark:border-ink-700">
            <div className="flex items-center gap-3 text-status-warning">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <h3 className="font-semibold text-lg text-ink-900 dark:text-ink-100">
                {confirmTarget.action === 'approve' && 'Approve this payout?'}
                {confirmTarget.action === 'retry' && 'Retry this payout?'}
                {confirmTarget.action === 'settle_manual' && 'Mark as paid manually?'}
              </h3>
            </div>
            <div className="text-sm text-ink-700 space-y-1 bg-ink-100 border border-hairline rounded-lg p-4 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-300">
              <p>
                {confirmTarget.payout.event_id ? `GW${confirmTarget.payout.event_id}` : 'Season'} —{' '}
                {confirmTarget.payout.prize_rule_label || 'Prize'}
              </p>
              <p>{confirmTarget.payout.full_name || confirmTarget.payout.user_id}</p>
              <p className="font-semibold text-ink-900 dark:text-ink-100">₦{(confirmTarget.payout.amount_kobo / 100).toLocaleString()}</p>
              {(confirmTarget.action === 'approve' || confirmTarget.action === 'retry') && (
                <p className="pt-1 border-t border-hairline dark:border-ink-700 mt-1">
                  <span className="text-ink-500 dark:text-ink-400">Sending to: </span>
                  {confirmTarget.payout.bank_account_name ? (
                    <span className="font-medium text-ink-900 dark:text-ink-100">
                      {confirmTarget.payout.bank_account_name} — {confirmTarget.payout.bank_name || 'Bank'} ·{' '}
                      {confirmTarget.payout.bank_account_number}
                    </span>
                  ) : (
                    <span className="font-medium text-status-danger">Unverified — no resolved account name on file</span>
                  )}
                </p>
              )}
            </div>
            <p className="text-ink-500 text-xs dark:text-ink-400">
              {confirmTarget.action === 'approve' &&
                "This fires the Paystack transfer immediately and can't be undone from here."}
              {confirmTarget.action === 'retry' &&
                "This re-attempts the same Paystack transfer — use it once you've fixed whatever caused it to fail (e.g. topped up the Paystack balance, corrected the bank account)."}
              {confirmTarget.action === 'settle_manual' &&
                "This records the payout as paid WITHOUT sending another Paystack transfer. Only use this if you've already paid the manager some other way."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-lg text-sm text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="flex items-center gap-2 bg-brand-purple text-white font-medium px-4 py-2 rounded-lg text-sm"
              >
                {confirmTarget.action === 'approve' && (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Approve &amp; Pay
                  </>
                )}
                {confirmTarget.action === 'retry' && (
                  <>
                    <RotateCcw className="h-4 w-4" /> Retry Transfer
                  </>
                )}
                {confirmTarget.action === 'settle_manual' && (
                  <>
                    <HandCoins className="h-4 w-4" /> Mark as Paid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
