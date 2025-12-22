import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component props
 */
interface ProtectedRouteProps {
  /** Child components to render if authenticated */
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Route protection component that ensures only authenticated users can access protected routes.
 * Redirects to login page if user is not authenticated.
 *
 * Features:
 * - Loading state handling
 * - Automatic redirect to login
 * - Preserves intended destination for post-login redirect
 * - Accessibility compliant (loading indicator)
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-elevated)] to-[var(--bg-main)]" role="status" aria-live="polite" aria-label="Loading authentication">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 min-h-[44px] min-w-[44px] border-4 border-[var(--accent)] border-t-transparent" aria-hidden="true"></div>
          <p className="mt-4 text-[var(--text-muted)]">Securing your access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

