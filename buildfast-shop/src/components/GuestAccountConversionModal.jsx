import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { clearGuestSession } from '../lib/guestSessionUtils'
import { logger } from '../utils/logger'

/**
 * Modal to convert guest order to user account
 * Shown after successful guest checkout
 */
function GuestAccountConversionModal({
  isOpen,
  onClose,
  guestEmail,
  orderId,
  guestSessionId
}) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
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
  }, [isOpen]);

  const handleCreateAccount = async (e) => {
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
            full_name: fullName
          }
        }
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
          guest_session_id: null
        })
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
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6 md:px-10"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <div 
        className="rounded-xl sm:rounded-2xl max-w-md w-full px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(5, 5, 9, 0.95)',
          boxShadow: isLightTheme 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)] mb-4">Create Your Account</h2>
        <p className="text-sm sm:text-base text-[var(--text-muted)] mb-6">
          Save this order and get access to order history, faster checkout, and exclusive offers!
        </p>

        <form onSubmit={handleCreateAccount} className="space-y-4 gap-3 sm:gap-4 md:gap-6">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">Email</label>
            <input
              type="email"
              value={guestEmail}
              disabled
              className="w-full px-4 sm:px-6 md:px-10 py-3 min-h-[44px] border border-theme rounded-xl sm:rounded-2xl cursor-not-allowed text-sm sm:text-base"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(5, 5, 9, 0.3)',
                color: 'var(--text-main)'
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
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 sm:px-6 md:px-10 py-3 min-h-[44px] border border-theme bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = isLightTheme 
                    ? 'rgba(0, 0, 0, 0.08)' 
                    : 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GuestAccountConversionModal

GuestAccountConversionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  guestEmail: PropTypes.string.isRequired,
  orderId: PropTypes.string.isRequired,
  guestSessionId: PropTypes.string.isRequired
}
