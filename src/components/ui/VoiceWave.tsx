interface VoiceWaveProps {
  active?: boolean
  bars?: number
}

export function VoiceWave({ active = false, bars = 5 }: VoiceWaveProps) {
  return (
    <div className={`voice-wave ${active ? 'voice-wave--active' : ''}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} style={active ? { animationDelay: `${i * 0.15}s` } : undefined} />
      ))}
    </div>
  )
}
