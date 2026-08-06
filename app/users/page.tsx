'use client'

import { useEffect, useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason, ACTIVE_STATUSES } from '@/lib/season'
import { fetchSeasonUsers, resetUserPassword, type SeasonUser } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const STATUS_COLORS: Record<string, string> = {
  active: 'text-status-success',
  pending_payment: 'text-status-warning',
}

export default function UsersPage() {
  const { token } = useAuth()
  const { seasonId, selectedSeason } = useSeason()
  const [users, setUsers] = useState<SeasonUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)
  const [resetConfirmation, setResetConfirmation] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !seasonId) return
    fetchSeasonUsers(seasonId)
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load users'))
  }, [token, seasonId])

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
      setError(err instanceof Error ? err.message : 'Could not reset password')
    } finally {
      setResettingUserId(null)
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

      {error && <p className="text-status-danger text-sm">{error}</p>}

      {resetConfirmation && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-card p-4 text-sm">
          <p className="font-semibold text-status-success">Password reset</p>
          <p className="text-ink-700 mt-1 dark:text-ink-300">
            A new temporary password has been emailed to <span className="font-medium text-ink-900 dark:text-ink-100">{resetConfirmation}</span>.
          </p>
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
