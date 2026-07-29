import React from 'react'
import styles from './PhoneFrame.module.css'

interface PhoneFrameProps {
  children: React.ReactNode
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className={styles.phoneFrame}>
      <div className={styles.screen}>{children}</div>
    </div>
  )
}
