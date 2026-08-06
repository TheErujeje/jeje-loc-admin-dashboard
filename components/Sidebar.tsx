'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Users, Trophy, Settings, LogOut, ListOrdered, Swords } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Logo } from './Logo'

const groups = [
  {
    label: 'Overview',
    links: [{ name: 'Standings', path: '/standings', icon: ListOrdered }],
  },
  {
    label: 'Management',
    links: [
      { name: 'Payouts', path: '/payouts', icon: Wallet },
      { name: 'Challenges', path: '/challenges', icon: Swords },
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Prize Rules', path: '/prize-rules', icon: Trophy },
    ],
  },
  {
    label: 'Settings',
    links: [{ name: 'Configuration', path: '/configuration', icon: Settings }],
  },
]

export function Sidebar() {
  const { logout } = useAuth()
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-hairline bg-white min-h-screen lg:flex lg:flex-col dark:border-ink-700 dark:bg-ink-900">
      <div className="flex items-center gap-2 px-6 py-6">
        <Logo className="h-12 w-12 text-brand-purple dark:text-brand-lilac" />
        <span className="font-semibold text-ink-900 tracking-tight dark:text-ink-100">LOC Admin</span>
      </div>

      <nav className="flex-1 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="label-eyebrow px-3 mb-2 dark:text-ink-500">{group.label}</div>
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon
                const active = pathname === link.path
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-brand-purple-light text-brand-purple font-medium dark:bg-brand-purple/20 dark:text-brand-lilac'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/5 dark:hover:text-ink-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-6 py-5 border-t border-hairline text-ink-500 hover:text-status-danger text-sm transition-colors dark:border-ink-700 dark:text-ink-400"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </aside>
  )
}
