interface GlassInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ReactNode
  error?: string
  readOnly?: boolean
}

export function GlassInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  readOnly = false,
}: GlassInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-white/60 text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`
            w-full h-12 ${icon ? 'pl-10' : 'pl-4'} pr-4
            bg-white/[0.06] border ${error ? 'border-[#FF5A5F]/50' : 'border-white/[0.1]'}
            rounded-xl text-white text-[15px]
            placeholder:text-white/35
            focus:outline-none focus:border-[#4F8CFF]/50 focus:bg-white/[0.08]
            transition-all duration-200
            ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-[#FF5A5F] text-xs">{error}</p>
      )}
    </div>
  )
}
