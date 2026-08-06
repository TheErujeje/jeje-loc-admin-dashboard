'use client'

import { useEffect, useState } from 'react'
import { Loader2, Swords, ShieldCheck, AlertTriangle, RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchArbitrationQueue, resolveChallenge, type Challenge } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const TYPE_LABELS: Record<string, string> = {
  most_points: 'Most Points',
  most_goals: 'Most Goals',
  most_bonus: 'Most Bonus Points',
  most_cards: 'Most Cards',
}

type ConfirmTarget =
  | { challenge: Challenge; action: 'declare_winner'; winnerLeagueEntryId: string; winnerLabel: string }
  | { challenge: Challenge; action: 'refund_both' }

export default function ChallengesPage() {
  const { token } = useAuth()
  const [queue, setQueue] = useState<Challenge[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)

  const load = () => {
    if (!token) return
    fetchArbitrationQueue()
      .then(setQueue)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load challenges'))
  }

  useEffect(load, [token])

  const confirmResolve = async () => {
    if (!confirmTarget) return
    const { challenge } = confirmTarget
    setConfirmTarget(null)
    setBusyId(challenge.id)
    setMessage(null)
    try {
      if (confirmTarget.action === 'declare_winner') {
        await resolveChallenge(challenge.id, { action: 'declare_winner', winner_league_entry_id: confirmTarget.winnerLeagueEntryId })
        setMessage(`Resolved — ${confirmTarget.winnerLabel} wins.`)
      } else {
        await resolveChallenge(challenge.id, { action: 'refund_both' })
        setMessage('Both stakes refunded.')
      }
      load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Resolution failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight flex items-center gap-2 dark:text-ink-100">
          <Swords className="h-6 w-6 text-brand-purple dark:text-brand-lilac" /> Challenge Arbitration
        </h1>
      </div>

      {message && <p className="text-sm text-ink-500 dark:text-ink-400">{message}</p>}

      <p className="text-sm text-ink-500 dark:text-ink-400">
        These challenges have finished their gameweek and are awaiting your confirmation. The
        system&apos;s proposed winner is highlighted — override it if needed, or refund both stakes on
        a tie or dispute. Confirming fires the Paystack payout (or refunds) immediately.
      </p>

      <div className="space-y-4">
        {queue.length === 0 && (
          <div className="border border-hairline rounded-card p-8 text-center text-ink-500 text-sm dark:border-ink-700 dark:text-ink-400">
            No challenges awaiting arbitration.
          </div>
        )}

        {queue.map((c) => {
          const snapshot = c.result_snapshot
          const proposedWinner = snapshot?.proposed_winner_league_entry_id ?? null
          const isTie = proposedWinner == null
          const busy = busyId === c.id

          return (
            <div key={c.id} className="bg-white border border-hairline rounded-card shadow-sm p-5 space-y-4 dark:bg-ink-800 dark:border-ink-700">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{TYPE_LABELS[c.challenge_type] || c.challenge_type}</p>
                  <p className="text-ink-500 text-xs dark:text-ink-400">
                    GW{c.event_id} · ₦{(c.stake_kobo / 100).toLocaleString()} stake each · {c.payout_percent_snapshot}%
                    to winner
                  </p>
                </div>
                {isTie && (
                  <span className="label-eyebrow flex items-center gap-1.5 text-status-warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> Exact tie
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`rounded-lg border p-4 ${
                    proposedWinner === c.creator_league_entry_id ? 'border-status-success bg-status-success/10' : 'border-hairline dark:border-ink-700'
                  }`}
                >
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{c.creator_team_name || `#${c.creator_league_entry_id}`}</p>
                  <p className="text-ink-500 text-xs dark:text-ink-400">Creator</p>
                  <p className="text-2xl font-semibold text-ink-900 tnum mt-2 dark:text-ink-100">{snapshot?.creator_value ?? '—'}</p>
                  <button
                    onClick={() =>
                      setConfirmTarget({
                        challenge: c,
                        action: 'declare_winner',
                        winnerLeagueEntryId: c.creator_league_entry_id,
                        winnerLabel: c.creator_team_name || `#${c.creator_league_entry_id}`,
                      })
                    }
                    disabled={busy}
                    className="mt-3 flex items-center gap-1.5 bg-brand-purple text-white font-medium text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {proposedWinner === c.creator_league_entry_id ? 'Confirm Winner' : 'Override: Winner'}
                  </button>
                </div>

                <div
                  className={`rounded-lg border p-4 ${
                    proposedWinner === c.opponent_league_entry_id ? 'border-status-success bg-status-success/10' : 'border-hairline dark:border-ink-700'
                  }`}
                >
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{c.opponent_team_name || `#${c.opponent_league_entry_id}`}</p>
                  <p className="text-ink-500 text-xs dark:text-ink-400">Opponent</p>
                  <p className="text-2xl font-semibold text-ink-900 tnum mt-2 dark:text-ink-100">{snapshot?.opponent_value ?? '—'}</p>
                  <button
                    onClick={() =>
                      c.opponent_league_entry_id &&
                      setConfirmTarget({
                        challenge: c,
                        action: 'declare_winner',
                        winnerLeagueEntryId: c.opponent_league_entry_id,
                        winnerLabel: c.opponent_team_name || `#${c.opponent_league_entry_id}`,
                      })
                    }
                    disabled={busy}
                    className="mt-3 flex items-center gap-1.5 bg-brand-purple text-white font-medium text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {proposedWinner === c.opponent_league_entry_id ? 'Confirm Winner' : 'Override: Winner'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setConfirmTarget({ challenge: c, action: 'refund_both' })}
                disabled={busy}
                className="flex items-center gap-1.5 text-ink-500 hover:text-ink-900 text-xs border border-hairline px-3 py-1.5 rounded-md disabled:opacity-50 dark:border-ink-700 dark:text-ink-400 dark:hover:text-ink-100"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Refund Both
              </button>
            </div>
          )
        })}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-hairline rounded-card shadow-sm p-6 max-w-md w-full space-y-4 dark:bg-ink-800 dark:border-ink-700">
            <div className="flex items-center gap-3 text-status-warning">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <h3 className="font-semibold text-lg text-ink-900 dark:text-ink-100">
                {confirmTarget.action === 'declare_winner' ? 'Confirm this winner?' : 'Refund both stakes?'}
              </h3>
            </div>
            <div className="text-sm text-ink-700 space-y-1 bg-ink-100 border border-hairline rounded-lg p-4 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-300">
              {confirmTarget.action === 'declare_winner' ? (
                <>
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{confirmTarget.winnerLabel}</p>
                  <p>
                    Receives {confirmTarget.challenge.payout_percent_snapshot}% of the pot — ₦
                    {(
                      (confirmTarget.challenge.stake_kobo * 2 * confirmTarget.challenge.payout_percent_snapshot) /
                      100 /
                      100
                    ).toLocaleString()}
                  </p>
                </>
              ) : (
                <p>
                  Both players get their ₦{(confirmTarget.challenge.stake_kobo / 100).toLocaleString()} stake back —
                  no winner, no commission.
                </p>
              )}
            </div>
            <p className="text-ink-500 text-xs dark:text-ink-400">This fires immediately and can&apos;t be undone from here.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-lg text-sm text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmResolve}
                className="flex items-center gap-2 bg-brand-purple text-white font-medium px-4 py-2 rounded-lg text-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
