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
  const isProcessingRef = useRef(false)
  const handleScanRef = useRef<(barcode: string) => void>(() => {})

  useEffect(() => {
    const scanner = new Html5Qrcode('scan-region', false)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, aspectRatio: 1.777 },
        (decodedText) => {
          if (!isProcessingRef.current) handleScanRef.current(decodedText)
        },
        () => {},
      )
      .then(() => speak('Apunta la cámara al código de barras'))
      .catch(() => setCameraError(true))

    return () => {
      const s = scannerRef.current
      scannerRef.current = null
      isProcessingRef.current = false
      if (s) {
        void s
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              s.clear()
            } catch {}
          })
      } else {
        // fallback for StrictMode second mount before first start finished
        void scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear()
            } catch {}
          })
      }
    }
  }, [speak])

  const handleScan = useCallback(
    async (raw: string) => {
      if (isProcessingRef.current) return
      const barcode = raw.trim()
      if (!barcode) return

      isProcessingRef.current = true
      setIsScanning(true)
      playScanBeep()
      hapticSuccess()

      // Detener cámara de inmediato y esperar a que frene el loop interno de html5-qrcode
      const scanner = scannerRef.current
      if (scanner) {
        try {
          await scanner.stop()
        } catch {}
        try {
          scanner.clear()
        } catch {}
        scannerRef.current = null
      }

      try {
        const product = await productApi.getByBarcode(barcode)
        navigate(`/product/${encodeURIComponent(product.barcode)}`)
      } catch {
        navigate(`/new/${encodeURIComponent(barcode)}`)
      }
      // No reset de isScanning/isProcessing: la página se desmonta al navegar.
      // Si la navegación falla, permitir reintento tras 2s
      setTimeout(() => {
        isProcessingRef.current = false
        setIsScanning(false)
      }, 2500)
    },
    [navigate],
  )

  useEffect(() => {
    handleScanRef.current = handleScan
  }, [handleScan])

  const handleSimulateScan = () => {
    void handleScan(generateRandomBarcode())
  }

  const handleMic = () => {
    navigate('/search?voice=true')
  }

  return (
    <PageLayout nav navExtra={<FAB onClick={handleMic} />} scroll={false} className="!bg-black">
      <div className="relative flex-1 overflow-hidden bg-black">
        {/* Cámara fullscreen sin bandas: html5-qrcode inyecta video/canvas aquí */}
        <div
          id="scan-region"
          className="absolute inset-0 h-full w-full [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:!hidden"
        />

        {cameraError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-2">
            <EmptyState
              icon={<ScanLine className="w-8 h-8 text-on-surface-muted" />}
              title="Cámara no disponible"
              description="Verifica los permisos de la cámara en tu navegador"
            />
          </div>
        )}

        {/* Overlay visor — solo decorativo, no recorta la cámara */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(72vw,300px)] h-[min(72vw,300px)] transition-all duration-200 ${isScanning ? 'ring-2 ring-brand/70 rounded-2xl' : ''}`}
          >
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-brand rounded-tl-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-brand rounded-tr-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-brand rounded-bl-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-brand rounded-br-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute left-3 right-3 top-0 bottom-0 overflow-hidden">
              <div className="h-[2px] rounded-full bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_10px_rgba(249,115,22,0.9)] animate-[scan-line_2.4s_ease-in-out_infinite]" />
            </div>
          </div>
          <div className="absolute bottom-[calc(10%+7rem)] left-0 right-0 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-black/45 backdrop-blur-sm text-center">
              <p className="text-white text-sm font-medium whitespace-nowrap">
                {isScanning ? 'Escaneando...' : 'Apunta al código de barras'}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4">
          <h1 className="text-center text-white text-lg font-bold drop-shadow-md">VoiceInvenXi</h1>
          {import.meta.env.DEV && (
            <button
              onClick={handleSimulateScan}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-on-surface text-xs font-medium shadow-sm hover:bg-white transition-all duration-150 active:scale-95"
            >
              Activo
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
