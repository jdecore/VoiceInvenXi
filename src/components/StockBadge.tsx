import React from 'react'
import { Package } from 'lucide-react'
import styles from './StockBadge.module.css'

interface StockBadgeProps {
  stock: number
  unit?: string
}

function getVariant(stock: number): 'low' | 'medium' | 'high' {
  if (stock <= 0) return 'low'
  if (stock <= 10) return 'medium'
  return 'high'
}

const StockBadge = React.memo(function StockBadge({ stock, unit }: StockBadgeProps) {
  const variant = getVariant(stock)

  return (
    <div className={`${styles.badge} ${styles[variant]}`}>
      <Package size={18} />
      <span className={styles.stockNumber}>{stock}</span>
      <span>{unit || 'uds'}</span>
    </div>
  )
})

export default StockBadge
