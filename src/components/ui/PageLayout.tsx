import { type ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`h-full flex flex-col bg-surface overflow-hidden ${className}`}>
      {children}
    </div>
  )
}
