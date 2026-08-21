import { useEffect, useState } from 'react'
import { wakeBackend } from '@/lib/wake'
import { Logo } from './Logo'

interface BootSplashProps {
  onReady: () => void
}

const MAX_WAIT_MS = 45_000

export function BootSplash({ onReady }: BootSplashProps) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      onReady()
    }

    wakeBackend(controller.signal).then(() => {
      // Brief beat so the splash doesn't flash; the backend is awake.
      window.setTimeout(finish, 350)
    })

    // Show a "still starting" hint if the cold start is taking a while.
    const slowTimer = window.setTimeout(() => setSlow(true), 10_000)
    // Hard cap so the app is never blocked indefinitely.
    const capTimer = window.setTimeout(finish, MAX_WAIT_MS)

    return () => {
      controller.abort()
      window.clearTimeout(slowTimer)
      window.clearTimeout(capTimer)
    }
  }, [onReady])

  return (
    <div className="boot-splash" role="status" aria-live="polite">
      <div className="boot-logo text-on-surface">
        <Logo size={58} />
      </div>
      <div className="boot-spinner" />
      <p className="boot-sub">
        {slow ? 'El servidor se está iniciando, espera un momento…' : 'Despertando el servidor…'}
      </p>
    </div>
  )
}
