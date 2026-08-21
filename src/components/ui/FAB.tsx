import { Mic } from 'lucide-react'
import { hapticTap } from '@/lib/haptics'

interface FABProps {
  isListening?: boolean
  onClick?: () => void
  disabled?: boolean
  'aria-label'?: string
}

export function FAB({
  isListening = false,
  onClick,
  disabled = false,
  'aria-label': ariaLabel = 'Buscar por voz',
}: FABProps) {
  const handleClick = () => {
    hapticTap()
    onClick?.()
  }

  const classes = ['fab', isListening ? 'fab--listening' : 'fab--idle']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      <Mic />
    </button>
  )
}
