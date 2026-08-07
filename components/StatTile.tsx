import { type LucideIcon } from 'lucide-react'

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const valueColor =
    tone === 'success'
      ? 'text-status-success'
      : tone === 'warning'
        ? 'text-status-warning'
        : tone === 'danger'
          ? 'text-status-danger'
          : 'text-ink-900 dark:text-ink-100'

  return (
    <div className="bg-white border border-hairline rounded-card shadow-sm p-4 dark:bg-ink-800 dark:border-ink-700">
      <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-semibold tracking-tight mt-1 ${valueColor}`}>{value}</p>
    </div>
  )
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{children}</div>
}
