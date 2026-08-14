import { motion } from 'motion/react'
import { Mic } from 'lucide-react'
import { hapticTap } from '@/lib/haptics'

interface FABProps {
  isListening?: boolean
  onClick?: () => void
  disabled?: boolean
  'aria-label'?: string
}

export function FAB({ isListening = false, onClick, disabled = false, 'aria-label': ariaLabel = 'Buscar por voz' }: FABProps) {
  const handleClick = () => {
    hapticTap()
    onClick?.()
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative flex items-center justify-center
        w-14 h-14 rounded-full
        shadow-lg
        transition-all duration-300
        shrink-0
        ${isListening
          ? 'bg-error text-white shadow-error/30 animate-pulse-mic'
          : 'bg-brand text-white hover:bg-brand-dark shadow-brand/20'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={ariaLabel}
    >
      <Mic className="w-6 h-6" />
      {isListening && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-error"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  )
}