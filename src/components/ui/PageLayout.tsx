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
    ? 'relative flex-1 overflow-y-auto'
    : 'relative flex-1 overflow-hidden flex flex-col'

  return (
    <div className={`relative h-full flex flex-col bg-surface overflow-hidden ${className}`}>
      {header}
      <div className={`${contentClasses} ${contentClassName}`}>
        {children}
      </div>
      {nav && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <NavBar />
          {navExtra}
        </div>
      )}
    </div>
  )
}