'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader2, Plus, Pencil, Check, X, Trophy, Settings, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import {
  fetchPrizeRules,
  createPrizeRule,
  updatePrizeRule,
  deletePrizeRule,
  fetchAdminPrizePool,
  fetchSeasons,
  updateSeason,
  type PrizeRule,
  type PrizePoolConfig,
} from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'
import { Select } from '@/components/ui/Select'

type EditForm = {
  label: string
  scope: string
  competition_type: string
  rank_target: number
  amount_naira: number
  is_active: boolean
}

function toEditForm(r: PrizeRule): EditForm {
  return {
    label: r.label,
    scope: r.scope,
    competition_type: r.competition_type,
    rank_target: r.rank_target,
    amount_naira: (r.amount_kobo ?? 0) / 100,
    is_active: r.is_active,
  }
}

// Matches the fixed order payout_engine.SEASON_PRIZE_SLOTS returns breakdown
// rows in — there's no other way to tie a breakdown row back to its config key.
const SEASON_PRIZE_KEYS: (keyof PrizePoolConfig['season_prizes'])[] = [
  'winner_percent',
  'runner_up_percent',
  'third_place_percent',
  'fourth_to_tenth_percent',
  'eleventh_to_fifteenth_percent',
]
// How many ranks share each slot's percentage — same order as SEASON_PRIZE_KEYS.
const SEASON_PRIZE_RANGE_SIZES = [1, 1, 1, 7, 5]

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`
}

export default function PrizeRulesPage() {
  const { token } = useAuth()
  const { seasonId } = useSeason()
  const canLoad = Boolean(token) && Boolean(seasonId)

  const {
    data: rules = [],
    error: rulesErrObj,
    mutate: mutateRules,
  } = useSWR(canLoad ? ['prize-rules', seasonId] : null, () => fetchPrizeRules(seasonId as string))
  const { data: pool, mutate: mutatePool } = useSWR(canLoad ? ['admin-prize-pool', seasonId] : null, () =>
    fetchAdminPrizePool(seasonId as string)
  )
  // Shares the 'seasons' cache key with the Configuration page — navigating
  // between the two reuses the same cached list instead of refetching.
  const { data: seasons = [], mutate: mutateSeasons } = useSWR(token ? 'seasons' : null, fetchSeasons)
  const season = seasons.find((s) => s.id === seasonId) || null

  const [percentDraft, setPercentDraft] = useState<PrizePoolConfig['season_prizes'] | null>(null)
  const [editingPercents, setEditingPercents] = useState(false)
  const [savingPercents, setSavingPercents] = useState(false)
  const [percentsSaved, setPercentsSaved] = useState(false)
  const [form, setForm] = useState({
    label: '',
    scope: 'gameweek',
    competition_type: 'classic',
    rank_target: 1,
    amount_naira: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const error = actionError ?? (rulesErrObj ? (rulesErrObj instanceof Error ? rulesErrObj.message : 'Could not load prize rules') : null)

  // Skipped while actively editing so a background revalidation (tab
  // refocus etc.) can't stomp percentages the admin hasn't saved yet.
  useEffect(() => {
    if (!season || editingPercents) return
    setPercentDraft({ ...season.prize_pool_config.season_prizes })
  }, [season, editingPercents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !seasonId) return
    setSubmitting(true)
    setActionError(null)
    try {
      await createPrizeRule({
        season_id: seasonId,
        label: form.label,
        scope: form.scope,
        competition_type: form.competition_type,
        rank_target: form.rank_target,
        amount_kobo: Math.round(form.amount_naira * 100),
      })
      setForm({ label: '', scope: 'gameweek', competition_type: 'classic', rank_target: 1, amount_naira: 0 })
      mutateRules()
      mutatePool()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not create prize rule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSavePercents = async () => {
    if (!seasonId || !season || !percentDraft) return
    setSavingPercents(true)
    setPercentsSaved(false)
    setActionError(null)
    try {
      await updateSeason(seasonId, {
        prize_pool_config: {
          minimum_players: season.prize_pool_config.minimum_players,
          weekly_prize: season.prize_pool_config.weekly_prize,
          season_prizes: percentDraft,
        },
      })
      setPercentsSaved(true)
      setEditingPercents(false)
      mutateSeasons()
      mutatePool()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save percentages')
    } finally {
      setSavingPercents(false)
    }
  }

  const startEditPercents = () => {
    setActionError(null)
    setPercentsSaved(false)
    setPercentDraft(season ? { ...season.prize_pool_config.season_prizes } : null)
    setEditingPercents(true)
  }

  const cancelEditPercents = () => {
    setPercentDraft(season ? { ...season.prize_pool_config.season_prizes } : null)
    setEditingPercents(false)
  }

  const startEdit = (r: PrizeRule) => {
    setActionError(null)
    setEditingId(r.id)
    setEditForm(toEditForm(r))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleDelete = async (r: PrizeRule) => {
    if (!confirm(`Delete "${r.label}"? This can't be undone.`)) return
    setActionError(null)
    setDeletingId(r.id)
    try {
      await deletePrizeRule(r.id)
      mutateRules()
      mutatePool()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete prize')
    } finally {
      setDeletingId(null)
    }
  }

  const saveEdit = async () => {
    if (!editingId || !editForm) return
    setSavingEdit(true)
    setActionError(null)
    try {
      await updatePrizeRule(editingId, {
        label: editForm.label,
        scope: editForm.scope,
        competition_type: editForm.competition_type,
        rank_target: editForm.rank_target,
        amount_kobo: Math.round(editForm.amount_naira * 100),
        is_active: editForm.is_active,
      })
      cancelEdit()
      mutateRules()
      mutatePool()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update prize rule')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Prizes</h1>
        <Link
          href="/configuration"
          className="flex items-center gap-1.5 text-sm text-brand-purple hover:underline dark:text-brand-lilac"
        >
          <Settings className="h-4 w-4" />
          Entry fee, weekly limit &amp; more in Configuration
        </Link>
      </div>

      {error && <p className="text-status-danger text-sm">{error}</p>}

      {pool && (
        <div className="bg-white border border-hairline rounded-card shadow-sm p-6 space-y-6 dark:bg-ink-800 dark:border-ink-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="label-eyebrow text-brand-purple dark:text-brand-lilac mb-1">Current prize pool</p>
              <p className="text-3xl font-semibold text-ink-900 tracking-tight tnum dark:text-ink-100">{formatNaira(pool.pool_kobo)}</p>
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {pool.paid_entries} paid entries
              {pool.minimum_players > 0 && ` / ${pool.minimum_players} min`}
            </p>
          </div>

          {pool.weekly_prize_enabled && (
            <div className="bg-ink-100 rounded-lg px-4 py-3 text-sm text-ink-700 dark:bg-white/5 dark:text-ink-300">
              <span className="font-semibold tnum">{formatNaira(pool.weekly_prize_amount_kobo)}</span> paid to the gameweek
              winner, every gameweek.
            </div>
          )}

          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <p className="label-eyebrow">Season-end split</p>
              <div className="flex items-center gap-3">
                {percentsSaved && (
                  <span className="flex items-center gap-1 text-xs text-status-success">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
                {!editingPercents && (
                  <button
                    onClick={startEditPercents}
                    className="flex items-center gap-1.5 bg-white border border-hairline hover:border-brand-purple text-xs px-3 py-1.5 rounded-md text-ink-700 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-300 dark:hover:border-brand-lilac"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {pool.season_prizes.map((slot, i) => {
                const key = SEASON_PRIZE_KEYS[i]
                const percent = editingPercents ? (percentDraft ? percentDraft[key] : slot.percent) : slot.percent
                const rangeSize = SEASON_PRIZE_RANGE_SIZES[i]
                const previewPerRank = editingPercents
                  ? Math.floor((pool.pool_kobo * percent) / 100 / rangeSize)
                  : slot.per_rank_amount_kobo
                return (
                  <div key={slot.label} className="bg-ink-100 rounded-lg p-3 text-center dark:bg-white/5">
                    <Trophy className="h-4 w-4 mx-auto text-brand-purple mb-1 dark:text-brand-lilac" />
                    <p className="text-xs text-ink-500 mb-1 dark:text-ink-400">{slot.rank_range}</p>
                    <p className="font-semibold text-sm tnum text-ink-900 dark:text-ink-100">{formatNaira(previewPerRank)}</p>
                    {editingPercents ? (
                      <div className="relative mt-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={percent}
                          onChange={(e) => {
                            setPercentsSaved(false)
                            setPercentDraft((prev) => (prev ? { ...prev, [key]: Number(e.target.value) } : prev))
                          }}
                          className="w-full bg-white border border-hairline rounded-md pl-2 pr-6 py-1 text-xs text-ink-900 text-center dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-400">%</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-400 mt-1">{slot.percent}% of pool</p>
                    )}
                  </div>
                )
              })}
            </div>
            {editingPercents && (
              <div className="flex items-center justify-between mt-3">
                <p
                  className={`text-xs ${
                    percentDraft && SEASON_PRIZE_KEYS.reduce((sum, k) => sum + (percentDraft[k] || 0), 0) > 100
                      ? 'text-status-danger'
                      : 'text-ink-400'
                  }`}
                >
                  Total: {percentDraft ? SEASON_PRIZE_KEYS.reduce((sum, k) => sum + (percentDraft[k] || 0), 0) : 0}% of pool
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEditPercents}
                    disabled={savingPercents}
                    className="flex items-center gap-1.5 bg-white border border-hairline text-ink-500 font-medium text-xs px-3 py-1.5 rounded-md disabled:opacity-50 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-400"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePercents}
                    disabled={savingPercents || !percentDraft}
                    className="flex items-center gap-1.5 bg-brand-purple text-white font-medium text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    {savingPercents ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save percentages
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2 border-t border-hairline dark:border-ink-700">
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Allocated to prizes</p>
              <p className="font-semibold text-ink-900 tnum dark:text-ink-100">{formatNaira(pool.allocated_kobo)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Platform profit</p>
              <p className={`font-semibold tnum ${(pool.platform_profit_kobo ?? 0) < 0 ? 'text-status-danger' : 'text-ink-900 dark:text-ink-100'}`}>
                {formatNaira(pool.platform_profit_kobo ?? 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-ink-900 tracking-tight mb-1 dark:text-ink-100">Additional prizes</h2>
        <p className="text-sm text-ink-500 mb-4 dark:text-ink-400">
          One-off or bonus prizes on top of the default split above — e.g. an H2H cup, a monthly bonus, or a special-occasion
          prize. These are flat amounts, not a percentage of the pool.
        </p>

        <form onSubmit={handleSubmit} className="bg-white border border-hairline rounded-card shadow-sm p-6 space-y-4 dark:bg-ink-800 dark:border-ink-700">
          <h3 className="label-eyebrow">Add a prize</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="Label, e.g. H2H Cup Winner"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              className="bg-white border border-hairline rounded-lg px-4 py-2 text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
            />
            <Select
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="bg-white border border-hairline rounded-lg pl-4 py-2 text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
            >
              <option value="gameweek">Gameweek (weekly)</option>
              <option value="monthly">Monthly</option>
              <option value="season">Season overall</option>
              <option value="h2h_cup">H2H Cup (season end)</option>
            </Select>
            <Select
              value={form.competition_type}
              onChange={(e) => setForm({ ...form, competition_type: e.target.value })}
              className="bg-white border border-hairline rounded-lg pl-4 py-2 text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
            >
              <option value="classic">Classic</option>
              <option value="h2h">Head-to-Head</option>
            </Select>
            <input
              type="number"
              min={1}
              placeholder="Rank target (1 = winner)"
              value={form.rank_target}
              onChange={(e) => setForm({ ...form, rank_target: Number(e.target.value) })}
              className="bg-white border border-hairline rounded-lg px-4 py-2 text-ink-900 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
            />
            <input
              type="number"
              min={0}
              placeholder="Amount (NGN)"
              value={form.amount_naira || ''}
              onChange={(e) => setForm({ ...form, amount_naira: Number(e.target.value) })}
              required
              className="bg-white border border-hairline rounded-lg px-4 py-2 text-ink-900 sm:col-span-2 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
            />
          </div>
          {error && <p className="text-status-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-brand-purple text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Prize
          </button>
        </form>

        <div className="overflow-x-auto rounded-card border border-hairline shadow-sm mt-4 dark:border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) =>
                editingId === r.id && editForm ? (
                  <tr key={r.id} className="border-t border-hairline bg-ink-100/50 dark:border-ink-700 dark:bg-white/5">
                    <td className="px-4 py-2">
                      <input
                        value={editForm.label}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        className="w-full bg-white border border-hairline rounded-md px-2 py-1 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Select
                        dense
                        value={editForm.scope}
                        onChange={(e) => setEditForm({ ...editForm, scope: e.target.value })}
                        className="bg-white border border-hairline rounded-md pl-2 py-1 focus:outline-none focus:border-brand-purple dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
                      >
                        <option value="gameweek">Gameweek</option>
                        <option value="monthly">Monthly</option>
                        <option value="season">Season</option>
                        <option value="h2h_cup">H2H Cup</option>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Select
                        dense
                        value={editForm.competition_type}
                        onChange={(e) => setEditForm({ ...editForm, competition_type: e.target.value })}
                        className="bg-white border border-hairline rounded-md pl-2 py-1 focus:outline-none focus:border-brand-purple dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
                      >
                        <option value="classic">Classic</option>
                        <option value="h2h">H2H</option>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        value={editForm.rank_target}
                        onChange={(e) => setEditForm({ ...editForm, rank_target: Number(e.target.value) })}
                        className="w-16 bg-white border border-hairline rounded-md px-2 py-1 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        value={editForm.amount_naira}
                        onChange={(e) => setEditForm({ ...editForm, amount_naira: Number(e.target.value) })}
                        className="w-24 bg-white border border-hairline rounded-md px-2 py-1 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={savingEdit}
                          className="flex items-center gap-1 bg-brand-purple text-white font-medium text-xs px-2 py-1.5 rounded-md disabled:opacity-50"
                        >
                          {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          className="flex items-center gap-1 bg-white border border-hairline text-ink-500 text-xs px-2 py-1.5 rounded-md disabled:opacity-50 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="border-t border-hairline dark:border-ink-700 dark:bg-ink-800">
                    <td className="px-4 py-3 dark:text-ink-100">{r.label}</td>
                    <td className="px-4 py-3 dark:text-ink-100">{r.scope}</td>
                    <td className="px-4 py-3 dark:text-ink-100">{r.competition_type}</td>
                    <td className="px-4 py-3 dark:text-ink-100">{r.rank_target}</td>
                    <td className="px-4 py-3 dark:text-ink-100">{r.amount_kobo != null ? formatNaira(r.amount_kobo) : '—'}</td>
                    <td className="px-4 py-3 dark:text-ink-100">{r.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(r)}
                          className="flex items-center gap-1.5 bg-white border border-hairline hover:border-brand-purple text-xs px-3 py-1.5 rounded-md text-ink-700 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-300 dark:hover:border-brand-lilac"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={deletingId === r.id}
                          className="flex items-center gap-1.5 bg-white border border-hairline hover:border-status-danger hover:text-status-danger text-xs px-3 py-1.5 rounded-md text-ink-700 disabled:opacity-50 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-300"
                        >
                          {deletingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
                    No additional prizes configured for the current season.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
