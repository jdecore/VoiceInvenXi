import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { FAB, NavBar, PageLayout } from '@/components/ui'
import { useCamera } from '@/hooks/useCamera'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { MOCK_PRODUCTS } from '@/constants'

export function ScanPage() {
  const navigate = useNavigate()
  const { videoRef, isActive, start, stop } = useCamera()
  const { speak } = useTTS()
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    start()
    speak('Apunta la cámara al código de barras')
    return () => stop()
  }, [])

  const handleScan = useCallback(async (barcode: string) => {
    if (isScanning) return
    setIsScanning(true)

    try {
      const product = await productApi.getByBarcode(barcode)
      navigate(`/product/${product.barcode}`)
    } catch {
      navigate(`/new/${barcode}`)
    } finally {
      setTimeout(() => setIsScanning(false), 3000)
    }
  }, [navigate, isScanning])

  const handleSimulateScan = () => {
    const randomProduct = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)]
    handleScan(randomProduct.barcode)
  }

  const handleMic = () => {
    navigate('/search?voice=true')
  }

  return (
    <PageLayout>
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

        {isActive && <ScanOverlay />}

        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-on-surface text-lg font-bold">VoiceInvenXi</h1>
          <button
            onClick={handleSimulateScan}
            className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm
              text-on-surface text-xs font-medium shadow-sm
              hover:bg-white transition-colors"
          >
            Simular escaneo
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-white border-t border-outline-variant/50">
        <NavBar />
        <FAB onClick={handleMic} />
      </div>
    </PageLayout>
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
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[min(70vw,260px)] h-[min(70vw,260px)]
        border-2 border-brand/60 rounded-2xl
        shadow-[0_0_60px_rgba(249,115,22,0.15)]
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
