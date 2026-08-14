/// <reference types="vite/client" />

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

interface Window {
  SpeechRecognition: SpeechRecognitionConstructor
  webkitSpeechRecognition: SpeechRecognitionConstructor
  webkitAudioContext?: typeof AudioContext
}

interface BarcodeDetectedCode {
  rawValue: string
  format: string
  boundingBox: DOMRectReadOnly
}

interface BarcodeDetector {
  detect(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  ): Promise<BarcodeDetectedCode[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetector
}

interface Window {
  BarcodeDetector?: BarcodeDetectorConstructor
}
