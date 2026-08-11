import { type ReactNode } from 'react'

interface GlassDrawerProps {
  children: ReactNode
  className?: string
}

export function GlassDrawer({ children, className = '' }: GlassDrawerProps) {
  return (
    <div
      className={`
        relative z-40 mt-auto
        min-h-[120px] pb-[env(safe-area-inset-bottom)]
        bg-[rgba(18,18,26,0.92)] backdrop-blur-xl backdrop-saturate-[180%]
        border-t border-[rgba(255,255,255,0.12)]
        rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]
        ${className}
      `}
    >
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      {children}
    </div>
  )
}
