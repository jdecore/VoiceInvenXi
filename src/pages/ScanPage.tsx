import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { CameraOverlay, GlassDrawer, SearchBar, ScanBadge, BottomNav, useToast } from '@/components/ui'
import { useCamera } from '@/hooks/useCamera'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { MOCK_PRODUCTS } from '@/constants'

export function ScanPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { videoRef, isActive, start, stop } = useCamera()
  const { speak } = useTTS()
  const [lastScanned] = useState<{ name: string; quantity: number; type: 'in' | 'out' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const scanCooldown = useRef(false)

  useEffect(() => {
    start()
    speak('Apunta la cámara al código de barras')

    return () => stop()
  }, [])

  const handleScan = useCallback(async (barcode: string) => {
    if (scanCooldown.current) return
    scanCooldown.current = true
    setIsScanning(true)

    try {
      const product = await productApi.getByBarcode(barcode)
      navigate(`/product/${product.barcode}`)
    } catch {
      navigate(`/new/${barcode}`)
    } finally {
      setTimeout(() => {
        scanCooldown.current = false
        setIsScanning(false)
      }, 3000)
    }
  }, [navigate])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast({ variant: 'info', message: 'Escribe algo para buscar' })
      return
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleVoiceSearch = () => {
    navigate('/search?voice=true')
  }

  const handleSimulateScan = () => {
    const randomProduct = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)]
    handleScan(randomProduct.barcode)
  }

  return (
    <div className="relative h-full flex flex-col bg-transparent">
      {/* Camera feed */}
      <div className="relative flex-1 bg-black/80 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Fallback when no camera */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,10,15,0.55)]">
            <p className="text-white/50 text-sm">Cámara no disponible</p>
          </div>
        )}

        {/* Scanning overlay */}
        <CameraOverlay isActive={!isScanning} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-white text-lg font-bold tracking-tight">
            VoiceInvenXi
          </h1>
          <button
            onClick={handleSimulateScan}
            className="
              px-3 py-1.5 rounded-full
              bg-white/10 hover:bg-white/15
              text-white/80 text-xs font-medium
              transition-colors duration-200
            "
          >
            Simular escaneo
          </button>
        </div>
      </div>

      {/* Bottom drawer */}
      <GlassDrawer className="z-20">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onVoiceClick={handleVoiceSearch}
          onSearch={handleSearch}
          placeholder="Buscar por voz o texto..."
        />

        {lastScanned && (
          <ScanBadge
            productName={lastScanned.name}
            quantity={lastScanned.quantity}
            type={lastScanned.type}
          />
        )}

        <BottomNav />
      </GlassDrawer>
    </div>
  )
}
