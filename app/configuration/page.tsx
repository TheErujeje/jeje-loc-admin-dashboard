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
    fetchSeasons()
      .then((data) => {
        setSeasons(data)
        setEndsAtDraft(Object.fromEntries(data.map((s) => [s.id, toDatetimeLocal(s.season_ends_at)])))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load seasons'))
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
      await updateSeasonEndsAt(seasonId, iso)
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
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Configuration</h1>

      {activeSeason ? (
        <div className="bg-white border border-hairline rounded-card shadow-sm p-6">
          <p className="label-eyebrow text-brand-purple mb-2">Active season</p>
          <p className="text-3xl font-semibold text-ink-900 tracking-tight">{activeSeason.label}</p>
          <p className="text-ink-500 text-sm mt-1">
            {activeSeason.status === 'registration_open' ? 'Registration open' : 'In progress'} &middot;{' '}
            {activeSeason.fpl_league_name || 'League name not set'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-hairline rounded-card shadow-sm p-6 text-ink-500 text-sm">
          No active or registration-open season right now.
        </div>
      )}

      {error && <p className="text-status-danger text-sm">{error}</p>}

      <div className="space-y-4">
        {seasons.map((season) => (
          <div key={season.id} className="bg-white border border-hairline rounded-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink-900 tracking-tight">{season.label}</h2>
                <span
                  className={`text-xs font-medium ${
                    ACTIVE_STATUSES.includes(season.status) ? 'text-status-success' : 'text-ink-500'
                  }`}
                >
                  {season.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-ink-500 text-sm">Entry fee: ₦{(season.entry_fee_kobo / 100).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="label-eyebrow mb-1">FPL League</p>
                <p className="text-ink-700">{season.fpl_league_name || '—'}</p>
              </div>
              <div>
                <p className="label-eyebrow mb-1">Join Code</p>
                <p className="text-ink-700 font-mono">{season.fpl_league_join_code || '—'}</p>
              </div>
              <div>
                <p className="label-eyebrow mb-1">Gameweeks</p>
                <p className="text-ink-700">
                  {season.fpl_start_event ?? '—'} – {season.fpl_end_event ?? '—'}
                </p>
              </div>
              <div>
                <p className="label-eyebrow mb-1">Created</p>
                <p className="text-ink-700">{new Date(season.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline">
              <label className="label-eyebrow block mb-2">
                Season close date — when this season ends and the app switches to the next one
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="datetime-local"
                  value={endsAtDraft[season.id] || ''}
                  onChange={(e) => setEndsAtDraft({ ...endsAtDraft, [season.id]: e.target.value })}
                  className="bg-white border border-hairline rounded-lg px-4 py-2 text-sm text-ink-900"
                />
                <button
                  onClick={() => handleSave(season.id)}
                  disabled={savingId === season.id}
                  className="flex items-center gap-2 bg-white border border-hairline hover:border-brand-purple px-4 py-2 rounded-lg text-sm text-ink-700 disabled:opacity-50"
                >
                  {savingId === season.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedId === season.id ? (
                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}

        {seasons.length === 0 && <p className="text-ink-500 text-sm">No seasons found.</p>}
      </div>
    </AdminLayout>
  )
}
