interface StockValueProps {
  stock: number
  unit?: string | null
  className?: string
}

export function getStockColor(stock: number): string {
  if (stock === 0) return 'text-error'
  if (stock <= 10) return 'text-warning'
  return 'text-success'
}

export function StockValue({ stock, unit, className = '' }: StockValueProps) {
  return (
    <span className={`stock-value ${className}`}>
      {stock}
      {unit && <span className="unit">{unit}</span>}
    </span>
  )
}
