import { type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { IconArrowLeft } from '@tabler/icons-react'

interface HeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  action?: ReactNode
}

export function Header({ title, subtitle, showBack = true, action }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="header">
      {showBack && (
        <button onClick={() => navigate(-1)} className="header-back" aria-label="Volver">
          <IconArrowLeft />
        </button>
      )}
      <div className="header-title-wrap">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
