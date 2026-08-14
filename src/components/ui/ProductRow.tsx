import { Package } from 'lucide-react'
import { StockBadge } from './StockBadge'

interface ProductRowProps {
  name: string
  meta: string
  stock: number
  unit?: string | null
}

export function ProductRow({ name, meta, stock, unit }: ProductRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-container shrink-0">
        <Package className="w-5 h-5 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-on-surface font-medium truncate">{name}</p>
        <p className="text-on-surface-muted text-sm truncate">{meta}</p>
      </div>
      <StockBadge stock={stock} unit={unit} />
    </div>
  )
}