import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import UpdateTimestamp from '../../components/UpdateTimestamp'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { applyThemeAdjustmentsDebounced, cancelDebouncedThemeAdjustments } from '../../utils/themeColorUtils'
import { logger } from '../../utils/logger'

/**
 * Admin Settings Page
 *
 * Tabbed settings page with:
 * - Store Settings (store name, logo, tax, shipping, etc.)
 * - Reservation Settings (reservation system configuration)
 */
const createToggleStatus = () => ({
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

  const [formData, setFormData] = useState({
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
    // Theme Adjustments
    theme_contrast: 1.0,
    theme_exposure: 0.0,
    theme_brilliance: 0.0,
    theme_highlights: 0.0,
    theme_shadows: 0.0,
    theme_brightness: 1.0,
    theme_black_point: 0.0,
    theme_saturation: 1.0,
    theme_vibrance: 0.0,
    theme_warmth: 0.0,
    theme_tint: 0.0,
    theme_sharpness: 0.0,
    theme_definition: 0.0,
    theme_vignette: 0.0
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [toggleStatus, setToggleStatus] = useState(createToggleStatus)
  // eslint-disable-next-line no-unused-vars
  const [featureFlagStatus, setFeatureFlagStatus] = useState({
    enable_loyalty_program: { saving: false, message: '', type: 'idle' },
    enable_reservations: { saving: false, message: '', type: 'idle' },
    enable_menu_filters: { saving: false, message: '', type: 'idle' },
    enable_product_customization: { saving: false, message: '', type: 'idle' },
    enable_order_tracking: { saving: false, message: '', type: 'idle' },
    enable_order_feedback: { saving: false, message: '', type: 'idle' },
    enable_marketing_optins: { saving: false, message: '', type: 'idle' },
    enable_quick_reorder: { saving: false, message: '', type: 'idle' }
  })
  // eslint-disable-next-line no-unused-vars
  const themeAdjustmentTimeoutRef = useRef(null)
  const isInitialLoadRef = useRef(true)
  const [themeAdjustmentSaving, setThemeAdjustmentSaving] = useState(false)

  // Load settings into form when they're available
  useEffect(() => {
    if (settings) {
      // Reset initial load flag after first settings load
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
      
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
        // Theme Adjustments with defaults
        theme_contrast: settings.theme_contrast ?? 1.0,
        theme_exposure: settings.theme_exposure ?? 0.0,
        theme_brilliance: settings.theme_brilliance ?? 0.0,
        theme_highlights: settings.theme_highlights ?? 0.0,
        theme_shadows: settings.theme_shadows ?? 0.0,
        theme_brightness: settings.theme_brightness ?? 1.0,
        theme_black_point: settings.theme_black_point ?? 0.0,
        theme_saturation: settings.theme_saturation ?? 1.0,
        theme_vibrance: settings.theme_vibrance ?? 0.0,
        theme_warmth: settings.theme_warmth ?? 0.0,
        theme_tint: settings.theme_tint ?? 0.0,
        theme_sharpness: settings.theme_sharpness ?? 0.0,
        theme_definition: settings.theme_definition ?? 0.0,
        theme_vignette: settings.theme_vignette ?? 0.0
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
  useEffect(() => {
    // Skip on initial load to prevent unnecessary updates
    if (isInitialLoadRef.current) {
      return
    }

    // Use debounced utility function for smooth 60fps updates
    applyThemeAdjustmentsDebounced(formData, 16)
    
    // Cleanup: cancel pending debounced updates on unmount
    return () => {
      cancelDebouncedThemeAdjustments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.theme_contrast,
    formData.theme_exposure,
    formData.theme_brilliance,
    formData.theme_highlights,
    formData.theme_shadows,
    formData.theme_brightness,
    formData.theme_black_point,
    formData.theme_saturation,
    formData.theme_vibrance,
    formData.theme_warmth,
    formData.theme_tint,
    formData.theme_sharpness,
    formData.theme_definition,
    formData.theme_vignette
  ])

  const handleChange = (e) => {
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

  // Check if theme adjustments have unsaved changes
  const hasUnsavedThemeChanges = () => {
    if (!settings) return false

    const themeFields = [
      'theme_contrast',
      'theme_exposure',
      'theme_brilliance',
      'theme_highlights',
      'theme_shadows',
      'theme_brightness',
      'theme_black_point',
      'theme_saturation',
      'theme_vibrance',
      'theme_warmth',
      'theme_tint',
      'theme_sharpness',
      'theme_definition',
      'theme_vignette'
    ]

    return themeFields.some(field => {
      const currentValue = formData[field]
      const savedValue = settings[field]
      // Compare with tolerance for floating point differences
      return Math.abs((currentValue ?? 0) - (savedValue ?? 0)) > 0.001
    })
  }

  // Handle manual save of theme adjustments
  const handleSaveThemeAdjustments = async () => {
    if (!settings) return

    // Define theme adjustment fields
    const themeFields = [
      'theme_contrast',
      'theme_exposure',
      'theme_brilliance',
      'theme_highlights',
      'theme_shadows',
      'theme_brightness',
      'theme_black_point',
      'theme_saturation',
      'theme_vibrance',
      'theme_warmth',
      'theme_tint',
      'theme_sharpness',
      'theme_definition',
      'theme_vignette'
    ]

    // Collect only changed theme fields
    const themeUpdates = {}
    themeFields.forEach(field => {
      const currentValue = formData[field]
      const savedValue = settings[field]
      // Only include fields that have actually changed
      if (Math.abs((currentValue ?? 0) - (savedValue ?? 0)) > 0.001) {
        themeUpdates[field] = currentValue
      }
    })

    // Only save if there are actual changes
    if (Object.keys(themeUpdates).length === 0) {
      return
    }

    setThemeAdjustmentSaving(true)
    try {
      const result = await updateSettings(themeUpdates)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        logger.log('Theme adjustments saved successfully')
      } else {
        setError(result.error || 'Failed to save theme adjustments')
        logger.error('Failed to save theme adjustments:', result.error)
      }
    } catch (error) {
      setError('Error saving theme adjustments')
      logger.error('Error saving theme adjustments:', error)
    } finally {
      setThemeAdjustmentSaving(false)
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

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to current saved settings?')) {
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
  }

  if (contextLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-[var(--bg-main)] p-8">
        <div data-animate="fade-scale" data-animate-active="false" className="text-[var(--text-muted)]">Loading settings...</div>
      </div>
    )
  }

  return (
    <motion.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <UpdateTimestamp />
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <select
                  name="shipping_type"
                  value={formData.shipping_type}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent text-sm sm:text-base"
                >
                  <option value="flat">Flat Rate</option>
                  <option value="free_over_amount">Free Over Amount</option>
                  <option value="free">Always Free</option>
                </select>
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
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent text-sm sm:text-base"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD (C$) - Canadian Dollar</option>
                <option value="AUD">AUD (A$) - Australian Dollar</option>
              </select>
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Open Home Page Controls
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Appearance Settings Link */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-xl sm:rounded-2xl border border-[var(--accent)]/30 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-main)] mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Theme & Appearance Settings
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Customize page backgrounds, colors, and visual appearance for light and dark themes
                </p>
              </div>
              <Link
                to="/admin/appearance"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Open Appearance
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Open Feature Flags
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Theme Adjustments Section */}
          <div data-animate="fade-scale" data-animate-active="false" className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">
                Theme Adjustments
              </h2>
              <div className="flex items-center gap-3">
                {hasUnsavedThemeChanges() && !themeAdjustmentSaving && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
                {themeAdjustmentSaving && (
                  <span className="text-xs text-[var(--accent)] flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
                    Saving...
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">Fine-tune the visual appearance of your theme with professional image adjustments</p>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contrast */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Contrast: {formData.theme_contrast.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_contrast"
                  value={formData.theme_contrast}
                  onChange={handleChange}
                  min="0"
                  max="2"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>0</span>
                  <span>1.0</span>
                  <span>2.0</span>
                </div>
              </div>

              {/* Exposure */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Exposure: {formData.theme_exposure > 0 ? '+' : ''}{formData.theme_exposure.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_exposure"
                  value={formData.theme_exposure}
                  onChange={handleChange}
                  min="-2"
                  max="2"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>-2.0</span>
                  <span>0</span>
                  <span>+2.0</span>
                </div>
              </div>

              {/* Brilliance */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Brilliance: {formData.theme_brilliance > 0 ? '+' : ''}{formData.theme_brilliance.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_brilliance"
                  value={formData.theme_brilliance}
                  onChange={handleChange}
                  min="-1"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>-1.0</span>
                  <span>0</span>
                  <span>+1.0</span>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Highlights: {formData.theme_highlights > 0 ? '+' : ''}{formData.theme_highlights.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_highlights"
                  value={formData.theme_highlights}
                  onChange={handleChange}
                  min="-1"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>-1.0</span>
                  <span>0</span>
                  <span>+1.0</span>
                </div>
              </div>

              {/* Shadows */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Shadows: {formData.theme_shadows > 0 ? '+' : ''}{formData.theme_shadows.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_shadows"
                  value={formData.theme_shadows}
                  onChange={handleChange}
                  min="-1"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>-1.0</span>
                  <span>0</span>
                  <span>+1.0</span>
                </div>
              </div>

              {/* Brightness */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Brightness: {formData.theme_brightness.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_brightness"
                  value={formData.theme_brightness}
                  onChange={handleChange}
                  min="0"
                  max="2"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>0</span>
                  <span>1.0</span>
                  <span>2.0</span>
                </div>
              </div>

              {/* Black Point */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Black Point: {formData.theme_black_point > 0 ? '+' : ''}{formData.theme_black_point.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_black_point"
                  value={formData.theme_black_point}
                  onChange={handleChange}
                  min="-1"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>-1.0</span>
                  <span>0</span>
                  <span>+1.0</span>
                </div>
              </div>

              {/* Saturation */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Saturation: {formData.theme_saturation.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_saturation"
                  value={formData.theme_saturation}
                  onChange={handleChange}
                  min="0"
                  max="2"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>0</span>
                  <span>1.0</span>
                  <span>2.0</span>
                </div>
              </div>

              {/* Vibrance */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Vibrance: {formData.theme_vibrance > 0 ? '+' : ''}{formData.theme_vibrance.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_vibrance"
                  value={formData.theme_vibrance}
                  onChange={handleChange}
                  min="-1"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>-1.0</span>
                  <span>0</span>
                  <span>+1.0</span>
                </div>
              </div>

              {/* Warmth */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Warmth: {formData.theme_warmth > 0 ? '+' : ''}{formData.theme_warmth.toFixed(0)}
                </label>
                <input
                  type="range"
                  name="theme_warmth"
                  value={formData.theme_warmth}
                  onChange={handleChange}
                  min="-100"
                  max="100"
                  step="1"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>Cool (-100)</span>
                  <span>0</span>
                  <span>Warm (+100)</span>
                </div>
              </div>

              {/* Tint */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Tint: {formData.theme_tint > 0 ? '+' : ''}{formData.theme_tint.toFixed(0)}
                </label>
                <input
                  type="range"
                  name="theme_tint"
                  value={formData.theme_tint}
                  onChange={handleChange}
                  min="-100"
                  max="100"
                  step="1"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>Green (-100)</span>
                  <span>0</span>
                  <span>Magenta (+100)</span>
                </div>
              </div>

              {/* Sharpness */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Sharpness: {formData.theme_sharpness.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_sharpness"
                  value={formData.theme_sharpness}
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>

              {/* Definition */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Definition: {formData.theme_definition > 0 ? '+' : ''}{formData.theme_definition.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_definition"
                  value={formData.theme_definition}
                  onChange={handleChange}
                  min="-1"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>-1.0</span>
                  <span>0</span>
                  <span>+1.0</span>
                </div>
              </div>

              {/* Vignette */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Vignette: {formData.theme_vignette.toFixed(2)}
                </label>
                <input
                  type="range"
                  name="theme_vignette"
                  value={formData.theme_vignette}
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    theme_contrast: 1.0,
                    theme_exposure: 0.0,
                    theme_brilliance: 0.0,
                    theme_highlights: 0.0,
                    theme_shadows: 0.0,
                    theme_brightness: 1.0,
                    theme_black_point: 0.0,
                    theme_saturation: 1.0,
                    theme_vibrance: 0.0,
                    theme_warmth: 0.0,
                    theme_tint: 0.0,
                    theme_sharpness: 0.0,
                    theme_definition: 0.0,
                    theme_vignette: 0.0,
                  }))
                }}
                className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg transition min-h-[44px]"
                style={{
                  backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isLightTheme 
                    ? 'rgba(0, 0, 0, 0.08)' 
                    : 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isLightTheme 
                    ? 'rgba(0, 0, 0, 0.04)' 
                    : '';
                }}
              >
                Reset to Defaults
              </button>
              
              <button
                type="button"
                onClick={handleSaveThemeAdjustments}
                disabled={themeAdjustmentSaving || !hasUnsavedThemeChanges()}
                className="px-6 py-2 text-sm font-semibold text-white bg-[var(--accent)] rounded-lg hover:bg-[#B08D4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center gap-2"
              >
                {themeAdjustmentSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Theme Adjustments
                  </>
                )}
              </button>
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
              onClick={handleReset}
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
    </motion.main>
  )
}

export default AdminSettings
