import { useState, useEffect, type ReactNode, type ElementType } from 'react'

/**
 * GlowPanel component props
 */
interface GlowPanelProps {
  /** HTML element or React component to render as */
  as?: ElementType
  /** Border radius class */
  radius?: string
  /** Padding class */
  padding?: string
  /** Background class */
  background?: string
  /** Border color class */
  borderColor?: string
  /** Glow intensity level */
  glow?: 'none' | 'subtle' | 'soft' | 'medium' | 'strong'
  /** Additional CSS classes */
  className?: string
  /** Child content */
  children?: ReactNode
  /** Inline styles */
  style?: React.CSSProperties
  /** Additional HTML attributes */
  [key: string]: unknown
}

/**
 * Reusable panel that applies the app-wide glow surface styling.
 *
 * Allows customizing radius, padding, and background while keeping
 * the radial highlights and border treatment consistent.
 * Now theme-aware for proper light/dark theme support.
 *
 * Features:
 * - Theme-aware background and border colors
 * - Configurable glow intensity
 * - Flexible component rendering (as prop)
 * - Accessibility compliant (semantic HTML)
 */
function GlowPanel({
  as: Component = 'div',
  radius = 'rounded-2xl',
  padding = 'p-6',
  background,
  borderColor = 'border-[var(--border-default)]',
  glow = 'medium',
  className = '',
  children,
  style,
  ...props
}: GlowPanelProps) {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const glowClass = glow && glow !== 'medium' ? (glow === 'none' ? '' : `glow-${glow}`) : ''

  // Determine default background based on theme if not provided
  // Use inline styles instead of Tailwind classes for better theme support
  const defaultBackgroundStyle = background
    ? undefined
    : {
        backgroundColor: isLightTheme
          ? 'rgba(var(--text-main-rgb), 0.95)'
          : 'rgba(var(--text-main-rgb), 0.03)',
      }

  const baseClasses = [
    'glow-surface',
    'border',
    radius,
    padding,
    background, // Only use if explicitly provided
    borderColor,
    glowClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Merge inline styles with theme-aware background and border color
  const mergedStyle: React.CSSProperties = {
    ...defaultBackgroundStyle,
    ...style,
    ...(isLightTheme && !style?.borderColor
      ? {
          borderColor: 'rgba(var(--bg-dark-rgb), 0.1)',
        }
      : {}),
  }

  return (
    <Component className={baseClasses} style={mergedStyle} {...props}>
      {children}
    </Component>
  )
}

export default GlowPanel
