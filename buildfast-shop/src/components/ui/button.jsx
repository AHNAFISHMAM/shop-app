import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import * as React from "react"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-black shadow-sm shadow-black/5 hover:bg-[var(--accent)]/90",
        destructive:
          "bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-600/90",
        outline:
          "border border-theme bg-[var(--bg-main)] shadow-sm shadow-black/5 hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-main)]",
        secondary:
          "bg-[rgba(255,255,255,0.05)] text-[var(--text-main)] shadow-sm shadow-black/5 hover:bg-[rgba(255,255,255,0.08)]",
        ghost: "hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-main)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

