'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchSeasons, updateSeasonEndsAt, type Season } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const ACTIVE_STATUSES = ['active', 'registration_open']

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ConfigurationPage() {
  const { token } = useAuth()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [endsAtDraft, setEndsAtDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    if (!token) return
    fetchSeasons(token)
      .then((data) => {
        setSeasons(data)
        setEndsAtDraft(Object.fromEntries(data.map((s) => [s.id, toDatetimeLocal(s.season_ends_at)])))
      })
      .catch(() => {})
  }

  useEffect(load, [token])

  const handleSave = async (seasonId: string) => {
    if (!token) return
    setSavingId(seasonId)
    setSavedId(null)
    setError(null)
    try {
      const draft = endsAtDraft[seasonId]
      const iso = draft ? new Date(draft).toISOString() : null
      await updateSeasonEndsAt(token, seasonId, iso)
      setSavedId(seasonId)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSavingId(null)
    }
  }

  const activeSeason = seasons.find((s) => ACTIVE_STATUSES.includes(s.status))

  return (
    <AdminLayout>
      <h1 className="text-2xl font-heading font-bold">Configuration</h1>

      {activeSeason ? (
        <div className="bg-stadium-800 border border-pitch-green/40 rounded-sm p-6">
          <p className="font-heading text-xs tracking-widest text-pitch-green mb-2">ACTIVE SEASON</p>
          <p className="text-3xl font-heading font-bold">{activeSeason.label}</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeSeason.status === 'registration_open' ? 'Registration open' : 'In progress'} &middot;{' '}
            {activeSeason.fpl_league_name || 'League name not set'}
          </p>
        </div>
      ) : (
        <div className="bg-stadium-800 border border-stadium-700 rounded-sm p-6 text-gray-400 text-sm">
          No active or registration-open season right now.
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-4">
        {seasons.map((season) => (
          <div key={season.id} className="bg-stadium-800 border border-stadium-700 rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-heading text-xl font-bold">{season.label}</h2>
                <span
                  className={`text-xs font-heading tracking-wide ${
                    ACTIVE_STATUSES.includes(season.status) ? 'text-pitch-green' : 'text-gray-500'
                  }`}
                >
                  {season.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Entry fee: ₦{(season.entry_fee_kobo / 100).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">FPL League</p>
                <p className="text-gray-300">{season.fpl_league_name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Join Code</p>
                <p className="text-gray-300 font-mono">{season.fpl_league_join_code || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Gameweeks</p>
                <p className="text-gray-300">
                  {season.fpl_start_event ?? '—'} – {season.fpl_end_event ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Created</p>
                <p className="text-gray-300">{new Date(season.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-stadium-700">
              <label className="block text-gray-500 text-xs uppercase tracking-widest mb-2">
                Season Close Date — when this season ends and the app switches to the next one
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="datetime-local"
                  value={endsAtDraft[season.id] || ''}
                  onChange={(e) => setEndsAtDraft({ ...endsAtDraft, [season.id]: e.target.value })}
                  className="bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-2 text-sm"
                />
                <button
                  onClick={() => handleSave(season.id)}
                  disabled={savingId === season.id}
                  className="flex items-center gap-2 bg-stadium-900 border border-stadium-700 hover:border-pitch-green px-4 py-2 rounded-sm text-sm font-heading tracking-wide disabled:opacity-50"
                >
                  {savingId === season.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedId === season.id ? (
                    <CheckCircle2 className="h-4 w-4 text-pitch-green" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}

        {seasons.length === 0 && <p className="text-gray-500 text-sm">No seasons found.</p>}
      </div>
    </AdminLayout>
  )
}
