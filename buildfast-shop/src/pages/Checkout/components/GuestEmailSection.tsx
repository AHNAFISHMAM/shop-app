/**
 * GuestEmailSection Component
 *
 * Email input section for guest checkout.
 */

import { Link } from 'react-router-dom'

interface GuestEmailSectionProps {
  guestEmail: string
  onEmailChange: (email: string) => void
  disabled?: boolean
}

export function GuestEmailSection({
  guestEmail,
  onEmailChange,
  disabled = false,
}: GuestEmailSectionProps) {
  return (
    <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <svg
          className="w-6 h-6 text-accent flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-xl font-bold text-[var(--text-main)]">Guest Checkout</h2>
      </div>
      <p className="text-sm text-muted mb-4">
        Checking out as a guest. You&apos;ll receive your order confirmation at this email address.
      </p>
      <div>
        <label
          htmlFor="guestEmail"
          className="block text-sm font-medium text-[var(--text-main)] mb-2"
        >
          Email Address <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="guestEmail"
          value={guestEmail}
          onChange={e => onEmailChange(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={disabled}
          className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        />
      </div>
      <div className="mt-4 flex items-start gap-2 text-sm text-muted">
        <svg
          className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>
          Want to save your order history? You can{' '}
          <Link to="/signup" className="text-accent hover:text-accent/80 font-medium">
            create an account
          </Link>{' '}
          or{' '}
          <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
