'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSeason } from '@/lib/season'
import { fetchPrizeRules, createPrizeRule, type PrizeRule } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

export default function PrizeRulesPage() {
  const { token } = useAuth()
  const { seasonId } = useSeason()
  const [rules, setRules] = useState<PrizeRule[]>([])
  const [form, setForm] = useState({
    label: '',
    scope: 'gameweek',
    competition_type: 'classic',
    rank_target: 1,
    amount_naira: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!token || !seasonId) return
    setRules(await fetchPrizeRules(token, seasonId))
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load prize rules'))
  }, [token, seasonId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !seasonId) return
    setSubmitting(true)
    setError(null)
    try {
      await createPrizeRule(token, {
        season_id: seasonId,
        label: form.label,
        scope: form.scope,
        competition_type: form.competition_type,
        rank_target: form.rank_target,
        amount_kobo: Math.round(form.amount_naira * 100),
      })
      setForm({ label: '', scope: 'gameweek', competition_type: 'classic', rank_target: 1, amount_naira: 0 })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create prize rule')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-heading font-bold">Prize Rules</h1>

        <form onSubmit={handleSubmit} className="bg-stadium-800 border border-stadium-700 rounded-sm p-6 space-y-4">
          <h2 className="font-heading text-sm tracking-wide text-gray-400">ADD A PRIZE RULE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="Label, e.g. Gameweek Winner"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              className="bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-2"
            />
            <select
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-2"
            >
              <option value="gameweek">Gameweek (weekly)</option>
              <option value="monthly">Monthly</option>
              <option value="season">Season overall</option>
              <option value="h2h_cup">H2H Cup (season end)</option>
            </select>
            <select
              value={form.competition_type}
              onChange={(e) => setForm({ ...form, competition_type: e.target.value })}
              className="bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-2"
            >
              <option value="classic">Classic</option>
              <option value="h2h">Head-to-Head</option>
            </select>
            <input
              type="number"
              min={1}
              placeholder="Rank target (1 = winner)"
              value={form.rank_target}
              onChange={(e) => setForm({ ...form, rank_target: Number(e.target.value) })}
              className="bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-2"
            />
            <input
              type="number"
              min={0}
              placeholder="Amount (NGN)"
              value={form.amount_naira || ''}
              onChange={(e) => setForm({ ...form, amount_naira: Number(e.target.value) })}
              required
              className="bg-stadium-900 border border-stadium-700 rounded-sm px-4 py-2 sm:col-span-2"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-pitch-green text-stadium-900 font-heading font-bold px-4 py-2 rounded-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Rule
          </button>
        </form>

        <div className="overflow-x-auto rounded-sm border border-stadium-700">
          <table className="w-full text-sm">
            <thead className="bg-stadium-800 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-stadium-800">
                  <td className="px-4 py-3">{r.label}</td>
                  <td className="px-4 py-3">{r.scope}</td>
                  <td className="px-4 py-3">{r.competition_type}</td>
                  <td className="px-4 py-3">{r.rank_target}</td>
                  <td className="px-4 py-3">₦{(r.amount_kobo / 100).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.is_active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No prize rules configured yet for the current season.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </AdminLayout>
  )
}
