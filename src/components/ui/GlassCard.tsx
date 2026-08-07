import { type ReactNode } from 'react'
import { motion } from 'motion/react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  elevated?: boolean
  interactive?: boolean
  onClick?: () => void
}

export function GlassCard({
  children,
  className = '',
  elevated = false,
  interactive = false,
  onClick,
}: GlassCardProps) {
  const baseClasses = `
    bg-white/[0.06] backdrop-blur-xl
    border border-white/[0.1]
    rounded-2xl p-4
    ${elevated ? 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : ''}
    ${onClick ? 'cursor-pointer' : ''}
  `

  if (interactive && onClick) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${baseClasses} ${className}`}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </div>
  )
}
