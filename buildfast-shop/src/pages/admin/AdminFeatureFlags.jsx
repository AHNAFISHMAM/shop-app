import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger';
import { pageFade } from '../../components/animations/menuAnimations';
import { logger } from '../../utils/logger';

const createFeatureFlagStatus = () => ({
  enable_loyalty_program: { saving: false, message: '', type: 'idle' },
  enable_reservations: { saving: false, message: '', type: 'idle' },
  enable_menu_filters: { saving: false, message: '', type: 'idle' },
  enable_product_customization: { saving: false, message: '', type: 'idle' },
  enable_order_tracking: { saving: false, message: '', type: 'idle' },
  enable_order_feedback: { saving: false, message: '', type: 'idle' },
  enable_marketing_optins: { saving: false, message: '', type: 'idle' },
  enable_quick_reorder: { saving: false, message: '', type: 'idle' }
});

function AdminFeatureFlags() {
  const navigate = useNavigate();
  const containerRef = useViewportAnimationTrigger();
  const { settings, loading: contextLoading, updateSettings } = useStoreSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    enable_loyalty_program: true,
    enable_reservations: true,
    enable_menu_filters: true,
    enable_product_customization: true,
    enable_order_tracking: true,
    enable_order_feedback: true,
    enable_marketing_optins: true,
    enable_quick_reorder: true
  });
  const [featureFlagStatus, setFeatureFlagStatus] = useState(createFeatureFlagStatus);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
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
      setFormData({
        enable_loyalty_program: settings.enable_loyalty_program ?? true,
        enable_reservations: settings.enable_reservations ?? true,
        enable_menu_filters: settings.enable_menu_filters ?? true,
        enable_product_customization: settings.enable_product_customization ?? true,
        enable_order_tracking: settings.enable_order_tracking ?? true,
        enable_order_feedback: settings.enable_order_feedback ?? true,
        enable_marketing_optins: settings.enable_marketing_optins ?? true,
        enable_quick_reorder: settings.enable_quick_reorder ?? true
      });
      setFeatureFlagStatus(createFeatureFlagStatus());
    }
  }, [settings]);

  const handleFeatureFlagToggle = async (field) => {
    const nextValue = !formData[field]
    const previousValue = formData[field]

    setFormData(prev => ({
      ...prev,
      [field]: nextValue
    }))

    setFeatureFlagStatus(prev => ({
      ...prev,
      [field]: { saving: true, message: '', type: 'idle' }
    }))

    const result = await updateSettings({ [field]: nextValue })

    if (result.success) {
      setFeatureFlagStatus(prev => ({
        ...prev,
        [field]: {
          saving: false,
          message: nextValue ? 'Enabled' : 'Disabled',
          type: 'success'
        }
      }))

      setTimeout(() => {
        setFeatureFlagStatus(prev => ({
          ...prev,
          [field]: { saving: false, message: '', type: 'idle' }
        }))
      }, 2000)
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: previousValue
      }))
      setFeatureFlagStatus(prev => ({
        ...prev,
        [field]: {
          saving: false,
          message: result.error || 'Update failed',
          type: 'error'
        }
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
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        <header className="mb-12 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-end md:justify-between" data-animate="fade-rise" data-animate-active="false">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)]">Feature Flags</h1>
            <p className="mt-2 text-sm sm:text-base text-muted">
              Control which features are visible to customers across your store
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/settings')}
            className="px-4 py-2 rounded-xl border border-theme text-muted hover:text-[var(--text-main)] hover:border-[var(--accent)] transition-all duration-200"
          >
            Back to Settings
          </button>
        </header>

        {/* Feature Flags Section */}
        <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-2">Feature Flags</h2>
          <p className="text-sm sm:text-base text-[var(--text-muted)] mb-6">Control which features are visible to customers</p>

          <div className="space-y-6">
            {/* Loyalty Program */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Star Rewards (Loyalty Program)</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable the loyalty program with points, tiers, and referral system
                </p>
                {featureFlagStatus.enable_loyalty_program.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_loyalty_program.saving && featureFlagStatus.enable_loyalty_program.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_loyalty_program.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_loyalty_program.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_loyalty_program}
                  aria-label="Toggle loyalty program"
                  onClick={() => handleFeatureFlagToggle('enable_loyalty_program')}
                  disabled={featureFlagStatus.enable_loyalty_program.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_loyalty_program
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_loyalty_program.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_loyalty_program
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_loyalty_program ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Reservations */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Table Reservations</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable table reservation system with booking form
                </p>
                {featureFlagStatus.enable_reservations.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_reservations.saving && featureFlagStatus.enable_reservations.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_reservations.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_reservations.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_reservations}
                  aria-label="Toggle reservations"
                  onClick={() => handleFeatureFlagToggle('enable_reservations')}
                  disabled={featureFlagStatus.enable_reservations.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_reservations
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_reservations.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_reservations
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_reservations ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Menu Filters */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Menu Filters</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable dietary and allergen filters on menu page
                </p>
                {featureFlagStatus.enable_menu_filters.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_menu_filters.saving && featureFlagStatus.enable_menu_filters.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_menu_filters.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_menu_filters.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_menu_filters}
                  aria-label="Toggle menu filters"
                  onClick={() => handleFeatureFlagToggle('enable_menu_filters')}
                  disabled={featureFlagStatus.enable_menu_filters.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_menu_filters
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_menu_filters.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_menu_filters
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_menu_filters ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Product Customization */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Product Customization</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable add-ons and spice level customization on products
                </p>
                {featureFlagStatus.enable_product_customization.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_product_customization.saving && featureFlagStatus.enable_product_customization.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_product_customization.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_product_customization.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_product_customization}
                  aria-label="Toggle product customization"
                  onClick={() => handleFeatureFlagToggle('enable_product_customization')}
                  disabled={featureFlagStatus.enable_product_customization.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_product_customization
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_product_customization.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_product_customization
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_product_customization ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Order Tracking */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Order Tracking</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable live order tracking timeline
                </p>
                {featureFlagStatus.enable_order_tracking.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_order_tracking.saving && featureFlagStatus.enable_order_tracking.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_order_tracking.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_order_tracking.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_order_tracking}
                  aria-label="Toggle order tracking"
                  onClick={() => handleFeatureFlagToggle('enable_order_tracking')}
                  disabled={featureFlagStatus.enable_order_tracking.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_order_tracking
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_order_tracking.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_order_tracking
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_order_tracking ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Order Feedback */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Order Feedback</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable post-meal feedback and rating system
                </p>
                {featureFlagStatus.enable_order_feedback.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_order_feedback.saving && featureFlagStatus.enable_order_feedback.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_order_feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_order_feedback.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_order_feedback}
                  aria-label="Toggle order feedback"
                  onClick={() => handleFeatureFlagToggle('enable_order_feedback')}
                  disabled={featureFlagStatus.enable_order_feedback.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_order_feedback
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_order_feedback.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_order_feedback
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_order_feedback ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Marketing Opt-ins */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Marketing Opt-ins</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable email/SMS marketing preference collection
                </p>
                {featureFlagStatus.enable_marketing_optins.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_marketing_optins.saving && featureFlagStatus.enable_marketing_optins.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_marketing_optins.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_marketing_optins.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_marketing_optins}
                  aria-label="Toggle marketing opt-ins"
                  onClick={() => handleFeatureFlagToggle('enable_marketing_optins')}
                  disabled={featureFlagStatus.enable_marketing_optins.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_marketing_optins
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_marketing_optins.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_marketing_optins
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_marketing_optins ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Quick Reorder */}
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-medium text-[var(--text-main)] mb-1">Quick Reorder</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Enable quick reorder functionality for previous orders
                </p>
                {featureFlagStatus.enable_quick_reorder.saving && (
                  <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Updating…
                  </p>
                )}
                {!featureFlagStatus.enable_quick_reorder.saving && featureFlagStatus.enable_quick_reorder.message && (
                  <p className={`mt-2 text-xs ${
                    featureFlagStatus.enable_quick_reorder.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {featureFlagStatus.enable_quick_reorder.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_quick_reorder}
                  aria-label="Toggle quick reorder"
                  onClick={() => handleFeatureFlagToggle('enable_quick_reorder')}
                  disabled={featureFlagStatus.enable_quick_reorder.saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                    formData.enable_quick_reorder
                      ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                      : 'bg-theme-elevated border-transparent'
                  } ${featureFlagStatus.enable_quick_reorder.saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                    formData.enable_quick_reorder
                      ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                      : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {formData.enable_quick_reorder ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.main>
  );
}

export default AdminFeatureFlags;

