import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import AuthShell from '../components/auth-shell/auth-shell'
import { useTheme } from '../shared/hooks/use-theme'
import { pageFade, fadeSlideUp } from '../components/animations/menuAnimations'

/**
 * Login Page Component
 *
 * Provides user authentication with email and password.
 * Redirects to intended destination or admin dashboard after successful login.
 *
 * @component
 */
const Login = memo((): JSX.Element => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)
  const _isLightTheme = useTheme()
  const { signIn, user, loading: authLoading, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent | { matches: boolean }): void => {
      setPrefersReducedMotion('matches' in e ? e.matches : false)
    }

    if (mediaQuery.addEventListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
    return undefined
  }, [])

  // Get the page they were trying to visit, or default to home
  const from = useMemo(() => {
    return (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'
  }, [location.state])

  // Redirect when user becomes available after sign-in
  useEffect(() => {
    if (shouldRedirect && user && !authLoading) {
      setShouldRedirect(false)
      setLoading(false)
      // Redirect admins to /admin dashboard, others to their intended destination
      const destination = isAdmin ? '/admin' : from
      navigate(destination, { replace: true })
    }
  }, [user, authLoading, shouldRedirect, navigate, from, isAdmin])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault()
      setError('')

      // Basic validation
      if (!email.trim()) {
        setError('Please enter your email address')
        return
      }

      if (!password) {
        setError('Please enter your password')
        return
      }

      setLoading(true)

      const { data, error: signInError } = await signIn(email, password)

      if (signInError) {
        // Handle common error messages
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in.')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // Success - wait for auth state to update via useEffect
      if (data?.session) {
        setShouldRedirect(true)
      } else {
        // Fallback: if session exists but user not set yet, wait a bit
        setTimeout(() => {
          setLoading(false)
          const destination = isAdmin ? '/admin' : from
          navigate(destination, { replace: true })
        }, 200)
      }
    },
    [email, password, signIn, isAdmin, from, navigate]
  )

  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <m.main
      variants={prefersReducedMotion ? {} : pageFade}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      className="min-h-screen"
      style={{
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible',
      }}
      role="main"
      aria-label="Login page"
    >
      <AuthShell.Root>
        <m.div
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
          exit={prefersReducedMotion ? undefined : 'exit'}
          custom={0.12}
          className="w-full"
        >
          <AuthShell.Card>
            <AuthShell.Header
              eyebrow="Welcome back"
              title="Sign in to your account"
              helper={
                <span>
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-[var(--accent)] underline underline-offset-4 transition hover:text-[var(--accent)]/80"
                    aria-label="Go to sign up page"
                  >
                    Sign up
                  </Link>
                </span>
              }
            />

            {error ? (
              <div
                className="rounded-2xl border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-4 py-3 text-left"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-sm font-medium text-[var(--color-red)]">{error}</p>
              </div>
            ) : null}

            <form
              className="space-y-5 relative z-10 pointer-events-auto"
              onSubmit={handleSubmit}
              aria-label="Login form"
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email-address"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
                  >
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="peer block w-full rounded-xl border border-theme bg-elevated px-3 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] shadow-inner transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/70 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]/50 min-h-[44px]"
                    placeholder="john@example.com"
                    aria-required="true"
                    aria-invalid={error && error.includes('email') ? 'true' : 'false'}
                    aria-describedby={error && error.includes('email') ? 'email-error' : undefined}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-theme bg-elevated px-3 py-3 pr-10 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] shadow-inner transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/70 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]/50 min-h-[44px]"
                      placeholder="Enter your password"
                      aria-required="true"
                      aria-invalid={error && error.includes('password') ? 'true' : 'false'}
                      aria-describedby={
                        error && error.includes('password') ? 'password-error' : undefined
                      }
                    />
                    <button
                      type="button"
                      data-unstyled
                      onClick={togglePasswordVisibility}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-1 rounded-md bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/70 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]/50 disabled:cursor-not-allowed disabled:opacity-70 min-h-[44px]"
                aria-label={loading ? 'Signing in, please wait' : 'Sign in to your account'}
                aria-busy={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </AuthShell.Card>
        </m.div>
      </AuthShell.Root>
    </m.main>
  )
})

Login.displayName = 'Login'

export default Login
