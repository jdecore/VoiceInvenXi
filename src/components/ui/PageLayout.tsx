import { type ReactNode } from 'react'
import { NavBar } from './NavBar'

interface PageLayoutProps {
  children: ReactNode
  header?: ReactNode
  nav?: boolean
  navExtra?: ReactNode
  scroll?: boolean
  contentClassName?: string
  className?: string
}

export function PageLayout({
  children,
  header,
  nav = false,
  navExtra,
  scroll = true,
  contentClassName = '',
  className = '',
}: PageLayoutProps) {
  const contentClasses = scroll
    ? 'page-scroll scrollbar-thin'
    : 'page-fixed'

  return (
    <div className={`page ${className}`}>
      {header}
      <div className={`${contentClasses} ${contentClassName}`}>
        {children}
      </div>
      {nav && (
        <div className="nav-dock">
          <NavBar />
          {navExtra}
        </div>
      )}
    </div>
  )
}
