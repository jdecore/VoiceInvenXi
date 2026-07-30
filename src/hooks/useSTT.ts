import { useState, useRef, useCallback, useEffect } from 'react'
import { transcribe } from '@/lib/elevenlabs'

interface UseSTT {
  isListening: boolean
  transcript: string
  interimTranscript: string
  start: () => void
  stop: () => void
  isSupported: boolean
  reset: () => void
}

const MAX_RECORDING_MS = 10_000

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10))
}

type Mode = 'elevenlabs' | 'webspeech' | 'idle'

export function useSTT(): UseSTT {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const isListeningRef = useRef(false)
  const modeRef = useRef<Mode>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const hasMediaRecorder = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!window.MediaRecorder
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : undefined
  const hasWebSpeech = !!SpeechRecognitionAPI

  const isSupported = hasMediaRecorder || hasWebSpeech

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startElevenLabs = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      modeRef.current = 'elevenlabs'

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        isListeningRef.current = false

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        chunksRef.current = []

        if (blob.size > 0) {
          setInterimTranscript('Procesando...')

          try {
            const text = await transcribe(blob)
            setTranscript(text)
            setInterimTranscript('')
            await nextTick()
          } catch {
            setTranscript('')
            setInterimTranscript('')
          }
        }

        setIsListening(false)
        cleanup()
      }

      setIsListening(true)
      setInterimTranscript('')

      nextTick().then(() => {
        if (isListeningRef.current) {
          setInterimTranscript('Grabando...')
        }
      })

      mediaRecorder.start()

      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, MAX_RECORDING_MS)

      return true
    } catch {
      return false
    }
  }, [cleanup])

  const startWebSpeech = useCallback(() => {
    if (!SpeechRecognitionAPI) return false

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'es-ES'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition
    modeRef.current = 'webspeech'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }

      if (final) setTranscript(final)
      setInterimTranscript(interim)
    }

    recognition.onend = () => {
      isListeningRef.current = false
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.onerror = () => {
      isListeningRef.current = false
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.start()
    setIsListening(true)
    setTranscript('')
    setInterimTranscript('')

    return true
  }, [SpeechRecognitionAPI])

  const start = useCallback(async () => {
    if (!isSupported || isListeningRef.current) return
    isListeningRef.current = true

    cleanup()
    setTranscript('')
    setInterimTranscript('')

    if (hasMediaRecorder) {
      const started = await startElevenLabs()
      if (started) return
    }

    if (hasWebSpeech) {
      startWebSpeech()
    } else {
      isListeningRef.current = false
    }
  }, [isSupported, hasMediaRecorder, hasWebSpeech, cleanup, startElevenLabs, startWebSpeech])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  useEffect(() => {
    return () => {
      isListeningRef.current = false
      cleanup()
    }
  }, [cleanup])

  return {
    isListening,
    transcript,
    interimTranscript,
    start,
    stop,
    isSupported,
    reset,
  }
}
