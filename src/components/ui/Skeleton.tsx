interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const base = 'relative overflow-hidden bg-surface-2 rounded-xl'

  const variants = {
    text: 'h-4 w-3/4',
    rect: 'h-32 w-full',
    circle: 'h-12 w-12 rounded-full',
  }

  return (
    <div className={`${base} ${variants[variant]} ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}
