import { useRef, useEffect, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera } from 'lucide-react'
import styles from './CameraView.module.css'

function playScanBeep() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.value = 1200
    gain.gain.value = 0.3
    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    oscillator.stop(ctx.currentTime + 0.15)
  } catch {
    // Silently fail if AudioContext not available
  }
}

interface CameraViewProps {
  showScanHint?: boolean
  onScan?: (barcode: string) => void
  scanning?: boolean
}

export default function CameraView({ showScanHint = true, onScan, scanning = true }: CameraViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasCamera, setHasCamera] = useState(true)
  const [scanningActive, setScanningActive] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const handleScan = useCallback(
    (decodedText: string) => {
      if (onScan) {
        playScanBeep()
        onScan(decodedText)
      }
    },
    [onScan]
  )

  useEffect(() => {
    if (!scanning || !containerRef.current) return

    const scanner = new Html5Qrcode('qr-scanner-region')
    scannerRef.current = scanner

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            handleScan(decodedText)
          },
          () => {}
        )
        setScanningActive(true)
        setHasCamera(true)
      } catch {
        setHasCamera(false)
      }
    }

    startScanner()

    return () => {
      try {
        scannerRef.current?.stop()
      } catch {
        // Ignore errors during cleanup
      }
      try {
        scannerRef.current?.clear()
      } catch {
        // Ignore errors during cleanup
      }
    }
  }, [scanning, handleScan])

  if (!hasCamera) {
    return (
      <div className={styles.cameraContainer}>
        <div className={styles.noCamera}>
          <Camera size={48} opacity={0.3} />
          <span className={styles.noCameraText}>
            Cámara no disponible.
            <br />
            Pulsa el botón de búsqueda para simular un escaneo.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.cameraContainer} ref={containerRef}>
      <div id="qr-scanner-region" className={styles.scannerRegion} />
      {scanningActive && (
        <div className={styles.scanOverlay}>
          <div className={styles.scanArea}>
            <div className={`${styles.corner} ${styles.topLeft}`} />
            <div className={`${styles.corner} ${styles.topRight}`} />
            <div className={`${styles.corner} ${styles.bottomLeft}`} />
            <div className={`${styles.corner} ${styles.bottomRight}`} />
            <div className={styles.scanLine} />
          </div>
        </div>
      )}
      {showScanHint && scanningActive && (
        <span className={styles.hint}>Apunta al código de barras</span>
      )}
    </div>
  )
}
