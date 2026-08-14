import { Package } from 'lucide-react'
import { StockValue } from './StockValue'

interface StockBadgeProps {
  stock: number
  unit?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function StockBadge({ stock, unit = 'Unidad', size = 'md' }: StockBadgeProps) {
  const getColor = () => {
    if (stock === 0) return 'bg-error-container text-error border-error/20'
    if (stock <= 10) return 'bg-warning-container text-warning border-warning/20'
    return 'bg-success-container text-success border-success/20'
  }

  const getSize = () => {
    switch (size) {
      case 'sm': return 'px-2 py-0.5 text-xs gap-1'
      case 'md': return 'px-3 py-1 text-sm gap-1.5'
      case 'lg': return 'px-4 py-1.5 text-base gap-2'
    }
  }

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${getColor()} ${getSize()}
    `}>
      <Package className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      <StockValue stock={stock} unit={unit} unitClassName="text-[inherit]" />
    </span>
  )
}
