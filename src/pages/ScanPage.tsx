import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ScanLine } from 'lucide-react'
import Quagga, {
  type QuaggaJSCodeReader,
  type QuaggaJSConfigObject,
  type QuaggaJSResultObject,
} from '@ericblade/quagga2'
import { PageLayout, FAB, EmptyState, useToast } from '@/components/ui'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { generateRandomBarcode } from '@/lib/barcode'
import { playScanBeep } from '@/lib/beep'
import { hapticSuccess } from '@/lib/haptics'

const MAX_BARCODE_LENGTH = 128
const INVALID_BARCODE_TOAST_COOLDOWN_MS = 1500

const CAMERA_CONSTRAINTS: MediaTrackConstraints[] = [
  {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
  },
  {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280, max: 1280 },
    height: { ideal: 720, max: 720 },
  },
  {
    facingMode: { ideal: 'environment' },
  },
]

const QUAGGA_READERS: QuaggaJSCodeReader[] = [
  'code_128_reader',
  'ean_reader',
  'ean_8_reader',
  'upc_reader',
  'code_39_reader',
]

function getScannerConfig(target: HTMLElement): QuaggaJSConfigObject {
  const workers = typeof navigator !== 'undefined'
    ? Math.max(1, Math.min(2, Math.floor((navigator.hardwareConcurrency ?? 4) / 2)))
    : 1

  return {
    inputStream: {
      type: 'LiveStream',
      target,
      willReadFrequently: true,
      constraints: {
        ...CAMERA_CONSTRAINTS[0],
      },
      area: {
        top: '18%',
        right: '10%',
        left: '10%',
        bottom: '18%',
      },
    },
    locator: {
      halfSample: true,
      patchSize: 'medium',
    },
    numOfWorkers: workers,
    frequency: 8,
    locate: true,
    canvas: {
      createOverlay: false,
    },
    decoder: {
      readers: QUAGGA_READERS,
      multiple: false,
    },
  }
}

export function ScanPage() {
  const navigate = useNavigate()
  const { speak } = useTTS()
  const { showToast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const scannerHostRef = useRef<HTMLDivElement | null>(null)
  const quaggaRunningRef = useRef(false)
  const detectionLockRef = useRef(false)
  const hasAnnouncedRef = useRef(false)
  const lastInvalidToastAtRef = useRef(0)
  const resetTimerRef = useRef<number | null>(null)
  const activeDetectedRef = useRef<(data: QuaggaJSResultObject) => void>(() => {})

  const stopScanner = useCallback(async () => {
    try {
      Quagga.offDetected(activeDetectedRef.current)
    } catch {
      // Quagga puede no tener listeners registrados todavía.
    }

    if (!quaggaRunningRef.current) return

    quaggaRunningRef.current = false
    try {
      await Quagga.stop()
    } catch {
      // Si la cámara ya se cerró, no necesitamos hacer nada.
    }
  }, [])

  const handleScan = useCallback(async (barcode: string) => {
    if (detectionLockRef.current) return

    const normalizedBarcode = barcode.trim()
    if (!normalizedBarcode || normalizedBarcode.length > MAX_BARCODE_LENGTH) {
      const now = Date.now()
      if (now - lastInvalidToastAtRef.current > INVALID_BARCODE_TOAST_COOLDOWN_MS) {
        showToast('error', 'Código de barras inválido o demasiado largo')
        lastInvalidToastAtRef.current = now
      }
      return
    }

    detectionLockRef.current = true
    setIsScanning(true)
    playScanBeep()
    hapticSuccess()
    void stopScanner()

    try {
      const product = await productApi.getByBarcode(normalizedBarcode)
      navigate(`/product/${encodeURIComponent(product.barcode)}`)
    } catch {
      navigate(`/new/${encodeURIComponent(normalizedBarcode)}`)
    } finally {
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }
      resetTimerRef.current = window.setTimeout(() => {
        detectionLockRef.current = false
        setIsScanning(false)
        resetTimerRef.current = null
      }, 3000)
    }
  }, [navigate, showToast, stopScanner])

  const handleDetected = useCallback((result: QuaggaJSResultObject) => {
    const code = result.codeResult?.code?.trim()
    if (!code || detectionLockRef.current) return
    void handleScan(code)
  }, [handleScan])

  useEffect(() => {
    const target = scannerHostRef.current
    if (!target) return

    let cancelled = false
    const baseConfig = getScannerConfig(target)

    const startScanner = async () => {
      for (const constraints of CAMERA_CONSTRAINTS) {
        try {
          await new Promise<void>((resolve, reject) => {
            Quagga.init({
              ...baseConfig,
              inputStream: {
                ...baseConfig.inputStream,
                constraints,
              },
            }, (error) => {
              if (cancelled) {
                reject(new Error('cancelled'))
                return
              }
              if (error) {
                reject(error)
                return
              }
              resolve()
            })
          })

          if (cancelled) {
            void stopScanner()
            return
          }

          activeDetectedRef.current = handleDetected
          Quagga.onDetected(handleDetected)
          quaggaRunningRef.current = true
          setCameraError(false)
          if (!hasAnnouncedRef.current) {
            hasAnnouncedRef.current = true
            speak('Apunta la cámara al código de barras')
          }
          Quagga.start()
          return
        } catch {
          await stopScanner()
          // Probar la siguiente resolución.
        }
      }

      if (!cancelled) setCameraError(true)
    }

    void startScanner()

    return () => {
      cancelled = true
      hasAnnouncedRef.current = false
      void stopScanner()
    }
  }, [handleDetected, speak, stopScanner])

  useEffect(() => {
    return () => {
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }
    }
  }, [])

  const handleSimulateScan = () => {
    void handleScan(generateRandomBarcode())
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
      <div className="relative flex-1 overflow-hidden bg-black">
        <div ref={scannerHostRef} className="absolute inset-0" />

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
            <EmptyState
              icon={<ScanLine className="w-8 h-8 text-on-surface-muted" />}
              title="Cámara no disponible"
              description="Verifica los permisos de la cámara en tu navegador"
            />
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[min(70vw,280px,45dvh)] h-[min(70vw,280px,45dvh)]
            transition-all duration-200
            ${isScanning ? 'ring-2 ring-brand/70 rounded-2xl' : ''}
          `}>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-brand rounded-tl-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-brand rounded-tr-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-brand rounded-bl-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-brand rounded-br-xl animate-[corner-pulse_2.4s_ease-in-out_infinite]" />

            <div className="absolute left-3 right-3 top-0 bottom-0 overflow-hidden">
              <div className="h-[2px] rounded-full
                bg-gradient-to-r from-transparent via-brand to-transparent
                shadow-[0_0_10px_rgba(249,115,22,0.9)]
                animate-[scan-line_2.4s_ease-in-out_infinite]
              " />
            </div>
          </div>

          <div className="absolute bottom-[calc(10%+7rem)] left-0 right-0 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-center">
              <p className="text-white text-sm font-medium whitespace-nowrap">
                {isScanning ? 'Escaneando...' : 'Apunta al código de barras'}
              </p>
            </div>
          </div>
        </div>

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
