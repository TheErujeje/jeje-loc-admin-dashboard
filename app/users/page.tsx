'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { fetchSeasons, fetchSeasonUsers, type Season, type SeasonUser } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const ACTIVE_STATUSES = ['active', 'registration_open']

const STATUS_COLORS: Record<string, string> = {
  active: 'text-pitch-green',
  pending_payment: 'text-floodlight-gold',
}

export default function UsersPage() {
  const { token } = useAuth()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonId, setSeasonId] = useState<string>('')
  const [users, setUsers] = useState<SeasonUser[]>([])

  useEffect(() => {
    if (!token) return
    fetchSeasons(token)
      .then((data) => {
        setSeasons(data)
        const active = data.find((s) => ACTIVE_STATUSES.includes(s.status))
        setSeasonId((active || data[0])?.id || '')
      })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (token && seasonId) fetchSeasonUsers(token, seasonId).then(setUsers).catch(() => {})
  }, [token, seasonId])

  const selectedSeason = seasons.find((s) => s.id === seasonId)

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-heading font-bold">Registered Managers ({users.length})</h1>
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="bg-stadium-800 border border-stadium-700 rounded-sm px-4 py-2 text-sm font-heading tracking-wide"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} {ACTIVE_STATUSES.includes(s.status) ? '(active)' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason && !ACTIVE_STATUSES.includes(selectedSeason.status) && (
        <p className="text-sm text-gray-500">
          Viewing a past season — {selectedSeason.label} is {selectedSeason.status}.
        </p>
      )}

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
