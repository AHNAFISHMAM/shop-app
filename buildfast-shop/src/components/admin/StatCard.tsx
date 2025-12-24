import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCountUp } from '../../hooks/useCountUp'
import GlowPanel from '../ui/GlowPanel'

/**
 * Trend data interface
 */
interface TrendData {
  /** Trend percentage value */
  value: number
  /** Trend direction */
  direction: 'up' | 'down' | 'flat'
  /** Trend label (e.g., "vs last week") */
  label?: string
}

/**
 * StatCard component props
 */
interface StatCardProps {
  /** Card title (e.g., "Total Dishes") */
  title: string
  /** Stat value to display (number or string) */
  value: number | string
  /** Optional subtitle (e.g., "Today: 12") */
  subtitle?: string
  /** Optional subtitle color */
  subtitleColor?: string
  /** SVG icon element */
  icon?: ReactNode
  /** Icon color class (default: 'text-[var(--accent)]') */
  iconColor?: string
  /** Icon background class (default: 'bg-[var(--accent)]/20') */
  iconBg?: string
  /** Navigation link */
  link?: string
  /** Loading state */
  loading?: boolean
  /** Optional trend data */
  trend?: TrendData
  /** Entrance animation delay in ms */
  animationDelay?: number
}

/**
 * Premium Stat Card Component
 *
 * Displays animated statistics with trend indicators and hover effects.
 *
 * Features:
 * - Number count-up animation
 * - Skeleton loading state
 * - Trend indicators with arrows
 * - Smooth hover animations
 * - Dark Luxe glassmorphism design
 * - Theme-aware styling
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized values)
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Dishes"
 *   value={150}
 *   subtitle="Today: 12"
 *   icon={<DishIcon />}
 *   link="/admin/menu-items"
 *   trend={{ value: 12, direction: 'up', label: 'vs last week' }}
 * />
 * ```
 */
