import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { Elements } from '@stripe/react-stripe-js'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
// Removed unused imports: formatPrice, getCurrencySymbol (now using formatCurrency from utils)
import { stripePromise } from '../lib/stripe'
import StripeCheckoutForm from '../components/StripeCheckoutForm'
import PaymentSuccessModal from '../components/PaymentSuccessModal'
import { validateDiscountCode } from '../lib/discountUtils'
import GuestAccountConversionModal from '../components/GuestAccountConversionModal'
import { pageFade, fadeSlideUp } from '../components/animations/menuAnimations'
import OrderTimeline from '../components/OrderTimeline'
import { logger } from '../utils/logger'
import { useTheme } from '../shared/hooks'
// New hooks
import { useCartItems } from '../features/cart/hooks'
import { useAddresses } from '../features/addresses/hooks'
import { supabase } from '../lib/supabase'
import CustomDropdown from '../components/ui/CustomDropdown'

// Extracted constants, types, hooks, and components
import { CURRENCY_SYMBOL, SCHEDULED_SLOTS } from './Checkout/constants'
// Note: CURRENCY_CODE, SHIPPING_THRESHOLD, SHIPPING_FEE, DEFAULT_TAX_RATE are used in hooks/utils
// Types imported from Checkout/types (used for type annotations in JS)
// Note: This is a JS file, so we can't use 'import type' - types are inferred from usage
import { useCheckoutCalculations, useCheckoutOrder, useCheckoutRealtime } from './Checkout/hooks'
import {
  CheckoutHeader,
  OrderError,
  GuestChoiceSection,
  OrderItemsList,
  GuestEmailSection,
  // TODO: Replace inline JSX with these components in next phase
  // FulfillmentSection,
  // OrderSummarySidebar,
  // SavedAddressDisplay,
  // ShippingAddressForm,
  // PaymentSection,
} from './Checkout/components'
import { formatCurrency } from './Checkout/utils/formatting'
// Removed unused import: getProductImage (now in OrderItemsList component)

/**
 * Checkout Page
 *
 * Displays user's shopping cart items for order review.
 * Shows order summary with totals and next steps message.
 */
