import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Input Component
 * 
 * A fully accessible, mobile-first input component with error/success states.
 * Meets WCAG 2.2 AA accessibility standards with 44px minimum touch targets,
 * proper label association, error announcements, and full keyboard navigation.
 * 
 * @example
 * ```tsx
 * <Input
 *   id="email"
 *   type="email"
 *   label="Email Address"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error="Please enter a valid email"
 * />
 * 
 * <Input
 *   id="name"
 *   type="text"
 *   label="Full Name"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 *   success
 *   helperText="Looks good!"
 * />
 * ```
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Label text for the input. If provided, automatically associates label with input via htmlFor/id.
   * If you prefer to render your own label, omit this prop and use the `id` prop.
   */
  label?: string
  /**
   * Helper text displayed below the input. Useful for instructions or hints.
   */
  helperText?: string
  /**
   * Error message to display. When provided, input shows error styling.
   */
  error?: string
  /**
   * Show success state styling. Useful for validation feedback.
   */
  success?: boolean
  /**
   * Size variant of the input
   */
  size?: "sm" | "default" | "lg"
  /**
   * Optional wrapper className for the entire input group (label + input + helper/error)
   */
  wrapperClassName?: string
}

// Extract constants outside component (performance best practice)
const SIZE_CLASSES = {
  sm: "min-h-[44px] h-11 px-3 py-2.5 text-sm",
  default: "min-h-[44px] h-11 px-4 py-2.5 text-sm",
  lg: "min-h-[44px] h-12 px-4 py-3 text-base",
} as const

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      label,
      helperText,
      error,
      success = false,
      size = "default",
      id,
      type = "text",
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided (for label association)
    const inputId = React.useId()
    const finalId = id || inputId
    const hasError = Boolean(error)
    const showHelperText = Boolean(helperText || error)

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={finalId}
            className={cn(
              "block text-sm font-medium text-[var(--text-primary)]",
              disabled && "opacity-50 cursor-not-allowed",
              required && "after:content-['*'] after:ml-0.5 after:text-[var(--destructive)]"
            )}
          >
            {label}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={finalId}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            showHelperText ? `${finalId}-helper` : undefined
          }
          aria-required={required}
          className={cn(
            // Base styles
            "w-full rounded-lg border bg-[var(--bg-elevated)] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-tertiary)]",
            "transition-colors outline-offset-2",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-main)]/30",
            // Size
            SIZE_CLASSES[size],
            // Border and focus states
            !hasError && !success && "border-[var(--border-default)] focus:border-[var(--accent)] focus:ring-[var(--accent)]/50",
            // Error state
            hasError && "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/50",
            // Success state
            success && !hasError && "border-[var(--status-success-border)] focus:border-[var(--status-success-border)] focus:ring-[var(--status-success-border)]/50",
            // Shadow
            "shadow-sm shadow-black/5",
            className
          )}
          {...props}
        />

        {/* Helper text / Error message */}
        {showHelperText && (
          <p
            id={`${finalId}-helper`}
            role={hasError ? "alert" : undefined}
            className={cn(
              "text-xs",
              hasError
                ? "text-[var(--destructive)]"
                : success
                ? "text-[var(--status-success-border)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

