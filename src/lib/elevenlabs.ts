import { API_BASE } from '@/constants'

export async function speak(text: string, voiceId = 'LnGOA2SxH2fX1e1iNzEp'): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice_id: voiceId }),
  })

  if (!response.ok) {
    throw new Error('TTS request failed')
  }

  return response.blob()
}

export async function transcribe(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')

  const response = await fetch(`${API_BASE}/api/stt`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('STT request failed')
  }

  const data = await response.json()
  return data.text
}
