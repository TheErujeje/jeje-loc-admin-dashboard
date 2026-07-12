'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth'
import { fetchSeasons, type Season } from './api'

const ACTIVE_STATUSES = ['active', 'registration_open']

interface SeasonContextValue {
  seasons: Season[]
  seasonId: string
  setSeasonId: (id: string) => void
  selectedSeason: Season | undefined
  loading: boolean
  error: string | null
}

const SeasonContext = createContext<SeasonContextValue | undefined>(undefined)

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonId, setSeasonId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchSeasons()
      .then((data) => {
        setSeasons(data)
        const active = data.find((s) => ACTIVE_STATUSES.includes(s.status))
        setSeasonId((active || data[0])?.id || '')
        if (data.length === 0) setError('No seasons found.')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load seasons'))
      .finally(() => setLoading(false))
  }, [token])

  const selectedSeason = seasons.find((s) => s.id === seasonId)

  return (
    <SeasonContext.Provider value={{ seasons, seasonId, setSeasonId, selectedSeason, loading, error }}>
      {children}
    </SeasonContext.Provider>
  )
}

export function useSeason() {
  const ctx = useContext(SeasonContext)
  if (!ctx) throw new Error('useSeason must be used within SeasonProvider')
  return ctx
}

export { ACTIVE_STATUSES }
