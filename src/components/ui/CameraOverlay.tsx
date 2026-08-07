import { useEffect, useRef } from 'react'

interface CameraOverlayProps {
  isActive?: boolean
}

export function CameraOverlay({ isActive = true }: CameraOverlayProps) {
  const scanLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || !scanLineRef.current) return

    let position = 0
    let direction = 1
    const speed = 2

    const animate = () => {
      position += speed * direction
      if (position >= 100 || position <= 0) direction *= -1

      if (scanLineRef.current) {
        scanLineRef.current.style.top = `${position}%`
      }

      requestAnimationFrame(animate)
    }

    const frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isActive])

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Main scan area */}
      <div className="relative w-[70vw] h-[70vw] max-w-[260px] max-h-[260px]">
        {/* Corner markers */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-[3px] border-t-[3px] border-[#2ECC71] rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-[3px] border-t-[3px] border-[#2ECC71] rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-[3px] border-b-[3px] border-[#2ECC71] rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-[3px] border-b-[3px] border-[#2ECC71] rounded-br-lg" />

        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-[2px] bg-[#2ECC71]/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-8 bg-[#2ECC71]/60" />
        </div>

        {/* Scan line */}
        {isActive && (
          <div
            ref={scanLineRef}
            className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#2ECC71] to-transparent"
            style={{ top: '0%' }}
          />
        )}

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl shadow-[0_0_60px_rgba(46,204,113,0.15)] animate-glow-pulse" />
      </div>

      {/* Hint text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/60 text-sm font-medium">
          Apunta al código de barras
        </p>
      </div>
    </div>
  )
}
