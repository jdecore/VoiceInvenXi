import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
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
  success: <CheckCircle />,
  error: <AlertCircle />,
  info: <Info />,
}

export function ToastHost() {
  const { toasts, dismissToast } = useToast()
  const [listRef] = useAutoAnimate<HTMLDivElement>()

  return (
    <div className="toast-host" aria-live="polite">
      <div ref={listRef} className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.variant}`}>
            {icons[toast.variant]}
            <p className="toast-msg">{toast.message}</p>
            <button onClick={() => dismissToast(toast.id)} className="toast-close" aria-label="Cerrar">
              <X />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
