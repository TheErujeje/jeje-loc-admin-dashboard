'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import { fetchNewEntries, fetchStandings, type NewEntryRow, type StandingRow } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'
import { Select } from '@/components/ui/Select'

export default function StandingsPage() {
  const { token } = useAuth()
  const { seasonId } = useSeason()
  const [tab, setTab] = useState<'standings' | 'new_entries'>('standings')

  const [liveStandings, setLiveStandings] = useState<StandingRow[]>([])
  const [liveEventId, setLiveEventId] = useState<number | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [historicalStandings, setHistoricalStandings] = useState<StandingRow[]>([])

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
        setLiveStandings(data.results)
        setLiveEventId(data.event_id)
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

  useEffect(() => {
    if (!token || !seasonId || selectedEventId == null) return
    setLoading(true)
    setError(null)
    fetchStandings(seasonId, selectedEventId)
      .then((data) => setHistoricalStandings(data.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load standings'))
      .finally(() => setLoading(false))
  }, [token, seasonId, selectedEventId])

  const viewingLive = selectedEventId == null
  const standings = viewingLive ? liveStandings : historicalStandings
  const eventId = viewingLive ? liveEventId : selectedEventId

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Standings</h1>

      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-hairline dark:border-ink-700">
        <div className="flex gap-6">
          <button
            onClick={() => setTab('standings')}
            className={`pb-3 text-sm font-medium ${
              tab === 'standings' ? 'text-brand-purple border-b-2 border-brand-purple dark:text-brand-lilac dark:border-brand-lilac' : 'text-ink-500 dark:text-ink-400'
            }`}
          >
            Standings {eventId ? `— GW${eventId}` : ''}
          </button>
          <button
            onClick={() => setTab('new_entries')}
            className={`pb-3 text-sm font-medium ${
              tab === 'new_entries' ? 'text-brand-purple border-b-2 border-brand-purple dark:text-brand-lilac dark:border-brand-lilac' : 'text-ink-500 dark:text-ink-400'
            }`}
          >
            New entries {newEntries.length ? `(${newEntries.length})` : ''}
          </button>
        </div>

        {tab === 'standings' && liveEventId != null && (
          <Select
            value={selectedEventId ?? ''}
            onChange={(e) => setSelectedEventId(e.target.value === '' ? null : Number(e.target.value))}
            wrapperClassName="mb-2"
            className="bg-white border border-hairline rounded-lg pl-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
          >
            <option value="">Live — GW{liveEventId}</option>
            {Array.from({ length: liveEventId }, (_, i) => liveEventId - i).map((gw) => (
              <option key={gw} value={gw}>
                Gameweek {gw}
              </option>
            ))}
          </Select>
        )}
      </div>

      {tab === 'standings' && (
        <>
          {loading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}
          {error && <p className="text-status-danger text-sm">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-card border border-hairline shadow-sm dark:border-ink-700">
              <table className="w-full text-sm">
                <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
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
                    <tr key={row.user_id} className="border-t border-hairline dark:border-ink-700 dark:bg-ink-800">
                      <td className="px-4 py-3 tnum dark:text-ink-100">{row.overall_rank ?? '—'}</td>
                      <td className="px-4 py-3 dark:text-ink-100">{row.full_name}</td>
                      <td className="px-4 py-3 dark:text-ink-100">{row.fpl_team_name}</td>
                      <td className="px-4 py-3 tnum dark:text-ink-100">{row.gw_points}</td>
                      <td className="px-4 py-3 font-semibold tnum dark:text-ink-100">{row.total_points}</td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
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
          {newEntriesLoading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}
          {newEntriesError && <p className="text-status-danger text-sm">{newEntriesError}</p>}

          {!newEntriesLoading && !newEntriesError && (
            <div className="overflow-x-auto rounded-card border border-hairline shadow-sm dark:border-ink-700">
              <table className="w-full text-sm">
                <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">Manager</th>
                    <th className="px-4 py-3 font-medium">FPL Entry ID</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {newEntries.map((row) => (
                    <tr key={row.fpl_entry_id} className="border-t border-hairline dark:border-ink-700 dark:bg-ink-800">
                      <td className="px-4 py-3 dark:text-ink-100">{row.entry_name}</td>
                      <td className="px-4 py-3 dark:text-ink-100">
                        {[row.player_first_name, row.player_last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-500 tnum dark:text-ink-400">{row.fpl_entry_id}</td>
                      <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{new Date(row.joined_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {newEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
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
