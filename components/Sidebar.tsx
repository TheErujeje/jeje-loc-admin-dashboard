'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Users, Trophy, Settings, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'

const links = [
  { name: 'Payouts', path: '/payouts', icon: Wallet },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Prize Rules', path: '/prize-rules', icon: Trophy },
  { name: 'Configuration', path: '/configuration', icon: Settings },
]

export function Sidebar() {
  const { logout } = useAuth()
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 border-r border-stadium-700 min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <ShieldCheck className="h-6 w-6 text-pitch-green" />
        <span className="font-heading font-bold tracking-wider">LOC ADMIN</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const active = pathname === link.path
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-heading text-sm tracking-wide transition-colors ${
                active
                  ? 'bg-stadium-800 text-pitch-green border-l-2 border-pitch-green'
                  : 'text-gray-400 hover:text-white hover:bg-stadium-800/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-6 py-5 border-t border-stadium-700 text-gray-400 hover:text-white text-sm"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </aside>
  )
}
