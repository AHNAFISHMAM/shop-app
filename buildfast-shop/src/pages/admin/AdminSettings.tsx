import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { logger } from '../../utils/logger'
import CustomDropdown from '../../components/ui/CustomDropdown'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

/**
 * Admin Settings Page
 *
 * Tabbed settings page with:
 * - Store Settings (store name, logo, tax, shipping, etc.)
 * - Reservation Settings (reservation system configuration)
 */
interface ToggleStatus {
  saving: boolean;
  message: string;
  type: 'idle' | 'success' | 'error';
}

const createToggleStatus = (): Record<string, ToggleStatus> => ({
  show_home_ambience_uploader: { saving: false, message: '', type: 'idle' },
  show_theme_toggle: { saving: false, message: '', type: 'idle' },
  show_public_reviews: { saving: false, message: '', type: 'idle' },
  show_home_testimonials: { saving: false, message: '', type: 'idle' }
})

function AdminSettings() {
  const containerRef = useViewportAnimationTrigger()
  const { settings, loading: contextLoading, updateSettings } = useStoreSettings()

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    try {
      const checkTheme = () => {
        try {
          setIsLightTheme(document.documentElement.classList.contains('theme-light'));
        } catch (err) {
          logger.error('Error checking theme:', err);
        }
      };

      checkTheme();

      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });

      return () => {
        try {
          observer.disconnect();
        } catch (err) {
          logger.error('Error disconnecting observer:', err);
        }
      };
    } catch (err) {
      logger.error('Error setting up theme observer:', err);
    }
  }, []);

  const [formData, setFormData] = useState<{
    store_name: string;
    store_description: string;
    store_logo_url: string;
    tax_rate: number;
    shipping_type: string;
    shipping_cost: number;
    free_shipping_threshold: number;
    currency: string;
    store_hours: string;
    contact_email: string;
    contact_phone: string;
    facebook_url: string;
    twitter_url: string;
    instagram_url: string;
    return_policy: string;
    show_home_ambience_uploader: boolean;
    show_theme_toggle: boolean;
    show_public_reviews: boolean;
    show_home_testimonials: boolean;
    scroll_thumb_brightness: number;
    enable_loyalty_program: boolean;
    enable_reservations: boolean;
    enable_menu_filters: boolean;
    enable_product_customization: boolean;
    enable_order_tracking: boolean;
    enable_order_feedback: boolean;
    enable_marketing_optins: boolean;
    enable_quick_reorder: boolean;
  }>({
    store_name: '',
    store_description: '',
    store_logo_url: '',
    tax_rate: 0,
    shipping_type: 'flat',
    shipping_cost: 0,
    free_shipping_threshold: 0,
    currency: 'USD',
    store_hours: '',
    contact_email: '',
    contact_phone: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    return_policy: '',
    show_home_ambience_uploader: false,
    show_theme_toggle: true,
    show_public_reviews: false,
    show_home_testimonials: true,
    scroll_thumb_brightness: 0.6,
    // Feature flags
    enable_loyalty_program: true,
    enable_reservations: true,
    enable_menu_filters: true,
    enable_product_customization: true,
    enable_order_tracking: true,
    enable_order_feedback: true,
    enable_marketing_optins: true,
    enable_quick_reorder: true,
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [toggleStatus, setToggleStatus] = useState<Record<string, ToggleStatus>>(createToggleStatus)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  // eslint-disable-next-line no-unused-vars
  const [featureFlagStatus, setFeatureFlagStatus] = useState<Record<string, ToggleStatus>>({
    enable_loyalty_program: { saving: false, message: '', type: 'idle' },
    enable_reservations: { saving: false, message: '', type: 'idle' },
    enable_menu_filters: { saving: false, message: '', type: 'idle' },
    enable_product_customization: { saving: false, message: '', type: 'idle' },
    enable_order_tracking: { saving: false, message: '', type: 'idle' },
    enable_order_feedback: { saving: false, message: '', type: 'idle' },
    enable_marketing_optins: { saving: false, message: '', type: 'idle' },
    enable_quick_reorder: { saving: false, message: '', type: 'idle' }
  })
  // Load settings into form when they're available
  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        store_description: settings.store_description || '',
        store_logo_url: settings.store_logo_url || '',
        tax_rate: settings.tax_rate || 0,
        shipping_type: settings.shipping_type || 'flat',
        shipping_cost: settings.shipping_cost || 0,
        free_shipping_threshold: settings.free_shipping_threshold || 0,
        currency: settings.currency || 'USD',
        store_hours: settings.store_hours || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        facebook_url: settings.facebook_url || '',
        twitter_url: settings.twitter_url || '',
        instagram_url: settings.instagram_url || '',
        return_policy: settings.return_policy || '',
        show_home_ambience_uploader: settings.show_home_ambience_uploader || false,
        show_theme_toggle: settings.show_theme_toggle ?? true,
        show_public_reviews: settings.show_public_reviews ?? false,
        show_home_testimonials: (settings.show_public_reviews ?? false)
          ? (settings.show_home_testimonials ?? true)
          : false,
        scroll_thumb_brightness: settings.scroll_thumb_brightness ?? 0.6,
        // Feature flags
        enable_loyalty_program: settings.enable_loyalty_program ?? true,
        enable_reservations: settings.enable_reservations ?? true,
        enable_menu_filters: settings.enable_menu_filters ?? true,
        enable_product_customization: settings.enable_product_customization ?? true,
        enable_order_tracking: settings.enable_order_tracking ?? true,
        enable_order_feedback: settings.enable_order_feedback ?? true,
        enable_marketing_optins: settings.enable_marketing_optins ?? true,
        enable_quick_reorder: settings.enable_quick_reorder ?? true,
      })
      setToggleStatus(createToggleStatus())
      setFeatureFlagStatus({
        enable_loyalty_program: { saving: false, message: '', type: 'idle' },
        enable_reservations: { saving: false, message: '', type: 'idle' },
        enable_menu_filters: { saving: false, message: '', type: 'idle' },
        enable_product_customization: { saving: false, message: '', type: 'idle' },
        enable_order_tracking: { saving: false, message: '', type: 'idle' },
        enable_order_feedback: { saving: false, message: '', type: 'idle' },
        enable_marketing_optins: { saving: false, message: '', type: 'idle' },
        enable_quick_reorder: { saving: false, message: '', type: 'idle' }
      })
    }
  }, [settings])

  // Real-time theme adjustment application

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target

    if (type === 'checkbox') {
      if (name === 'show_public_reviews' && !checked) {
        setFormData(prev => ({
          ...prev,
          show_public_reviews: false,
          show_home_testimonials: false
        }))
        return
      }

      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
      return
    }

    // Handle numeric fields
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }))
    } else if (type === 'range') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0.6 : parseFloat(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }


  // eslint-disable-next-line no-unused-vars
  const handleQuickToggle = async (field) => {
    const nextValue = !formData[field]
    const previousValue = formData[field]
    const previousTestimonials = formData.show_home_testimonials

    const updates = { [field]: nextValue }
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
  }

  // eslint-disable-next-line no-unused-vars
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      // Validate tax rate
      if (formData.tax_rate < 0 || formData.tax_rate > 100) {
        setError('Tax rate must be between 0 and 100')
        setSaving(false)
        return
      }

      // Validate shipping cost
      if (formData.shipping_cost < 0) {
        setError('Shipping cost cannot be negative')
        setSaving(false)
        return
      }

      // Validate free shipping threshold
      if (formData.shipping_type === 'free_over_amount' && formData.free_shipping_threshold <= 0) {
        setError('Free shipping threshold must be greater than 0')
        setSaving(false)
        return
      }

      const payload = {
        ...formData,
        show_home_testimonials: formData.show_public_reviews ? formData.show_home_testimonials : false
      }

      payload.scroll_thumb_brightness = Math.max(0.05, Math.min(1, Number((payload.scroll_thumb_brightness ?? 0.6).toFixed(2))))

      if (settings && payload.show_public_reviews !== (settings.show_public_reviews ?? false)) {
        payload.reviews_visibility_updated_at = new Date().toISOString()
      }

      const result = await updateSettings(payload)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch (err) {
      logger.error('Error saving settings:', err)
      setError('Failed to save settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmReset = () => {
    setShowResetConfirm(true)
  }

  const handleReset = () => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        store_description: settings.store_description || '',
        store_logo_url: settings.store_logo_url || '',
        tax_rate: settings.tax_rate || 0,
        shipping_type: settings.shipping_type || 'flat',
        shipping_cost: settings.shipping_cost || 0,
        free_shipping_threshold: settings.free_shipping_threshold || 0,
        currency: settings.currency || 'USD',
        store_hours: settings.store_hours || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        facebook_url: settings.facebook_url || '',
        twitter_url: settings.twitter_url || '',
        instagram_url: settings.instagram_url || '',
        return_policy: settings.return_policy || '',
        show_home_ambience_uploader: settings.show_home_ambience_uploader ?? false,
        show_theme_toggle: settings.show_theme_toggle ?? true,
        show_public_reviews: settings.show_public_reviews ?? false,
        show_home_testimonials: settings.show_home_testimonials ?? true,
        scroll_thumb_brightness: settings.scroll_thumb_brightness ?? 0.6,
        // Feature flags
        enable_loyalty_program: settings.enable_loyalty_program ?? true,
        enable_reservations: settings.enable_reservations ?? true,
        enable_menu_filters: settings.enable_menu_filters ?? true,
        enable_product_customization: settings.enable_product_customization ?? true,
        enable_order_tracking: settings.enable_order_tracking ?? true,
        enable_order_feedback: settings.enable_order_feedback ?? true,
        enable_marketing_optins: settings.enable_marketing_optins ?? true,
        enable_quick_reorder: settings.enable_quick_reorder ?? true
      })
    }
    setError('')
    setSuccess(false)
  }

  if (contextLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-[var(--bg-main)] p-8">
        <div data-animate="fade-scale" data-animate-active="false" className="text-[var(--text-muted)]">Loading settings...</div>
      </div>
    )
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
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)]">Settings</h1>
            <p className="mt-2 text-sm sm:text-base text-muted">
              Configure your store presentation, commerce, and contact details
            </p>
          </div>
        </header>

        {success && (
          <div data-animate="fade-scale" data-animate-active="false" className="mb-6 bg-green-900/20 border border-green-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm sm:text-base font-medium text-green-400">Settings saved successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div data-animate="fade-scale" data-animate-active="false" className="mb-6 bg-red-900/20 border border-red-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm sm:text-base font-medium text-red-400">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10 pointer-events-auto">
          {/* Store Information Section */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Store Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleChange}
                  required
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="Buildfast Shop"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Store Description
                </label>
                <textarea
                  name="store_description"
                  value={formData.store_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="Your one-stop shop for everything you need"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Store Logo URL
                </label>
                <input
                  type="url"
                  name="store_logo_url"
                  value={formData.store_logo_url}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="https://example.com/logo.png"
                />
                <p className="mt-1 text-[10px] sm:text-xs text-[var(--text-muted)]">Enter the URL of your store logo</p>
              </div>
            </div>
          </div>

          {/* Tax & Shipping Section */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Tax & Shipping</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="tax_rate"
                  value={formData.tax_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="8.5"
                />
                <p className="mt-1 text-[10px] sm:text-xs text-[var(--text-muted)]">Enter tax rate as a percentage (e.g., 8.5 for 8.5%)</p>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Shipping Type
                </label>
                <CustomDropdown
                  name="shipping_type"
                  options={[
                    { value: 'flat', label: 'Flat Rate' },
                    { value: 'free_over_amount', label: 'Free Over Amount' },
                    { value: 'free', label: 'Always Free' }
                  ]}
                  value={formData.shipping_type}
                  onChange={handleChange}
                  placeholder="Select shipping type"
                  maxVisibleItems={5}
                />
              </div>

              {formData.shipping_type !== 'free' && (
                <div>
                  <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                    Shipping Cost ($)
                  </label>
                  <input
                    type="number"
                    name="shipping_cost"
                    value={formData.shipping_cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                    placeholder="5.00"
                  />
                </div>
              )}

              {formData.shipping_type === 'free_over_amount' && (
                <div>
                  <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                    Free Shipping Threshold ($)
                  </label>
                  <input
                    type="number"
                    name="free_shipping_threshold"
                    value={formData.free_shipping_threshold}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                    placeholder="50.00"
                  />
                  <p className="mt-1 text-[10px] sm:text-xs text-[var(--text-muted)]">Orders over this amount get free shipping</p>
                </div>
              )}
            </div>
          </div>

          {/* Currency Section */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Currency</h2>

            <div>
              <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                Currency
              </label>
              <CustomDropdown
                name="currency"
                options={[
                  { value: 'USD', label: 'USD ($) - US Dollar' },
                  { value: 'EUR', label: 'EUR (€) - Euro' },
                  { value: 'GBP', label: 'GBP (£) - British Pound' },
                  { value: 'CAD', label: 'CAD (C$) - Canadian Dollar' },
                  { value: 'AUD', label: 'AUD (A$) - Australian Dollar' }
                ]}
                value={formData.currency}
                onChange={handleChange}
                placeholder="Select currency"
                maxVisibleItems={5}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Contact Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Store Hours
                </label>
                <textarea
                  name="store_hours"
                  value={formData.store_hours}
                  onChange={handleChange}
                  rows={3}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="support@buildfastshop.com"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Social Media Links</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  name="facebook_url"
                  value={formData.facebook_url}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="https://facebook.com/yourstore"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Twitter URL
                </label>
                <input
                  type="url"
                  name="twitter_url"
                  value={formData.twitter_url}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="https://twitter.com/yourstore"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="https://instagram.com/yourstore"
                />
              </div>
            </div>
          </div>

          {/* Home Page Controls Link */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-xl sm:rounded-2xl border border-[var(--accent)]/30 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-main)] mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home Page Controls
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Control visibility and behavior of home page elements, reviews, testimonials, and theme settings
                </p>
              </div>
              <Link
                to="/admin/home-page-controls"
                className="btn-primary inline-flex items-center gap-2 rounded-xl"
              >
                Open Home Page Controls
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Admin Management Link */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-xl sm:rounded-2xl border border-[var(--accent)]/30 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-main)] mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Manage Administrators
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Add or remove administrator privileges by email address
                </p>
              </div>
              <Link
                to="/admin/manage-admins"
                className="btn-primary inline-flex items-center gap-2 rounded-xl"
              >
                Manage Admins
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Feature Flags Link */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-xl sm:rounded-2xl border border-[var(--accent)]/30 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-main)] mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Feature Flags
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Control which features are visible to customers across your store
                </p>
              </div>
              <Link
                to="/admin/feature-flags"
                className="btn-primary inline-flex items-center gap-2 rounded-xl"
              >
                Open Feature Flags
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>


          {/* Policies Section */}
          <div className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Return Policy</h2>

            <div>
              <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
                Return Policy Text
              </label>
              <textarea
                name="return_policy"
                value={formData.return_policy}
                onChange={handleChange}
                rows={5}
                className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                placeholder="We accept returns within 30 days of purchase..."
              />
              <p className="mt-1 text-[10px] sm:text-xs text-[var(--text-muted)]">This will be displayed to customers</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 sm:gap-4 md:gap-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--accent)] text-black min-h-[44px] px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl font-medium hover:bg-[#B08D4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={confirmReset}
              disabled={saving}
              className="bg-theme-elevated text-[var(--text-main)] min-h-[44px] px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              style={{
                backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isLightTheme 
                    ? 'rgba(0, 0, 0, 0.08)' 
                    : 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : '';
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset Settings"
        message="Are you sure you want to reset to current saved settings?\n\nAll unsaved changes will be lost."
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
      />
    </m.main>
  )
}

export default AdminSettings
