import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import styles from './SuccessCheck.module.css'

interface SuccessCheckProps {
  message: string
  subMessage?: string
  onComplete?: () => void
  duration?: number
}

export default function SuccessCheck({
  message,
  subMessage,
  onComplete,
  duration = 2500,
}: SuccessCheckProps) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className={styles.container}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <div className={styles.circle}>
            <svg className={styles.checkSvg} viewBox="0 0 24 24">
              <path
                className={`${styles.checkPath} ${styles.checkPathAnimated}`}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div className={styles.ripple} />
            <div className={styles.ripple} style={{ animationDelay: '0.5s' }} />
          </div>
          <motion.span
            className={styles.message}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.span>
          {subMessage && (
            <motion.span
              className={styles.subMessage}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {subMessage}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
