import styles from './LoadingDots.module.css'

interface LoadingDotsProps {
  text?: string
}

export default function LoadingDots({ text = 'Cargando...' }: LoadingDotsProps) {
  return (
    <div className={styles.container}>
      <div className={styles.dots}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
      <span className={styles.text}>{text}</span>
    </div>
  )
}
