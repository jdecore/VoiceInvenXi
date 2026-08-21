import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: number
  variant: ToastVariant
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (variant: ToastVariant, message: string) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const timeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = idRef.current++
    setToasts((prev) => [...prev.slice(-2), { id, variant, message }])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timeoutRef.current.delete(id)
    }, 3000)
    timeoutRef.current.set(id, timer)
  }, [])

  const dismissToast = useCallback((id: number) => {
    const timer = timeoutRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timeoutRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    return () => {
      for (const timer of timeoutRef.current.values()) {
        clearTimeout(timer)
      }
      timeoutRef.current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <AlertCircle className="w-5 h-5 text-error" />,
  info: <Info className="w-5 h-5 text-brand" />,
}

const borderColors = {
  success: 'border-success/30',
  error: 'border-error/30',
  info: 'border-brand/30',
}

export function ToastHost() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[480px] px-4 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={`
              flex items-center gap-3 px-4 py-3
              bg-white rounded-2xl shadow-lg
              border ${borderColors[toast.variant]} pointer-events-auto
            `}
          >
            {icons[toast.variant]}
            <p className="flex-1 text-sm text-on-surface">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-on-surface-muted hover:text-on-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}