import { Package } from 'lucide-react'

interface BadgeProps {
  stock: number
  unit?: string | null
  size?: 'sm' | 'md'
}

export function Badge({ stock, unit = 'Unidad', size = 'sm' }: BadgeProps) {
  const getColor = () => {
    if (stock === 0) return 'bg-error-container text-error border-error/20'
    if (stock <= 10) return 'bg-warning-container text-warning border-warning/20'
    return 'bg-success-container text-success border-success/20'
  }

  const getSize = () => {
    return size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5'
  }

  const getIconSize = () => {
    return size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  }

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${getColor()} ${getSize()}
    `}>
      <Package className={getIconSize()} />
      {stock} {unit}
    </span>
  )
}
