import { API_BASE } from '@/constants'

/**
 * Pings the backend health endpoint. On Render's free tier the service spins
 * down when idle, so this first request also "warms" it up (cold start).
 * Returns true if the backend answered OK, false on network/timeout errors.
 */
export async function wakeBackend(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal,
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}
