'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/theme'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-white p-0.5 dark:border-ink-700 dark:bg-ink-800">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const active = theme === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-label={opt.label}
            title={opt.label}
            className={`flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
              active
                ? 'bg-brand-purple-light text-brand-purple dark:bg-brand-purple/20 dark:text-brand-lilac'
                : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
