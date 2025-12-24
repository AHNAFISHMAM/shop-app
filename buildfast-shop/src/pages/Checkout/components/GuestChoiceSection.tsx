/**
 * GuestChoiceSection Component
 *
 * Allows users to choose between signing in or continuing as guest.
 */

import { Link } from 'react-router-dom'

interface GuestChoiceSectionProps {
  onContinueAsGuest: () => void
}

export function GuestChoiceSection({ onContinueAsGuest }: GuestChoiceSectionProps) {
  return (
    <div className="glow-surface glow-strong mb-8 bg-theme-elevated border border-theme rounded-2xl p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-accent mb-2">How would you like to checkout?</h2>
          <p className="text-muted">Sign in for faster checkout or continue as a guest</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sign In / Sign Up Option */}
          <Link
            to="/login"
            state={{ from: { pathname: '/checkout' } }}
            className="flex flex-col items-center justify-center p-6 border-2 border-theme-medium rounded-xl hover:border-accent transition group min-h-[44px]"
            style={{
              backgroundColor: 'var(--bg-card)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)'
            }}
          >
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/30 transition">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">
              Sign In / Sign Up
            </h3>
            <p className="text-sm text-muted text-center">
              Access your account, view order history, and save addresses
            </p>
          </Link>

          {/* Continue as Guest Option */}
          <button
            onClick={onContinueAsGuest}
            type="button"
            className="flex flex-col items-center justify-center p-6 border-2 border-theme-medium rounded-xl hover:border-green-400 transition group min-h-[44px]"
            style={{
              backgroundColor: 'var(--bg-card)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)'
            }}
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">
              Continue as Guest
            </h3>
            <p className="text-sm text-muted text-center">
              Quick checkout without creating an account
            </p>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            Note: Guest orders cannot be tracked later. You can create an account after checkout.
          </p>
        </div>
      </div>
    </div>
  )
}
