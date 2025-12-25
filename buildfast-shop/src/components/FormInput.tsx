import React from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  name: string
  error?: string
  helperText?: string
  showErrorIcon?: boolean
}

/**
 * FormInput Component
 *
 * Enhanced form input with real-time validation feedback.
 * Based on UX best practices:
 * - Inline error display near the field
 * - Clear, specific error messages
 * - Accessible with ARIA attributes
 * - Visual distinction for errors
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      id,
      name,
      error,
      helperText,
      showErrorIcon = true,
      required,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error
    const inputId = id || name

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-main)]">
          {label}
          {required && (
            <span className="text-red-400 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={name}
            required={required}
            disabled={disabled}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`w-full px-4 py-3 bg-theme-elevated border rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 transition min-h-[44px] ${
              hasError
                ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400'
                : 'border-theme focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[0.3] ${className}`}
            {...props}
          />
          {hasError && showErrorIcon && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            >
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-400 flex items-center gap-1"
            role="alert"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-[var(--text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput
