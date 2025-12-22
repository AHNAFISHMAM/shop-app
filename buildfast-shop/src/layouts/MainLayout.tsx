import { useEffect, useRef, ReactNode } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { getBackgroundStyle } from '../utils/backgroundUtils';
import QuickActionsBar from '../components/QuickActionsBar';
import ScrollProgress from '../components/ScrollProgress';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps): JSX.Element => {
  const { settings } = useStoreSettings();
  const mainContentRef = useRef<HTMLElement>(null);

  // Prevent scroll events from bubbling to window
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const handleWheel = (e: WheelEvent) => {
      // Only stop propagation if we're not at the scroll boundaries
      const target = e.currentTarget as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const isScrollable = scrollHeight > clientHeight;
      
      if (isScrollable) {
        const isAtTop = scrollTop === 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
        
        // If we're at boundaries and trying to scroll further, prevent bubbling
        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
          e.stopPropagation();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.stopPropagation();
    };

    // Add listeners to all scrollable children
    const allElements = mainContent.querySelectorAll('[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]');
    
    // Filter to only actually scrollable elements
    const scrollableElements = Array.from(allElements).filter(el => {
      const style = window.getComputedStyle(el);
      const isScrollable = el.scrollHeight > el.clientHeight &&
                          (style.overflow === 'auto' || 
                           style.overflow === 'scroll' || 
                           style.overflowY === 'auto' || 
                           style.overflowY === 'scroll');
      return isScrollable;
    });
    
    scrollableElements.forEach(el => {
      el.addEventListener('wheel', handleWheel, { passive: false });
      el.addEventListener('touchmove', handleTouchMove, { passive: false });
    });

    return () => {
      scrollableElements.forEach(el => {
        el.removeEventListener('wheel', handleWheel);
        el.removeEventListener('touchmove', handleTouchMove);
      });
    };
  }, []);

  const backgroundStyle = settings ? getBackgroundStyle(settings, 'page') : {};
  // Only apply inline style if it's not using theme variable
  const shouldApplyStyle = backgroundStyle.background && 
    backgroundStyle.background !== 'var(--bg-main)' && 
    backgroundStyle.background !== 'transparent';

  return (
    <div
      className="app-shell min-h-screen flex flex-col overflow-visible"
      style={shouldApplyStyle ? backgroundStyle : {}}
    >
      {/* Skip Navigation Link for Accessibility */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      <ScrollProgress />

      <Navbar />
      <main 
        ref={mainContentRef}
        id="main-content" 
        className="flex-1 overflow-visible" 
        style={{
          position: 'relative', // Ensure proper positioning context
          transform: 'none !important', // Force no transforms - critical for sticky sidebar
          willChange: 'auto !important', // Force no will-change - critical for sticky sidebar
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
        role="main" 
        aria-label="Main content"
        onWheel={(e) => {
          // Prevent scroll bubbling for scrollable children
          const target = e.target as HTMLElement;
          const scrollableParent = target.closest('[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]');
          if (scrollableParent) {
            // Check if element is actually scrollable (not just overflow-hidden)
            const style = window.getComputedStyle(scrollableParent);
            const isScrollable = scrollableParent.scrollHeight > scrollableParent.clientHeight &&
                                 (style.overflow === 'auto' || 
                                  style.overflow === 'scroll' || 
                                  style.overflowY === 'auto' || 
                                  style.overflowY === 'scroll');
            if (isScrollable) {
              e.stopPropagation();
            }
          }
        }}
        onTouchMove={(e) => {
          const target = e.target as HTMLElement;
          const scrollableParent = target.closest('[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]');
          if (scrollableParent) {
            // Check if element is actually scrollable (not just overflow-hidden)
            const style = window.getComputedStyle(scrollableParent);
            const isScrollable = scrollableParent.scrollHeight > scrollableParent.clientHeight &&
                                 (style.overflow === 'auto' || 
                                  style.overflow === 'scroll' || 
                                  style.overflowY === 'auto' || 
                                  style.overflowY === 'scroll');
            if (isScrollable) {
              e.stopPropagation();
            }
          }
        }}
      >
        {/* Removed .app-container wrapper to allow sticky sidebars to work properly */}
        {/* Pages that need .app-container should add it themselves */}
        <div 
          className="pt-1 pb-14 md:pt-3 md:pb-16 overflow-visible"
          style={{
            overflow: 'visible',
            overflowX: 'visible',
            overflowY: 'visible'
          }}
        >
          {children}
        </div>
      </main>
      <div className="app-container pb-4">
        <QuickActionsBar />
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;

