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
    <div className="product-row">
      <div className="product-row-tile">
        <Package />
      </div>
      <div className="product-row-body">
        <p className="product-row-name">{name}</p>
        <p className="product-row-meta">{meta}</p>
      </div>
      <StockBadge stock={stock} unit={unit} />
    </div>
  )
}
