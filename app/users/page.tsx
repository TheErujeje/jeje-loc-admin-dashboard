'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useSeason, ACTIVE_STATUSES } from '@/lib/season'
import { fetchSeasonUsers, type SeasonUser } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const STATUS_COLORS: Record<string, string> = {
  active: 'text-pitch-green',
  pending_payment: 'text-floodlight-gold',
}

export default function UsersPage() {
  const { token } = useAuth()
  const { seasonId, selectedSeason } = useSeason()
  const [users, setUsers] = useState<SeasonUser[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !seasonId) return
    fetchSeasonUsers(seasonId)
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load users'))
  }, [token, seasonId])

  return (
    <AdminLayout>
      <h1 className="text-2xl font-heading font-bold">Registered Managers ({users.length})</h1>

      {selectedSeason && !ACTIVE_STATUSES.includes(selectedSeason.status) && (
        <p className="text-sm text-gray-500">
          Viewing a past season — {selectedSeason.label} is {selectedSeason.status}.
        </p>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-sm border border-stadium-700">
        <table className="w-full text-sm">
          <thead className="bg-stadium-800 text-gray-400 text-left">
            <tr>
              <th className="px-4 py-3">FPL Entry ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">H2H</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.fpl_entry_id} className="border-t border-stadium-800">
                <td className="px-4 py-3">{u.fpl_entry_id}</td>
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">{u.fpl_team_name}</td>
                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                <td className="px-4 py-3">{u.in_h2h ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_COLORS[u.league_entry_status] || 'text-gray-400'}>
                    {u.league_entry_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.registered_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
