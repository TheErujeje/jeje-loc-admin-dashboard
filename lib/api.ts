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
  event_id: number | null
  user_id: number
  amount_kobo: number
  status: string
  calculated_at: string
  approved_at: string | null
  paid_at: string | null
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Access token expired (30 min TTL) or invalid — every admin page shares this
    // fetch path, so handling it once here means a stale session always sends the
    // user back to /login instead of pages getting stuck silently mid-fetch.
    localStorage.removeItem('loc_admin_access_token')
    localStorage.removeItem('loc_admin_refresh_token')
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Session expired — please log in again')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handle<{ access_token: string; refresh_token: string }>(res)
}

export async function fetchUsers(token: string) {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
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

export async function fetchSeasonUsers(token: string, seasonId: string) {
  const res = await fetch(`${API_BASE_URL}/admin/seasons/${seasonId}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handle<SeasonUser[]>(res)
}

export async function fetchPayouts(token: string, seasonId?: string, status?: string) {
  const url = new URL(`${API_BASE_URL}/payouts`)
  if (status) url.searchParams.set('status_filter', status)
  if (seasonId) url.searchParams.set('season_id', seasonId)
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
  return handle<Payout[]>(res)
}

export async function triggerSyncAndCalculate(token: string, seasonId: string) {
  const res = await fetch(`${API_BASE_URL}/payouts/sync-and-calculate/${seasonId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
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

export async function fetchPrizeRules(token: string, seasonId: string) {
  const res = await fetch(`${API_BASE_URL}/admin/prize-rules?season_id=${seasonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handle<PrizeRule[]>(res)
}

export async function createPrizeRule(
  token: string,
  body: {
    season_id: string
    label: string
    scope: string
    competition_type: string
    rank_target: number
    amount_kobo: number
  }
) {
  const res = await fetch(`${API_BASE_URL}/admin/prize-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

export async function fetchSeasons(token: string) {
  const res = await fetch(`${API_BASE_URL}/admin/seasons`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handle<Season[]>(res)
}

export async function updateSeasonEndsAt(token: string, seasonId: string, seasonEndsAt: string | null) {
  const res = await fetch(`${API_BASE_URL}/admin/seasons/${seasonId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

export async function fetchStandings(token: string, seasonId: string, eventId?: number) {
  const url = new URL(`${API_BASE_URL}/fpl/seasons/${seasonId}/standings`)
  if (eventId) url.searchParams.set('event_id', String(eventId))
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
  return handle<{ event_id: number | null; results: StandingRow[] }>(res)
}

export async function approvePayoutByToken(token: string) {
  const res = await fetch(`${API_BASE_URL}/payouts/approve?token=${encodeURIComponent(token)}`)
  return handle<{ payout_id: string; status: string; message: string }>(res)
}
