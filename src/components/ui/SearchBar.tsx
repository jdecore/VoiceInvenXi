import { Search, Mic } from 'lucide-react'
import { hapticTap } from '@/lib/haptics'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  onVoiceClick?: () => void
  onSearch?: () => void
  placeholder?: string
  isListening?: boolean
  disabled?: boolean
}

export function SearchBar({
  value = '',
  onChange,
  onVoiceClick,
  onSearch,
  placeholder = 'Buscar producto...',
  isListening = false,
  disabled = false,
}: SearchBarProps) {
  const handleVoiceClick = () => {
    hapticTap()
    onVoiceClick?.()
  }

  return (
    <div className="flex items-center gap-2 px-4 pb-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
          placeholder={placeholder}
          disabled={disabled}
          className="
            w-full h-12 pl-10 pr-4
            bg-white/[0.06] border border-white/[0.1]
            rounded-2xl text-white text-[15px] font-medium
            placeholder:text-white/35
            focus:outline-none focus:border-[#4F8CFF]/50 focus:bg-white/[0.08]
            transition-all duration-200
            disabled:opacity-50
          "
        />
      </div>
      <button
        onClick={handleVoiceClick}
        disabled={disabled}
        className={`
          flex items-center justify-center
          w-12 h-12 rounded-2xl
          transition-all duration-300
          ${isListening
            ? 'bg-[#FF5A5F] shadow-[0_0_24px_rgba(255,90,95,0.5)] animate-pulse-scan'
            : 'bg-[#4F8CFF] hover:bg-[#3A6FD8] shadow-[0_4px_16px_rgba(79,140,255,0.3)]'
          }
          disabled:opacity-50
        `}
      >
        <Mic className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}
