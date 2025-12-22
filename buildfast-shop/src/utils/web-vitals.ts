/**
 * Web Vitals Performance Monitoring
 * 
 * Tracks Core Web Vitals (LCP, FID, CLS) and other performance metrics
 * for production monitoring and optimization.
 */

import { onCLS, onFID, onLCP, onINP, onTTFB, Metric } from 'web-vitals'

/**
 * Send metrics to analytics endpoint
 * In production, replace with your analytics service (e.g., Google Analytics, Vercel Analytics)
 */
function sendToAnalytics(metric: Metric) {
  // Development: log to console
  if (import.meta.env.DEV ?? false) {
    console.log('[Web Vitals]', metric.name, metric.value, metric.id)
  }

  // Production: send to analytics service
  if (import.meta.env.PROD ?? false) {
    // Example: Google Analytics 4
    // gtag('event', metric.name, {
    //   event_category: 'Web Vitals',
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   event_label: metric.id,
    //   non_interaction: true,
    // })

    // Example: Custom analytics endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(() => {
    //   // Silently fail if analytics endpoint is unavailable
    // })
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this in your app entry point (main.tsx)
 */
export function initWebVitals() {
  // Core Web Vitals
  onCLS(sendToAnalytics) // Cumulative Layout Shift
  onFID(sendToAnalytics) // First Input Delay (deprecated, use INP)
  onINP(sendToAnalytics) // Interaction to Next Paint
  onLCP(sendToAnalytics) // Largest Contentful Paint
  onTTFB(sendToAnalytics) // Time to First Byte

  if (import.meta.env.DEV ?? false) {
    console.log('[Web Vitals] Performance monitoring initialized')
  }
}

/**
 * Get performance budget thresholds
 * These are the recommended Core Web Vitals thresholds
 */
export const PERFORMANCE_BUDGETS = {
  LCP: 2500, // Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s
  FID: 100, // Good: < 100ms, Needs Improvement: 100-300ms, Poor: > 300ms
  INP: 200, // Good: < 200ms, Needs Improvement: 200-500ms, Poor: > 500ms
  CLS: 0.1, // Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
  TTFB: 800, // Good: < 800ms, Needs Improvement: 800-1800ms, Poor: > 1800ms
} as const

