import { useState, useRef, useCallback, useEffect } from 'react'

interface UseCamera {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
  torchOn: boolean
  capture: () => Promise<Blob | null>
  start: () => Promise<void>
  stop: () => void
  toggleTorch: () => Promise<void>
}

export function useCamera(): UseCamera {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsActive(true)
    } catch {
      setIsActive(false)
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsActive(false)
    setTorchOn(false)
  }, [])

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
    })
  }, [])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return

    const next = !torchOn
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      })
      setTorchOn(next)
    } catch {
      // Linterna no soportada en este dispositivo — no-op
    }
  }, [torchOn])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { videoRef, isActive, torchOn, capture, start, stop, toggleTorch }
}
