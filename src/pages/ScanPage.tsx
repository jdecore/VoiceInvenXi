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
    let cancelled = false
    const scanner = new Html5Qrcode('scan-region', false)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10 },
        (decodedText) => {
          if (!isProcessingRef.current) handleScanRef.current(decodedText)
        },
        () => {},
      )
      .then(() => {
        if (cancelled) {
          // StrictMode (dev) mounted us twice: the real cleanup ran before
          // start() resolved, so this scanner finished starting on its own.
          // Tear it down now or it becomes an orphaned second <video>.
          try {
            scanner.stop().catch(() => {}).finally(() => {
              try { scanner.clear() } catch {}
            })
          } catch {
            try { scanner.clear() } catch {}
          }
          return
        }
        speak('Apunta la cámara al código de barras')
      })
      .catch(() => {
        // Ignore rejections caused by StrictMode's immediate unmount in dev.
        if (!cancelled) setCameraError(true)
      })

    return () => {
      cancelled = true
      const s = scannerRef.current
      scannerRef.current = null
      isProcessingRef.current = false
      const toStop = s ?? scanner
      // stop() may throw synchronously if the scanner is not in the SCANNING
      // state (e.g. still starting, or already stopped). Guard both the call
      // and the promise so cleanup never surfaces an error.
      try {
        toStop
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              toStop.clear()
            } catch {}
          })
      } catch {
        try {
          toStop.clear()
        } catch {}
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
    <PageLayout nav navExtra={<FAB onClick={handleMic} />} scroll={false} className="scan-bg-black">
      <div className="relative flex-1 overflow-hidden bg-black">
        <div id="scan-region" />

        {cameraError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-2">
            <EmptyState
              icon={<ScanLine />}
              title="Cámara no disponible"
              description="Verifica los permisos de la cámara en tu navegador"
            />
          </div>
        )}

        <div className="scan-overlay">
          <div className={`scan-frame ${isScanning ? 'scan-frame--active' : ''}`}>
            <div className="scan-corner scan-corner--tl" />
            <div className="scan-corner scan-corner--tr" />
            <div className="scan-corner scan-corner--bl" />
            <div className="scan-corner scan-corner--br" />
            <div className="scan-line-bar" />
          </div>
          <div className="scan-hint">
            <div className="scan-hint-pill">
              <p>{isScanning ? 'Escaneando...' : 'Apunta al código de barras'}</p>
            </div>
          </div>
        </div>

        <div className="scan-topbar">
          <h1 className="scan-title">VoiceInvenXi</h1>
          {import.meta.env.DEV && (
            <button onClick={handleSimulateScan} className="dev-button">
              Activo
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
