'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { adminLogin, adminLogout, type AdminUser } from './api'

interface AuthContextValue {
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('loc_admin_access_token')
    if (stored) setToken(stored)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { access_token, refresh_token } = await adminLogin(email, password)
    localStorage.setItem('loc_admin_access_token', access_token)
    localStorage.setItem('loc_admin_refresh_token', refresh_token)
    setToken(access_token)
  }

  const logout = () => {
    adminLogout() // revoke server-side; fire-and-forget, local logout doesn't wait on it
    localStorage.removeItem('loc_admin_access_token')
    localStorage.removeItem('loc_admin_refresh_token')
    setToken(null)
  }

  return <AuthContext.Provider value={{ token, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
