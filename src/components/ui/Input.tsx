import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, className = '', ...props }, ref) => {
    const hasError = Boolean(error)

    return (
      <div className="w-full">
        <label className="input-label">{label}</label>
        <div className="input-wrap">
          {icon && <div className="input-icon">{icon}</div>}
          <input
            ref={ref}
            className={[
              'input',
              icon ? 'has-icon' : '',
              hasError ? 'has-error' : '',
              className,
            ].filter(Boolean).join(' ')}
            {...props}
          />
        </div>
        {(error || helper) && (
          <p className={`input-helper ${hasError ? 'input-helper--error' : 'input-helper--muted'}`}>
            {error || helper}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
