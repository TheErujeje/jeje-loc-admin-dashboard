'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchSeasons, updateSeason, fetchAdminPrizePool, type Season, type PrizePoolConfig, type PrizePoolBreakdown } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

const ACTIVE_STATUSES = ['active', 'registration_open']

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Draft = {
  endsAt: string
  entryFeeNaira: number
  weeklyLimit: number
  prizeEligibilityCutoffEvent: number | ''
  prizePool: PrizePoolConfig
}

function toDraft(s: Season): Draft {
  return {
    endsAt: toDatetimeLocal(s.season_ends_at),
    entryFeeNaira: s.entry_fee_kobo / 100,
    weeklyLimit: s.challenge_weekly_limit,
    prizeEligibilityCutoffEvent: s.prize_eligibility_cutoff_event ?? '',
    prizePool: {
      minimum_players: s.prize_pool_config.minimum_players,
      weekly_prize: { ...s.prize_pool_config.weekly_prize, amount_kobo: s.prize_pool_config.weekly_prize.amount_kobo / 100 },
      season_prizes: { ...s.prize_pool_config.season_prizes },
    },
  }
}

const PRIZE_PERCENT_FIELDS: { key: keyof PrizePoolConfig['season_prizes']; label: string }[] = [
  { key: 'winner_percent', label: 'Winner (1st)' },
  { key: 'runner_up_percent', label: 'Runner-up (2nd)' },
  { key: 'third_place_percent', label: '3rd place' },
  { key: 'fourth_to_tenth_percent', label: '4th – 10th (split evenly)' },
  { key: 'eleventh_to_fifteenth_percent', label: '11th – 15th (split evenly)' },
]

