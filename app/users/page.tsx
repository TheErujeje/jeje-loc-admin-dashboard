'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { KeyRound, Loader2, RefreshCw, Users, CheckCircle2, Clock, Wifi, Swords, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason, ACTIVE_STATUSES } from '@/lib/season'
import { fetchSeasonUsers, fetchSeasonUserStats, resetUserPassword, verifyLeagueEntryPayment, type SeasonUser } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'
import { StatRow, StatTile } from '@/components/StatTile'

const STATUS_COLORS: Record<string, string> = {
  active: 'text-status-success',
  pending_payment: 'text-status-warning',
}

export default function UsersPage() {
  const { token } = useAuth()
  const { seasonId, selectedSeason } = useSeason()
  const canLoad = Boolean(token) && Boolean(seasonId)
  const [actionError, setActionError] = useState<string | null>(null)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)
  const [resetConfirmation, setResetConfirmation] = useState<string | null>(null)
  const [verifyingEntryId, setVerifyingEntryId] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ message: string; success: boolean } | null>(null)

  // Pending-payment rows can flip to active from a Paystack webhook or
  // another admin's action while this page just sits open — poll so that's
  // visible without a manual refresh.
  const {
    data: users = [],
    error: usersErrObj,
    mutate: mutateUsers,
  } = useSWR(canLoad ? ['season-users', seasonId] : null, () => fetchSeasonUsers(seasonId as string), {
    refreshInterval: 30000,
  })
  const { data: stats, mutate: mutateStats } = useSWR(
    canLoad ? ['season-user-stats', seasonId] : null,
    () => fetchSeasonUserStats(seasonId as string),
    { refreshInterval: 30000 }
  )
  const error = actionError ?? (usersErrObj ? (usersErrObj instanceof Error ? usersErrObj.message : 'Could not load users') : null)

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Issue a new temporary password for this user? Their old password stops working immediately, and the new one is emailed to them.')) {
      return
    }
    setResettingUserId(userId)
    setResetConfirmation(null)
    try {
      const result = await resetUserPassword(userId)
      setResetConfirmation(result.emailed_to)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reset password')
    } finally {
      setResettingUserId(null)
    }
  }

  const handleVerifyPayment = async (u: SeasonUser) => {
    setVerifyingEntryId(u.league_entry_id)
    setVerifyResult(null)
    try {
      const result = await verifyLeagueEntryPayment(u.league_entry_id)
      if (result.changed) {
        setVerifyResult({
          message: `${u.full_name}'s payment was confirmed with Paystack — entry is now active.`,
          success: true,
        })
        mutateUsers()
        mutateStats()
      } else if (result.payment_status === 'success') {
        setVerifyResult({ message: `${u.full_name}'s payment was already confirmed.`, success: true })
      } else {
        setVerifyResult({
          message: `Paystack still shows this payment as "${result.payment_status}" — not yet confirmed.`,
          success: false,
        })
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not verify payment')
    } finally {
      setVerifyingEntryId(null)
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Registered Managers ({users.length})</h1>

      {selectedSeason && !ACTIVE_STATUSES.includes(selectedSeason.status) && (
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Viewing a past season — {selectedSeason.label} is {selectedSeason.status}.
        </p>
      )}

      {stats && (
        <StatRow>
          <StatTile label="Registered" value={stats.total_registered.toLocaleString()} icon={Users} />
          <StatTile label="Active" value={stats.active_count.toLocaleString()} icon={CheckCircle2} tone="success" />
          <StatTile
            label="Pending payment"
            value={stats.pending_payment_count.toLocaleString()}
            icon={Clock}
            tone={stats.pending_payment_count > 0 ? 'warning' : 'default'}
          />
          <StatTile
            label="Active sessions"
            value={stats.active_sessions_count.toLocaleString()}
            icon={Wifi}
          />
          <StatTile label="H2H opt-in" value={`${stats.h2h_opt_in_percent}%`} icon={Swords} />
          <StatTile label="New this week" value={stats.new_registrations_7d.toLocaleString()} icon={TrendingUp} />
        </StatRow>
      )}

      {error && <p className="text-status-danger text-sm">{error}</p>}

      {resetConfirmation && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-card p-4 text-sm">
          <p className="font-semibold text-status-success">Password reset</p>
          <p className="text-ink-700 mt-1 dark:text-ink-300">
            A new temporary password has been emailed to <span className="font-medium text-ink-900 dark:text-ink-100">{resetConfirmation}</span>.
          </p>
        </div>
      )}

      {verifyResult && (
        <div
          className={`rounded-card p-4 text-sm border ${
            verifyResult.success
              ? 'bg-status-success/10 border-status-success/30'
              : 'bg-status-warning/10 border-status-warning/30'
          }`}
        >
          <p className={`font-semibold ${verifyResult.success ? 'text-status-success' : 'text-status-warning'}`}>
            {verifyResult.success ? 'Payment verified' : 'Still pending'}
          </p>
          <p className="text-ink-700 mt-1 dark:text-ink-300">{verifyResult.message}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-hairline shadow-sm dark:border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
            <tr>
              <th className="px-4 py-3 font-medium">FPL Entry ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">H2H</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t border-hairline dark:border-ink-700 dark:bg-ink-800">
                <td className="px-4 py-3 tnum dark:text-ink-100">{u.fpl_entry_id}</td>
                <td className="px-4 py-3 dark:text-ink-100">{u.full_name}</td>
                <td className="px-4 py-3 dark:text-ink-100">{u.fpl_team_name}</td>
                <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{u.email}</td>
                <td className="px-4 py-3 dark:text-ink-100">{u.in_h2h ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${STATUS_COLORS[u.league_entry_status] || 'text-ink-500 dark:text-ink-400'}`}>
                    {u.league_entry_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{new Date(u.registered_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {u.league_entry_status === 'pending_payment' && (
                      <button
                        onClick={() => handleVerifyPayment(u)}
                        disabled={verifyingEntryId === u.league_entry_id}
                        title="Re-check this payment against Paystack directly — use this if the manager says they paid but is still stuck pending."
                        className="flex items-center gap-1.5 text-status-warning hover:text-ink-900 text-xs border border-status-warning/40 px-3 py-1.5 rounded-md disabled:opacity-50 dark:hover:text-ink-100"
                      >
                        {verifyingEntryId === u.league_entry_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Verify Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(u.user_id)}
                      disabled={resettingUserId === u.user_id}
                      className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900 text-xs border border-hairline px-3 py-1.5 rounded-md disabled:opacity-50 dark:border-ink-700 dark:text-ink-300 dark:hover:text-ink-100"
                    >
                      {resettingUserId === u.user_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="h-3.5 w-3.5" />
                      )}
                      Reset Password
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
                  No registered users yet for this season.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
