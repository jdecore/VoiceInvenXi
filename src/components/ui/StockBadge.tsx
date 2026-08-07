import { Package } from 'lucide-react'

interface StockBadgeProps {
  stock: number
  unit?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StockBadge({ stock, unit = 'Unidad', size = 'md' }: StockBadgeProps) {
  const getColor = () => {
    if (stock === 0) return 'bg-[#FF5A5F]/20 text-[#FF5A5F] border-[#FF5A5F]/30'
    if (stock <= 10) return 'bg-[#FFB347]/20 text-[#FFB347] border-[#FFB347]/30'
    return 'bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]/30'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div
      className={`
        inline-flex items-center font-semibold
        rounded-full border
        ${getColor()}
        ${sizeClasses[size]}
      `}
    >
      <Package className={iconSizes[size]} />
      <span>{stock} {unit}</span>
    </div>
  )
}
