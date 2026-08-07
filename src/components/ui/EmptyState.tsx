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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.1] mb-4">
        {icon || <Package className="w-8 h-8 text-white/30" />}
      </div>
      <h3 className="text-white/90 text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-white/50 text-sm max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
