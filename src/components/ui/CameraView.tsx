import { useEffect, useRef, useState } from 'react'

interface CameraViewProps {
  showOverlay?: boolean
}

export function CameraView({ showOverlay = true }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsActive(true)
      }
    } catch {
      setIsActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
  }

  return (
    <div className="relative flex-1 bg-surface-2 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
          <p className="text-on-surface-muted text-sm">Cámara no disponible</p>
        </div>
      )}
      {showOverlay && isActive && <ScanOverlay />}
    </div>
  )
}

function ScanOverlay() {
  const [lineTop, setLineTop] = useState(0)

  useEffect(() => {
    let frame: number
    let position = 0
    let direction = 1

    const animate = () => {
      position += direction * 1.5
      if (position >= 100 || position <= 0) direction *= -1
      setLineTop(position)
      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[min(70vw,260px)] h-[min(70vw,260px)]
        border-2 border-brand/60 rounded-2xl
        shadow-[0_0_60px_rgba(249,115,22,0.15)]
        animate-glow-pulse
      ">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-brand rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-brand rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-brand rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-brand rounded-br-lg" />
        <div
          className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent"
          style={{ top: `${lineTop}%` }}
        />
      </div>
    </div>
  )
}
