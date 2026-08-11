interface VoiceWaveProps {
  active?: boolean
  bars?: number
}

export function VoiceWave({ active = false, bars = 5 }: VoiceWaveProps) {
  return (
    <div className="flex items-center justify-center gap-1 h-8" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`
            w-1 rounded-full transition-all duration-150
            ${active
              ? 'bg-brand animate-wave-bar'
              : 'bg-surface-3 h-1'
            }
          `}
          style={active ? { animationDelay: `${i * 0.15}s` } : undefined}
        />
      ))}
    </div>
  )
}
