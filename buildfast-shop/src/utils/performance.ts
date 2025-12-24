/**
 * Performance Utilities
 *
 * Utilities for measuring and monitoring performance metrics.
 */

import { logger } from './logger'

/**
 * Measure execution time of a function
 *
 * @param fn - Function to measure
 * @param label - Label for console log
 * @returns Result of function execution
 *
 * @example
 * ```tsx
 * const result = measurePerformance(() => expensiveOperation(), 'Expensive Operation')
 * ```
 */
export function measurePerformance<T>(fn: () => T, label?: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  const duration = end - start

  if (label && (import.meta.env.DEV ?? false)) {
    logger.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
  }

  return result
}

/**
 * Measure execution time of an async function
 *
 * @param fn - Async function to measure
 * @param label - Label for console log
 * @returns Result of async function execution
 *
 * @example
 * ```tsx
 * const result = await measureAsyncPerformance(
 *   async () => await fetchData(),
 *   'Fetch Data'
 * )
 * ```
 */
export async function measureAsyncPerformance<T>(fn: () => Promise<T>, label?: string): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = end - start

  if (label && (import.meta.env.DEV ?? false)) {
    logger.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
  }

  return result
}

/**
 * Performance mark names
 */
export const PerformanceMarks = {
  COMPONENT_RENDER: 'component-render',
  DATA_FETCH: 'data-fetch',
  IMAGE_LOAD: 'image-load',
  ROUTE_CHANGE: 'route-change',
} as const

/**
 * Create a performance mark
 *
 * @param name - Mark name
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

/**
 * Measure between two marks
 *
 * @param markName - Name of the mark
 * @param measureName - Name for the measure
 */
export function measure(markName: string, measureName: string): void {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(measureName, markName)
      const measure = performance.getEntriesByName(measureName, 'measure')[0]
      if (measure && (import.meta.env.DEV ?? false)) {
        logger.log(`📊 ${measureName}: ${measure.duration.toFixed(2)}ms`)
      }
    } catch {
      // Mark might not exist yet
      if (import.meta.env.DEV ?? false) {
        logger.warn(`Performance mark "${markName}" not found`)
      }
    }
  }
}

/**
 * Get Core Web Vitals metrics
 *
 * @returns Promise with Core Web Vitals data
 */
export async function getCoreWebVitals(): Promise<{
  lcp?: number
  fid?: number
  cls?: number
}> {
  if (typeof window === 'undefined') {
    return {}
  }

  const vitals: { lcp?: number; fid?: number; cls?: number } = {}

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number
          loadTime?: number
        }
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime || 0
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming
            vitals.fid = fidEntry.processingStart - fidEntry.startTime
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          const layoutShiftEntry = entry as { hadRecentInput?: boolean; value?: number }
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value ?? 0
          }
        })
        vitals.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch {
      // CLS not supported
    }
  }

  return vitals
}

/**
 * Log performance metrics
 *
 * @param metrics - Metrics to log
 */
export function logPerformanceMetrics(metrics: { lcp?: number; fid?: number; cls?: number }): void {
  if (import.meta.env.DEV ?? false) {
    logger.group('📊 Core Web Vitals', () => {
      if (metrics.lcp) {
        const status = metrics.lcp < 2500 ? '✅' : metrics.lcp < 4000 ? '⚠️' : '❌'
        logger.log(`${status} LCP: ${metrics.lcp.toFixed(0)}ms (target: <2500ms)`)
      }
      if (metrics.fid) {
        const status = metrics.fid < 100 ? '✅' : metrics.fid < 300 ? '⚠️' : '❌'
        logger.log(`${status} FID: ${metrics.fid.toFixed(0)}ms (target: <100ms)`)
      }
      if (metrics.cls !== undefined) {
        const status = metrics.cls < 0.1 ? '✅' : metrics.cls < 0.25 ? '⚠️' : '❌'
        logger.log(`${status} CLS: ${metrics.cls.toFixed(3)} (target: <0.1)`)
      }
    })
  }
}
