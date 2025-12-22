import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

/**
 * Menu item interface
 */
interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
}

/**
 * AdminLayout Component
 *
 * Provides the consistent sidebar navigation layout for all admin pages.
 * Uses React Router's Outlet to render child routes.
 * Includes the main Navbar at the top for navigation back to the main site.
 * Includes logout functionality at the bottom of the sidebar.
 *
 * Features:
 * - Sidebar navigation with active state
 * - Body scroll prevention
 * - Scroll boundary handling
 * - Logout functionality
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 */
function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when admin layout is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverflowY = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalOverflowY;
    };
  }, []);

  // Prevent scroll event from bubbling to window only at boundaries
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return undefined;

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // Only prevent bubbling if we're at boundaries and trying to scroll further
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.stopPropagation();
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      logger.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, [signOut, navigate]);

  const menuItems: MenuItem[] = useMemo(() => [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Menu Categories',
      path: '/admin/menu-categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      name: 'Menu Items',
      path: '/admin/menu-items',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      name: 'Reservations',
      path: '/admin/reservations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Customers',
      path: '/admin/customers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Special Sections',
      path: '/admin/special-sections',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      name: 'Discount Codes',
      path: '/admin/discount-codes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Favorite Comments',
      path: '/admin/favorite-comments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v7a2 2 0 01-2 2h-6l-4 4v-4H7a2 2 0 01-2-2v-1" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3H5a2 2 0 00-2 2v10a2 2 0 002 2h2l4 4v-4h4a2 2 0 002-2V5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ], []);

  // Memoized wheel handler
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    // Only stop propagation if we're at boundaries and trying to scroll further
    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.stopPropagation();
    }
  }, []);

  return (
    <div className="app-shell">
      {/* Main Navbar - at the top */}
      <Navbar />

      {/* Admin Layout with Sidebar - Below Navbar */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside
          data-overlay-scroll
          className="w-56 border-r flex flex-col sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0 overflow-hidden"
          style={{
            width: '224px',
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-default)'
          }}
          role="complementary"
          aria-label="Admin navigation"
        >
          {/* Sidebar Header - Fixed at top */}
          <div className="p-6 border-b flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            <h2 className="text-xl font-bold text-[var(--accent)] tracking-wide flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Panel
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Restaurant Management</p>
          </div>

          {/* Navigation - Scrollable middle section */}
          <nav className="flex-1 p-4 overflow-y-auto min-h-0" aria-label="Admin navigation menu">
            <ul className="space-y-1" role="list">
              {menuItems.map((item) => (
                <li key={item.path} role="listitem">
                  <NavLink
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }: { isActive: boolean }) =>
                      `flex items-center px-4 py-3 min-h-[44px] text-sm font-medium rounded-xl transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                        isActive ? 'shadow-lg ring-1 ring-[rgba(var(--accent-rgb),0.25)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]'
                      }`
                    }
                    style={({ isActive }: { isActive: boolean }) => ({
                      backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? '#111111' : undefined
                    })}
                  >
                    {({ isActive }: { isActive: boolean }) => (
                      <>
                        <span
                          className="flex items-center justify-center"
                          style={{
                            color: isActive ? '#111111' : 'var(--accent)'
                          }}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        <span className="ml-3">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer - Fixed at bottom */}
          <div className="p-4 border-t space-y-3 flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            {/* User Email */}
            {user?.email && (
              <div className="px-3 py-2 bg-[var(--bg-elevated)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] mb-1">Logged in as</p>
                <p className="text-xs font-medium text-[var(--accent)] truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            )}

            {/* Logout Button - Distinct Red Styling */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center w-full px-4 py-3 min-h-[44px] text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-red)] focus-visible:ring-offset-2"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
              }}
              aria-label={isLoggingOut ? 'Logging out' : 'Logout'}
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="ml-3">Logging out...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="ml-3">Logout</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content - Rendered from child routes */}
        <main
          data-overlay-scroll
          className="flex-1 min-h-0 min-w-0 flex flex-col"
          style={{ backgroundColor: 'var(--bg-main)', maxWidth: 'calc(100vw - 224px)', overflow: 'hidden' }}
          role="main"
        >
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
            onWheel={handleWheel}
          >
            <div className="p-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