function StatCard({
  title,
  value,
  subtitle,
  subtitleColor,
  icon,
  iconColor = 'text-[var(--accent)]',
  iconBg = 'bg-[var(--accent)]/20',
  link,
  loading = false,
  trend,
  animationDelay = 0,
}: StatCardProps) {
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

  // Animated count-up effect (only for numbers)
  const isNumeric = typeof value === 'number'
  // Always call hook, but only use result if numeric
  const countUpValue = useCountUp(loading ? 0 : isNumeric ? value : 0, 1500, animationDelay)
  const animatedValue = isNumeric ? countUpValue : value

  // Memoized skeleton background colors
  const skeletonBg = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.08)' : 'rgba(var(--text-main-rgb), 0.1)'
  }, [isLightTheme])

  // Memoized card background
  const cardBackground = useMemo(() => {
    return isLightTheme ? 'bg-white/95' : 'bg-[rgba(var(--text-main-rgb),0.05)]'
  }, [isLightTheme])

  // Memoized box shadow
  const boxShadow = useMemo(() => {
    return isLightTheme
      ? '0 4px 24px rgba(var(--bg-dark-rgb), 0.15), 0 1px 2px rgba(var(--bg-dark-rgb), 0.1), 0 0 0 1px rgba(var(--bg-dark-rgb), 0.05)'
      : '0 4px 24px rgba(var(--bg-dark-rgb), 0.1), 0 1px 2px rgba(var(--bg-dark-rgb), 0.08)'
  }, [isLightTheme])

  // Memoized trend color
  const trendColor = useMemo(() => {
    if (!trend) return undefined
    return trend.direction === 'up'
      ? 'text-[var(--color-emerald)]'
      : trend.direction === 'down'
        ? 'text-[var(--color-rose)]'
        : 'text-[var(--color-amber)]'
  }, [trend])

  // Skeleton loading state
  if (loading) {
    return (
      <GlowPanel
        glow="soft"
        padding="p-6"
        className="group relative overflow-hidden backdrop-blur-xl"
        data-animate="fade-rise"
        data-animate-active="false"
        style={{ animationDelay: `${animationDelay}ms` }}
        aria-label={`Loading ${title}`}
        role="status"
      >
        {/* Skeleton shimmer effect */}
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[rgba(var(--text-main-rgb),0.05)] to-transparent"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            {/* Title skeleton */}
            <div
              className="h-4 w-24 rounded animate-pulse"
              style={{ backgroundColor: skeletonBg }}
              aria-hidden="true"
            />
            {/* Value skeleton */}
            <div
              className="h-10 w-32 rounded animate-pulse"
              style={{ backgroundColor: skeletonBg }}
              aria-hidden="true"
            />
            {/* Subtitle skeleton */}
            <div
              className="h-3 w-20 rounded animate-pulse"
              style={{ backgroundColor: skeletonBg }}
              aria-hidden="true"
            />
          </div>
          {/* Icon skeleton */}
          <div
            className={`${iconBg} p-4 rounded-2xl animate-pulse min-h-[44px] min-w-[44px] flex items-center justify-center`}
            aria-hidden="true"
          >
            <div className="w-8 h-8 opacity-30">{icon}</div>
          </div>
        </div>
      </GlowPanel>
    )
  }

  // Main stat card
  const CardContent = (
    <GlowPanel
      glow="soft"
      padding="p-6"
      background={cardBackground}
      className="group relative overflow-hidden backdrop-blur-xl transition-all duration-300 ease-out hover:scale-[1.02] h-[180px] flex flex-col justify-between min-h-[44px]"
      data-animate="fade-rise"
      data-animate-active="false"
      style={{
        boxShadow,
        animationDelay: `${animationDelay}ms`,
      }}
      role="article"
      aria-label={`${title}: ${isNumeric ? animatedValue.toLocaleString() : animatedValue}`}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-[var(--accent)]/10 transition-all duration-300"
        aria-hidden="true"
      />

      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          boxShadow:
            '0 0 40px rgba(var(--accent-rgb), 0.2), 0 8px 32px rgba(var(--bg-dark-rgb), 0.2)',
        }}
        aria-hidden="true"
      />

      {/* Border glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          borderColor: 'rgba(var(--accent-rgb), 0.3)',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
        aria-hidden="true"
      />

      {/* Main content area */}
      <div className="relative flex items-start justify-between gap-6">
        {/* Stats content - Left side */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <p
            className="text-sm font-medium tracking-wide"
            style={{ color: 'var(--text-subtitle)' }}
          >
            {title}
          </p>

          {/* Value with animation */}
          <p
            className="text-5xl font-bold tabular-nums tracking-tight leading-none"
            style={{ color: 'var(--text-heading)' }}
            aria-live="polite"
          >
            {isNumeric ? animatedValue.toLocaleString() : animatedValue}
          </p>

          {/* Subtitle or trend */}
          {subtitle && !trend && (
            <p
              className="text-sm font-medium pt-1 whitespace-nowrap"
              style={{ color: subtitleColor || 'var(--color-emerald)' }}
            >
              {subtitle}
            </p>
          )}

          {/* Trend indicator */}
          {trend && (
            <div
              className="flex items-center gap-2 pt-1"
              role="status"
              aria-label={`Trend: ${trend.direction} ${trend.value}%`}
            >
              <span className={`text-sm font-semibold flex items-center gap-1 ${trendColor}`}>
                {trend.direction === 'up' && (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                )}
                {trend.direction === 'down' && (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                )}
                {trend.value > 0 && '+'}
                {trend.value}%
              </span>
              <span className="text-sm" style={{ color: 'var(--text-body-muted-light)' }}>
                {trend.label || 'vs last week'}
              </span>
            </div>
          )}
        </div>

        {/* Icon - Right side */}
        <div
          className={`${iconBg} p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 self-start min-h-[44px] min-w-[44px] flex items-center justify-center`}
          style={{
            boxShadow: '0 2px 8px rgba(var(--accent-rgb), 0.15)',
          }}
          aria-hidden="true"
        >
          <div
            className={`w-8 h-8 ${iconColor} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
      </div>

      {/* Clickable hint - Bottom */}
      {link && (
        <div className="relative">
          <p
            className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ color: 'var(--text-body-muted-lighter)' }}
          >
            Click to manage →
          </p>
        </div>
      )}
    </GlowPanel>
  )

  // Wrap in Link if provided
  if (link) {
    return (
      <Link
        to={link}
        className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] transition-transform min-h-[44px]"
        aria-label={`${title}: ${isNumeric ? animatedValue.toLocaleString() : animatedValue}. Click to view details.`}
      >
        {CardContent}
      </Link>
    )
  }

  return CardContent
}

export default StatCard
