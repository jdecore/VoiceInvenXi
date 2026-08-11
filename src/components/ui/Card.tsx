import { type ReactNode } from 'react'
import { motion } from 'motion/react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function Card({ children, className = '', onClick, interactive = false }: CardProps) {
  if (interactive && onClick) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
          bg-surface-1 rounded-2xl p-4
          border border-outline-variant/50
          shadow-sm
          cursor-pointer active:bg-surface-2
          transition-colors duration-150
          ${className}
        `}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-surface-1 rounded-2xl p-4
        border border-outline-variant/50
        shadow-sm
        ${onClick ? 'cursor-pointer active:bg-surface-2 transition-colors duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
