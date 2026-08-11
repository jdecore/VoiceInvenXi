import { type ReactNode } from 'react'
import { Package } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-4">
          {icon}
        </div>
      )}
      {!icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-4">
          <Package className="w-8 h-8 text-on-surface-muted" />
        </div>
      )}
      <h3 className="text-on-surface text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-on-surface-muted text-sm mt-1 max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
