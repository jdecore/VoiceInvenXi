import { motion } from 'motion/react'
import { Mic } from 'lucide-react'
import { hapticTap } from '@/lib/haptics'
import styles from './MicButton.module.css'

interface MicButtonProps {
  isListening: boolean
  onClick: () => void
  disabled?: boolean
  size?: number
}

export default function MicButton({
  isListening,
  onClick,
  disabled,
  size = 28,
}: MicButtonProps) {
  const handleClick = () => {
    hapticTap()
    onClick()
  }

  return (
    <motion.button
      className={`${styles.micButton} ${isListening ? styles.listening : ''} ${disabled ? styles.disabled : ''}`}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      aria-label="Grabar voz"
    >
      <Mic size={size} />
    </motion.button>
  )
}
