import { useCallback, useRef, useState } from 'react'
import { speak } from '@/lib/elevenlabs'

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (utteranceRef.current) {
      window.speechSynthesis?.cancel()
      utteranceRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  const speakText = useCallback(async (text: string) => {
    stopSpeaking()
    setIsSpeaking(true)

    try {
      const blob = await speak(text)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        setIsSpeaking(false)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        setIsSpeaking(false)
      }

      await audio.play()
    } catch {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-ES'
        utterance.rate = 0.9
        utteranceRef.current = utterance

        utterance.onend = () => {
          utteranceRef.current = null
          setIsSpeaking(false)
        }

        utterance.onerror = () => {
          utteranceRef.current = null
          setIsSpeaking(false)
        }

        window.speechSynthesis.speak(utterance)
      } else {
        setIsSpeaking(false)
      }
    }
  }, [stopSpeaking])

  return { speak: speakText, isSpeaking, stop: stopSpeaking }
}
