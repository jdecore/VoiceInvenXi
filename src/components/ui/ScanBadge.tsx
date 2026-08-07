import { Package } from 'lucide-react'

interface ScanBadgeProps {
  productName: string
  quantity?: number
  type?: 'in' | 'out'
  onClick?: () => void
}

export function ScanBadge({ productName, quantity, type, onClick }: ScanBadgeProps) {
  if (!productName) return null

  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2 mx-4 mb-3 px-3 py-2
        bg-white/[0.06] border border-white/[0.1]
        rounded-xl
        hover:bg-white/[0.1] active:bg-white/[0.08]
        transition-all duration-200
        text-left w-[calc(100%-2rem)]
      "
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4F8CFF]/20">
        <Package className="w-4 h-4 text-[#4F8CFF]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-medium truncate">
          {productName}
        </p>
        {quantity !== undefined && type && (
          <p className={`text-xs font-semibold ${type === 'in' ? 'text-[#2ECC71]' : 'text-[#FF5A5F]'}`}>
            {type === 'in' ? '+' : '-'}{quantity} unidades
          </p>
        )}
      </div>
    </button>
  )
}
