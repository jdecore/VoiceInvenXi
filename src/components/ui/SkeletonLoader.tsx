interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
}

export function SkeletonLoader({ className = '', variant = 'rect' }: SkeletonLoaderProps) {
  const baseClasses = 'relative overflow-hidden bg-white/[0.06] rounded-xl'

  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'h-32 w-full rounded-xl',
    circle: 'h-12 w-12 rounded-full',
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  )
}
