type HapticPattern = number | number[]

let supported = false
let checked = false

function isSupported(): boolean {
  if (checked) return supported
  checked = true
  supported = typeof navigator !== 'undefined' && 'vibrate' in navigator
  return supported
}

export function haptic(pattern: HapticPattern = 15): void {
  if (!isSupported()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Silently fail on unsupported / blocked environments
  }
}

export function hapticSuccess(): void {
  haptic([12, 40, 24])
}

export function hapticTap(): void {
  haptic(10)
}
