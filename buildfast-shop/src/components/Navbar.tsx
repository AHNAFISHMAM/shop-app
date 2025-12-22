import { Link, NavLink } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { supabase } from '../lib/supabase';
import { getFavoritesCount } from '../lib/favoritesUtils';
import { onFavoritesChanged } from '../lib/favoritesEvents';
import { logger } from '../utils/logger';
import SignupPromptModal from './SignupPromptModal';
import ProfileDropdown from './ProfileDropdown';

/**
 * Burger icon component props
 */
interface BurgerIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Burger Icon Component
 * 
 * Custom hamburger menu icon for navigation
 */
const BurgerIcon = ({ className, ...props }: BurgerIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 9.25c0-2.485 3.134-4.75 8-4.75s8 2.265 8 4.75" />
    <path d="M3.5 12h17" />
    <path d="M5.5 14.75h13" />
    <path d="M5 17.5c1.6 1.1 3.7 1.75 7 1.75s5.4-.65 7-1.75" />
  </svg>
);

/**
 * Navigation link interface
 */
interface NavLinkItem {
  to: string;
  label: string;
}

/**
 * Navigation links configuration
 */
const navLinks: NavLinkItem[] = [
  { to: '/menu', label: 'Menu' },
  { to: '/order', label: 'ORDER' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/**
 * Navbar Component
 *
 * Main navigation component with desktop and mobile layouts.
 * Features:
 * - Responsive navigation (desktop horizontal, mobile drawer)
 * - Favorites count with real-time updates
 * - Theme toggle
 * - Admin link (conditional)
 * - Reservations link (conditional)
 * - Signup prompt for unauthenticated users
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks, reduced motion support)
 */
const Navbar = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);
  const { user, isAdmin, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const [favoritesCount, setFavoritesCount] = useState<number>(0);

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

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

  // Fetch favorites count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        if (user) {
          const count = await getFavoritesCount(user.id);
          setFavoritesCount(count);
        } else {
          setFavoritesCount(0);
        }
      } catch (error) {
        logger.error('Error fetching favorites count:', error);
        setFavoritesCount(0);
      }
    };

    fetchCount();

    // Listen for favorites changes
    const cleanup = onFavoritesChanged(() => {
      fetchCount();
    });

    // Real-time subscription for favorites
    if (user) {
      const channel = supabase
        .channel(`navbar-favorites-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCount();
          }
        )
        .subscribe();

      return () => {
        cleanup();
        supabase.removeChannel(channel);
      };
    }

    return cleanup;
  }, [user]);

  // Memoized computed values
  const adminPath = useMemo(() => {
    return isAdmin ? '/admin' : '/login';
  }, [isAdmin]);

  const adminLabel = useMemo(() => {
    return isAdmin ? 'Admin' : 'Log In';
  }, [isAdmin]);

  const showThemeToggle = useMemo(() => {
    return settings?.show_theme_toggle !== false;
  }, [settings]);

  const enableReservations = useMemo(() => {
    return settingsLoading ? false : (settings?.enable_reservations ?? true);
  }, [settings, settingsLoading]);

  // Memoized callbacks
  const handleToggleMenu = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleShowSignupModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSignupModal(true);
  }, []);

  const handleCloseSignupModal = useCallback(() => {
    setShowSignupModal(false);
  }, []);

  // Memoized hover handlers for better performance
  const getHoverBackgroundColor = useCallback((isHover: boolean) => {
    if (!isHover) return 'transparent';
    return isLightTheme
      ? 'rgba(var(--bg-dark-rgb), 0.08)'
      : 'rgba(var(--text-main-rgb), 0.1)';
  }, [isLightTheme]);

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur border-b border-[var(--border-default)] relative overflow-visible"
      style={{
        backgroundColor: isLightTheme
          ? 'rgba(var(--text-main-rgb), 0.8)'
          : 'rgba(var(--bg-dark-rgb), 0.8)'
      }}
      role="banner"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--text-main-rgb),0.2),transparent_60%)] opacity-60"
        aria-hidden="true"
      />
      <nav 
        className="relative z-10 py-3 flex items-center justify-between" 
        style={{
          // Add padding to match page spacing (consistent side spacing)
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
          // Ensure no overflow constraints
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
        role="navigation" 
        aria-label="Main navigation"
      >
        <Link to="/" className="flex items-baseline gap-2" aria-label="Star Café home">
          <span className="text-xl font-semibold tracking-wide text-[var(--accent)]">
            Star Café
          </span>
          <span className="hidden sm:inline text-sm text-[var(--text-muted)] uppercase tracking-[0.1em] opacity-80">
            Taste That Shines
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }: { isActive: boolean }) =>
                `text-sm uppercase tracking-wide min-h-[44px] flex items-center ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {enableReservations && (
            <Link
              to="/reservations"
              className="ml-2 btn-primary text-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Reserve a table"
            >
              RESERVE
            </Link>
          )}

          {/* Favorites Button - Navigate to Favorites or Show Signup */}
          {!loading && user ? (
            <Link
              to="/favorites"
              className="relative p-3 min-h-[44px] min-w-[44px] rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] group"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getHoverBackgroundColor(true);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="View your favorite dishes"
              aria-label={`Go to favorites page${favoritesCount > 0 ? ` (${favoritesCount} items)` : ''}`}
            >
              <BurgerIcon className="w-5 h-5 text-[var(--accent)] group-hover:scale-110 transition-transform" />
              {favoritesCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-[var(--accent)] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-black"
                  aria-label={`${favoritesCount} favorite items`}
                >
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>
          ) : !loading && !user ? (
            <button
              type="button"
              onClick={handleShowSignupModal}
              className="relative p-3 min-h-[44px] min-w-[44px] rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] group"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getHoverBackgroundColor(true);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Save your favorite dishes - Sign up required"
              aria-label="Open favorites signup prompt"
            >
              <BurgerIcon className="w-5 h-5 text-[var(--accent)] group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <div className="relative p-2 w-9 h-9 min-h-[44px] min-w-[44px]" aria-label="Loading favorites" aria-busy="true">
              <BurgerIcon className="w-5 h-5 text-[var(--accent)]/50" />
            </div>
          )}

          {/* Theme Toggle Button */}
          {showThemeToggle && (
            <button
              onClick={handleThemeToggle}
              className="p-3 min-h-[44px] min-w-[44px] rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getHoverBackgroundColor(true);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={`Toggle theme. Current: ${theme === 'dark' ? 'Dark' : 'Light'}`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          )}

          <ProfileDropdown />
        </div>

        {/* Mobile */}
        <button
          className="md:hidden inline-flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-full border border-[var(--border-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          onClick={handleToggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <div className="flex flex-col gap-[5px]">
            <span className="w-4 h-[1.5px] bg-[var(--text-main)] block" aria-hidden="true" />
            <span className="w-4 h-[1.5px] bg-[var(--text-main)] block" aria-hidden="true" />
            <span className="w-4 h-[1.5px] bg-[var(--text-main)] block" aria-hidden="true" />
          </div>
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-[var(--border-default)]"
          style={{
            backgroundColor: isLightTheme
              ? 'rgba(var(--text-main-rgb), 0.95)'
              : 'rgba(var(--bg-dark-rgb), 0.95)'
          }}
          role="region"
          aria-label="Mobile navigation menu"
        >
          <div 
            className="py-3 flex flex-col gap-2"
            style={{
              // Add padding to match page spacing (consistent side spacing)
              paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
              paddingRight: 'clamp(1rem, 3vw, 3.5rem)'
            }}
          >
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={handleCloseMenu}
                className={({ isActive }: { isActive: boolean }) =>
                  `py-3 text-sm min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {enableReservations && (
              <Link
                to="/reservations"
                onClick={handleCloseMenu}
                className="mt-2 w-full text-center btn-primary text-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label="Reserve a table"
              >
                RESERVE A TABLE
              </Link>
            )}

            {/* Mobile Favorites Button - Navigate or Show Signup */}
            {!loading && user ? (
              <Link
                to="/favorites"
                onClick={handleCloseMenu}
                className="mt-4 pt-4 border-t border-[var(--border-default)] w-full flex items-center justify-between py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label={`Go to favorites page${favoritesCount > 0 ? ` (${favoritesCount} items)` : ''}`}
              >
                <span className="text-xs uppercase tracking-wide">My Favorites</span>
                <div className="flex items-center gap-2">
                  {favoritesCount > 0 && (
                    <span
                      className="bg-[var(--accent)] text-black text-xs font-bold rounded-full px-2 py-0.5"
                      aria-label={`${favoritesCount} favorite items`}
                    >
                      {favoritesCount}
                    </span>
                  )}
                  <BurgerIcon className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
                </div>
              </Link>
            ) : !loading && !user ? (
              <button
                type="button"
                onClick={(e) => {
                  handleShowSignupModal(e);
                  handleCloseMenu();
                }}
                className="mt-4 pt-4 border-t border-[var(--border-default)] w-full flex items-center justify-between py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label="Open favorites signup prompt"
              >
                <span className="text-xs uppercase tracking-wide">My Favorites</span>
                <BurgerIcon className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
              </button>
            ) : null}

            {/* Mobile Theme Toggle */}
            {showThemeToggle && (
              <button
                onClick={() => {
                  handleThemeToggle();
                  handleCloseMenu();
                }}
                className="mt-4 pt-4 border-t border-[var(--border-default)] w-full flex items-center justify-between py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label={`Toggle theme. Current: ${theme === 'dark' ? 'Dark' : 'Light'}`}
              >
                <span className="text-xs uppercase tracking-wide">Theme</span>
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <>
                      <span className="text-xs font-medium">Light</span>
                      <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium">Dark</span>
                      <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            )}

            <Link
              to={adminPath}
              onClick={handleCloseMenu}
              className="mt-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label={adminLabel}
            >
              {adminLabel}
            </Link>
          </div>
        </div>
      )}

      {/* Signup Prompt Modal */}
      <SignupPromptModal
        isOpen={showSignupModal}
        onClose={handleCloseSignupModal}
      />
    </header>
  );
};

export default Navbar;

