import React from 'react'
import { motion } from 'motion/react'
import styles from './GlassIconButton.module.css'

interface GlassIconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  size?: number
  label?: string
}

const GlassIconButton = React.memo(function GlassIconButton({
  icon,
  onClick,
  disabled,
  size = 64,
  label,
}: GlassIconButtonProps) {
  return (
    <motion.button
      className={`${styles.iconButton} ${disabled ? styles.disabled : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  )
})

export default GlassIconButton
