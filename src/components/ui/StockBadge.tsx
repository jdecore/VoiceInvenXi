import { IconPackage } from '@tabler/icons-react'
import { StockValue } from './StockValue'

interface StockBadgeProps {
  stock: number
  unit?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function StockBadge({ stock, unit = 'Unidad', size = 'md' }: StockBadgeProps) {
  const tone = stock === 0 ? 'empty' : stock <= 10 ? 'low' : 'ok'

  const classes = [
    'stock-badge',
    `stock-badge--${size}`,
    `stock-badge--${tone}`,
  ].join(' ')

  return (
    <span className={classes}>
      <IconPackage />
      <StockValue stock={stock} unit={unit} />
    </span>
  )
}
