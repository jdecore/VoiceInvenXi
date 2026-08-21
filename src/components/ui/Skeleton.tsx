interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const variantClass = {
    text: 'skeleton--text',
    rect: 'skeleton--rect',
    circle: 'skeleton--circle',
  }[variant]

  return <div className={`skeleton ${variantClass} ${className}`} />
}
