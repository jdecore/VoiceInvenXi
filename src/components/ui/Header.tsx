import { type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  action?: ReactNode
}

export function Header({ title, subtitle, showBack = true, action }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-on-surface truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-on-surface-muted truncate">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
