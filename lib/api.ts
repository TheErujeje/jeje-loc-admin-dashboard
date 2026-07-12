const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
}

export interface User {
  fpl_entry_id: number
  email: string
  full_name: string
  fpl_team_name: string
  status: string
  created_at: string
}

export interface Payout {
  id: string
  season_id: string
  prize_rule_id: string
  prize_rule_label: string | null
  event_id: number | null
  user_id: number
  full_name: string | null
  fpl_team_name: string | null
  amount_kobo: number
  status: string
  failure_reason: string | null
  calculated_at: string
  approved_at: string | null
  paid_at: string | null
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

function clearSessionAndRedirect() {
  localStorage.removeItem('loc_admin_access_token')
  localStorage.removeItem('loc_admin_refresh_token')
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

let refreshInFlight: Promise<string | null> | null = null

// Access tokens expire in 30 min. Rather than send the user back to /login on
// every 401, try exchanging the (30-day) refresh token for a new pair first —
// only fall back to a hard redirect if the refresh token is also gone/expired.
// refreshInFlight collapses concurrent 401s (several requests can fail at
// once) into a single refresh call instead of racing multiple rotations.
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem('loc_admin_refresh_token')
    if (!refreshToken) return null

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return null
      const data = await res.json()
      localStorage.setItem('loc_admin_access_token', data.access_token)
      localStorage.setItem('loc_admin_refresh_token', data.refresh_token)
      return data.access_token as string
    } catch {
      return null
    }
  })()

  const result = await refreshInFlight
  refreshInFlight = null
  return result
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('loc_admin_access_token')
  const withAuth = (t: string | null): RequestInit => ({
    ...init,
    headers: { ...init.headers, ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  })

  const res = await fetch(`${API_BASE_URL}${path}`, withAuth(token))
  if (res.status !== 401) return res

  const newToken = await refreshAccessToken()
  if (!newToken) {
    clearSessionAndRedirect()
    return res
  }
  return fetch(`${API_BASE_URL}${path}`, withAuth(newToken))
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handle<{ access_token: string; refresh_token: string }>(res)
}

export async function adminLogout() {
  const refreshToken = localStorage.getItem('loc_admin_refresh_token')
  if (!refreshToken) return
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {})
}

export async function fetchUsers() {
  const res = await authedFetch('/admin/users')
  return handle<User[]>(res)
}

export interface SeasonUser {
  fpl_entry_id: number
  email: string
  full_name: string
  fpl_team_name: string
  phone: string | null
  league_entry_status: string
  in_h2h: boolean
  registered_at: string
  joined_at: string | null
}

export async function fetchSeasonUsers(seasonId: string) {
  const res = await authedFetch(`/admin/seasons/${seasonId}/users`)
  return handle<SeasonUser[]>(res)
}

export async function fetchPayouts(seasonId?: string, status?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status_filter', status)
  if (seasonId) params.set('season_id', seasonId)
  const qs = params.toString()
  const res = await authedFetch(`/payouts${qs ? `?${qs}` : ''}`)
  return handle<Payout[]>(res)
}

export async function triggerSyncAndCalculate(seasonId: string) {
  const res = await authedFetch(`/payouts/sync-and-calculate/${seasonId}`, { method: 'POST' })
  return handle<{ newly_final_gameweeks: number[]; payouts_created: number }>(res)
}

export async function fetchCurrentSeason() {
  const res = await fetch(`${API_BASE_URL}/fpl/seasons/current`)
  return handle<{ id: string; label: string; status: string }>(res)
}

export interface PrizeRule {
  id: string
  season_id: string
  label: string
  scope: string
  competition_type: string
  rank_target: number
  amount_kobo: number
  is_active: boolean
}

export async function fetchPrizeRules(seasonId: string) {
  const res = await authedFetch(`/admin/prize-rules?season_id=${seasonId}`)
  return handle<PrizeRule[]>(res)
}

export async function createPrizeRule(body: {
  season_id: string
  label: string
  scope: string
  competition_type: string
  rank_target: number
  amount_kobo: number
}) {
  const res = await authedFetch('/admin/prize-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handle<PrizeRule>(res)
}

export interface Season {
  id: string
  label: string
  status: string
  fpl_classic_league_id: number
  fpl_league_name: string | null
  fpl_league_join_code: string | null
  entry_fee_kobo: number
  currency: string
  registration_opens_at: string | null
  registration_closes_at: string | null
  season_ends_at: string | null
  fpl_start_event: number | null
  fpl_end_event: number | null
  created_at: string
}

export async function fetchSeasons() {
  const res = await authedFetch('/admin/seasons')
  return handle<Season[]>(res)
}

export async function updateSeasonEndsAt(seasonId: string, seasonEndsAt: string | null) {
  const res = await authedFetch(`/admin/seasons/${seasonId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ season_ends_at: seasonEndsAt }),
  })
  return handle<Season>(res)
}

export interface StandingRow {
  user_id: number
  fpl_team_name: string
  full_name: string
  gw_points: number
  gw_rank: number | null
  total_points: number
  overall_rank: number | null
}

export async function fetchStandings(seasonId: string, eventId?: number) {
  const params = new URLSearchParams()
  if (eventId) params.set('event_id', String(eventId))
  const qs = params.toString()
  const res = await authedFetch(`/fpl/seasons/${seasonId}/standings${qs ? `?${qs}` : ''}`)
  return handle<{ event_id: number | null; results: StandingRow[] }>(res)
}

export async function approvePayoutByToken(token: string) {
  const res = await fetch(`${API_BASE_URL}/payouts/approve?token=${encodeURIComponent(token)}`)
  return handle<{ payout_id: string; status: string; message: string }>(res)
}

export async function approvePayoutDirect(payoutId: string) {
  const res = await authedFetch(`/payouts/${payoutId}/approve`, { method: 'POST' })
  return handle<{ payout_id: string; status: string; message: string }>(res)
}
