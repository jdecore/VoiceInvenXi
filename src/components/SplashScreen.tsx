import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Package } from 'lucide-react'
import styles from './SplashScreen.module.css'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const timer = setTimeout(() => onDone(), reduceMotion ? 250 : 1300)
    return () => clearTimeout(timer)
  }, [onDone, reduceMotion])

  return (
    <motion.div
      className={styles.splash}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
    >
      <motion.div
        className={styles.glow}
        initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <div className={styles.logo}>
          <Package size={36} strokeWidth={2.4} />
        </div>
      </motion.div>
      <motion.h1
        className={styles.title}
        initial={reduceMotion ? false : { y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.5 }}
      >
        VoiceInvenXi
      </motion.h1>
      <motion.span
        className={styles.subtitle}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.35, duration: reduceMotion ? 0 : 0.5 }}
      >
        Inventario por voz
      </motion.span>
    </motion.div>
  )
}
