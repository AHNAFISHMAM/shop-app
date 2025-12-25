import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { logger } from '../utils/logger'

// Ensure React is available globally before framer-motion tries to use it
if (typeof window !== 'undefined' && !(window as any).React) {
  ;(window as any).React = React
}

interface SafeAnimatePresenceProps {
  children: ReactNode
  mode?: 'wait' | 'sync' | 'popLayout'
  [key: string]: unknown
}

interface SafeAnimatePresenceState {
  hasError: boolean
}

/**
 * Safe wrapper for AnimatePresence that gracefully handles errors
 * Falls back to rendering children without animations if framer-motion fails
 */
class SafeAnimatePresence extends Component<SafeAnimatePresenceProps, SafeAnimatePresenceState> {
  constructor(props: SafeAnimatePresenceProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): SafeAnimatePresenceState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.warn('AnimatePresence error, rendering without animations:', error)
    logger.warn('Error info:', errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      // Fallback: render children without animations
      return <>{this.props.children}</>
    }

    try {
      const { children, mode, ...rest } = this.props
      return (
        <AnimatePresence mode={mode} {...rest}>
          {children}
        </AnimatePresence>
      )
    } catch (error) {
      logger.warn('AnimatePresence render error, using fallback:', error)
      this.setState({ hasError: true })
      return <>{this.props.children}</>
    }
  }
}

export default SafeAnimatePresence

