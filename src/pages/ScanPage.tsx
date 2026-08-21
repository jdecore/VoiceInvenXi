import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { IconScan } from '@tabler/icons-react'
import { Html5Qrcode } from 'html5-qrcode'
import { PageLayout, FAB, EmptyState, Logo } from '@/components/ui'
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
    const timers: number[] = []

    // Keep only the most recent <video> in #scan-region so a StrictMode
    // double-mount can never show two camera feeds at once.
    const ensureSingleVideo = () => {
      const region = document.getElementById('scan-region')
      if (!region) return
      const vids = Array.from(region.querySelectorAll('video'))
      for (let i = 0; i < vids.length - 1; i++) vids[i].remove()
    }

    // Reuse the scanner across StrictMode's double-invoke (same fiber, so the
    // ref survives): only build a new Html5Qrcode if we don't already have one.
    let scanner = scannerRef.current
    if (!scanner) {
      scanner = new Html5Qrcode('scan-region', false)
      scannerRef.current = scanner
    }

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          // Request a high-resolution stream so the full-screen preview is
          // sharp instead of a low-res feed stretched to fill the viewport.
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
        },
        (decodedText) => {
          if (!isProcessingRef.current) handleScanRef.current(decodedText)
        },
        () => {},
      )
      .then(() => {
        if (cancelled) {
          // StrictMode (dev) ran the cleanup before start() resolved; stop
          // this orphaned scanner so it doesn't keep a second <video>.
          try {
            scanner!.stop().catch(() => {}).finally(() => {
              try { scanner!.clear() } catch {}
            })
          } catch {
            try { scanner!.clear() } catch {}
          }
          return
        }
        ensureSingleVideo()
        timers.push(window.setTimeout(ensureSingleVideo, 400))
        timers.push(window.setTimeout(ensureSingleVideo, 900))
        speak('Apunta la cámara al código de barras')
      })
      .catch(() => {
        // Ignore rejections caused by StrictMode's immediate unmount in dev.
        if (!cancelled) setCameraError(true)
      })

    return () => {
      cancelled = true
      const toStop = scannerRef.current
      isProcessingRef.current = false
      timers.forEach((t) => clearTimeout(t))
      if (!toStop) return
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
      // Detach the instance so the next real mount builds a fresh one against
      // the (re-created) #scan-region element.
      scannerRef.current = null
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
              icon={<IconScan />}
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

        <div className="scan-topbar flex justify-center">
          <h1 className="scan-title flex items-center justify-center text-white">
            <Logo size={52} className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]" />
          </h1>
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
