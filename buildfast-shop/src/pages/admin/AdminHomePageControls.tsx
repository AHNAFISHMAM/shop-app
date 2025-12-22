import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger';
import { pageFade } from '../../components/animations/menuAnimations';
import { logger } from '../../utils/logger';

interface ToggleStatus {
  saving: boolean;
  message: string;
  type: 'idle' | 'success' | 'error';
}

interface ToggleStatuses {
  show_home_ambience_uploader: ToggleStatus;
  show_theme_toggle: ToggleStatus;
  show_public_reviews: ToggleStatus;
  show_home_testimonials: ToggleStatus;
}

interface FormData {
  show_home_ambience_uploader: boolean;
  show_theme_toggle: boolean;
  show_public_reviews: boolean;
  show_home_testimonials: boolean;
  scroll_thumb_brightness: number;
}

const createToggleStatus = (): ToggleStatuses => ({
  show_home_ambience_uploader: { saving: false, message: '', type: 'idle' },
  show_theme_toggle: { saving: false, message: '', type: 'idle' },
  show_public_reviews: { saving: false, message: '', type: 'idle' },
  show_home_testimonials: { saving: false, message: '', type: 'idle' }
});

function AdminHomePageControls(): JSX.Element {
  const navigate = useNavigate();
  const containerRef = useViewportAnimationTrigger();
  const { settings, loading: contextLoading, updateSettings } = useStoreSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    show_home_ambience_uploader: false,
    show_theme_toggle: true,
    show_public_reviews: false,
    show_home_testimonials: true,
    scroll_thumb_brightness: 0.6
  });
  const [toggleStatus, setToggleStatus] = useState<ToggleStatuses>(createToggleStatus);
  const scrollBrightnessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async (): Promise<void> => {
      setVerifying(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Log in to access admin tools.');
          setIsAdmin(false);
          navigate('/login');
          return;
        }

        const { data, error: customerError } = await supabase
          .from('customers')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (customerError || !data?.is_admin) {
          setError('Access denied. Administrator role required.');
          setIsAdmin(false);
          navigate('/admin');
          return;
        }

        setIsAdmin(true);
        setError('');
      } catch (err) {
        logger.error(err);
        setError('Unable to verify admin permissions.');
        setIsAdmin(false);
        navigate('/admin');
      } finally {
        setVerifying(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Load settings into form when they're available
  useEffect(() => {
    if (settings) {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      setFormData({
        show_home_ambience_uploader: settings.show_home_ambience_uploader || false,
        show_theme_toggle: settings.show_theme_toggle ?? true,
        show_public_reviews: settings.show_public_reviews ?? false,
        show_home_testimonials: (settings.show_public_reviews ?? false)
          ? (settings.show_home_testimonials ?? true)
          : false,
        scroll_thumb_brightness: settings.scroll_thumb_brightness ?? 0.6
      });
      setToggleStatus(createToggleStatus());
    }
  }, [settings]);

  // Auto-save scroll thumb brightness with debounce
  useEffect(() => {
    if (isInitialLoadRef.current || !settings) {
      return;
    }

    if (scrollBrightnessTimeoutRef.current) {
      clearTimeout(scrollBrightnessTimeoutRef.current);
    }

    const currentValue = formData.scroll_thumb_brightness ?? 0.6;
    const savedValue = settings.scroll_thumb_brightness ?? 0.6;

    if (Math.abs(currentValue - savedValue) > 0.001) {
      scrollBrightnessTimeoutRef.current = setTimeout(async () => {
        const normalizedValue = Math.max(0.05, Math.min(1, Number(currentValue.toFixed(2))));
        await updateSettings({ scroll_thumb_brightness: normalizedValue });
      }, 500);
    }

    return () => {
      if (scrollBrightnessTimeoutRef.current) {
        clearTimeout(scrollBrightnessTimeoutRef.current);
      }
    };
  }, [formData.scroll_thumb_brightness, settings, updateSettings]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type } = e.target;

    if (type === 'range') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0.6 : parseFloat(value)
      }))
    }
  };

  const handleQuickToggle = async (field: keyof FormData): Promise<void> => {
    const nextValue = !formData[field]
    const previousValue = formData[field]
    const previousTestimonials = formData.show_home_testimonials

    const updates: Record<string, unknown> = { [field]: nextValue }
    if (field === 'show_public_reviews') {
      updates.reviews_visibility_updated_at = new Date().toISOString()
      if (!nextValue) {
        updates.show_home_testimonials = false
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: nextValue,
      ...(field === 'show_public_reviews' && !nextValue ? { show_home_testimonials: false } : {})
    }))

    setToggleStatus(prev => ({
      ...prev,
      [field]: { saving: true, message: '', type: 'idle' },
      ...(field === 'show_public_reviews' && !nextValue
        ? { show_home_testimonials: { saving: false, message: 'Hidden with reviews', type: 'success' } }
        : {})
    }))

    const result = await updateSettings(updates)

    if (result.success) {
      setToggleStatus(prev => ({
        ...prev,
        [field]: {
          saving: false,
          message: nextValue ? 'Enabled' : 'Disabled',
          type: 'success'
        },
        ...(field === 'show_public_reviews' && !nextValue
          ? { show_home_testimonials: { saving: false, message: 'Hidden with reviews', type: 'success' } }
          : {})
      }))

      setTimeout(() => {
        setToggleStatus(prev => ({
          ...prev,
          [field]: { saving: false, message: '', type: 'idle' },
          ...(field === 'show_public_reviews'
            ? { show_home_testimonials: { saving: false, message: '', type: 'idle' } }
            : {})
        }))
      }, 2000)
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: previousValue,
        ...(field === 'show_public_reviews' && !nextValue
          ? { show_home_testimonials: previousTestimonials }
          : {})
      }))
      setToggleStatus(prev => ({
        ...prev,
        [field]: {
          saving: false,
          message: result.error || 'Update failed',
          type: 'error'
        },
        ...(field === 'show_public_reviews' && !nextValue
          ? { show_home_testimonials: { saving: false, message: '', type: 'idle' } }
          : {})
      }))
    }
  };

  if (verifying || contextLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-[0_25px_60px_-45px_rgba(248,113,113,0.6)]">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-main)]">Admin Access Required</h2>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <m.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ 
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        <header className="mb-12 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-end md:justify-between" data-animate="fade-rise" data-animate-active="false">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)]">Home Page Controls</h1>
            <p className="mt-2 text-sm sm:text-base text-muted">
              Control visibility and behavior of home page elements and features
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/settings')}
            className="px-4 py-2 rounded-xl border border-theme text-muted hover:text-[var(--text-main)] hover:border-[var(--accent)] transition-all duration-200"
          >
            Back to Settings
          </button>
        </header>

        {/* Home Page Controls */}
        <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Home Page Controls</h2>
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Show Public Reviews</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Control whether verified customer reviews appear on storefront pages.
                </p>
                {toggleStatus.show_public_reviews.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!toggleStatus.show_public_reviews.saving && toggleStatus.show_public_reviews.message && (
                  <p
                    className={`mt-2 text-xs ${
                      toggleStatus.show_public_reviews.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {toggleStatus.show_public_reviews.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.show_public_reviews}
                  aria-label="Toggle public visibility for product reviews"
                  onClick={() => handleQuickToggle('show_public_reviews')}
                  disabled={toggleStatus.show_public_reviews.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.show_public_reviews
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${toggleStatus.show_public_reviews.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                      formData.show_public_reviews
                        ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.show_public_reviews ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Show Home Testimonials</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Display the customer testimonials block on the home page. Requires public reviews to be visible.
                </p>
                {toggleStatus.show_home_testimonials.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!toggleStatus.show_home_testimonials.saving && toggleStatus.show_home_testimonials.message && (
                  <p
                    className={`mt-2 text-xs ${
                      toggleStatus.show_home_testimonials.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {toggleStatus.show_home_testimonials.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.show_home_testimonials && formData.show_public_reviews}
                  aria-label="Toggle testimonials section on home page"
                  onClick={() => handleQuickToggle('show_home_testimonials')}
                  disabled={toggleStatus.show_home_testimonials.saving || !formData.show_public_reviews}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.show_home_testimonials && formData.show_public_reviews
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${
                    toggleStatus.show_home_testimonials.saving || !formData.show_public_reviews
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                      formData.show_home_testimonials && formData.show_public_reviews
                        ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.show_home_testimonials && formData.show_public_reviews ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Show Ambience Uploader</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Toggle visibility of the ambience uploader block on the public home page. Recommended to keep hidden unless updating ambience assets.
                </p>
                {toggleStatus.show_home_ambience_uploader.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!toggleStatus.show_home_ambience_uploader.saving && toggleStatus.show_home_ambience_uploader.message && (
                  <p
                    className={`mt-2 text-xs ${
                      toggleStatus.show_home_ambience_uploader.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {toggleStatus.show_home_ambience_uploader.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.show_home_ambience_uploader}
                  aria-label="Toggle ambience uploader visibility on home page"
                  onClick={() => handleQuickToggle('show_home_ambience_uploader')}
                  disabled={toggleStatus.show_home_ambience_uploader.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.show_home_ambience_uploader
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${toggleStatus.show_home_ambience_uploader.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                      formData.show_home_ambience_uploader
                        ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.show_home_ambience_uploader ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Show Theme Toggle</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Allow visitors to switch between light and dark themes from the navigation bar. Disable to keep the site locked to the default look.
                </p>
                {toggleStatus.show_theme_toggle.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!toggleStatus.show_theme_toggle.saving && toggleStatus.show_theme_toggle.message && (
                  <p
                    className={`mt-2 text-xs ${
                      toggleStatus.show_theme_toggle.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {toggleStatus.show_theme_toggle.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.show_theme_toggle}
                  aria-label="Toggle theme switch visibility in navigation"
                  onClick={() => handleQuickToggle('show_theme_toggle')}
                  disabled={toggleStatus.show_theme_toggle.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.show_theme_toggle
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${toggleStatus.show_theme_toggle.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                      formData.show_theme_toggle
                        ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.show_theme_toggle ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-theme-subtle pt-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Scroll Thumb Brightness</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Fine tune the overlay scrollbar thumb visibility across the entire application. Lower values keep the slider subtle, higher values make it easier to spot.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <input
                  type="range"
                  name="scroll_thumb_brightness"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={formData.scroll_thumb_brightness ?? 0.6}
                  onChange={handleChange}
                  className="w-44 accent-[var(--accent)]"
                />
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-[0.25em]">
                  {Math.round(((formData.scroll_thumb_brightness ?? 0.6) + Number.EPSILON) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.main>
  );
}

export default AdminHomePageControls;

