import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StoreSettingsProvider, useStoreSettings } from './contexts/StoreSettingsContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import PageErrorBoundary from './components/PageErrorBoundary';
import AdminLayout from './components/AdminLayout';
import AdminFullPageLayout from './components/AdminFullPageLayout';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import AutoReconnect from './components/AutoReconnect';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Favorites = lazy(() => import('./pages/Favorites'));
const AddressBook = lazy(() => import('./pages/AddressBook'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));

// Lazy load admin pages
const Admin = lazy(() => import('./pages/Admin'));
const AdminMenuCategories = lazy(() => import('./pages/admin/AdminMenuCategories'));
const AdminMenuItems = lazy(() => import('./pages/admin/AdminMenuItems'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminDiscountCodes = lazy(() => import('./pages/admin/AdminDiscountCodes'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAppearance = lazy(() => import('./pages/admin/AdminAppearance'));
const AdminHomePageControls = lazy(() => import('./pages/admin/AdminHomePageControls'));
const AdminFeatureFlags = lazy(() => import('./pages/admin/AdminFeatureFlags'));
const AdminManageAdmins = lazy(() => import('./pages/admin/AdminManageAdmins'));
const AdminReservations = lazy(() => import('./pages/admin/AdminReservations'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const AdminSpecialSections = lazy(() => import('./pages/admin/AdminSpecialSections'));
const AdminFavoriteComments = lazy(() => import('./pages/admin/AdminFavoriteComments'));

// Loading component for all pages
const PageLoading = () => {
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

  return (
    <div 
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(5, 5, 9, 0.95)'
      }}
    >
      <div className="text-center space-y-4">
        <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent)]/70 border-t-transparent"></div>
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  );
};

function AppContent() {
  const location = useLocation();
  const { settings } = useStoreSettings();
  const brightnessSetting = settings?.scroll_thumb_brightness ?? 0.6;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const normalizedBrightness = Math.max(0.05, Math.min(1, Number(brightnessSetting) || 0.6));
    const baseColorAlpha = Number((0.08 + normalizedBrightness * 0.32).toFixed(3));
    const activeColorAlpha = Math.min(0.95, Number((baseColorAlpha + normalizedBrightness * 0.25).toFixed(3)));
    const activeOpacity = Number((0.25 + normalizedBrightness * 0.55).toFixed(3));
    const idleOpacity = Number((Math.max(0.12, activeOpacity * 0.75)).toFixed(3));
    const boxShadowAlpha = Number((0.08 + normalizedBrightness * 0.22).toFixed(3));

    const html = document.documentElement;
    const managed = new Map();
    const SELECTOR = '[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]';

    const createThumbElement = () => {
      const thumb = document.createElement('div');
      thumb.setAttribute('data-scroll-thumb', 'true');
      Object.assign(thumb.style, {
        position: 'fixed',
        width: '6px',
        height: '48px',
        borderRadius: '9999px',
        background: `rgba(197, 157, 95, ${baseColorAlpha})`,
        opacity: '0',
        visibility: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        transition: 'opacity 160ms ease, visibility 160ms ease, background-color 160ms ease, transform 160ms ease',
        zIndex: '9999',
        pointerEvents: 'none',
        boxShadow: `0 6px 18px rgba(197, 157, 95, ${boxShadowAlpha})`,
        mixBlendMode: 'screen',
        willChange: 'transform, opacity',
      });
      thumb.dataset.baseAlpha = String(baseColorAlpha);
      thumb.dataset.activeColorAlpha = String(activeColorAlpha);
      thumb.dataset.activeOpacity = String(activeOpacity);
      thumb.dataset.idleOpacity = String(idleOpacity);
      document.body.appendChild(thumb);
      return thumb;
    };

    const getRect = (el) => {
      if (el === html || el === document || el === window) {
        return {
          top: 0,
          right: window.innerWidth,
          height: window.innerHeight,
          visible: true,
        };
      }

      const rect = el.getBoundingClientRect();
      const visible =
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth;

      return {
        top: rect.top,
        right: rect.right,
        height: rect.height,
        visible,
      };
    };

    const ensureManager = (el) => {
      if (managed.has(el)) {
        return managed.get(el);
      }

      const isDocumentTarget = el === html || el === document || el === window;
      const scrollElement = isDocumentTarget ? window : el;
      const thumb = createThumbElement();

      let hideTimer = null;
      let scheduled = false;

      const minThumbHeight = 32;

      const calculateMetrics = () => {
        if (isDocumentTarget) {
          return {
            scrollHeight: html.scrollHeight,
            viewport: window.innerHeight,
            scrollTop: window.scrollY,
            rect: getRect(el),
          };
        }

        return {
          scrollHeight: el.scrollHeight,
          viewport: el.clientHeight,
          scrollTop: el.scrollTop,
          rect: getRect(el),
        };
      };

      const hideThumb = () => {
        thumb.style.opacity = '0';
        thumb.style.visibility = 'hidden';
        thumb.style.background = `rgba(197, 157, 95, ${thumb.dataset.baseAlpha || baseColorAlpha})`;
      };

      const updateThumb = () => {
        scheduled = false;
        const { scrollHeight, viewport, scrollTop, rect } = calculateMetrics();
        const scrollable = scrollHeight - viewport;

        if (!rect.visible || viewport <= 0 || scrollable <= 1) {
          hideThumb();
          return;
        }

        const ratio = Math.min(1, Math.max(0, scrollTop / scrollable));
        const computedHeight = Math.max(
          minThumbHeight,
          (viewport / scrollHeight) * rect.height
        );
        const maxOffset = rect.height - computedHeight;
        const offset = Math.max(0, Math.min(maxOffset, ratio * maxOffset));
        const top = rect.top + offset;
        const left = rect.right - 6;

        thumb.style.height = `${computedHeight}px`;
        thumb.style.top = `${Math.min(
          window.innerHeight - computedHeight,
          Math.max(0, top)
        )}px`;
        thumb.style.left = `${Math.min(
          window.innerWidth - 3,
          Math.max(0, left)
        )}px`;
      };

      const requestUpdate = () => {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(updateThumb);
        }
      };

      const revealThumb = () => {
        requestUpdate();
        thumb.style.visibility = 'visible';
        const activeColor = Number(thumb.dataset.activeColorAlpha || activeColorAlpha);
        const baseColor = Number(thumb.dataset.baseAlpha || baseColorAlpha);
        thumb.style.background = `rgba(197, 157, 95, ${isDocumentTarget && window.scrollY === 0 ? baseColor : activeColor})`;

        const active = Number(thumb.dataset.activeOpacity || activeOpacity);
        const idle = Number(thumb.dataset.idleOpacity || idleOpacity);
        thumb.style.opacity =
          isDocumentTarget && window.scrollY === 0 ? String(idle) : String(active);

        if (hideTimer) {
          window.clearTimeout(hideTimer);
        }

        hideTimer = window.setTimeout(() => {
          thumb.style.opacity = '0';
          hideTimer = window.setTimeout(() => {
            thumb.style.visibility = 'hidden';
          }, 160);
        }, 600);
      };

      const handleScroll = () => revealThumb();
      const handleResize = () => requestUpdate();
      const handleViewportScroll = () => requestUpdate();

      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleViewportScroll, true);

      const resizeObserver = !isDocumentTarget
        ? new ResizeObserver(() => requestUpdate())
        : null;
      if (resizeObserver) {
        resizeObserver.observe(el);
      }

      const cleanup = () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleViewportScroll, true);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (hideTimer) {
          window.clearTimeout(hideTimer);
        }
        if (thumb.parentNode) {
          thumb.parentNode.removeChild(thumb);
        }
        managed.delete(el);
      };

      const manager = {
        update: requestUpdate,
        reveal: revealThumb,
        dispose: cleanup,
      };

      managed.set(el, manager);
      requestUpdate();

      return manager;
    };

    const scan = () => {
      const elements = new Set([html, ...document.querySelectorAll(SELECTOR)]);
      elements.forEach((el) => ensureManager(el));
      managed.forEach((manager, el) => {
        if (!elements.has(el)) {
          manager.dispose();
        }
      });
    };

    const mutationObserver = new MutationObserver(() => {
      scan();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', scan);
    window.addEventListener('orientationchange', scan);

    scan();

    return () => {
      mutationObserver.disconnect();
      window.removeEventListener('resize', scan);
      window.removeEventListener('orientationchange', scan);
      managed.forEach((manager) => manager.dispose());
      managed.clear();
    };
  }, [brightnessSetting]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const activateAll = () => {
      document.querySelectorAll('[data-animate]').forEach((el) => {
        el.dataset.animateActive = 'true';
      });
    };

    if (reduceMotionQuery.matches) {
      activateAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          const once = target.dataset.animateOnce !== 'false';
          if (isIntersecting) {
            target.dataset.animateActive = 'true';
            if (once) {
              observer.unobserve(target);
            }
          } else if (!once) {
            target.dataset.animateActive = 'false';
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10%',
      }
    );

    const tracked = new WeakSet();

    const scan = () => {
      document.querySelectorAll('[data-animate]').forEach((el) => {
        if (reduceMotionQuery.matches) {
          el.dataset.animateActive = 'true';
          return;
        }

        if (!el.dataset.animateActive) {
          el.dataset.animateActive = 'false';
        }

        if (tracked.has(el)) return;
        observer.observe(el);
        tracked.add(el);
      });
    };

    scan();

    const mutationObserver = new MutationObserver(() => {
      scan();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const handlePreferenceChange = (event) => {
      if (event.matches) {
        mutationObserver.disconnect();
        observer.disconnect();
        activateAll();
      } else {
        scan();
      }
    };

    reduceMotionQuery.addEventListener('change', handlePreferenceChange);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      reduceMotionQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-[var(--bg-main)]"
        onWheel={(e) => {
          // Prevent scroll bubbling from scrollable children
          const target = e.target;
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
          const target = e.target;
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
        <ScrollToTop />
        <AutoReconnect />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#F9FAFB',
              border: '1px solid rgba(197, 157, 95, 0.3)',
            },
            success: {
              iconTheme: {
                primary: '#C59D5F',
                secondary: '#111',
              },
            },
          }}
        />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
        {/* Main Routes with New Minimalist Design */}
        <Route path="/" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><HomePage /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/menu" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><MenuPage /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/order" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><OrderPage /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/order-online" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><OrderPage /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/reservations" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><ReservationsPage /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/about" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><AboutPage /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/contact" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><ContactPage /></Suspense></PageErrorBoundary></MainLayout>} />

        {/* Legacy/Hidden Routes - Still Accessible but Not in Main Nav */}
        <Route path="/products" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><Products /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/products/:id" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><ProductDetail /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/cart" element={<Navigate to="/order" replace />} />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><Favorites /></Suspense></PageErrorBoundary></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/addresses"
          element={
            <ProtectedRoute>
              <MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><AddressBook /></Suspense></PageErrorBoundary></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><Checkout /></Suspense></PageErrorBoundary></MainLayout>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><OrderHistory /></Suspense></PageErrorBoundary></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute>
              <MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><OrderHistory /></Suspense></PageErrorBoundary></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/signup" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><Signup /></Suspense></PageErrorBoundary></MainLayout>} />
        <Route path="/login" element={<MainLayout><PageErrorBoundary><Suspense fallback={<PageLoading />}><Login /></Suspense></PageErrorBoundary></MainLayout>} />

        {/* Admin Routes - Protected with AdminRoute */}
        <Route path="/admin" element={
          <ErrorBoundary>
            <AdminRoute>
              <Suspense fallback={<PageLoading />}>
                <AdminLayout />
              </Suspense>
            </AdminRoute>
          </ErrorBoundary>
        }>
          <Route index element={<Suspense fallback={<PageLoading />}><Admin /></Suspense>} />
          <Route path="menu-categories" element={<Suspense fallback={<PageLoading />}><AdminMenuCategories /></Suspense>} />
          <Route path="menu-items" element={<Suspense fallback={<PageLoading />}><AdminMenuItems /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<PageLoading />}><AdminOrders /></Suspense>} />
          <Route path="reservations" element={<Suspense fallback={<PageLoading />}><AdminReservations /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<PageLoading />}><AdminCustomers /></Suspense>} />
          <Route path="special-sections" element={<Suspense fallback={<PageLoading />}><AdminSpecialSections /></Suspense>} />
          <Route path="discount-codes" element={<Suspense fallback={<PageLoading />}><AdminDiscountCodes /></Suspense>} />
          <Route path="gallery" element={<Suspense fallback={<PageLoading />}><AdminGallery /></Suspense>} />
          <Route path="favorite-comments" element={<Suspense fallback={<PageLoading />}><AdminFavoriteComments /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoading />}><AdminSettings /></Suspense>} />
          <Route path="appearance" element={<Suspense fallback={<PageLoading />}><AdminAppearance /></Suspense>} />
          <Route path="home-page-controls" element={<Suspense fallback={<PageLoading />}><AdminHomePageControls /></Suspense>} />
          <Route path="feature-flags" element={<Suspense fallback={<PageLoading />}><AdminFeatureFlags /></Suspense>} />
          <Route path="manage-admins" element={<Suspense fallback={<PageLoading />}><AdminManageAdmins /></Suspense>} />
        </Route>

        {/* Full-Page Admin Routes - No sidebar/navbar, minimal header with back button */}
        <Route
          path="/admin/orders/full"
          element={
            <ErrorBoundary>
              <AdminRoute>
                <Suspense fallback={<PageLoading />}>
                  <AdminFullPageLayout title="Order Management" backPath="/admin/orders">
                    <AdminOrders fullPage={true} />
                  </AdminFullPageLayout>
                </Suspense>
              </AdminRoute>
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <Router>
        <AuthProvider>
          <StoreSettingsProvider>
            <AppContent />
          </StoreSettingsProvider>
        </AuthProvider>
      </Router>
    </LazyMotion>
  );
}

export default App;
