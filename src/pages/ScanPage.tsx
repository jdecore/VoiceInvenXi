import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Flashlight, ScanLine } from 'lucide-react'
import { PageLayout, FAB, EmptyState } from '@/components/ui'
import { useCamera } from '@/hooks/useCamera'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { MOCK_PRODUCTS } from '@/constants'

export function ScanPage() {
  const navigate = useNavigate()
  const { videoRef, isActive, start, stop, torchOn, toggleTorch } = useCamera()
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
    <PageLayout nav scroll={false} className="!bg-surface-2">
      {/* Camera feed */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center !bg-surface-2">
            <EmptyState
              icon={<ScanLine className="w-8 h-8 text-on-surface-muted" />}
              title="Cámara no disponible"
              description="Verifica los permisos de la cámara en tu navegador"
            />
          </div>
        )}

        {/* Scan viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[min(70vw,280px)] h-[min(70vw,280px)]
          ">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-brand rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-brand rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-brand rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-brand rounded-br-xl" />

            {/* Scanning line */}
            <div className="absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent animate-[scan-line_2.4s_ease-in-out_infinite]" />
          </div>

          {/* Hint text */}
          <div className="absolute bottom-40 left-0 right-0 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
              <p className="text-white text-sm font-medium">
                {isScanning ? 'Escaneando...' : 'Apunta al código de barras'}
              </p>
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-white text-lg font-bold drop-shadow-md pl-[10%]">VoiceInvenXi</h1>
          <div className="flex items-center gap-2 mr-[10%]">
            <button
              onClick={toggleTorch}
              disabled={!isActive}
              aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              className={`flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm transition-colors ${
                torchOn
                  ? 'bg-brand text-white'
                  : 'bg-white/90 text-on-surface hover:bg-white'
              } disabled:opacity-50`}
            >
              <Flashlight className={`w-4 h-4 ${torchOn ? '' : 'text-on-surface'}`} />
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={handleSimulateScan}
                className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm
                  text-on-surface text-xs font-medium shadow-sm
                  hover:bg-white transition-colors"
              >
                Activo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Voice search FAB - corner, above nav */}
      <div className="absolute bottom-32 right-5 z-20">
        <FAB onClick={handleMic} />
      </div>
    </PageLayout>
  )
}
