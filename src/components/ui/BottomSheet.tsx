import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface BottomSheetProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
}

export function BottomSheet({ open, onClose, children, className = '' }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {onClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/30 z-40"
            />
          )}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl
              shadow-[0_-4px_20px_rgba(0,0,0,0.1)]
              pb-[env(safe-area-inset-bottom)]
              max-h-[80vh] overflow-y-auto
              ${className}
            `}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
