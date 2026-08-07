import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  variant: ToastVariant
  title?: string
  message: string
}

interface ToastContextValue {
  showToast: (toast: { variant?: ToastVariant; title?: string; message: string; duration?: number }) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return { showToast: () => {}, dismissToast: () => {} }
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [counter, setCounter] = useState(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({
      variant = 'info',
      title,
      message,
      duration = 3500,
    }: {
      variant?: ToastVariant
      title?: string
      message: string
      duration?: number
    }) => {
      const id = counter + 1
      setCounter(id)
      setToasts((prev) => [...prev, { id, variant, title, message }])

      setTimeout(() => dismissToast(id), duration)
    },
    [counter, dismissToast]
  )

  const getIcon = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#2ECC71]" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#FF5A5F]" />
      case 'info':
        return <Info className="w-5 h-5 text-[#4F8CFF]" />
    }
  }

  const getBorderColor = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return 'border-[#2ECC71]/30'
      case 'error':
        return 'border-[#FF5A5F]/30'
      case 'info':
        return 'border-[#4F8CFF]/30'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-[440px] px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`
                pointer-events-auto
                flex items-start gap-3 p-3
                bg-[rgba(18,18,26,0.95)] backdrop-blur-xl
                border ${getBorderColor(toast.variant)}
                rounded-2xl shadow-lg
              `}
            >
              <div className="mt-0.5">{getIcon(toast.variant)}</div>
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="text-white text-sm font-semibold">{toast.title}</p>
                )}
                <p className="text-white/80 text-sm">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="mt-0.5 text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
