import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ScanLine } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { PageLayout, FAB, EmptyState } from '@/components/ui'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { generateRandomBarcode } from '@/lib/barcode'
import { playScanBeep } from '@/lib/beep'
import { hapticSuccess } from '@/lib/haptics'

export function ScanPage() {
  const navigate = useNavigate()
  const { speak } = useTTS()
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(isScanning)
  const handleScanRef = useRef<(barcode: string) => void>(() => {})

  useEffect(() => {
    isScanningRef.current = isScanning
  }, [isScanning])

  useEffect(() => {
    const scanner = new Html5Qrcode('scan-region', false)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 8 },
        (decodedText) => {
          if (!isScanningRef.current) handleScanRef.current(decodedText)
        },
        () => {},
      )
      .then(() => speak('Apunta la cámara al código de barras'))
      .catch(() => setCameraError(true))

    return () => {
      if (scannerRef.current === scanner) scannerRef.current = null
      // html5-qrcode: clear() lanza "Cannot clear while scan is ongoing" si no
      // esperamos a que stop() (async) termine primero — por eso el orden.
      // Además, en StrictMode (dev) un segundo scanner puede montarse sobre el
      // mismo elemento; clear() de la instancia vieja lo rompería.
      void scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          if (scannerRef.current !== scanner) return
          try {
            scanner.clear()
          } catch {
            // Ya limpiado o elemento desmontado — no-op
          }
        })
    }
  }, [speak])

  const handleScan = useCallback(async (barcode: string) => {
    if (isScanningRef.current) return
    isScanningRef.current = true
    setIsScanning(true)
    playScanBeep()
    hapticSuccess()
    scannerRef.current?.stop().catch(() => {})

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

  const handleSimulateScan = () => {
    handleScan(generateRandomBarcode())
  }

  const handleMic = () => {
    navigate('/search?voice=true')
  }

  return (
    <PageLayout
      nav
      navExtra={<FAB onClick={handleMic} />}
      scroll={false}
      className="!bg-surface-2"
    >
      {/* Camera feed */}
      <div className="relative flex-1 overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Camera strip — html5-qrcode renders video + canvas aquí (16:9, sin distorsión) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 aspect-video overflow-hidden">
          <div id="scan-region" className="absolute inset-0" />
        </div>

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
            <EmptyState
              icon={<ScanLine className="w-8 h-8 text-on-surface-muted" />}
              title="Cámara no disponible"
              description="Verifica los permisos de la cámara en tu navegador"
            />
          </div>
        )}

        {/* Scan viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none">
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
          <div className="absolute bottom-[calc(10%+7rem)] left-0 right-0 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-center">
              <p className="text-white text-sm font-medium whitespace-nowrap">
                {isScanning ? 'Escaneando...' : 'Apunta al código de barras'}
              </p>
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-4">
          <h1 className="text-center text-white text-lg font-bold drop-shadow-md">
            VoiceInvenXi
          </h1>
          {import.meta.env.DEV && (
            <button
              onClick={handleSimulateScan}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm
                text-on-surface text-xs font-medium shadow-sm
                hover:bg-white transition-all duration-150 active:scale-95"
            >
              Activo
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  )
}