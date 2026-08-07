import { type ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="relative h-full w-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20vh] -left-[10vw] w-[55vw] h-[55vw] rounded-full bg-[#4F8CFF]/20 blur-[120px] animate-[float_18s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[15vh] -right-[10vw] w-[50vw] h-[50vw] rounded-full bg-[#2ECC71]/15 blur-[120px] animate-[float_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[30vh] right-[20vw] w-[45vw] h-[45vw] rounded-full bg-[#9B59B6]/10 blur-[120px] animate-[float_26s_ease-in-out_infinite]" />
      </div>

      {/* Phone frame - visible on desktop */}
      <div className="
        relative z-10
        h-dvh w-full max-w-[480px]
        lg:h-[844px] lg:rounded-[44px] lg:border lg:border-white/10
        lg:shadow-[0_20px_80px_rgba(0,0,0,0.5)]
        overflow-hidden
        bg-transparent
      ">
        {children}
      </div>
    </div>
  )
}
