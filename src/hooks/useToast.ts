import { createContext, useContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  variant: ToastVariant
  title?: string
  message: string
}

export interface ToastContextValue {
  showToast: (toast: { variant?: ToastVariant; title?: string; message: string; duration?: number }) => void
  dismissToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return { showToast: () => {}, dismissToast: () => {} }
  }
  return ctx
}
