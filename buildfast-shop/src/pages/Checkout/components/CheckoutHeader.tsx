/**
 * CheckoutHeader Component
 *
 * Header section for checkout page with back link and title.
 */

import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { fadeSlideUp } from '../../../components/animations/menuAnimations'

export function CheckoutHeader() {
  return (
    <m.header
      className="bg-[var(--bg-main)] border-b border-theme"
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      custom={0.08}
    >
      <div className="app-container py-8">
        <Link
          to="/order"
          className="inline-flex items-center text-accent hover:text-accent/80 font-medium mb-4 transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Menu
        </Link>
        <h1 className="text-4xl font-bold text-accent mb-2">Checkout</h1>
        <p className="text-muted">
          Review your order and complete payment
        </p>
      </div>
    </m.header>
  )
}

