'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import { fetchStandings, type StandingRow } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

export default function StandingsPage() {
  const { token } = useAuth()
  const { seasonId } = useSeason()
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [eventId, setEventId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !seasonId) return
    setLoading(true)
    setError(null)
    fetchStandings(seasonId)
      .then((data) => {
        setStandings(data.results)
        setEventId(data.event_id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load standings'))
      .finally(() => setLoading(false))
  }, [token, seasonId])

  return (
    <AdminLayout>
      <h1 className="text-2xl font-heading font-bold">Standings {eventId ? `— GW${eventId}` : ''}</h1>

      {loading && <Loader2 className="h-6 w-6 text-pitch-green animate-spin" />}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-sm border border-stadium-700">
          <table className="w-full text-sm">
            <thead className="bg-stadium-800 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">GW Pts</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.user_id} className="border-t border-stadium-800">
                  <td className="px-4 py-3">{row.overall_rank ?? '—'}</td>
                  <td className="px-4 py-3">{row.full_name}</td>
                  <td className="px-4 py-3">{row.fpl_team_name}</td>
                  <td className="px-4 py-3">{row.gw_points}</td>
                  <td className="px-4 py-3 font-bold">{row.total_points}</td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No standings synced yet for this season.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
