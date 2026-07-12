'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function IndexPage() {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    router.replace(token ? '/standings' : '/login')
  }, [loading, token, router])

  return null
}
