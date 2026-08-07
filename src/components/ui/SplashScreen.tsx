import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Package } from 'lucide-react'

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 1300)

    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0a0f]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#4F8CFF]/30 blur-xl animate-pulse" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#3A6FD8] shadow-[0_0_40px_rgba(79,140,255,0.4)]">
                <Package className="w-10 h-10 text-white" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h1 className="text-white text-2xl font-bold tracking-tight">
                VoiceInvenXi
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Inventario por voz
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