const Checkout = memo(function Checkout() {
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()
  const navigate = useNavigate()

  // Feature flags - default to false during loading
  const enableOrderTracking = settingsLoading ? false : (settings?.enable_order_tracking ?? true)
  const enableMarketingOptins = settingsLoading
    ? false
    : (settings?.enable_marketing_optins ?? true)
  const enableLoyaltyProgram = settingsLoading ? false : (settings?.enable_loyalty_program ?? true)

  // Theme detection
  const isLightTheme = useTheme()

  // Data fetching using new hooks with refetch capability for real-time updates
  const {
    cartItems: rawCartItems,
    loading: loadingCart,
    refetch: refetchCart,
  } = useCartItems({ user, enabled: true })
  const {
    addresses: savedAddresses,
    loading: loadingAddresses,
    refetch: refetchAddresses,
  } = useAddresses({ user, enabled: !!user })

  // Normalize cart items to match expected structure
  // IMPORTANT: Preserve ALL product data sources (database, embedded, already-resolved)
  // This ensures checkout works even when products can't be fetched from database
  const cartItems = useMemo(() => {
    return (rawCartItems || []).map((item: {
      resolvedProduct?: unknown
      menu_items?: unknown
      dishes?: unknown
      products?: unknown
      product?: unknown
      [key: string]: unknown
    }) => {
      // Priority order for product resolution:
      // 1. Already resolved product from hook (getGuestCartItems sets this)
      // 2. Database relations (menu_items, dishes, products)
      // 3. Embedded product data (guest cart often has this)
      const alreadyResolved = item.resolvedProduct || null
      const resolvedFromDB = item.menu_items || item.dishes || item.products || null
      const embeddedProduct = item.product || null

      // Use already-resolved first, then database, then embedded
      const resolvedProduct = alreadyResolved || resolvedFromDB || embeddedProduct

      // Determine product type (preserve if already set)
      const resolvedProductType =
        item.resolvedProductType ||
        (item.menu_items
          ? 'menu_item'
          : item.dishes
            ? 'dish'
            : item.products
              ? 'legacy'
              : embeddedProduct
                ? embeddedProduct.isMenuItem
                  ? 'menu_item'
                  : 'legacy'
                : null)

      return {
        ...item,
        // Preserve all product data sources
        resolvedProduct,
        resolvedProductType,
        // Also preserve embedded product for fallback in cartItemsWithProducts
        product: embeddedProduct || item.product || null,
      }
    })
    // Don't filter - let checkout handle items without products
  }, [rawCartItems])

  // Guest checkout state
  const [guestEmail, setGuestEmail] = useState('')
  const [continueAsGuest, setContinueAsGuest] = useState(false) // Track if guest chose to continue
  const [fulfillmentMode, setFulfillmentMode] = useState<'delivery' | 'pickup'>('delivery')
  const [scheduledSlot, setScheduledSlot] = useState('asap')

  // Saved addresses state (for authenticated users)
  const [selectedSavedAddress, setSelectedSavedAddress] = useState(null)
  const [useManualAddress, setUseManualAddress] = useState(false)

  // Shipping address form state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    streetAddress: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
  })

  // Order submission and payment state managed by hook
  const [showOrderNote, setShowOrderNote] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [showRewardsPanel, setShowRewardsPanel] = useState(false)

  // Use hook's state for conversion modal and guest checkout data (aliased from hook)
  // Note: These are already destructured from hook above, using aliases to avoid conflicts
  const trackingRef = useRef<HTMLElement | null>(null)
  const scrollToTracking = () => {
    if (trackingRef.current) {
      trackingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  const [emailUpdatesOptIn, setEmailUpdatesOptIn] = useState(true)
  const [smsUpdatesOptIn, setSmsUpdatesOptIn] = useState(true)

  // Discount code state
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountError, setDiscountError] = useState('')
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  // Refs for cleanup (managed by hook internally)

  // Handle selecting a saved address
  const handleSelectSavedAddress = useCallback((address: {
    fullName?: string
    addressLine1?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    phone?: string
    [key: string]: unknown
  }) => {
    if (!address) return

    setSelectedSavedAddress(address)
    setUseManualAddress(false)

    // Pre-fill shipping address form with safe defaults
    setShippingAddress({
      fullName: address.fullName || '',
      streetAddress: address.addressLine1 || '',
      city: address.city || '',
      stateProvince: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
      phoneNumber: address.phone || '',
    })
  }, [])

  // Auto-select default address when addresses are loaded
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedSavedAddress) {
      const defaultAddress = savedAddresses.find((addr: any) => addr.isDefault)
      if (defaultAddress) {
        handleSelectSavedAddress(defaultAddress)
      }
    }
  }, [savedAddresses, selectedSavedAddress, handleSelectSavedAddress])

  // Calculate totals with useMemo for performance
  // CRITICAL: Include ALL cart items, not just those with resolved products
  // This ensures checkout works even when products can't be fetched from database
  // We'll use fallback data (price from cart item, name from ID, etc.) if product data is missing
  // IMPORTANT: Define this BEFORE any useEffect that uses it
  const cartItemsWithProducts = useMemo(() => {
    // Return ALL cart items - don't filter out items without resolved products
    // This ensures items are displayed even if database lookup fails
    return cartItems.map((item: any) => {
      // If product isn't resolved, create fallback product data from cart item
      if (!item.resolvedProduct && !item.product) {
        // Create minimal product data from cart item itself
        // This allows checkout to proceed even without database product data
        return {
          ...item,
          // Use fallback product data
          resolvedProduct: {
            id: item.menu_item_id || item.product_id || item.id,
            name: item.name || `Item ${item.menu_item_id || item.product_id || item.id}`,
            price: item.price || item.price_at_purchase || 0,
            image_url: item.image_url || item.image || null,
            description: item.description || null,
            is_available: item.is_available !== false, // Default to available
            stock: item.stock || null,
          },
          resolvedProductType: item.menu_item_id
            ? 'menu_item'
            : item.product_id
              ? 'dish'
              : 'legacy',
        }
      }
      return item
    })
  }, [cartItems])

  // Reset order success state when cart has items (allows new checkout after successful order)
  // Note: This logic is now handled by the hook - removed duplicate reset logic

  // 3. Real-time subscription for store settings (already in StoreSettingsContext)
  // The context already handles this, so we don't need to add it here
  // Store settings changes will automatically update the checkout UI via context

  // REMOVED: Auto-redirect when cart is empty
  // This was causing navigation issues - let users navigate manually via the "Back to Menu" button
  // Only prevent redirects if modal/payment is active
  // Redirect prevention logic is now handled by the hook - removed duplicate logic

  // Stripe redirect handling is now managed by the hook - removed duplicate logic

  const handleFulfillmentChange = (mode: 'delivery' | 'pickup') => {
    setFulfillmentMode(mode)
    setScheduledSlot('asap')
  }

  // Handle switching to manual address entry
  const handleUseManualAddress = () => {
    setSelectedSavedAddress(null)
    setUseManualAddress(true)

    // Clear the form
    setShippingAddress({
      fullName: '',
      streetAddress: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: '',
      phoneNumber: '',
    })
  }

  // Cleanup timeouts are now managed by the hook - removed duplicate cleanup logic

  // Loading state
  const loading = loadingCart || loadingAddresses

  // Use extracted calculations hook (using cartItemsWithProducts for accurate totals)
  const { totalItemsCount, subtotal, shipping, tax, taxRatePercent, grandTotal, loyalty } =
    useCheckoutCalculations({
      cartItems: cartItemsWithProducts,
      discountAmount,
    })

  // Handle shipping address form input changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShippingAddress(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle discount code application
  const handleApplyDiscountCode = async () => {
    if (!discountCodeInput.trim()) {
      setDiscountError('Please enter a discount code')
      return
    }

    if (!user?.id) {
      setDiscountError('You must be logged in to use discount codes')
      return
    }

    try {
      setValidatingDiscount(true)
      setDiscountError('')

      // Calculate order total before discount (subtotal + shipping + tax)
      const orderTotalBeforeDiscount = subtotal + shipping + tax

      const result = await validateDiscountCode(
        discountCodeInput.trim(),
        user.id,
        orderTotalBeforeDiscount
      )

      if (result.valid) {
        setAppliedDiscountCode(result.discount || null)
        setDiscountAmount(result.discountAmount || 0)
        setDiscountCodeInput('') // Clear input after successful application
      } else {
        setDiscountError(result.message || 'Invalid discount code')
        setAppliedDiscountCode(null)
        setDiscountAmount(0)
      }
    } catch (err) {
      logger.error('Error validating discount code:', err)
      setDiscountError('Failed to validate discount code. Please try again.')
      setAppliedDiscountCode(null)
      setDiscountAmount(0)
    } finally {
      setValidatingDiscount(false)
    }
  }

  // Handle discount code removal
  const handleRemoveDiscountCode = () => {
    setAppliedDiscountCode(null)
    setDiscountAmount(0)
    setDiscountCodeInput('')
    setDiscountError('')
  }

  // Validate shipping address form
  const isAddressValid = useCallback(() => {
    // For saved addresses, phone is optional if not provided (legacy addresses)
    // For manual addresses, phone is required
    const requirePhone = useManualAddress || !selectedSavedAddress

    const baseValidation =
      shippingAddress.fullName?.trim() &&
      shippingAddress.fullName.trim().length >= 2 &&
      shippingAddress.streetAddress?.trim() &&
      shippingAddress.streetAddress.trim().length >= 5 &&
      shippingAddress.city?.trim() &&
      shippingAddress.city.trim().length >= 2 &&
      shippingAddress.stateProvince?.trim() &&
      shippingAddress.stateProvince.trim().length >= 2 &&
      shippingAddress.postalCode?.trim() &&
      shippingAddress.postalCode.trim().length >= 3 &&
      shippingAddress.country?.trim()

    // Phone is required for manual addresses, optional for saved addresses
    if (requirePhone) {
      const phone = shippingAddress.phoneNumber?.trim()
      if (!phone) return false
      // Validate phone format: 8-20 digits, allows spaces, dashes, parentheses, plus
      const phoneRegex = /^[\d\s\-+()]{8,20}$/
      if (!phoneRegex.test(phone)) return false
    } else if (shippingAddress.phoneNumber?.trim()) {
      // If phone is provided (even if optional), validate format
      const phoneRegex = /^[\d\s\-+()]{8,20}$/
      if (!phoneRegex.test(shippingAddress.phoneNumber.trim())) return false
    }

    return !!baseValidation
  }, [shippingAddress, useManualAddress, selectedSavedAddress])

  // Get missing address fields for error display
  const getMissingAddressFields = useCallback((): { missing: string[]; errors: string[] } => {
    const missing = []
    const errors = []

    if (!shippingAddress.fullName?.trim()) {
      missing.push('Full Name')
    } else if (shippingAddress.fullName.trim().length < 2) {
      errors.push('Full Name must be at least 2 characters')
    }

    if (!shippingAddress.streetAddress?.trim()) {
      missing.push('Street Address')
    } else if (shippingAddress.streetAddress.trim().length < 5) {
      errors.push('Street Address must be at least 5 characters')
    }

    if (!shippingAddress.city?.trim()) {
      missing.push('City')
    } else if (shippingAddress.city.trim().length < 2) {
      errors.push('City must be at least 2 characters')
    }

    if (!shippingAddress.stateProvince?.trim()) {
      missing.push('State/Province')
    } else if (shippingAddress.stateProvince.trim().length < 2) {
      errors.push('State/Province must be at least 2 characters')
    }

    if (!shippingAddress.postalCode?.trim()) {
      missing.push('Postal Code')
    } else if (shippingAddress.postalCode.trim().length < 3) {
      errors.push('Postal Code must be at least 3 characters')
    }

    if (!shippingAddress.country?.trim()) {
      missing.push('Country')
    }

    // Phone validation
    const requirePhone = useManualAddress || !selectedSavedAddress
    if (requirePhone && !shippingAddress.phoneNumber?.trim()) {
      missing.push('Phone Number')
    } else if (shippingAddress.phoneNumber?.trim()) {
      const phoneRegex = /^[\d\s\-+()]{8,20}$/
      if (!phoneRegex.test(shippingAddress.phoneNumber.trim())) {
        errors.push('Phone Number must be 8-20 digits (spaces, dashes, parentheses allowed)')
      }
    }

    return { missing, errors }
  }, [shippingAddress, useManualAddress, selectedSavedAddress])

  // Use extracted order hook for order placement and payment
  // IMPORTANT: This must be called AFTER all variables it depends on are declared
  const {
    placingOrder,
    orderSuccess,
    orderError,
    showPayment,
    clientSecret,
    createdOrderId,
    showSuccessModal,
    showConversionModal: hookShowConversionModal,
    guestCheckoutData: hookGuestCheckoutData,
    trackingStatus,
    handlePlaceOrder,
    handlePaymentSuccess,
    handlePaymentError,
    handleModalClose,
    setShowConversionModal: setHookShowConversionModal,
    // Note: setShowSuccessModal and setOrderError are available but not needed in component
    // setShowSuccessModal: setHookShowSuccessModal,
    // setOrderError: setHookOrderError,
  } = useCheckoutOrder({
    user,
    guestEmail,
    cartItems: cartItemsWithProducts,
    shippingAddress,
    fulfillmentMode,
    scheduledSlot,
    orderNote,
    enableMarketingOptins,
    emailUpdatesOptIn,
    smsUpdatesOptIn,
    appliedDiscountCode,
    discountAmount,
    grandTotal,
    subtotal,
    shipping,
    tax,
    isAddressValid,
    getMissingAddressFields,
  })

  // Use extracted real-time subscriptions hook for product updates
  // IMPORTANT: This must be called AFTER useCheckoutOrder to access its state
  useCheckoutRealtime({
    cartItems: cartItemsWithProducts,
    user,
    showPayment,
    showSuccessModal,
    placingOrder,
    refetchCart,
    refetchAddresses,
    onProductUpdate: (payload: any) => {
      logger.log('Product updated in checkout:', payload)
    },
  })

  // 2. Real-time subscription for addresses updates
  // IMPORTANT: This must be called AFTER useCheckoutOrder to access its state
  useEffect(() => {
    if (!user) return undefined
    if (showPayment || showSuccessModal || placingOrder) return undefined // Don't update during payment

    try {
      const addressesChannel = supabase
        .channel('checkout-addresses-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'addresses',
            filter: `user_id=eq.${user.id}`,
          },
          async payload => {
            logger.log('Address updated in real-time:', payload)
            logger.log('Address updated in checkout:', payload)

            // Refetch addresses to get updated data (debounced)
            if (refetchAddresses) {
              setTimeout(() => {
                refetchAddresses()
              }, 500)
            }

            // If current selected address was updated, refresh it
            if (
              selectedSavedAddress &&
              (payload.new as any)?.id === (selectedSavedAddress as any).id
            ) {
              // Update selected address data
              handleSelectSavedAddress(payload.new as any)
            }
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            logger.warn(
              'Real-time subscription error for addresses (table might not exist or real-time not enabled)'
            )
          } else if (status === 'TIMED_OUT') {
            logger.warn('Real-time subscription timed out for addresses - retrying...')
            setTimeout(() => {
              try {
                addressesChannel.subscribe()
              } catch (retryErr) {
                logger.warn('Failed to retry addresses subscription:', retryErr)
              }
            }, 2000)
          }
        })

      return () => {
        try {
          supabase.removeChannel(addressesChannel)
        } catch (err) {
          logger.warn('Error removing addresses channel:', err)
        }
      }
    } catch (err) {
      // Table might not exist or real-time not enabled - skip silently
      const error = err as any
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.warn(
          'addresses table does not exist or real-time not enabled - skipping subscription'
        )
      } else {
        logger.warn('Failed to subscribe to addresses updates:', err)
      }
      return undefined
    }
  }, [
    user,
    showPayment,
    showSuccessModal,
    placingOrder,
    refetchAddresses,
    selectedSavedAddress,
    handleSelectSavedAddress,
  ])

  // Order placement and payment handlers are now provided by useCheckoutOrder hook
  // Removed duplicate handlers - using hook's versions

  if (loading) {
    return (
      <m.main
        className="min-h-screen"
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
          overflowY: 'visible',
        }}
      >
        <div className="app-container py-8 sm:py-12">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-[var(--bg-elevated)] rounded w-64"></div>
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-96"></div>
            </div>

            {/* Form skeleton */}
            <div className="space-y-6 animate-pulse">
              <div className="h-12 bg-[var(--bg-elevated)] rounded-lg"></div>
              <div className="h-12 bg-[var(--bg-elevated)] rounded-lg"></div>
              <div className="h-32 bg-[var(--bg-elevated)] rounded-lg"></div>
            </div>

            {/* Cart summary skeleton */}
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-[var(--bg-elevated)] rounded w-48"></div>
              <div className="h-10 bg-[var(--bg-elevated)] rounded"></div>
              <div className="h-10 bg-[var(--bg-elevated)] rounded"></div>
            </div>
          </div>
        </div>
      </m.main>
    )
  }

  // CRITICAL: Don't show empty cart if:
  // 1. Cart is still loading (items might not be loaded yet)
  // 2. Raw cart items exist (even if products aren't resolved yet)
  // 3. Cart items exist (with or without resolved products)
  // 4. Success modal is showing
  // 5. Payment flow is active
  // 6. Order is being placed
  const hasRawCartItems = rawCartItems && rawCartItems.length > 0
  const hasCartItems = cartItems && cartItems.length > 0
  const hasResolvedProducts = cartItemsWithProducts && cartItemsWithProducts.length > 0
  // Check if we have cart items but products aren't resolved
  // This happens when items exist but menu_items/dishes relations are null
  // NOTE: This should rarely happen now since we create fallback product data
  const hasUnresolvedItems = hasRawCartItems && hasCartItems && !hasResolvedProducts && !loadingCart

  // Only show empty cart if:
  // - Not loading
  // - No raw cart items at all
  // - No cart items at all (with or without products)
  // - Not in any payment/success flow
  const shouldShowEmptyCart =
    !loadingCart &&
    !loadingAddresses &&
    !hasRawCartItems &&
    !hasCartItems &&
    !hasResolvedProducts &&
    !showSuccessModal &&
    !orderSuccess &&
    !hookShowConversionModal &&
    !showPayment &&
    !placingOrder

  // Debug logging for cart state (only in development)
  if (import.meta.env.DEV ?? false) {
    logger.log('Checkout cart state:', {
      loadingCart,
      loadingAddresses,
      rawCartItemsCount: rawCartItems?.length || 0,
      cartItemsCount: cartItems?.length || 0,
      cartItemsWithProductsCount: cartItemsWithProducts?.length || 0,
      hasRawCartItems,
      hasCartItems,
      hasResolvedProducts,
      hasUnresolvedItems,
      shouldShowEmptyCart,
      sampleRawItem: rawCartItems?.[0] || null,
      sampleCartItem: cartItems?.[0] || null,
      sampleCartItemWithProduct: cartItemsWithProducts?.[0] || null,
      user: user?.id || 'guest',
      isAuthenticated: !!user,
    })
  }

  // Log warning if items exist but products aren't resolved (only in development)
  if (hasUnresolvedItems && (import.meta.env.DEV ?? false)) {
    logger.warn('Cart has items but products are not resolved:', {
      rawCartItemsCount: rawCartItems?.length || 0,
      cartItemsCount: cartItems?.length || 0,
      cartItemsWithProductsCount: cartItemsWithProducts?.length || 0,
      sampleItem: rawCartItems?.[0] || null,
    })
  }

  // Show empty cart message ONLY if:
  // - Cart is fully loaded
  // - No raw cart items exist at all
  // - Not in any payment/success flow
  if (shouldShowEmptyCart) {
    return (
      <m.main
        className="min-h-screen flex items-center justify-center"
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
          overflowY: 'visible',
        }}
      >
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">Your cart is empty</h1>
            <p className="text-muted">Add some items to your cart before checking out.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
            <button
              type="button"
              onClick={() => {
                logger.log('Back to Menu clicked - navigating to /order')
                navigate('/order')
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Menu
            </button>
            <button
              type="button"
              onClick={() => {
                logger.log('Home clicked - navigating to /')
                navigate('/')
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </button>
          </div>
        </div>
      </m.main>
    )
  }

  // If we have cart items but products aren't resolved, show error state
  // This happens when products were deleted or foreign keys are broken
  if (hasUnresolvedItems && !loadingCart) {
    return (
      <m.main
        className="min-h-screen flex items-center justify-center"
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
          overflowY: 'visible',
        }}
      >
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">
              Unable to load cart items
            </h1>
            <p className="text-muted">
              Some items in your cart are no longer available. Please refresh or clear your cart.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
            <button
              type="button"
              onClick={() => {
                logger.log('Refreshing page to reload cart')
                window.location.reload()
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Page
            </button>
            <button
              type="button"
              onClick={() => {
                logger.log('Back to Menu clicked - navigating to /order')
                navigate('/order')
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Menu
            </button>
          </div>
        </div>
      </m.main>
    )
  }

  // Render checkout page (even if cart is empty, if modal is showing)
  return (
    <>
      <m.main
        className="min-h-screen"
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
          overflowY: 'visible',
        }}
      >
        {/* Header */}
        <CheckoutHeader />

        <m.section
          className="app-container py-8"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          custom={0.18}
        >
          {/* Error Message */}
          <OrderError error={orderError} />

          {/* Guest Choice: Sign In OR Continue as Guest */}
          {!user && !continueAsGuest && (
            <GuestChoiceSection onContinueAsGuest={() => setContinueAsGuest(true)} />
          )}

          {/* Show checkout form only if user is logged in OR guest chose to continue */}
          {(user || continueAsGuest) && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Order Items */}
              <div className="flex-1">
                <div
                  className="glow-surface glow-strong border border-theme rounded-2xl p-6 mb-6"
                  style={{
                    backgroundColor: isLightTheme
                      ? 'var(--bg-elevated)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-accent">Order Summary</h2>
                    <span className="text-sm text-muted">
                      {cartItemsWithProducts.length}{' '}
                      {cartItemsWithProducts.length === 1 ? 'dish' : 'dishes'}
                    </span>
                  </div>

                  {/* Order Items List */}
                  <OrderItemsList items={cartItemsWithProducts} isLightTheme={isLightTheme} />
                </div>

                {createdOrderId && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={scrollToTracking}
                      className="inline-flex items-center gap-2 rounded-xl border border-theme-strong bg-theme-elevated px-4 py-2.5 text-xs sm:text-sm font-semibold text-accent transition hover:border-theme-medium hover:text-[var(--text-main)] min-h-[44px]"
                    >
                      View live tracking
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Guest Email Section - Only show if not logged in */}
                {!user && (
                  <GuestEmailSection
                    guestEmail={guestEmail}
                    onEmailChange={setGuestEmail}
                    disabled={placingOrder || orderSuccess}
                  />
                )}

                <div className="glow-surface glow-strong bg-theme-elevated border border-theme rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-main)]">Fulfillment</h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">
                      {fulfillmentMode === 'delivery' ? 'Delivery' : 'Pickup'}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleFulfillmentChange('delivery')}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        fulfillmentMode === 'delivery'
                          ? 'border-accent bg-accent/20 text-[var(--text-main)] shadow-lg shadow-accent/20'
                          : 'border-theme bg-theme-elevated text-muted hover:border-accent/30 hover:text-[var(--text-main)]'
                      }`}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFulfillmentChange('pickup')}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        fulfillmentMode === 'pickup'
                          ? 'border-accent bg-accent/20 text-[var(--text-main)] shadow-lg shadow-accent/20'
                          : 'border-theme bg-theme-elevated text-muted hover:border-accent/30 hover:text-[var(--text-main)]'
                      }`}
                    >
                      Pickup
                    </button>
                  </div>
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="scheduledSlot"
                        className="block text-sm font-medium text-[var(--text-main)] mb-2"
                      >
                        {fulfillmentMode === 'delivery' ? 'Delivery window' : 'Pickup window'}
                      </label>
                      <CustomDropdown
                        id="scheduledSlot"
                        name="scheduledSlot"
                        options={SCHEDULED_SLOTS.map(slot => ({
                          value: slot.value,
                          label: slot.label,
                        }))}
                        value={scheduledSlot}
                        onChange={event => setScheduledSlot(String(event.target.value))}
                        placeholder="Select time window"
                        maxVisibleItems={5}
                      />
                    </div>
                    <div className="rounded-xl border border-theme bg-theme-elevated p-4 text-sm text-muted">
                      {fulfillmentMode === 'delivery' ? (
                        <p className="leading-snug">
                          Courier heads out once the kitchen marks your order ready. We’ll text live
                          tracking the moment it’s on the road.
                        </p>
                      ) : (
                        <p className="leading-snug">
                          Collect from the host desk at 61 Orchard Street. We’ll ping you when the
                          order is plated and ready to hand off.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loading Addresses State */}
                {user && loadingAddresses && !selectedSavedAddress && (
                  <div className="glow-surface glow-strong border border-theme rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[var(--accent)] border-t-transparent"></div>
                      <p className="text-sm text-muted">Loading saved addresses...</p>
                    </div>
                  </div>
                )}

                {/* Shipping Address Display - Show default address (auto-filled) */}
                {user && selectedSavedAddress && !useManualAddress && !loadingAddresses && (
                  <div
                    className="border-2 border-accent/30 rounded-xl p-6 mb-6"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-full">
                          <svg
                            className="w-6 h-6 text-[var(--text-main)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-[var(--text-main)]">Shipping To</h2>
                          <p className="text-sm text-muted">
                            Ready to ship to your default address
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(selectedSavedAddress as any)?.isDefault && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-sm">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address Display */}
                    <div className="glow-surface glow-soft bg-theme-elevated border border-theme rounded-xl p-5 mb-4">
                      <div className="space-y-2">
                        <p className="font-bold text-[var(--text-main)] text-lg">
                          {(selectedSavedAddress as any)?.fullName}
                        </p>
                        <p className="text-muted">{(selectedSavedAddress as any)?.addressLine1}</p>
                        {(selectedSavedAddress as any)?.addressLine2 && (
                          <p className="text-muted">
                            {(selectedSavedAddress as any)?.addressLine2}
                          </p>
                        )}
                        <p className="text-muted">
                          {(selectedSavedAddress as any)?.city},{' '}
                          {(selectedSavedAddress as any)?.state}{' '}
                          {(selectedSavedAddress as any)?.postalCode}
                        </p>
                        <p className="text-muted">{(selectedSavedAddress as any)?.country}</p>
                        {(selectedSavedAddress as any)?.phone && (
                          <p className="text-muted text-sm flex items-center gap-1 mt-3">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            {(selectedSavedAddress as any)?.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleUseManualAddress}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-accent border border-theme rounded-lg transition cursor-pointer min-h-[44px]"
                        style={{
                          backgroundColor: isLightTheme
                            ? 'rgba(0, 0, 0, 0.04)'
                            : 'rgba(255, 255, 255, 0.05)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = isLightTheme
                            ? 'var(--bg-hover)'
                            : 'rgba(255, 255, 255, 0.08)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = isLightTheme
                            ? 'rgba(0, 0, 0, 0.04)'
                            : 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Change Address
                      </button>
                      <Link
                        to="/addresses"
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg transition min-h-[44px]"
                        style={{
                          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = isLightTheme
                            ? 'var(--bg-hover)'
                            : 'rgba(255, 255, 255, 0.08)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = isLightTheme
                            ? 'rgba(0, 0, 0, 0.04)'
                            : ''
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Manage Addresses
                      </Link>
                    </div>
                  </div>
                )}

                {/* Continue to Payment Button - Prominent for saved address users */}
                {user &&
                  selectedSavedAddress &&
                  !useManualAddress &&
                  !showPayment &&
                  (() => {
                    const addressValid = isAddressValid()
                    const missingFields = getMissingAddressFields()

                    return (
                      <div className="glow-surface glow-strong bg-theme-elevated border border-theme rounded-xl p-6 mb-6">
                        {!addressValid && missingFields.missing.length > 0 && (
                          <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                            <div className="flex items-start gap-3">
                              <svg
                                className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                  Missing required information: {missingFields.missing.join(', ')}
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                  Your saved address is missing some required fields. Please{' '}
                                  <button
                                    type="button"
                                    onClick={handleUseManualAddress}
                                    className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100"
                                  >
                                    edit the address
                                  </button>{' '}
                                  or add the missing information.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={handlePlaceOrder}
                          disabled={placingOrder || orderSuccess || !addressValid}
                          className="w-full bg-gradient-to-r from-accent to-accent/80 text-black py-4 rounded-lg font-bold text-lg hover:from-accent/90 hover:to-accent/70 focus:outline-none focus:ring-4 focus:ring-accent/30 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                          {placingOrder ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                              Processing Order...
                            </>
                          ) : orderSuccess ? (
                            <>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Order Created!
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                              </svg>
                              Continue to Payment
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                        <p className="text-center text-sm text-muted mt-3 flex items-center justify-center gap-1">
                          <svg
                            className="w-4 h-4 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          Secure payment powered by Stripe
                        </p>
                      </div>
                    )
                  })()}

                {/* Shipping Address Form */}
                {(useManualAddress || !user || savedAddresses.length === 0) && (
                  <div
                    className="glow-surface glow-strong border border-theme rounded-xl p-6"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-accent flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <h2 className="text-xl font-bold text-[var(--text-main)]">
                          Shipping Address
                        </h2>
                      </div>
                      {user && savedAddresses.length === 0 && (
                        <Link
                          to="/addresses"
                          className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition min-h-[44px]"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Save Address for Later
                        </Link>
                      )}
                    </div>

                    <form
                      onSubmit={handlePlaceOrder}
                      className="space-y-4 relative z-10 pointer-events-auto"
                    >
                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-[var(--text-main)] mb-1"
                        >
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={shippingAddress.fullName}
                          onChange={handleAddressChange}
                          placeholder="John Doe"
                          required
                          disabled={placingOrder || orderSuccess}
                          className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        />
                      </div>

                      {/* Street Address */}
                      <div>
                        <label
                          htmlFor="streetAddress"
                          className="block text-sm font-medium text-[var(--text-main)] mb-1"
                        >
                          Street Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          name="streetAddress"
                          value={shippingAddress.streetAddress}
                          onChange={handleAddressChange}
                          placeholder="123 Main Street"
                          required
                          disabled={placingOrder || orderSuccess}
                          className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        />
                      </div>

                      {/* City and State/Province */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="city"
                            className="block text-sm font-medium text-[var(--text-main)] mb-1"
                          >
                            City <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={shippingAddress.city}
                            onChange={handleAddressChange}
                            placeholder="New York"
                            required
                            disabled={placingOrder || orderSuccess}
                            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="stateProvince"
                            className="block text-sm font-medium text-[var(--text-main)] mb-1"
                          >
                            State/Province <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="stateProvince"
                            name="stateProvince"
                            value={shippingAddress.stateProvince}
                            onChange={handleAddressChange}
                            placeholder="NY"
                            required
                            disabled={placingOrder || orderSuccess}
                            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                          />
                        </div>
                      </div>

                      {/* Postal Code and Country */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="postalCode"
                            className="block text-sm font-medium text-[var(--text-main)] mb-1"
                          >
                            Postal/ZIP Code <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={shippingAddress.postalCode}
                            onChange={handleAddressChange}
                            placeholder="10001"
                            required
                            disabled={placingOrder || orderSuccess}
                            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="country"
                            className="block text-sm font-medium text-[var(--text-main)] mb-1"
                          >
                            Country <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="country"
                            name="country"
                            value={shippingAddress.country}
                            onChange={handleAddressChange}
                            placeholder="United States"
                            required
                            disabled={placingOrder || orderSuccess}
                            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label
                          htmlFor="phoneNumber"
                          className="block text-sm font-medium text-[var(--text-main)] mb-1"
                        >
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={shippingAddress.phoneNumber}
                          onChange={handleAddressChange}
                          placeholder="+1 (555) 123-4567"
                          required
                          disabled={placingOrder || orderSuccess}
                          className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        />
                      </div>

                      <div className="pt-4 border-t border-theme">
                        <button
                          type="button"
                          onClick={() => setShowOrderNote(prev => !prev)}
                          className="flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          {showOrderNote ? 'Remove order note' : 'Add order note for the kitchen'}
                        </button>
                        {showOrderNote && (
                          <textarea
                            value={orderNote}
                            onChange={event => setOrderNote(event.target.value.slice(0, 240))}
                            maxLength={240}
                            rows={3}
                            placeholder="Add dietary tweaks, arrival notes, or plate instructions (max 240 characters)."
                            disabled={placingOrder || orderSuccess}
                            className="mt-3 w-full rounded-lg border border-theme bg-theme-elevated px-4 py-3 text-sm text-[var(--text-main)] placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        )}
                      </div>

                      {enableMarketingOptins && (
                        <div className="space-y-3 rounded-2xl border border-theme bg-theme-elevated px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-main)]/60">
                            Stay in the loop
                          </p>
                          <label className="flex items-start gap-3 text-sm text-[var(--text-main)]/80">
                            <input
                              type="checkbox"
                              checked={emailUpdatesOptIn}
                              onChange={event => setEmailUpdatesOptIn(event.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-theme-medium bg-theme-elevated text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                            />
                            <span>
                              Email me about new menus, chef tastings, and loyalty rewards.
                            </span>
                          </label>
                          <label className="flex items-start gap-3 text-sm text-[var(--text-main)]/80">
                            <input
                              type="checkbox"
                              checked={smsUpdatesOptIn}
                              onChange={event => setSmsUpdatesOptIn(event.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-theme-medium bg-theme-elevated text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                            />
                            <span>
                              Text me order updates and flash deals (standard rates apply).
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Back to Saved Addresses Button - Show if user has saved addresses and is in manual mode */}
                      {user && useManualAddress && savedAddresses.length > 0 && (
                        <div className="flex justify-start">
                          <button
                            type="button"
                            onClick={() => {
                              setUseManualAddress(false)
                              // Re-select default address if available
                              const defaultAddress = savedAddresses.find(
                                (addr: any) => addr.isDefault
                              )
                              if (defaultAddress) {
                                handleSelectSavedAddress(defaultAddress)
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg transition cursor-pointer min-h-[44px]"
                            style={{
                              backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = isLightTheme
                                ? 'rgba(0, 0, 0, 0.08)'
                                : 'rgba(255, 255, 255, 0.1)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = isLightTheme
                                ? 'rgba(0, 0, 0, 0.04)'
                                : ''
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                              />
                            </svg>
                            Back to Saved Addresses
                          </button>
                        </div>
                      )}

                      {/* Place Order / Continue to Payment Button */}
                      {!showPayment && (
                        <div className="pt-6 border-t border-theme mt-6">
                          <button
                            type="submit"
                            disabled={placingOrder || orderSuccess || !isAddressValid()}
                            className="w-full bg-gradient-to-r from-accent to-accent/80 text-black py-3.5 rounded-lg font-semibold text-base hover:from-accent/90 hover:to-accent/70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {placingOrder ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Processing...
                              </>
                            ) : orderSuccess ? (
                              <>
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Order Placed!
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                  />
                                </svg>
                                Continue to Payment
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* Stripe Payment Form */}
                {showPayment && clientSecret && (
                  <div
                    className="glow-surface glow-strong border border-theme rounded-xl p-6 mt-6"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <svg
                        className="w-6 h-6 text-accent flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <h2 className="text-xl font-bold text-[var(--text-main)]">
                        Payment Information
                      </h2>
                    </div>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripeCheckoutForm
                        orderId={createdOrderId || ''}
                        amount={grandTotal}
                        currencySymbol={CURRENCY_SYMBOL}
                        onSuccess={handlePaymentSuccess}
                        onError={(error: string | Error) =>
                          handlePaymentError(error instanceof Error ? error.message : error)
                        }
                      />
                    </Elements>
                  </div>
                )}

                {/* Security Info */}
                {!showPayment && !orderSuccess && (
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mt-6">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-accent flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">
                          Secure Payment
                        </h3>
                        <p className="text-muted">
                          Your payment information is processed securely through Stripe. We never
                          store your credit card details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:w-80">
                <div
                  className="glow-surface glow-strong border border-theme rounded-xl p-6 sticky top-4"
                  style={{
                    backgroundColor: isLightTheme
                      ? 'var(--bg-elevated)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Total</h2>

                  {/* Only show loyalty program if enabled */}
                  {enableLoyaltyProgram && (
                    <div className="mb-4 rounded-xl border border-[#C59D5F]/30 bg-[#C59D5F]/10 p-4 text-xs text-amber-100/80">
                      <div className="flex items-center justify-between uppercase tracking-[0.2em] text-[10px] text-amber-200/70">
                        <span>Loyalty</span>
                        <span>{loyalty?.snapshot?.tier || 'Member'}</span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-main)]/30">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#D97706] transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(loyalty?.progressPercent ?? 0, 4))}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-amber-100/90">
                        <span>{loyalty?.snapshot?.currentPoints ?? 0} pts</span>
                        <span>
                          {Math.max(0, loyalty?.pointsToNextTier ?? 0)} pts to{' '}
                          {loyalty?.snapshot?.nextTierLabel || 'next tier'}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-amber-100/80">
                        +{loyalty?.pointsEarnedThisOrder ?? 0} pts projected this order
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRewardsPanel(prev => !prev)}
                        className="mt-3 w-full rounded-lg border border-theme bg-[var(--bg-main)]/30 px-3 py-3 text-xs sm:text-sm font-semibold text-[var(--text-main)] transition hover:border-[#C59D5F]/50 hover:text-[#C59D5F] min-h-[44px]"
                      >
                        {showRewardsPanel ? 'Hide Rewards' : 'Apply Rewards'}
                      </button>
                      {showRewardsPanel && (
                        <div className="mt-3 space-y-2 rounded-lg border border-theme bg-[var(--bg-main)]/40 p-3">
                          {loyalty?.redeemableRewards?.length ? (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold text-[var(--text-main)]">
                                Available now
                              </p>
                              <ul className="space-y-1 text-[11px] text-amber-50/90">
                                {loyalty.redeemableRewards.map(reward => (
                                  <li
                                    key={reward.id}
                                    className="flex items-center justify-between rounded-md px-2 py-1"
                                    style={{
                                      backgroundColor: isLightTheme
                                        ? 'rgba(0, 0, 0, 0.04)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    }}
                                  >
                                    <span className="truncate pr-2">{reward.label}</span>
                                    <span className="text-amber-200 font-semibold">
                                      {reward.cost} pts
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-100/70">
                              Earn {Math.max(0, loyalty?.pointsToNextTier ?? 0)} more pts to unlock
                              your next perk.
                            </p>
                          )}
                          {loyalty?.newlyUnlockedRewards?.length ? (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold text-[var(--text-main)]">
                                Unlocking soon
                              </p>
                              <ul className="space-y-1 text-[11px] text-amber-50/80">
                                {loyalty.newlyUnlockedRewards.map(reward => (
                                  <li
                                    key={reward.id}
                                    className="flex items-center justify-between px-2 py-1"
                                  >
                                    <span className="truncate pr-2">{reward.label}</span>
                                    <span className="text-amber-200">{reward.cost} pts</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total Items Count */}
                  <div className="mb-4 pb-4 border-b border-theme">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Total Items</span>
                      <span className="text-base font-semibold text-[var(--text-main)]">
                        {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  {/* Discount Code Section */}
                  <div className="mb-4 pb-4 border-b border-theme">
                    {!appliedDiscountCode ? (
                      <div>
                        <label
                          htmlFor="discountCode"
                          className="block text-sm font-medium text-[var(--text-main)] mb-2"
                        >
                          Discount Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="discountCode"
                            value={discountCodeInput}
                            onChange={e => {
                              setDiscountCodeInput(e.target.value.toUpperCase())
                              setDiscountError('')
                            }}
                            onKeyPress={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleApplyDiscountCode()
                              }
                            }}
                            placeholder="Enter code"
                            disabled={validatingDiscount || placingOrder || orderSuccess}
                            className="flex-1 px-3 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition uppercase disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyDiscountCode}
                            disabled={
                              validatingDiscount ||
                              placingOrder ||
                              orderSuccess ||
                              !discountCodeInput.trim()
                            }
                            className="px-4 py-3 bg-accent text-black rounded-lg hover:bg-accent/80 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px]"
                          >
                            {validatingDiscount ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'Apply'
                            )}
                          </button>
                        </div>
                        {discountError && (
                          <p className="mt-2 text-xs text-red-400">{discountError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-green-400">
                              Code: {appliedDiscountCode.code}
                            </p>
                            <p className="text-xs text-green-300 mt-0.5">
                              {appliedDiscountCode.discount_type === 'percentage'
                                ? `${appliedDiscountCode.discount_value}% off`
                                : `${formatCurrency(parseFloat(appliedDiscountCode.discount_value || 0))} off`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveDiscountCode}
                            disabled={placingOrder || orderSuccess}
                            className="text-green-300 hover:text-green-100 p-1 transition disabled:opacity-50"
                            title="Remove discount code"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm text-muted">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[var(--text-main)]">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted">
                      <span>Shipping</span>
                      <span className="font-semibold">
                        {shipping === 0 ? (
                          <span className="text-green-400">FREE</span>
                        ) : (
                          <span className="text-[var(--text-main)]">
                            {formatCurrency(shipping)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted">
                      <span>Tax ({Math.round(taxRatePercent)}%)</span>
                      <span className="font-semibold text-[var(--text-main)]">
                        {formatCurrency(tax)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400 font-medium">Discount</span>
                        <span className="font-semibold text-green-400">
                          -{formatCurrency(discountAmount)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-theme pt-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-[var(--text-main)]">Total</span>
                        <span className="text-2xl font-bold text-accent">
                          {formatCurrency(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {createdOrderId && trackingStatus && enableOrderTracking && (
                    <div
                      ref={trackingRef as React.RefObject<HTMLDivElement>}
                      className="mt-6 space-y-3 rounded-2xl border border-theme p-4"
                      style={{
                        backgroundColor: isLightTheme
                          ? 'rgba(0, 0, 0, 0.04)'
                          : 'rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.3em] text-muted">
                          Order tracker
                        </span>
                        <Link
                          to="/order-history"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80"
                        >
                          Order history
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                      <div className="rounded-xl bg-[var(--bg-main)] p-3">
                        <OrderTimeline status={trackingStatus || 'pending'} />
                      </div>
                    </div>
                  )}

                  {/* Security Badge */}
                  <div className="flex items-center justify-center text-sm text-muted mt-4 pt-4 border-t border-theme">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Secure Checkout
                  </div>
                </div>
              </div>
            </div>
          )}
        </m.section>
      </m.main>

      {/* Payment Success Modal - Render outside main to ensure it's always visible */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        orderId={createdOrderId || ''}
        orderTotal={grandTotal}
        currencySymbol={CURRENCY_SYMBOL}
        onClose={handleModalClose}
      />

      {/* Guest Account Conversion Modal */}
      {hookShowConversionModal && hookGuestCheckoutData && (
        <GuestAccountConversionModal
          isOpen={hookShowConversionModal}
          onClose={() => {
            setHookShowConversionModal(false)
            navigate('/')
          }}
          guestEmail={(hookGuestCheckoutData as any)?.email || ''}
          orderId={(hookGuestCheckoutData as any)?.orderId || ''}
          guestSessionId={(hookGuestCheckoutData as any)?.guestSessionId || ''}
        />
      )}
    </>
  )
})

Checkout.displayName = 'Checkout'

export default Checkout
