import { Link, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { supabase } from '../lib/supabase';
import { getFavoritesCount } from '../lib/favoritesUtils';
import { onFavoritesChanged } from '../lib/favoritesEvents';
import { logger } from '../utils/logger';
import SignupPromptModal from './SignupPromptModal';
import ProfileDropdown from './ProfileDropdown';

const BurgerIcon = ({ className = undefined, ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 9.25c0-2.485 3.134-4.75 8-4.75s8 2.265 8 4.75" />
    <path d="M3.5 12h17" />
    <path d="M5.5 14.75h13" />
    <path d="M5 17.5c1.6 1.1 3.7 1.75 7 1.75s5.4-.65 7-1.75" />
  </svg>
);

BurgerIcon.propTypes = {
  className: PropTypes.string,
};

const navLinks = [
  { to: '/menu', label: 'Menu' },
  { to: '/order', label: 'ORDER' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
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

  // Determine admin link destination and label based on authentication status
  const adminPath = user?.isAdmin || isAdmin ? '/admin' : '/login';
  const adminLabel = user?.isAdmin || isAdmin ? 'Admin' : 'Log In';
  const showThemeToggle = settings?.show_theme_toggle !== false;
  const enableReservations = settingsLoading ? false : (settings?.enable_reservations ?? true);

  return (
    <header 
      className="sticky top-0 z-30 backdrop-blur border-b border-theme-subtle relative overflow-visible"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'rgba(5, 5, 9, 0.8)'
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_60%)] opacity-60" />
      <nav className="relative z-10 app-container py-3 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-wide text-accent">
            Star Café
          </span>
          <span className="hidden sm:inline text-[0.6875rem] text-muted uppercase tracking-[0.1em] opacity-80">
            Taste That Shines
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm uppercase tracking-wide ${
                  isActive ? 'text-accent' : 'text-muted hover:text-[var(--text-main)]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {enableReservations && (
            <Link
              to="/reservations"
              className="ml-2 btn-primary text-sm min-h-[44px]"
            >
              RESERVE
            </Link>
          )}

          {/* Favorites Button - Navigate to Favorites or Show Signup */}
          {!loading && user ? (
            <Link
              to="/favorites"
              className="relative p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent group"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="View your favorite dishes"
              aria-label="Go to favorites page"
            >
              <BurgerIcon className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-black">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>
          ) : !loading && !user ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSignupModal(true);
              }}
              className="relative p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent group"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Save your favorite dishes - Sign up required"
              aria-label="Open favorites signup prompt"
            >
              <BurgerIcon className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <div className="relative p-2 w-9 h-9" aria-label="Loading favorites">
              <BurgerIcon className="w-5 h-5 text-accent/50" />
            </div>
          )}

          {/* Theme Toggle Button */}
          {showThemeToggle && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={`Toggle theme. Current: ${theme === 'dark' ? 'Dark' : 'Light'}`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          )}

          <ProfileDropdown />
        </div>

        {/* Mobile */}
        <button
          className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-theme-strong"
          onClick={() => setOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          <div className="flex flex-col gap-[5px]">
            <span className="w-4 h-[1.5px] bg-white block" />
            <span className="w-4 h-[1.5px] bg-white block" />
            <span className="w-4 h-[1.5px] bg-white block" />
          </div>
        </button>
      </nav>

      {open && (
        <div 
          className="md:hidden border-t border-theme"
          style={{
            backgroundColor: isLightTheme 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(5, 5, 9, 0.95)'
          }}
        >
          <div className="app-container py-3 flex flex-col gap-2">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-3 text-sm min-h-[44px] flex items-center ${
                    isActive ? 'text-accent' : 'text-muted'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {enableReservations && (
              <Link
                to="/reservations"
                onClick={() => setOpen(false)}
                className="mt-2 w-full text-center btn-primary text-sm min-h-[44px]"
              >
                RESERVE A TABLE
              </Link>
            )}

            {/* Mobile Favorites Button - Navigate or Show Signup */}
            {!loading && user ? (
              <Link
                to="/favorites"
                onClick={() => setOpen(false)}
                className="mt-4 pt-4 border-t border-theme w-full flex items-center justify-between py-3 text-sm text-muted hover:text-[var(--text-main)] transition min-h-[44px]"
              >
                <span className="text-xs uppercase tracking-wide">My Favorites</span>
                <div className="flex items-center gap-2">
                  {favoritesCount > 0 && (
                    <span className="bg-accent text-black text-xs font-bold rounded-full px-2 py-0.5">
                      {favoritesCount}
                    </span>
                  )}
                  <BurgerIcon className="w-4 h-4 text-accent" strokeWidth={2} />
                </div>
              </Link>
            ) : !loading && !user ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSignupModal(true);
                  setOpen(false);
                }}
                className="mt-4 pt-4 border-t border-theme w-full flex items-center justify-between py-3 text-sm text-muted hover:text-[var(--text-main)] transition min-h-[44px]"
              >
                <span className="text-xs uppercase tracking-wide">My Favorites</span>
                <BurgerIcon className="w-4 h-4 text-accent" strokeWidth={2} />
              </button>
            ) : null}

            {/* Mobile Theme Toggle */}
            {showThemeToggle && (
              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setOpen(false);
                }}
                className="mt-4 pt-4 border-t border-theme w-full flex items-center justify-between py-3 text-sm text-muted hover:text-[var(--text-main)] transition min-h-[44px]"
                aria-label={`Toggle theme. Current: ${theme === 'dark' ? 'Dark' : 'Light'}`}
              >
                <span className="text-xs uppercase tracking-wide">Theme</span>
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <>
                      <span className="text-xs font-medium">Light</span>
                      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium">Dark</span>
                      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            )}

            <Link
              to={adminPath}
              onClick={() => setOpen(false)}
              className="mt-4 py-2 text-sm text-muted hover:text-[var(--text-main)]"
            >
              {adminLabel}
            </Link>
          </div>
        </div>
      )}

      {/* Signup Prompt Modal */}
      <SignupPromptModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </header>
  );
};

export default Navbar;
