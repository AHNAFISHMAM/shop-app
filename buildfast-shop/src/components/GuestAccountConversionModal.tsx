import { useState, useEffect, useRef, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { clearGuestSession } from '../lib/guestSessionUtils'
import { logger } from '../utils/logger'
import { Button } from './ui/button'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface GuestAccountConversionModalProps {
  isOpen: boolean
  onClose: () => void
  guestEmail: string
  orderId: string
  guestSessionId: string
}

/**
 * Modal to convert guest order to user account
 * Shown after successful guest checkout
 */
function GuestAccountConversionModal({
  isOpen,
  onClose,
  guestEmail,
  orderId,
  guestSessionId,
}: GuestAccountConversionModalProps): JSX.Element | null {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Body scroll lock
  useBodyScrollLock(isOpen)

  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return

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
  }, [isOpen])

  // Keyboard handler (Escape to close)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen])

  const handleCreateAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Create account with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: guestEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      const newUserId = authData.user?.id

      if (!newUserId) {
        throw new Error('Failed to create account')
      }

      // Link guest order to new user account
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          user_id: newUserId,
          is_guest: false,
          guest_session_id: null,
        } as never)
        .eq('id', orderId)
        .eq('guest_session_id', guestSessionId)

      if (updateError) {
        logger.error('Failed to link order to account:', updateError)
        // Don't throw - account was created, just order linking failed
      }

      // Clear guest session
      clearGuestSession()

      // Success!
      alert('Account created successfully! You can now view your order history.')
      navigate('/orders')
      onClose()
    } catch (err) {
      logger.error('Error creating account:', err)
      const error = err as Error
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  // Ensure we can render at body level (SSR safety)
  if (typeof document === 'undefined' || !document.body) {
    return null
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-account-modal-title"
      onClick={onClose}
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-xl sm:rounded-2xl border border-[var(--border-default)] overflow-hidden"
        style={{
          backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
          boxShadow: isLightTheme
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 99999,
          maxHeight: 'calc(100vh - 2rem)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header with Close Button - Mobile-First Design */}
        <div
          className="sticky top-0 z-[100] flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-main)]/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
          style={{
            position: 'sticky',
            top: 0,
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >
          {/* Title */}
          <div className="flex-1 min-w-0 pr-3">
            <h2
              id="guest-account-modal-title"
              className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)] tracking-tight truncate"
            >
              Create Your Account
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 hidden sm:block">
              Save this order and get access to order history, faster checkout, and exclusive
              offers!
            </p>
          </div>

          {/* Close Button - Always visible and accessible */}
          <Button
            type="button"
            onClick={onClose}
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-[var(--bg-main)]/90 backdrop-blur-sm border border-[var(--border-default)] hover:bg-[var(--bg-hover)] shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 101,
            }}
            aria-label="Close account creation modal"
          >
            <svg
              className="w-5 h-5 text-[var(--text-main)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Scrollable Content - Below header */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-10 py-4 sm:py-6"
          style={{
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Mobile-only description */}
          <p className="text-sm text-[var(--text-muted)] mb-6 sm:hidden">
            Save this order and get access to order history, faster checkout, and exclusive offers!
          </p>

          <form onSubmit={handleCreateAccount} className="space-y-4 gap-3 sm:gap-4 md:gap-6">
            {/* Email (readonly) */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={guestEmail}
                disabled
                className="w-full px-4 sm:px-6 md:px-10 py-3 min-h-[44px] border border-theme rounded-xl sm:rounded-2xl cursor-not-allowed text-sm sm:text-base"
                style={{
                  backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(5, 5, 9, 0.3)',
                  color: 'var(--text-main)',
                }}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-4 sm:px-6 md:px-10 py-3 min-h-[44px] border border-theme bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-4 sm:px-6 md:px-10 py-3 min-h-[44px] border border-theme bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength={6}
                className="w-full px-4 sm:px-6 md:px-10 py-3 min-h-[44px] border border-theme bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
                <p className="text-sm sm:text-base text-red-800">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 sm:gap-4 md:gap-6 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-black py-3 min-h-[44px] rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate('/')
                }}
                disabled={loading}
                className="flex-1 bg-theme-elevated text-[var(--text-main)] py-3 min-h-[44px] rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base disabled:opacity-50"
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = isLightTheme
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                Skip for Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  // Render modal at document.body level using Portal
  return createPortal(modalContent, document.body)
}

export default GuestAccountConversionModal
