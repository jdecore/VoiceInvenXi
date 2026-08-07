import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

type SkeletonVariant = 'rect' | 'text' | 'circle'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  radius?: string
  className?: string
  style?: CSSProperties
}

export default function Skeleton({
  variant = 'rect',
  width,
  height,
  radius,
  className = '',
  style,
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    >
      <div className={styles.shimmer} />
    </div>
  )
}
