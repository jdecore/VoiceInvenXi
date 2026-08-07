import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Check, AlertTriangle, Info, X } from 'lucide-react'
import { ToastContext, type ToastContextValue, type ToastItem, type ToastVariant } from '@/hooks/useToast'
import styles from './Toast.module.css'

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <Check size={18} />,
  error: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: number) => void
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={`${styles.toast} ${styles[toast.variant]}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role="status"
    >
      <span className={styles.icon}>{ICONS[toast.variant]}</span>
      <div className={styles.body}>
        {toast.title && <span className={styles.title}>{toast.title}</span>}
        <span className={styles.message}>{toast.message}</span>
      </div>
      <button
        className={styles.close}
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback<ToastContextValue['showToast']>(
    ({ variant = 'info', title, message, duration = 3500 }) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, variant, title, message }])
      const timer = setTimeout(() => dismissToast(id), duration)
      timers.current.set(id, timer)
    },
    [dismissToast]
  )

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className={styles.container} aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
