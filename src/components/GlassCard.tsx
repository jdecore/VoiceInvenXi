import React from 'react'
import { motion } from 'motion/react'
import styles from './GlassCard.module.css'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  interactive?: boolean
  compact?: boolean
  noPadding?: boolean
  onClick?: () => void
}

const GlassCard = React.memo(function GlassCard({
  children,
  className,
  elevated,
  interactive,
  compact,
  noPadding,
  onClick,
}: GlassCardProps) {
  const classes = [
    styles.glassCard,
    elevated && styles.elevated,
    interactive && styles.interactive,
    compact && styles.compact,
    noPadding && styles.noPadding,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (interactive || onClick) {
    return (
      <motion.div
        className={classes}
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={classes}>{children}</div>
})

export default GlassCard