export default function ConfigurationPage() {
  const { token } = useAuth()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    data: seasons = [],
    error: seasonsErrObj,
    mutate: mutateSeasons,
  } = useSWR(token ? 'seasons' : null, fetchSeasons)
  const error = actionError ?? (seasonsErrObj ? (seasonsErrObj instanceof Error ? seasonsErrObj.message : 'Could not load seasons') : null)

  const { data: breakdowns = {} } = useSWR(
    token && seasons.length > 0 ? ['admin-prize-pool-breakdowns', seasons.map((s) => s.id).join(',')] : null,
    async () => {
      const pairs = await Promise.all(seasons.map((s) => fetchAdminPrizePool(s.id).then((b) => [s.id, b] as const)))
      return Object.fromEntries(pairs) as Record<string, PrizePoolBreakdown>
    }
  )

  // Merge-only: a season already drafted keeps whatever the admin's
  // actively editing, even if `seasons` silently revalidates in the
  // background (tab refocus etc.) — only a season we've never seen before
  // gets a fresh draft seeded from the server.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  useEffect(() => {
    setDrafts((prev) => {
      let changed = false
      const next = { ...prev }
      for (const s of seasons) {
        if (!next[s.id]) {
          next[s.id] = toDraft(s)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [seasons])

  const setDraft = (seasonId: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [seasonId]: { ...prev[seasonId], ...patch } }))
  }

  const setPrizePercent = (seasonId: string, key: keyof PrizePoolConfig['season_prizes'], value: number) => {
    setDrafts((prev) => ({
      ...prev,
      [seasonId]: {
        ...prev[seasonId],
        prizePool: { ...prev[seasonId].prizePool, season_prizes: { ...prev[seasonId].prizePool.season_prizes, [key]: value } },
      },
    }))
  }

  const handleSave = async (seasonId: string) => {
    if (!token) return
    const draft = drafts[seasonId]
    if (!draft) return
    setSavingId(seasonId)
    setSavedId(null)
    setActionError(null)
    try {
      const updated = await updateSeason(seasonId, {
        season_ends_at: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
        entry_fee_kobo: Math.round(draft.entryFeeNaira * 100),
        challenge_weekly_limit: draft.weeklyLimit,
        ...(draft.prizeEligibilityCutoffEvent !== ''
          ? { prize_eligibility_cutoff_event: draft.prizeEligibilityCutoffEvent }
          : {}),
        prize_pool_config: {
          minimum_players: draft.prizePool.minimum_players,
          weekly_prize: {
            enabled: draft.prizePool.weekly_prize.enabled,
            amount_kobo: Math.round(draft.prizePool.weekly_prize.amount_kobo * 100),
          },
          season_prizes: draft.prizePool.season_prizes,
        },
      })
      setSavedId(seasonId)
      // Re-seed just this season's draft from what the server actually
      // stored (e.g. normalized values) — the merge-only effect above
      // won't touch an existing draft, so this has to happen explicitly.
      setDrafts((prev) => ({ ...prev, [seasonId]: toDraft(updated) }))
      mutateSeasons()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSavingId(null)
    }
  }

  const activeSeason = seasons.find((s) => ACTIVE_STATUSES.includes(s.status))

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Configuration</h1>

      {activeSeason ? (
        <div className="bg-white border border-hairline rounded-card shadow-sm p-6 dark:bg-ink-800 dark:border-ink-700">
          <p className="label-eyebrow text-brand-purple dark:text-brand-lilac mb-2">Active season</p>
          <p className="text-3xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">{activeSeason.label}</p>
          <p className="text-ink-500 text-sm mt-1 dark:text-ink-400">
            {activeSeason.status === 'registration_open' ? 'Registration open' : 'In progress'} &middot;{' '}
            {activeSeason.fpl_league_name || 'League name not set'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-hairline rounded-card shadow-sm p-6 text-ink-500 text-sm dark:bg-ink-800 dark:border-ink-700 dark:text-ink-400">
          No active or registration-open season right now.
        </div>
      )}

      {error && <p className="text-status-danger text-sm">{error}</p>}

      <div className="space-y-4">
        {seasons.map((season) => {
          const draft = drafts[season.id]
          if (!draft) return null
          const percentTotal = PRIZE_PERCENT_FIELDS.reduce((sum, f) => sum + (draft.prizePool.season_prizes[f.key] || 0), 0)

          return (
            <div key={season.id} className="bg-white border border-hairline rounded-card shadow-sm p-6 space-y-6 dark:bg-ink-800 dark:border-ink-700">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">{season.label}</h2>
                  <span
                    className={`text-xs font-medium ${
                      ACTIVE_STATUSES.includes(season.status) ? 'text-status-success' : 'text-ink-500 dark:text-ink-400'
                    }`}
                  >
                    {season.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="label-eyebrow mb-1">FPL League</p>
                  <p className="text-ink-700 dark:text-ink-300">{season.fpl_league_name || '—'}</p>
                </div>
                <div>
                  <p className="label-eyebrow mb-1">Join Code</p>
                  <p className="text-ink-700 font-mono dark:text-ink-300">{season.fpl_league_join_code || '—'}</p>
                </div>
                <div>
                  <p className="label-eyebrow mb-1">Gameweeks</p>
                  <p className="text-ink-700 dark:text-ink-300">
                    {season.fpl_start_event ?? '—'} – {season.fpl_end_event ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="label-eyebrow mb-1">Created</p>
                  <p className="text-ink-700 dark:text-ink-300">{new Date(season.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 dark:border-ink-700">
                <div>
                  <label className="label-eyebrow block mb-2">Entry fee (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.entryFeeNaira}
                    onChange={(e) => setDraft(season.id, { entryFeeNaira: Number(e.target.value) })}
                    className="w-full bg-white border border-hairline rounded-lg px-4 py-2 text-sm text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                  />
                </div>
                <div>
                  <label className="label-eyebrow block mb-2">Max challenges / week</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.weeklyLimit}
                    onChange={(e) => setDraft(season.id, { weeklyLimit: Number(e.target.value) })}
                    className="w-full bg-white border border-hairline rounded-lg px-4 py-2 text-sm text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                  />
                </div>
                <div>
                  <label className="label-eyebrow block mb-2">Season close date</label>
                  <input
                    type="datetime-local"
                    value={draft.endsAt}
                    onChange={(e) => setDraft(season.id, { endsAt: e.target.value })}
                    className="w-full bg-white border border-hairline rounded-lg px-4 py-2 text-sm text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                  />
                </div>
                <div>
                  <label className="label-eyebrow block mb-2">Season prize eligibility cutoff (GW)</label>
                  <input
                    type="number"
                    min={1}
                    max={38}
                    placeholder="e.g. 10"
                    value={draft.prizeEligibilityCutoffEvent}
                    onChange={(e) =>
                      setDraft(season.id, {
                        prizeEligibilityCutoffEvent: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="w-full bg-white border border-hairline rounded-lg px-4 py-2 text-sm text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                  />
                  <p className="text-xs text-ink-500 mt-1 dark:text-ink-400">
                    Managers must register before this gameweek&apos;s deadline to be eligible for season-end
                    prizes. Registration itself always stays open all season.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline space-y-4 dark:border-ink-700">
                <p className="label-eyebrow">Prize pool</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-ink-500 block mb-2 dark:text-ink-400">Minimum players for prizes to run</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.prizePool.minimum_players}
                      onChange={(e) =>
                        setDraft(season.id, { prizePool: { ...draft.prizePool, minimum_players: Number(e.target.value) } })
                      }
                      className="w-full bg-white border border-hairline rounded-lg px-4 py-2 text-sm text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id={`weekly-enabled-${season.id}`}
                      checked={draft.prizePool.weekly_prize.enabled}
                      onChange={(e) =>
                        setDraft(season.id, {
                          prizePool: { ...draft.prizePool, weekly_prize: { ...draft.prizePool.weekly_prize, enabled: e.target.checked } },
                        })
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor={`weekly-enabled-${season.id}`} className="text-xs text-ink-500 dark:text-ink-400">
                      Weekly gameweek-winner prize enabled
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-ink-500 block mb-2 dark:text-ink-400">Weekly prize amount (₦)</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.prizePool.weekly_prize.amount_kobo}
                      disabled={!draft.prizePool.weekly_prize.enabled}
                      onChange={(e) =>
                        setDraft(season.id, {
                          prizePool: {
                            ...draft.prizePool,
                            weekly_prize: { ...draft.prizePool.weekly_prize, amount_kobo: Number(e.target.value) },
                          },
                        })
                      }
                      className="w-full bg-white border border-hairline rounded-lg px-4 py-2 text-sm text-ink-900 disabled:opacity-50 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-ink-500 mb-2 dark:text-ink-400">
                    Season-end split — percent of the collected registration pool paid to each rank
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {PRIZE_PERCENT_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="text-xs text-ink-500 block mb-1 dark:text-ink-400">{f.label}</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={draft.prizePool.season_prizes[f.key]}
                            onChange={(e) => setPrizePercent(season.id, f.key, Number(e.target.value))}
                            className="w-full bg-white border border-hairline rounded-lg pl-3 pr-7 py-2 text-sm text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs mt-2 ${percentTotal > 100 ? 'text-status-danger' : 'text-ink-500 dark:text-ink-400'}`}>
                    Total: {percentTotal}%{percentTotal > 100 ? ' — exceeds 100% of the pool' : ''}
                  </p>
                </div>
              </div>

              {breakdowns[season.id] && (
                <div className="pt-4 border-t border-hairline dark:border-ink-700">
                  <p className="label-eyebrow mb-3">Current pool (live)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="bg-ink-100 rounded-lg p-3 dark:bg-white/5">
                      <p className="text-xs text-ink-500 dark:text-ink-400">Collected</p>
                      <p className="font-semibold text-ink-900 dark:text-ink-100">₦{(breakdowns[season.id].pool_kobo / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-ink-100 rounded-lg p-3 dark:bg-white/5">
                      <p className="text-xs text-ink-500 dark:text-ink-400">Paid entries</p>
                      <p className="font-semibold text-ink-900 dark:text-ink-100">
                        {breakdowns[season.id].paid_entries}
                        {breakdowns[season.id].minimum_players > 0 && (
                          <span className="text-xs text-ink-500 font-normal dark:text-ink-400"> / {breakdowns[season.id].minimum_players} min</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-ink-100 rounded-lg p-3 dark:bg-white/5">
                      <p className="text-xs text-ink-500 dark:text-ink-400">Allocated to prizes</p>
                      <p className="font-semibold text-ink-900 dark:text-ink-100">₦{(breakdowns[season.id].allocated_kobo / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-ink-100 rounded-lg p-3 dark:bg-white/5">
                      <p className="text-xs text-ink-500 dark:text-ink-400">Platform profit</p>
                      <p className={`font-semibold ${(breakdowns[season.id].platform_profit_kobo ?? 0) < 0 ? 'text-status-danger' : 'text-ink-900 dark:text-ink-100'}`}>
                        ₦{((breakdowns[season.id].platform_profit_kobo ?? 0) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-hairline flex items-center gap-3 dark:border-ink-700">
                <button
                  onClick={() => handleSave(season.id)}
                  disabled={savingId === season.id}
                  className="flex items-center gap-2 bg-brand-purple text-white font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {savingId === season.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedId === season.id ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save configuration
                </button>
              </div>
            </div>
          )
        })}

        {seasons.length === 0 && <p className="text-ink-500 text-sm dark:text-ink-400">No seasons found.</p>}
      </div>
    </AdminLayout>
  )
}
