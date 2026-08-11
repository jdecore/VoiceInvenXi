interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

export function Chip({ label, selected = false, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center h-8 px-3 rounded-full
        text-sm font-medium
        border transition-all duration-150
        ${selected
          ? 'bg-brand-container text-on-brand-container border-brand/30'
          : 'bg-surface-1 text-on-surface-variant border-outline-variant hover:bg-surface-2'
        }
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
      `}
    >
      {label}
    </button>
  )
}
