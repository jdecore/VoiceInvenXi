interface StockValueProps {
  stock: number
  unit?: string | null
  className?: string
  unitClassName?: string
}

export function getStockColor(stock: number): string {
  if (stock === 0) return 'text-error'
  if (stock <= 10) return 'text-warning'
  return 'text-success'
}

export function StockValue({ stock, unit, className = '', unitClassName = 'text-sm text-on-surface-muted' }: StockValueProps) {
  return (
    <span className={`tabular-nums ${className}`}>
      {stock}
      {unit && <span className={`ml-1 ${unitClassName}`}>{unit}</span>}
    </span>
  )
}
