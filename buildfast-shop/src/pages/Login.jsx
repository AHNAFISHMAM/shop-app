import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import UpdateTimestamp from '../components/UpdateTimestamp'
import AuthShell from '../components/auth-shell/auth-shell'
import { pageFade, fadeSlideUp } from '../components/animations/menuAnimations'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const { signIn, user, loading: authLoading, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the page they were trying to visit, or default to home
  const from = location.state?.from?.pathname || '/'

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

  const handleSubmit = async (e) => {
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
  }

  return (
    <motion.main
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen"
    >
      <UpdateTimestamp />
      <AuthShell.Root>
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          custom={0.12}
          className="w-full"
        >
          <AuthShell.Card>
            <AuthShell.Header
              eyebrow="Welcome back"
              title="Sign in to your account"
              helper={(
                <span>
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="font-medium text-accent underline underline-offset-4 transition hover:text-amber-300">
                    Sign up
                  </Link>
                </span>
              )}
            />

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left">
                <p className="text-sm font-medium text-red-500">{error}</p>
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer block w-full rounded-xl border border-theme bg-elevated px-3 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] shadow-inner transition focus:border-[#C59D5F] focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/70 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]/50 min-h-[44px]"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-theme bg-elevated px-3 py-3 pr-10 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] shadow-inner transition focus:border-[#C59D5F] focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/70 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]/50 min-h-[44px]"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      data-unstyled
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/50 focus:ring-offset-1 rounded-md bg-transparent border-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#C59D5F] px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/70 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]/50 disabled:cursor-not-allowed disabled:opacity-70 min-h-[44px]"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </AuthShell.Card>
        </motion.div>
      </AuthShell.Root>
    </motion.main>
  )
}

export default Login
