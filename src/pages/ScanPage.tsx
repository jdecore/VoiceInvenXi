import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ScanLine, Zap, ZapOff } from 'lucide-react'
import Quagga, { type QuaggaJSCodeReader } from '@ericblade/quagga2'
import { PageLayout, FAB, EmptyState, useToast } from '@/components/ui'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import { generateRandomBarcode } from '@/lib/barcode'
import { playScanBeep } from '@/lib/beep'
import { hapticSuccess, hapticTap } from '@/lib/haptics'

const SCAN_MAX_DIMENSION = 700
const SCAN_INTERVAL_MS = 160
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
        inputStream: { size: 0 },
        locator: { patchSize: 'medium', halfSample: true },
        decoder: { readers: SCAN_FORMATS, multiple: false },
      },
      (result) => resolve(result?.codeResult?.code?.trim() || null),
    )
  })
}

export function ScanPage() {
  const navigate = useNavigate()
  const { speak } = useTTS()
  const { showToast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const decodeTimerRef = useRef<number | null>(null)
  const resetTimerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const decodingRef = useRef(false)
  const hasAnnouncedRef = useRef(false)
  const lastInvalidToastAtRef = useRef(0)
  const isScanningRef = useRef(false)
  const handleScanRef = useRef<(barcode: string) => Promise<void>>(async () => {})
  const frameRef = useRef<HTMLDivElement | null>(null)

  const getCanvas = useCallback(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    return canvasRef.current
  }, [])

  const stopCamera = useCallback(() => {
    if (decodeTimerRef.current != null) {
      window.clearInterval(decodeTimerRef.current)
      decodeTimerRef.current = null
    }
    try {
      const track = trackRef.current as MediaStreamTrack & { applyConstraints?: (c: unknown) => Promise<void> }
      const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined
      if (caps?.torch && torchOn) {
        void track.applyConstraints({ advanced: [{ torch: false }] } as unknown as MediaTrackConstraints).catch(() => {})
      }
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    trackRef.current = null
    setTorchOn(false)
    setHasTorch(false)
    const video = videoRef.current
    if (video) video.srcObject = null
  }, [torchOn])

  const tryContinuousFocus = useCallback(async (track: MediaStreamTrack) => {
    try {
      const caps = (track.getCapabilities?.() as unknown as Record<string, unknown>) ?? {}
      // torch capability
      if ('torch' in caps) setHasTorch(Boolean(caps.torch))
      // focusMode - intent continuous
      const advanced: Record<string, unknown>[] = []
      if ('focusMode' in caps) {
        const modes = caps.focusMode as string[] | undefined
        if (modes?.includes('continuous')) advanced.push({ focusMode: 'continuous' })
      }
      if ('exposureMode' in caps) {
        const modes = caps.exposureMode as string[] | undefined
        if (modes?.includes('continuous')) advanced.push({ exposureMode: 'continuous' })
      }
      if ('whiteBalanceMode' in caps) {
        const modes = caps.whiteBalanceMode as string[] | undefined
        if (modes?.includes('continuous')) advanced.push({ whiteBalanceMode: 'continuous' })
      }
      if (advanced.length) {
        await (track as unknown as { applyConstraints: (c: MediaTrackConstraints) => Promise<void> }).applyConstraints({
          advanced,
        } as unknown as MediaTrackConstraints)
      }
    } catch {
      // algunos devices no soportan applyConstraints
    }
  }, [])

  const scanFrame = useCallback(async () => {
    const video = videoRef.current
    const frameEl = frameRef.current
    if (!video || !frameEl || isScanningRef.current || decodingRef.current) return
    if (document.visibilityState !== 'visible') return
    if (video.readyState < 2 || video.videoWidth === 0) return

    const vW = video.videoWidth
    const vH = video.videoHeight
    const videoRect = video.getBoundingClientRect()
    const frameRect = frameEl.getBoundingClientRect()
    if (videoRect.width === 0 || videoRect.height === 0 || frameRect.width === 0) return

    decodingRef.current = true
    try {
      // video cover math: drawn size
      const scale = Math.max(videoRect.width / vW, videoRect.height / vH)
      const drawnW = vW * scale
      const drawnH = vH * scale
      // offset del video cubriendo el contenedor
      const offsetX = (drawnW - videoRect.width) / 2
      const offsetY = (drawnH - videoRect.height) / 2

      // frame relativo al video element
      const fx = frameRect.left - videoRect.left + offsetX
      const fy = frameRect.top - videoRect.top + offsetY
      const fw = frameRect.width
      const fh = frameRect.height

      // a coordenadas de video
      const sx = Math.max(0, fx / scale)
      const sy = Math.max(0, fy / scale)
      const sw = Math.min(fw / scale, vW - sx)
      const sh = Math.min(fh / scale, vH - sy)
      if (sw <= 10 || sh <= 10) return

      // pequeño padding (4% ) para no cortar bordes del código
      const padX = sw * 0.04
      const padY = sh * 0.04
      const psx = Math.max(0, sx - padX)
      const psy = Math.max(0, sy - padY)
      const psw = Math.min(sw + padX * 2, vW - psx)
      const psh = Math.min(sh + padY * 2, vH - psy)

      const canvas = getCanvas()
      const downscale = Math.min(1, SCAN_MAX_DIMENSION / Math.max(psw, psh))
      const dw = Math.max(1, Math.round(psw * downscale))
      const dh = Math.max(1, Math.round(psh * downscale))
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw
        canvas.height = dh
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, psx, psy, psw, psh, 0, 0, dw, dh)

      const code = await decodeCanvas(canvas)
      if (code && !isScanningRef.current) void handleScanRef.current(code)
    } finally {
      decodingRef.current = false
    }
  }, [getCanvas])

  const handleScan = useCallback(
    async (barcode: string) => {
      if (isScanningRef.current) return
      const normalizedBarcode = barcode.trim()
      if (!normalizedBarcode || normalizedBarcode.length > MAX_BARCODE_LENGTH) {
        const now = Date.now()
        if (now - lastInvalidToastAtRef.current > INVALID_BARCODE_TOAST_COOLDOWN_MS) {
          showToast('error', 'Código inválido')
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
    },
    [navigate, showToast, stopCamera],
  )

  useEffect(() => {
    handleScanRef.current = handleScan
  }, [handleScan])

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
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          const track = stream.getVideoTracks()[0] ?? null
          trackRef.current = track
          streamRef.current = stream
          setCameraError(false)
          video.srcObject = stream
          if (track) void tryContinuousFocus(track)
          void video.play().catch(() => {})
          return
        } catch {}
      }
      if (!cancelled) setCameraError(true)
    }

    const onPlaying = () => {
      if (!hasAnnouncedRef.current) {
        hasAnnouncedRef.current = true
        speak('Apunta al código dentro del marco')
      }
      if (decodeTimerRef.current == null) {
        decodeTimerRef.current = window.setInterval(() => void scanFrame(), SCAN_INTERVAL_MS)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && video.readyState >= 2) {
        if (decodeTimerRef.current == null)
          decodeTimerRef.current = window.setInterval(() => void scanFrame(), SCAN_INTERVAL_MS)
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
  }, [scanFrame, speak, stopCamera, tryContinuousFocus])

  useEffect(() => {
    return () => {
      if (resetTimerRef.current != null) window.clearTimeout(resetTimerRef.current)
    }
  }, [])

  const handleSimulateScan = () => void handleScan(generateRandomBarcode())
  const handleMic = () => navigate('/search?voice=true')

  const toggleTorch = async () => {
    const track = trackRef.current as (MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> }) | null
    if (!track || !hasTorch) return
    hapticTap()
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] } as unknown as MediaTrackConstraints)
      setTorchOn((v) => !v)
    } catch {
      showToast('error', 'Linterna no disponible')
    }
  }

  const handleTapFocus = async (e: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current
    const track = trackRef.current
    if (!video || !track) return
    const rect = video.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setTapPoint({ x, y })
    setFocusTick((t) => t + 1)
    setTimeout(() => setTapPoint(null), 900)
    hapticTap()
    // intenta forzar refocus
    try {
      const caps = (track.getCapabilities?.() as unknown as Record<string, unknown>) ?? {}
      if ('focusMode' in caps) {
        const modes = caps.focusMode as string[] | undefined
        if (modes?.includes('continuous')) {
          await (track as unknown as { applyConstraints: (c: MediaTrackConstraints) => Promise<void> }).applyConstraints({
            advanced: [{ focusMode: 'continuous' }],
          } as unknown as MediaTrackConstraints)
          return
        }
        if (modes?.includes('single-shot') || modes?.includes('manual')) {
          // single-shot focus trigger
          await (track as unknown as { applyConstraints: (c: MediaTrackConstraints) => Promise<void> }).applyConstraints({
            advanced: [{ focusMode: modes.includes('single-shot') ? 'single-shot' : 'manual' }],
          } as unknown as MediaTrackConstraints)
        }
      }
    } catch {}
  }

  return (
    <PageLayout nav navExtra={<FAB onClick={handleMic} />} scroll={false} className="!bg-black">
      {/* cámara */}
      <div className="relative flex-1 overflow-hidden bg-black" onPointerDown={handleTapFocus}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* focus ring anim */}
        {tapPoint && (
          <div
            key={focusTick}
            className="absolute w-14 h-14 -ml-7 -mt-7 rounded-xl border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.3)] pointer-events-none z-20 flex items-center justify-center"
            style={{ left: tapPoint.x, top: tapPoint.y }}
          >
            <div className="w-8 h-8 rounded-lg border border-white/60 animate-[focus-pop_0.9s_ease-out]" />
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-2 p-6">
            <EmptyState
              icon={<ScanLine className="w-8 h-8 text-on-surface-muted" />}
              title="Cámara no disponible"
              description="Verifica permisos. En iOS usa Safari y HTTPS."
            />
          </div>
        )}

        {/* overlay máscara + marco horizontal */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
          {/* top bar integrada */}
          <div className="pointer-events-auto flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              {hasTorch && !cameraError && (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation()
                    void toggleTorch()
                  }}
                  className={`pointer-events-auto flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-md border transition-colors ${torchOn ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/15 text-white border-white/20 hover:bg-white/25'}`}
                  aria-label="Linterna"
                >
                  {torchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </button>
              )}
            </div>
            <h1 className="text-white text-[15px] font-semibold tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
              VoiceInvenXi
            </h1>
            <div className="w-9 flex justify-end">
              {import.meta.env.DEV && (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation()
                    handleSimulateScan()
                  }}
                  className="pointer-events-auto px-2.5 py-1 rounded-full bg-white text-on-surface text-[11px] font-semibold shadow"
                >
                  Demo
                </button>
              )}
            </div>
          </div>

          {/* centro: marco */}
          <div className="flex-1 flex flex-col items-center justify-center px-5 pb-[10vh]">
            <div className="pointer-events-none flex flex-col items-center gap-3">
              <div
                ref={frameRef}
                className={`relative w-[92vw] max-w-[380px] h-[148px] sm:h-[164px] rounded-[20px] overflow-visible
                  bg-transparent
                  shadow-[0_0_0_9999px_rgba(0,0,0,0.62)]
                  ${isScanning ? 'ring-2 ring-brand/80' : 'ring-1 ring-white/25'}
                  transition-all duration-200`}
              >
                {/* esquinas nuevas - más visibles y con gap */}
                <div className="absolute -top-[1px] -left-[1px] w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-[18px] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" />
                <div className="absolute -top-[1px] -right-[1px] w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-[18px] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" />
                <div className="absolute -bottom-[1px] -left-[1px] w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-[18px] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" />
                <div className="absolute -bottom-[1px] -right-[1px] w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-[18px] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" />

                {/* línea de escaneo horizontal optimizada para 1D */}
                <div className="absolute inset-x-3 top-0 bottom-0 overflow-hidden rounded-[14px]">
                  <div className="absolute left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_12px_rgba(249,115,22,0.95)] animate-[scan-line_1.9s_ease-in-out_infinite]" />
                </div>

                {/* guía central sutil */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[72%] h-[1px] bg-white/10" />
                </div>

                {/* brillo de borde inferior */}
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60" />
              </div>

              <div className={`mt-4 px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium shadow-sm transition-colors ${isScanning ? 'bg-brand text-white border-brand' : 'bg-white/90 text-on-surface border-white/60'}`}>
                <span className="inline-flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-white animate-pulse' : 'bg-success'}`} />
                  {isScanning ? 'Procesando…' : 'Enfoca el código dentro del marco · toca para enfocar'}
                </span>
              </div>
            </div>
          </div>

          {/* hint inferior reserva espacio para nav */}
          <div className="h-[10vh] shrink-0" />
        </div>
      </div>

      <style>{`@keyframes focus-pop { 0%{transform:scale(0.7);opacity:0} 20%{opacity:1} 100%{transform:scale(1.15);opacity:0} }`}</style>
    </PageLayout>
  )
}
