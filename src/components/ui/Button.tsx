import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'filled',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-150 active:scale-[0.97] active:transition-transform disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    filled: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
    tonal: 'bg-brand-container text-on-brand-container hover:bg-brand/15',
    outlined: 'border border-outline text-brand hover:bg-brand/5',
    text: 'text-brand hover:bg-brand/5',
  }

  const sizeStyles = {
    sm: 'h-9 px-4 text-sm gap-2',
    md: 'h-11 px-6 text-sm gap-2',
    lg: 'h-12 px-8 text-base gap-2',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
