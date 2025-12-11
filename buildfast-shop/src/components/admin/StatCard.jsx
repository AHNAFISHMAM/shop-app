import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useCountUp } from '../../hooks/useCountUp'
import GlowPanel from '../ui/GlowPanel'

/**
 * Premium Stat Card Component
 * Displays animated statistics with trend indicators and hover effects
 *
 * Features:
 * - Number count-up animation
 * - Skeleton loading state
 * - Trend indicators with arrows
 * - Smooth hover animations
 * - Dark Luxe glassmorphism design
 *
 * @param {object} props
 * @param {string} props.title - Card title (e.g., "Total Dishes")
 * @param {number} props.value - Stat value to display
 * @param {string} props.subtitle - Optional subtitle (e.g., "Today: 12")
 * @param {React.ReactNode} props.icon - SVG icon element
 * @param {string} props.iconColor - Icon color class (e.g., "text-[#C59D5F]")
 * @param {string} props.iconBg - Icon background class (e.g., "bg-[#C59D5F]/20")
 * @param {string} props.link - Navigation link
 * @param {boolean} props.loading - Loading state
 * @param {object} props.trend - Optional trend data {value: 12, direction: 'up', label: 'vs last week'}
 * @param {number} props.animationDelay - Entrance animation delay in ms
 */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'text-[var(--accent)]',
  iconBg = 'bg-[var(--accent)]/20',
  link,
  loading = false,
  trend,
  animationDelay = 0
}) {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Animated count-up effect
  const animatedValue = useCountUp(loading ? 0 : value, 1500, animationDelay)

  // Skeleton loading state
  if (loading) {
    return (
      <GlowPanel
        padding="p-6"
        className="group relative overflow-hidden backdrop-blur-xl"
        data-animate="fade-rise"
        data-animate-active="false"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {/* Skeleton shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            {/* Title skeleton */}
            <div 
              className="h-4 w-24 rounded animate-pulse" 
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)'
              }}
            />
            {/* Value skeleton */}
            <div 
              className="h-10 w-32 rounded animate-pulse" 
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)'
              }}
            />
            {/* Subtitle skeleton */}
            <div 
              className="h-3 w-20 rounded animate-pulse" 
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>
          {/* Icon skeleton */}
          <div className={`${iconBg} p-4 rounded-2xl animate-pulse`}>
            <div className="w-8 h-8 opacity-30">{icon}</div>
          </div>
        </div>
      </GlowPanel>
    )
  }

  // Main stat card
  const CardContent = (
    <GlowPanel
      padding="p-6"
      background={isLightTheme ? 'bg-white/95' : 'bg-[rgba(255,255,255,0.05)]'}
      className="group relative overflow-hidden backdrop-blur-xl transition-all duration-300 ease-out hover:scale-[1.02] h-[180px] flex flex-col justify-between"
      data-animate="fade-rise"
      data-animate-active="false"
      style={{
        boxShadow: isLightTheme 
          ? '0 4px 24px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
          : '0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.08)',
        animationDelay: `${animationDelay}ms`
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-[var(--accent)]/10 transition-all duration-300" />

      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          boxShadow: '0 0 40px rgba(197, 157, 95, 0.2), 0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      />

      {/* Border glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          borderColor: 'rgba(197, 157, 95, 0.3)',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      />

      {/* Main content area */}
      <div className="relative flex items-start justify-between gap-6">
        {/* Stats content - Left side */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <p className="text-sm font-medium tracking-wide" style={{ color: 'var(--text-subtitle)' }}>
            {title}
          </p>

          {/* Value with animation */}
          <p
            className="text-5xl font-bold tabular-nums tracking-tight leading-none"
            style={{ color: 'var(--text-heading)' }}
          >
            {animatedValue.toLocaleString()}
          </p>

          {/* Subtitle or trend */}
          {subtitle && !trend && (
            <p className="text-xs font-medium pt-1 whitespace-nowrap" style={{ color: '#4ade80' }}>
              {subtitle}
            </p>
          )}

          {/* Trend indicator */}
          {trend && (
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`text-xs font-semibold flex items-center gap-1 ${
                  trend.direction === 'up' ? 'text-emerald-400' :
                  trend.direction === 'down' ? 'text-rose-400' :
                  'text-amber-400'
                }`}
              >
                {trend.direction === 'up' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {trend.direction === 'down' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {trend.value > 0 && '+'}{trend.value}%
              </span>
              <span className="text-xs" style={{ color: 'var(--text-body-muted-light)' }}>
                {trend.label || 'vs last week'}
              </span>
            </div>
          )}
        </div>

        {/* Icon - Right side */}
        <div
          className={`${iconBg} p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 self-start`}
          style={{
            boxShadow: '0 2px 8px rgba(197, 157, 95, 0.15)'
          }}
        >
          <div className={`w-8 h-8 ${iconColor} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </div>

      {/* Clickable hint - Bottom */}
      {link && (
        <div className="relative">
          <p className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: 'var(--text-body-muted-lighter)' }}>
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
        className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] transition-transform"
      >
        {CardContent}
      </Link>
    )
  }

  return CardContent
}

export default StatCard

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  iconColor: PropTypes.string,
  iconBg: PropTypes.string,
  link: PropTypes.string,
  loading: PropTypes.bool,
  trend: PropTypes.shape({
    value: PropTypes.number,
    direction: PropTypes.oneOf(['up', 'down', 'flat']),
    label: PropTypes.string
  }),
  animationDelay: PropTypes.number
}
