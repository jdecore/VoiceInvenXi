import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Flashlight, ScanLine } from 'lucide-react'
import { PageLayout, FAB, EmptyState } from '@/components/ui'
import { useCamera } from '@/hooks/useCamera'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { MOCK_PRODUCTS } from '@/constants'
import { playScanBeep } from '@/lib/beep'
import { hapticSuccess } from '@/lib/haptics'

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']

function createDetector(): BarcodeDetector | null {
  if (typeof window === 'undefined' || !window.BarcodeDetector) return null
  try {
    return new window.BarcodeDetector({ formats: BARCODE_FORMATS })
  } catch {
    try {
      return new window.BarcodeDetector()
    } catch {
      return null
    }
  }
}

export function ScanPage() {
  const navigate = useNavigate()
  const { videoRef, isActive, start, stop, torchOn, toggleTorch } = useCamera()
  const { speak } = useTTS()
  const [isScanning, setIsScanning] = useState(false)
  const [supportsBarcode, setSupportsBarcode] = useState(true)

  const isScanningRef = useRef(isScanning)
  const handleScanRef = useRef<(barcode: string) => void>(() => {})

  useEffect(() => {
    isScanningRef.current = isScanning
  }, [isScanning])

  useEffect(() => {
    start()
    speak('Apunta la cámara al código de barras')
    return () => stop()
  }, [])

  const handleScan = useCallback(async (barcode: string) => {
    if (isScanningRef.current) return
    isScanningRef.current = true
    setIsScanning(true)
    playScanBeep()
    hapticSuccess()

    try {
      const product = await productApi.getByBarcode(barcode)
      navigate(`/product/${product.barcode}`)
    } catch {
      navigate(`/new/${barcode}`)
    } finally {
      setTimeout(() => {
        isScanningRef.current = false
        setIsScanning(false)
      }, 3000)
    }
  }, [navigate])

  useEffect(() => {
    handleScanRef.current = handleScan
  }, [handleScan])

  useEffect(() => {
    const detector = createDetector()
    if (!detector) {
      setSupportsBarcode(false)
      return
    }

    const interval = window.setInterval(async () => {
      if (isScanningRef.current) return
      const video = videoRef.current
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return

      try {
        const codes = await detector.detect(video)
        if (codes.length > 0) {
          handleScanRef.current(String(codes[0].rawValue))
        }
      } catch {
        // Frame no listo o error transitorio — reintentar en el siguiente tick
      }
    }, 400)

    return () => window.clearInterval(interval)
  }, [])

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
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[min(70vw,280px,45dvh)] h-[min(70vw,280px,45dvh)]
            transition-all duration-200
            ${isScanning ? 'ring-2 ring-brand/70 rounded-2xl' : ''}
          `}>
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-brand rounded-tl-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-brand rounded-tr-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-brand rounded-bl-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-brand rounded-br-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />

            {/* Scanning line */}
            <div className="absolute left-3 right-3 top-0 h-[2px] rounded-full
              bg-gradient-to-r from-transparent via-brand to-transparent
              shadow-[0_0_10px_rgba(249,115,22,0.9)]
              animate-[scan-line_2.4s_ease-in-out_infinite]
            " />
          </div>

          {/* Hint text */}
          <div className="absolute bottom-[clamp(6.5rem,18dvh,12rem)] left-0 right-0 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-center">
              <p className="text-white text-sm font-medium whitespace-nowrap">
                {isScanning ? 'Escaneando...' : 'Apunta al código de barras'}
              </p>
            </div>
          </div>

          {!supportsBarcode && (
            <div className="absolute bottom-[clamp(4.25rem,12dvh,8rem)] left-0 right-0 flex justify-center">
              <p className="text-white/70 text-xs px-4 text-center">
                Escaneo automático no disponible en este navegador
              </p>
            </div>
          )}
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-4 pt-4 pb-2">
          <h1 className="flex-1 min-w-0 truncate text-white text-lg font-bold drop-shadow-md pl-[min(10%,40px)]">
            VoiceInvenXi
          </h1>
          <div className="flex shrink-0 items-center gap-2 pr-[min(10%,40px)]">
            <button
              onClick={toggleTorch}
              disabled={!isActive}
              aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              className={`flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm transition-all duration-150 active:scale-95 ${
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
                  hover:bg-white transition-all duration-150 active:scale-95"
              >
                Activo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Voice search FAB - corner, same band as nav bar */}
      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-5 z-20">
        <FAB onClick={handleMic} />
      </div>
    </PageLayout>
  )
}
