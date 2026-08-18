import { useCallback, useRef, useState } from 'react'

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stopSpeaking = useCallback(() => {
    if (utteranceRef.current) {
      window.speechSynthesis?.cancel()
      utteranceRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  const speakNative = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false)
      return
    }

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
  }, [])

  const speakText = useCallback((text: string) => {
    stopSpeaking()
    setIsSpeaking(true)
    speakNative(text)
  }, [stopSpeaking, speakNative])

  return { speak: speakText, isSpeaking, stop: stopSpeaking }
}
