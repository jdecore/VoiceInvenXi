import React from 'react'
import styles from './GlassInput.module.css'

interface GlassInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ReactNode
  error?: string
  readOnly?: boolean
}

const GlassInput = React.memo(function GlassInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  readOnly,
}: GlassInputProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.inputWrapper}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        <input
          className={styles.input}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
})

export default GlassInput
