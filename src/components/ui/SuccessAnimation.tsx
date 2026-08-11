import { motion, AnimatePresence } from 'motion/react'
import { Check } from 'lucide-react'
import { hapticSuccess } from '@/lib/haptics'
import { useEffect } from 'react'

interface SuccessAnimationProps {
  message: string
  subMessage?: string
  onComplete?: () => void
  duration?: number
}

export function SuccessAnimation({
  message,
  subMessage,
  onComplete,
  duration = 2500,
}: SuccessAnimationProps) {
  useEffect(() => {
    hapticSuccess()
    const timer = setTimeout(() => onComplete?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-success/20"
            initial={{ scale: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-success shadow-lg shadow-success/30">
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-on-surface text-lg font-semibold">{message}</p>
          {subMessage && (
            <p className="text-on-surface-muted text-sm mt-1">{subMessage}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
