let audioCtx: AudioContext | null = null
let unlockListenersBound = false

const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'keydown'] as const

// Los navegadores (especialmente iOS Safari y Chrome móvil) mantienen el
// AudioContext "suspended" hasta que el usuario interactúa con la página.
// Sin esto, el beep posterior a un escaneo (que no es un gesto de usuario)
// se ejecutaba en silencio → "escanea pero no suena".
function ensureUnlockListeners(): void {
  if (unlockListenersBound || typeof window === 'undefined') return
  unlockListenersBound = true
  const unlock = () => {
    const ctx = getContext()
    if (ctx?.state === 'suspended') void ctx.resume().catch(() => {})
  }
  for (const event of UNLOCK_EVENTS) {
    window.addEventListener(event, unlock, { once: true, passive: true })
  }
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioCtx ??= new Ctor()
    return audioCtx
  } catch {
    return null
  }
}

export function playScanBeep(): void {
  ensureUnlockListeners()
  const ctx = getContext()
  if (!ctx) return
  try {
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1318.5, t0)
    osc.frequency.exponentialRampToValueAtTime(987.8, t0 + 0.09)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + 0.18)
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  } catch {
    // Sin soporte de audio — no-op
  }
}
