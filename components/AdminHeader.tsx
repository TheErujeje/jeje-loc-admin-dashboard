'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function AdminHeader() {
  const { logout } = useAuth()
  const pathname = usePathname()

  const links = [
    { name: 'Payouts', path: '/payouts' },
    { name: 'Users', path: '/users' },
    { name: 'Prize Rules', path: '/prize-rules' },
  ]

  return (
    <header className="border-b border-stadium-700 px-4 sm:px-8 py-5 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-pitch-green" />
          <span className="font-heading font-bold tracking-wider">LOC ADMIN</span>
        </div>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`font-heading text-sm tracking-wide ${
                pathname === link.path ? 'text-pitch-green' : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
      <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </header>
  )
}
