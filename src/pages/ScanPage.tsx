import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ScanLine } from 'lucide-react'
import Quagga, { type QuaggaJSCodeReader } from '@ericblade/quagga2'
import { PageLayout, FAB, EmptyState, useToast } from '@/components/ui'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { generateRandomBarcode } from '@/lib/barcode'
import { playScanBeep } from '@/lib/beep'
import { hapticSuccess } from '@/lib/haptics'

const SCAN_MAX_DIMENSION = 600
const SCAN_INTERVAL_MS = 150
const MAX_BARCODE_LENGTH = 128
const INVALID_BARCODE_TOAST_COOLDOWN_MS = 1500

const SCAN_FORMATS: QuaggaJSCodeReader[] = [
  'code_128_reader',
  'ean_reader',
  'ean_8_reader',
  'upc_reader',
  'code_39_reader',
]

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

function decodeCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  return new Promise((resolve) => {
    Quagga.decodeSingle(
      {
        src: canvas.toDataURL('image/jpeg', 0.92),
        locate: true,
        inputStream: {
          size: 0,
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        decoder: {
          readers: SCAN_FORMATS,
          multiple: false,
        },
      },
      (result) => {
        resolve(result?.codeResult?.code?.trim() || null)
      },
    )
  })
}

export function ScanPage() {
  const navigate = useNavigate()
  const { speak } = useTTS()
  const { showToast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const decodeTimerRef = useRef<number | null>(null)
  const resetTimerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const decodingRef = useRef(false)
  const hasAnnouncedRef = useRef(false)
  const lastInvalidToastAtRef = useRef(0)
  const isScanningRef = useRef(isScanning)

  useEffect(() => {
    isScanningRef.current = isScanning
  }, [isScanning])

  const getCanvas = useCallback(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    return canvasRef.current
  }, [])

  const stopCamera = useCallback(() => {
    if (decodeTimerRef.current != null) {
      window.clearInterval(decodeTimerRef.current)
      decodeTimerRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    const video = videoRef.current
    if (video) video.srcObject = null
  }, [])

  const scanFrame = useCallback(async () => {
    const video = videoRef.current
    if (!video || isScanningRef.current || decodingRef.current) return
    if (document.visibilityState !== 'visible') return
    if (video.readyState < 2 || video.videoWidth === 0) return
    const boxW = video.clientWidth
    const boxH = video.clientHeight
    if (boxW === 0 || boxH === 0) return

    decodingRef.current = true
    try {
      const vW = video.videoWidth
      const vH = video.videoHeight
      const scale = Math.max(boxW / vW, boxH / vH)
      const drawnW = vW * scale
      const drawnH = vH * scale
      const sx = (drawnW - boxW) / 2 / scale
      const sy = (drawnH - boxH) / 2 / scale
      const sw = Math.min(boxW / scale, vW - sx)
      const sh = Math.min(boxH / scale, vH - sy)

      const canvas = getCanvas()
      const downscale = Math.min(1, SCAN_MAX_DIMENSION / Math.max(sw, sh))
      const dw = Math.max(1, Math.round(sw * downscale))
      const dh = Math.max(1, Math.round(sh * downscale))
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw
        canvas.height = dh
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh)

      const code = await decodeCanvas(canvas)
      if (code && !isScanningRef.current) {
        void handleScan(code)
      }
    } finally {
      decodingRef.current = false
    }
  }, [getCanvas])

  const handleScan = useCallback(async (barcode: string) => {
    if (isScanningRef.current) return

    const normalizedBarcode = barcode.trim()
    if (!normalizedBarcode || normalizedBarcode.length > MAX_BARCODE_LENGTH) {
      const now = Date.now()
      if (now - lastInvalidToastAtRef.current > INVALID_BARCODE_TOAST_COOLDOWN_MS) {
        showToast('error', 'Código de barras inválido o demasiado largo')
        lastInvalidToastAtRef.current = now
      }
      return
    }

    isScanningRef.current = true
    setIsScanning(true)
    playScanBeep()
    hapticSuccess()
    stopCamera()

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
        isScanningRef.current = false
        setIsScanning(false)
        resetTimerRef.current = null
      }, 3000)
    }
  }, [navigate, showToast, stopCamera])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false

    const startCamera = async () => {
      for (const constraints of CAMERA_CONSTRAINTS) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: constraints,
          })
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop())
            return
          }
          streamRef.current = stream
          setCameraError(false)
          video.srcObject = stream
          void video.play().catch(() => {})
          return
        } catch {
          // Seguir con la siguiente configuración
        }
      }
      if (!cancelled) setCameraError(true)
    }

    const onPlaying = () => {
      if (!hasAnnouncedRef.current) {
        hasAnnouncedRef.current = true
        speak('Apunta la cámara al código de barras')
      }
      if (decodeTimerRef.current == null) {
        decodeTimerRef.current = window.setInterval(() => {
          void scanFrame()
        }, SCAN_INTERVAL_MS)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && video.readyState >= 2) {
        if (decodeTimerRef.current == null) {
          decodeTimerRef.current = window.setInterval(() => {
            void scanFrame()
          }, SCAN_INTERVAL_MS)
        }
        return
      }

      if (decodeTimerRef.current != null) {
        window.clearInterval(decodeTimerRef.current)
        decodeTimerRef.current = null
      }
    }

    video.addEventListener('playing', onPlaying)
    document.addEventListener('visibilitychange', onVisibilityChange)
    void startCamera()

    return () => {
      cancelled = true
      video.removeEventListener('playing', onPlaying)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopCamera()
      hasAnnouncedRef.current = false
    }
  }, [scanFrame, speak, stopCamera])

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
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 z-0 h-full w-full object-cover"
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

        <div className="absolute inset-0 z-10 pointer-events-none">
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

        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4">
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
