import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../../lib/utils'

/**
 * Button Component
 *
 * A fully accessible, mobile-first button component with multiple variants and sizes.
 * Meets WCAG 2.2 AA accessibility standards with 44px minimum touch targets,
 * full keyboard navigation, and proper ARIA support.
 *
 * @example
 * ```tsx
 * <Button variant="default" size="default">
 *   Click me
 * </Button>
 *
 * <Button variant="destructive" size="lg" disabled>
 *   Delete
 * </Button>
 * ```
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * Render as a different element using Radix Slot
   * Useful for rendering buttons as links or other components
   */
  asChild?: boolean
}

// Extract constants outside component (performance best practice)
const VARIANTS = {
  default:
    'bg-[var(--accent)] text-black shadow-sm shadow-black/5 hover:bg-[var(--accent)]/90 focus-visible:ring-[var(--accent)]/50',
  destructive:
    'bg-[var(--destructive)] text-white shadow-sm shadow-black/5 hover:bg-[var(--destructive-hover)] focus-visible:ring-[var(--destructive)]/50',
  outline:
    'border border-[var(--border-default)] bg-[var(--bg-main)] shadow-sm shadow-black/5 hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] focus-visible:ring-[var(--accent)]/50',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-sm shadow-black/5 hover:bg-[var(--bg-hover)] focus-visible:ring-[var(--accent)]/50',
  ghost:
    'hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] focus-visible:ring-[var(--accent)]/50',
  link: 'text-[var(--accent)] underline-offset-4 hover:underline focus-visible:ring-[var(--accent)]/50',
} as const

const SIZES = {
  default: 'min-h-[44px] h-11 px-4 py-2.5 text-sm',
  sm: 'min-h-[44px] h-11 rounded-lg px-3 text-xs',
  lg: 'min-h-[44px] h-12 rounded-lg px-8 text-base',
  icon: 'min-h-[44px] min-w-[44px] h-11 w-11',
} as const

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: VARIANTS.default,
        destructive: VARIANTS.destructive,
        outline: VARIANTS.outline,
        secondary: VARIANTS.secondary,
        ghost: VARIANTS.ghost,
        link: VARIANTS.link,
      },
      size: {
        default: SIZES.default,
        sm: SIZES.sm,
        lg: SIZES.lg,
        icon: SIZES.icon,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
