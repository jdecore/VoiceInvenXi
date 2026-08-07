import styles from './VoiceWave.module.css'

interface VoiceWaveProps {
  active: boolean
  bars?: number
}

export default function VoiceWave({ active, bars = 5 }: VoiceWaveProps) {
  return (
    <div className={`${styles.container} ${!active ? styles.inactive : ''}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className={styles.bar} />
      ))}
    </div>
  )
}
