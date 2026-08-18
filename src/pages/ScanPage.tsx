import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ScanLine } from 'lucide-react'
import * as ZXing from 'html5-qrcode/third_party/zxing-js.umd'
import { PageLayout, FAB, EmptyState } from '@/components/ui'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { generateRandomBarcode } from '@/lib/barcode'
import { playScanBeep } from '@/lib/beep'
import { hapticSuccess } from '@/lib/haptics'

const SCAN_MAX_DIMENSION = 600
const SCAN_INTERVAL_MS = 125 // ~fps 8

const SCAN_FORMATS = [
  ZXing.BarcodeFormat.QR_CODE,
  ZXing.BarcodeFormat.EAN_13,
  ZXing.BarcodeFormat.EAN_8,
  ZXing.BarcodeFormat.UPC_A,
  ZXing.BarcodeFormat.UPC_E,
  ZXing.BarcodeFormat.CODE_128,
  ZXing.BarcodeFormat.CODE_39,
]

// Solo los formatos soportados (limita lectores -> más rápido) + TRY_HARDER
// para leer códigos pequeños o con poca resolución
const decodeHints = new Map<ZXing.DecodeHintType, unknown>([
  [ZXing.DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS],
  [ZXing.DecodeHintType.TRY_HARDER, true],
])

function decodeCanvas(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new ZXing.MultiFormatReader(false, decodeHints)
      const source = new ZXing.HTMLCanvasElementLuminanceSource(canvas)
      const bitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(source))
      const result = reader.decode(bitmap)
      resolve(result.text)
    } catch (error) {
      reject(error)
    }
  })
}

export function ScanPage() {
  const navigate = useNavigate()
  const { speak } = useTTS()
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const decodeTimerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const decodingRef = useRef(false)
  const isScanningRef = useRef(isScanning)
  const handleScanRef = useRef<(barcode: string) => void>(() => {})

  useEffect(() => {
    isScanningRef.current = isScanning
  }, [isScanning])

  const getCanvas = useCallback(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    return canvasRef.current
  }, [])

  // Decodifica el sub-rectángulo visible del video (object-fit: cover) sin
  // distorsión: el sampler dibuja los píxeles del recorte real, no el frame
  // completo estirado — lo que ves en pantalla es exactamente lo que decodifica.
  const scanFrame = useCallback(async () => {
    const video = videoRef.current
    if (!video || isScanningRef.current || decodingRef.current) return
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
      // Cap al lado largo (aspect-preserving) — sin esto el canvas llegaba a
      // 615x1080px y ZXing+TRY_HARDER (síncrono, main thread) bloqueaba la
      // animación y dejaba el escaneo en ~2fps
      const downscale = Math.min(1, SCAN_MAX_DIMENSION / Math.max(sw, sh))
      const dw = sw * downscale
      const dh = sh * downscale
      if (canvas.width !== Math.round(dw) || canvas.height !== Math.round(dh)) {
        canvas.width = Math.round(dw)
        canvas.height = Math.round(dh)
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh)

      const result = await decodeCanvas(canvas)
      if (!isScanningRef.current) handleScanRef.current(result)
    } catch {
      // Sin código en este frame — continuar escaneando
    } finally {
      decodingRef.current = false
    }
  }, [getCanvas])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false

    const startCamera = async () => {
      try {
        // Resolución máxima (1920x1080) — lo que ve el usuario es el recorte
        // cover del centro del frame nativo, a resolución completa
        // (sin aspectRatio ideal: forzaba a la cámara a resoluciones raras y
        // bajas, se veía borroso y no decodificaba)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        video.srcObject = stream
        void video.play().catch(() => {})
      } catch {
        if (!cancelled) setCameraError(true)
      }
    }

    const onPlaying = () => {
      speak('Apunta la cámara al código de barras')
      if (decodeTimerRef.current == null) {
        decodeTimerRef.current = window.setInterval(() => {
          void scanFrame()
        }, SCAN_INTERVAL_MS)
      }
    }

    video.addEventListener('playing', onPlaying)
    void startCamera()

    return () => {
      cancelled = true
      video.removeEventListener('playing', onPlaying)
      if (decodeTimerRef.current != null) {
        window.clearInterval(decodeTimerRef.current)
        decodeTimerRef.current = null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      video.srcObject = null
    }
  }, [speak, scanFrame])

  const handleScan = useCallback(async (barcode: string) => {
    if (isScanningRef.current) return
    isScanningRef.current = true
    setIsScanning(true)
    playScanBeep()
    hapticSuccess()
    streamRef.current?.getTracks().forEach((track) => track.stop())

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
      {/* Camera feed — pantalla completa en portrait y landscape (object-fit: cover) */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />

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

            {/* Scanning line — el wrapper da el 100% de altura para el
                translateY (composited); animar top bloqueaba el main thread
                y se veía muy lenta durante el decode */}
            <div className="absolute left-3 right-3 top-0 bottom-0 overflow-hidden">
              <div className="h-[2px] rounded-full
                bg-gradient-to-r from-transparent via-brand to-transparent
                shadow-[0_0_10px_rgba(249,115,22,0.9)]
                animate-[scan-line_2.4s_ease-in-out_infinite]
              " />
            </div>
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