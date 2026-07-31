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
  error: string | null
}

const MAX_RECORDING_MS = 10_000
const WEB_SPEECH_TIMEOUT_MS = 15_000

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10))
}

type Mode = 'elevenlabs' | 'webspeech' | 'idle'

export function useSTT(): UseSTT {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
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
            setIsListening(false)
            cleanup()
          } catch {
            setInterimTranscript('')
            cleanup()

            if (hasWebSpeech) {
              startWebSpeech()
            } else {
              setTranscript('')
              setIsListening(false)
              setError('Error al procesar audio')
            }
          }
        } else {
          setIsListening(false)
          cleanup()
        }
      }

      setIsListening(true)
      setInterimTranscript('')
      setError(null)

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
  }, [cleanup, hasWebSpeech])

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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isListeningRef.current = false
      setIsListening(false)
      recognitionRef.current = null
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado')
      } else if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta de nuevo.')
      } else if (event.error === 'network') {
        setError('Error de red')
      } else if (event.error !== 'aborted') {
        setError('Error de reconocimiento de voz')
      }
    }

    recognition.start()
    setIsListening(true)
    setTranscript('')
    setInterimTranscript('')
    setError(null)

    timeoutRef.current = setTimeout(() => {
      if (isListeningRef.current && recognitionRef.current) {
        recognitionRef.current.stop()
        isListeningRef.current = false
        setIsListening(false)
        setError('Tiempo de espera agotado')
      }
    }, WEB_SPEECH_TIMEOUT_MS)

    return true
  }, [SpeechRecognitionAPI])

  const start = useCallback(async () => {
    if (!isSupported || isListeningRef.current) return

    cleanup()
    setTranscript('')
    setInterimTranscript('')
    setError(null)

    if (hasWebSpeech) {
      const started = startWebSpeech()
      if (started) {
        isListeningRef.current = true
      }
    } else if (hasMediaRecorder) {
      const started = await startElevenLabs()
      if (started) {
        isListeningRef.current = true
      }
    }
  }, [isSupported, hasWebSpeech, hasMediaRecorder, cleanup, startWebSpeech, startElevenLabs])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
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
    error,
  }
}
