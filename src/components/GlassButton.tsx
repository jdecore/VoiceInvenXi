import React from 'react'
import { motion } from 'motion/react'
import type { GlassVariant, ButtonSize } from '@/types'
import styles from './GlassButton.module.css'

interface GlassButtonProps {
  children: React.ReactNode
  variant?: GlassVariant
  size?: ButtonSize
  icon?: React.ReactNode
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
}

const GlassButton = React.memo(function GlassButton({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  fullWidth,
  disabled,
  onClick,
}: GlassButtonProps) {
  const classes = [
    styles.glassButton,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    styles.focusVisible,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {icon}
      {children}
    </motion.button>
  )
})

export default GlassButton
