import { Component, type ReactNode, type ErrorInfo } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { logger } from '../utils/logger'

interface SafeLazyMotionProps {
  children: ReactNode
  strict?: boolean
}

interface SafeLazyMotionState {
  hasError: boolean
  error: Error | null
}

/**
 * Safe wrapper for LazyMotion that gracefully handles framer-motion errors
 * Falls back to rendering children without animations if framer-motion fails
 */
class SafeLazyMotion extends Component<SafeLazyMotionProps, SafeLazyMotionState> {
  constructor(props: SafeLazyMotionProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): SafeLazyMotionState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.warn('LazyMotion error, rendering without animations:', error)
    logger.warn('Error info:', errorInfo)
    
    // Log specific framer-motion context errors
    if (error.message?.includes('createContext') || error.message?.includes('LayoutGroupContext')) {
      logger.error('⚠️ Framer Motion React context error - React may not be properly loaded')
      logger.error('This usually means React is not available when framer-motion initializes')
    }
  }

  override render() {
    if (this.state.hasError) {
      // Fallback: render children without animations
      logger.warn('Rendering without framer-motion animations due to error')
      return <>{this.props.children}</>
    }

    try {
      const { children, strict = false } = this.props
      return (
        <LazyMotion features={domAnimation} strict={strict}>
          {children}
        </LazyMotion>
      )
    } catch (error) {
      logger.warn('LazyMotion render error, using fallback:', error)
      this.setState({ 
        hasError: true, 
        error: error instanceof Error ? error : new Error('Unknown LazyMotion error')
      })
      return <>{this.props.children}</>
    }
  }
}

export default SafeLazyMotion

