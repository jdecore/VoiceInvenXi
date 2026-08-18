import { API_BASE } from '@/constants'

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