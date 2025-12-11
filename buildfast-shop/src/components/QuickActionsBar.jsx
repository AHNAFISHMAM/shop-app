import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '../contexts/StoreSettingsContext';

const QuickActionsBar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { settings, loading: settingsLoading } = useStoreSettings();
  const enableReservations = settingsLoading ? false : (settings?.enable_reservations ?? true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (mediaQuery.matches) {
        setIsVisible(true);
        return;
      }

      const threshold = 160;
      const bottomOffset = 260;
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const nearFooter = scrollTop + viewportHeight >= docHeight - bottomOffset;
      setIsVisible(scrollTop > threshold && !nearFooter);
    };

    apply();
    mediaQuery.addEventListener('change', apply);
    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', apply);

    return () => {
      mediaQuery.removeEventListener('change', apply);
      window.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside
      data-animate="fade-rise"
      data-animate-active="false"
      data-animate-once="false"
      className="quick-actions-bar"
      data-visible={isVisible}
    >
      <button type="button" className="alt" onClick={scrollToTop} aria-label="Back to top">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
        Top
      </button>
      <Link to="/menu" className="alt" aria-label="View full menu">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h10" />
        </svg>
        View Menu
      </Link>
      {enableReservations && (
        <Link to="/reservations" className="primary" aria-label="Book a table now">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7V5a2 2 0 0 1 2-2h2" />
            <path d="M16 3h2a2 2 0 0 1 2 2v2" />
            <path d="M20 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M8 21H6a2 2 0 0 1-2-2v-2" />
            <rect x="8" y="7" width="8" height="6" rx="2" />
            <path d="M12 9v2" />
          </svg>
          Book Now
        </Link>
      )}
    </aside>
  );
};

export default QuickActionsBar;

