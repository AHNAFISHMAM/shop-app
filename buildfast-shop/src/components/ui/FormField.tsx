/**
 * FormField Component
 *
 * A reusable form field component that integrates with useForm hook.
 * Provides consistent styling, error handling, and accessibility.
 */

import * as React from 'react'
import { Input } from './input'
import { cn } from '../../lib/utils'

/**
 * FormField Props
 */
export interface FormFieldProps<T = unknown> {
  /** Field name (for useForm integration) */
  name: string
  /** Field label */
  label?: string
  /** Field value */
  value: T
  /** Change handler */
  onChange: (value: T) => void
  /** Blur handler */
  onBlur?: () => void
  /** Error message */
  error?: string | null
  /** Helper text */
  helperText?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Input type */
  type?: string
  /** Placeholder text */
  placeholder?: string
  /** Additional CSS classes */
  className?: string
  /** Wrapper CSS classes */
  wrapperClassName?: string
  /** Input size */
  size?: 'sm' | 'default' | 'lg'
  /** Children (for custom input rendering) */
  children?: React.ReactNode
}

/**
 * FormField Component
 *
 * A reusable form field with label, input, error message, and helper text.
 * Integrates with useForm hook for consistent form handling.
 *
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   label="Email Address"
 *   value={form.values.email}
 *   onChange={form.handleChange('email')}
 *   onBlur={form.handleBlur('email')}
 *   error={form.errors.email}
 *   required
 * />
 * ```
 */
export function FormField<T = string>({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  disabled,
  type = 'text',
  placeholder,
  className,
  wrapperClassName,
  size = 'default',
  children,
}: FormFieldProps<T>) {
  const fieldId = React.useId()
  const inputId = `${fieldId}-${name}`
  const errorId = error ? `${inputId}-error` : undefined
  const helperId = helperText ? `${inputId}-helper` : undefined

  // Handle change for different input types
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = type === 'number' ? Number(e.target.value) : e.target.value
      onChange(newValue as T)
    },
    [onChange, type]
  )

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {children ? (
        // Custom input rendering
        <div>
          {label && (
            <label
              htmlFor={inputId}
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {label}
              {required && <span className="ml-1 text-[var(--destructive)]">*</span>}
            </label>
          )}
          {children}
          {error && (
            <p id={errorId} className="mt-1 text-sm text-[var(--destructive)]" role="alert">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={helperId} className="mt-1 text-sm text-[var(--text-secondary)]">
              {helperText}
            </p>
          )}
        </div>
      ) : (
        // Default Input component
        <Input
          id={inputId}
          name={name}
          type={type}
          label={label}
          value={value !== null && value !== undefined ? (value as string | number) : undefined}
          onChange={handleChange}
          onBlur={onBlur}
          error={error ?? undefined}
          helperText={helperText}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={className}
          size={size}
          wrapperClassName={wrapperClassName}
        />
      )}
    </div>
  )
}

FormField.displayName = 'FormField'
