'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import { fetchNewEntries, fetchStandings, type NewEntryRow, type StandingRow } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

export default function StandingsPage() {
  const { token } = useAuth()
  const { seasonId } = useSeason()
  const [tab, setTab] = useState<'standings' | 'new_entries'>('standings')
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [eventId, setEventId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newEntries, setNewEntries] = useState<NewEntryRow[]>([])
  const [newEntriesLoading, setNewEntriesLoading] = useState(false)
  const [newEntriesError, setNewEntriesError] = useState<string | null>(null)

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

    setNewEntriesLoading(true)
    setNewEntriesError(null)
    fetchNewEntries(seasonId)
      .then(setNewEntries)
      .catch((err) => setNewEntriesError(err instanceof Error ? err.message : 'Could not load new entries'))
      .finally(() => setNewEntriesLoading(false))
  }, [token, seasonId])

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Standings</h1>

      <div className="flex gap-6 border-b border-hairline">
        <button
          onClick={() => setTab('standings')}
          className={`pb-3 text-sm font-medium ${
            tab === 'standings' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-ink-500'
          }`}
        >
          Standings {eventId ? `— GW${eventId}` : ''}
        </button>
        <button
          onClick={() => setTab('new_entries')}
          className={`pb-3 text-sm font-medium ${
            tab === 'new_entries' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-ink-500'
          }`}
        >
          New entries {newEntries.length ? `(${newEntries.length})` : ''}
        </button>
      </div>

      {tab === 'standings' && (
        <>
          {loading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin" />}
          {error && <p className="text-status-danger text-sm">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-card border border-hairline shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-ink-100 text-ink-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Rank</th>
                    <th className="px-4 py-3 font-medium">Manager</th>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">GW Pts</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.user_id} className="border-t border-hairline">
                      <td className="px-4 py-3 tnum">{row.overall_rank ?? '—'}</td>
                      <td className="px-4 py-3">{row.full_name}</td>
                      <td className="px-4 py-3">{row.fpl_team_name}</td>
                      <td className="px-4 py-3 tnum">{row.gw_points}</td>
                      <td className="px-4 py-3 font-semibold tnum">{row.total_points}</td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                        No standings synced yet for this season.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'new_entries' && (
        <>
          {newEntriesLoading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin" />}
          {newEntriesError && <p className="text-status-danger text-sm">{newEntriesError}</p>}

          {!newEntriesLoading && !newEntriesError && (
            <div className="overflow-x-auto rounded-card border border-hairline shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-ink-100 text-ink-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">Manager</th>
                    <th className="px-4 py-3 font-medium">FPL Entry ID</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {newEntries.map((row) => (
                    <tr key={row.fpl_entry_id} className="border-t border-hairline">
                      <td className="px-4 py-3">{row.entry_name}</td>
                      <td className="px-4 py-3">
                        {[row.player_first_name, row.player_last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-500 tnum">{row.fpl_entry_id}</td>
                      <td className="px-4 py-3 text-ink-500">{new Date(row.joined_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {newEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-ink-500">
                        Nobody has joined the FPL league yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
