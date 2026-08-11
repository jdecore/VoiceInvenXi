import { type ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-surface overflow-hidden">
      {/* Ambient background - only visible on desktop */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20vh] -left-[10vw] w-[55vw] h-[55vw] rounded-full bg-brand/10 blur-[120px] animate-[float_18s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[15vh] -right-[10vw] w-[50vw] h-[50vw] rounded-full bg-success/8 blur-[120px] animate-[float_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[30vh] right-[20vw] w-[45vw] h-[45vw] rounded-full bg-brand-light/6 blur-[120px] animate-[float_26s_ease-in-out_infinite]" />
      </div>

      {/* Phone frame */}
      <div className="
        relative z-10
        h-full w-full min-h-dvh
        lg:h-[844px] lg:min-h-0 lg:max-w-[480px] lg:rounded-[44px]
        lg:border lg:border-outline-variant/30
        lg:shadow-[0_20px_80px_rgba(0,0,0,0.12)]
        overflow-hidden
        bg-surface
      ">
        {children}
      </div>
    </div>
  )
}
