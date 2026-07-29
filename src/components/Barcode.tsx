import React from 'react'
import { Barcode as BarcodeIcon } from 'lucide-react'
import styles from './Barcode.module.css'

interface BarcodeProps {
  value: string
  size?: 'sm' | 'md'
}

const Barcode = React.memo(function Barcode({ value, size = 'md' }: BarcodeProps) {
  return (
    <div className={`${styles.barcode} ${size === 'sm' ? styles.sm : ''}`}>
      <BarcodeIcon size={16} className={styles.barcodeIcon} />
      <span>{value}</span>
    </div>
  )
})

export default Barcode
