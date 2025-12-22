import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStoreSettings } from '../contexts/StoreSettingsContext';

/**
 * Footer Component
 *
 * Main footer component with navigation links and copyright.
 * Features:
 * - Responsive layout (mobile-first)
 * - Conditional reservations link
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Design system compliant (CSS variables)
 */
const Footer = () => {
  const { settings, loading: settingsLoading } = useStoreSettings();
  
  const enableReservations = useMemo(() => {
    return settingsLoading ? false : (settings?.enable_reservations ?? true);
  }, [settings, settingsLoading]);

  const currentYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  return (
    <footer
      className="border-t bg-[var(--bg-elevated)] relative overflow-hidden"
      style={{ borderColor: 'rgba(var(--text-main-rgb), 0.05)' }}
      role="contentinfo"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--text-main-rgb),0.12),transparent_65%)]"
        aria-hidden="true"
      />
      <div 
        className="relative z-10 py-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between text-sm text-[var(--text-muted)]"
        style={{
          // Match navbar side spacing exactly
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        }}
      >
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[var(--accent)]">
            Star Café
          </div>
          <div className="text-sm leading-relaxed">Shuvash Chandra Road, Chitrar Mor, Jessore</div>
          <div className="text-sm">Phone: 01726-367742</div>
        </div>
        <nav className="flex flex-wrap gap-3 sm:gap-4 text-sm" aria-label="Footer navigation">
          <Link
            to="/menu"
            className="hover:text-[var(--accent)] transition min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="Go to menu page"
          >
            Menu
          </Link>
          {enableReservations && (
            <Link
              to="/reservations"
              className="hover:text-[var(--accent)] transition min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Go to reservations page"
            >
              Reservations
            </Link>
          )}
          <Link
            to="/contact"
            className="hover:text-[var(--accent)] transition min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="Go to contact page"
          >
            Contact
          </Link>
        </nav>
        <div className="text-sm text-[var(--text-muted)] opacity-75">
          © {currentYear} Star Café. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

