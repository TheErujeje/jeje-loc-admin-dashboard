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
  const [tempPassword, setTempPassword] = useState<{ userId: string; password: string } | null>(null)

  useEffect(() => {
    if (!token || !seasonId) return
    fetchSeasonUsers(seasonId)
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load users'))
  }, [token, seasonId])

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Issue a new temporary password for this user? Their old password stops working immediately.')) {
      return
    }
    setResettingUserId(userId)
    setTempPassword(null)
    try {
      const result = await resetUserPassword(userId)
      setTempPassword({ userId, password: result.temporary_password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password')
    } finally {
      setResettingUserId(null)
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Registered Managers ({users.length})</h1>

      {selectedSeason && !ACTIVE_STATUSES.includes(selectedSeason.status) && (
        <p className="text-sm text-ink-500">
          Viewing a past season — {selectedSeason.label} is {selectedSeason.status}.
        </p>
      )}

      {error && <p className="text-status-danger text-sm">{error}</p>}

      {tempPassword && (
        <div className="bg-status-warning/10 border border-status-warning/30 rounded-card p-4 text-sm">
          <p className="font-semibold text-status-warning">Temporary password issued</p>
          <p className="text-ink-700 mt-1">
            Relay this to the user directly — it won&apos;t be shown again:{' '}
            <span className="font-mono text-ink-900">{tempPassword.password}</span>
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-hairline shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink-100 text-ink-500 text-left">
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
              <tr key={u.user_id} className="border-t border-hairline">
                <td className="px-4 py-3 tnum">{u.fpl_entry_id}</td>
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">{u.fpl_team_name}</td>
                <td className="px-4 py-3 text-ink-500">{u.email}</td>
                <td className="px-4 py-3">{u.in_h2h ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${STATUS_COLORS[u.league_entry_status] || 'text-ink-500'}`}>
                    {u.league_entry_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-500">{new Date(u.registered_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleResetPassword(u.user_id)}
                    disabled={resettingUserId === u.user_id}
                    className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900 text-xs border border-hairline px-3 py-1.5 rounded-md disabled:opacity-50"
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
                <td colSpan={8} className="px-4 py-8 text-center text-ink-500">
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
