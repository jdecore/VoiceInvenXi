import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { hapticSuccess } from '@/lib/haptics'

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
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    hapticSuccess()

    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Check circle */}
            <div className="relative">
              {/* Ripple rings */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-[#2ECC71]"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full border border-[#2ECC71]"
              />

              {/* Main circle with check */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.1 }}
                className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#2ECC71] shadow-[0_0_40px_rgba(46,204,113,0.5)]"
              >
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-white text-lg font-semibold">{message}</p>
              {subMessage && (
                <p className="text-white/60 text-sm mt-1">{subMessage}</p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
