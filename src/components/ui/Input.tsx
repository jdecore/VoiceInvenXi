import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full h-12 px-4
              bg-transparent
              border rounded-xl
              text-on-surface text-[15px]
              placeholder:text-on-surface-muted
              transition-colors duration-150
              ${icon ? 'pl-10' : ''}
              ${error
                ? 'border-error focus:border-error'
                : 'border-outline focus:border-brand'
              }
              focus:outline-none focus:ring-2
              ${error ? 'focus:ring-error/20' : 'focus:ring-brand/20'}
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>
        {(error || helper) && (
          <p className={`mt-1 text-xs ${error ? 'text-error' : 'text-on-surface-muted'}`}>
            {error || helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
