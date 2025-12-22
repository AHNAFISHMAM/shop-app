import { useState, useEffect, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { logger } from '../utils/logger'

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute Component
 *
 * Wraps routes that require admin privileges. Checks both authentication
 * and admin status. Non-admin users are redirected to home page with an
 * error message.
 *
 * Usage:
 * <Route path="/admin" element={
 *   <AdminRoute>
 *     <AdminDashboard />
 *   </AdminRoute>
 * } />
 */
function AdminRoute({ children }: AdminRouteProps): JSX.Element {
  const { user, loading, isAdmin, refreshAdminStatus } = useAuth()
  const location = useLocation()
  const [isRefreshing, setIsRefreshing] = useState(false)

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
  }, []);

  // PRIORITY 1: If user is authenticated and confirmed as admin, allow access immediately
  // This ensures admin access persists even during background updates
  if (user && isAdmin) {
    return <>{children}</>
  }

  // PRIORITY 2: If not authenticated (and done loading), redirect to login
  if (!loading && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // PRIORITY 3: If authenticated but not admin (and done loading), deny access with helpful message
  if (!loading && user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-black p-4">
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-md w-full border border-theme">
          <div className="flex items-center mb-6">
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">Access Denied</h2>
              <p className="text-sm text-neutral-400">Admin privileges required</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-neutral-300 mb-4">
              You need administrator privileges to access this page.
            </p>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-accent mb-2">To gain admin access:</h3>
              <ol className="text-xs text-neutral-400 list-decimal list-inside space-y-1">
                <li>Open Supabase SQL Editor</li>
                <li>Run the SQL from <code className="bg-accent/10 text-accent px-1 rounded">036_enforce_single_admin_user.sql</code></li>
                <li>Or manually set your user as admin:
                  <code 
                    className="block p-2 mt-1 rounded text-[10px]"
                    style={{
                      backgroundColor: isLightTheme 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(5, 5, 9, 0.3)'
                    }}
                  >
                    UPDATE customers SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = &apos;your-email@example.com&apos;);
                  </code>
                </li>
                <li>Click &quot;Refresh Admin Status&quot; button below after making changes</li>
                <li>Check browser console (F12) for detailed error messages</li>
              </ol>
            </div>

            <div 
              className="text-xs text-neutral-500 rounded-lg p-3 border border-theme-subtle"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(5, 5, 9, 0.3)'
              }}
            >
              <p className="mb-2 text-neutral-400">Current status:</p>
              <ul className="space-y-1.5 ml-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Logged in as <span className="font-medium text-neutral-200">{user?.email}</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Admin status: <span className="font-medium text-red-400">Denied</span></span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={async () => {
                setIsRefreshing(true)
                try {
                  await refreshAdminStatus()
                  // Small delay to allow state update
                  setTimeout(() => setIsRefreshing(false), 500)
                } catch (error) {
                  logger.error('Error refreshing admin status:', error)
                  setIsRefreshing(false)
                }
              }}
              disabled={isRefreshing}
              className="w-full px-4 py-3 bg-blue-600 text-black font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Admin Status</span>
                </>
              )}
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-3 bg-accent text-black font-medium rounded-lg hover:bg-accent/90 transition-all duration-200 shadow-lg shadow-accent/20"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PRIORITY 4: Still loading - show loading spinner
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-black">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
        <p className="mt-4 text-neutral-300">Checking admin access...</p>
        <p className="mt-2 text-xs text-neutral-500">This may take a few seconds</p>
      </div>
    </div>
  )
}

export default AdminRoute
