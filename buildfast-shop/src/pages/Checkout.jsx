import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Elements } from '@stripe/react-stripe-js'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { parsePrice, formatPrice, getCurrencySymbol } from '../lib/priceUtils'
import { stripePromise } from '../lib/stripe'
import StripeCheckoutForm from '../components/StripeCheckoutForm'
import PaymentSuccessModal from '../components/PaymentSuccessModal'
import { validateDiscountCode, applyDiscountCodeToOrder } from '../lib/discountUtils'
import { getGuestSessionId, clearGuestCart } from '../lib/guestSessionUtils'
import GuestAccountConversionModal from '../components/GuestAccountConversionModal'
import UpdateTimestamp from '../components/UpdateTimestamp'
import { createOrderWithItems } from '../lib/orderService'
import { pageFade, fadeSlideUp } from '../components/animations/menuAnimations'
import OrderTimeline from '../components/OrderTimeline'
import { resolveLoyaltyState } from '../lib/loyaltyUtils'
import { logger } from '../utils/logger'
import { useTheme } from '../shared/hooks'
import { setMessageWithAutoClear } from '../utils/messageUtils'
// New hooks
import { useCartItems } from '../features/cart/hooks'
import { useAddresses } from '../features/addresses/hooks'
import { edgeFunctionClient } from '../shared/lib'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CURRENCY_SYMBOL = '৳'
const CURRENCY_CODE = 'BDT'
const SHIPPING_THRESHOLD = 500
const SHIPPING_FEE = 50
const DEFAULT_TAX_RATE = 0.08

/**
 * Checkout Page
 *
 * Displays user's shopping cart items for order review.
 * Shows order summary with totals and next steps message.
 */
function Checkout() {
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()
  const navigate = useNavigate()
  
  // Feature flags - default to false during loading
  const enableOrderTracking = settingsLoading ? false : (settings?.enable_order_tracking ?? true)
  const enableMarketingOptins = settingsLoading ? false : (settings?.enable_marketing_optins ?? true)
  const enableLoyaltyProgram = settingsLoading ? false : (settings?.enable_loyalty_program ?? true)
  
  // Theme detection
  const isLightTheme = useTheme()
  
  // Data fetching using new hooks with refetch capability for real-time updates
  const { cartItems: rawCartItems, loading: loadingCart, refetch: refetchCart } = useCartItems({ user, enabled: true })
  const { addresses: savedAddresses, loading: loadingAddresses, refetch: refetchAddresses } = useAddresses({ user, enabled: !!user })
  
  // Normalize cart items to match expected structure
  // IMPORTANT: Preserve ALL product data sources (database, embedded, already-resolved)
  // This ensures checkout works even when products can't be fetched from database
  const cartItems = useMemo(() => {
    return (rawCartItems || []).map(item => {
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
      const resolvedProductType = item.resolvedProductType || 
        (item.menu_items ? 'menu_item' 
        : item.dishes ? 'dish' 
        : item.products ? 'legacy'
        : embeddedProduct ? (embeddedProduct.isMenuItem ? 'menu_item' : 'legacy')
        : null)
      
      return {
        ...item,
        // Preserve all product data sources
        resolvedProduct,
        resolvedProductType,
        // Also preserve embedded product for fallback in cartItemsWithProducts
        product: embeddedProduct || item.product || null
      }
    })
    // Don't filter - let checkout handle items without products
  }, [rawCartItems])

  // Guest checkout state
  const [guestEmail, setGuestEmail] = useState('')
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [guestCheckoutData, setGuestCheckoutData] = useState(null)
  const [continueAsGuest, setContinueAsGuest] = useState(false) // Track if guest chose to continue
  const [fulfillmentMode, setFulfillmentMode] = useState('delivery')
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
    phoneNumber: ''
  })
  
  // Order submission state
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')
  const errorClearRef = useRef(null)

  // Payment state
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  // Flag to prevent redirect during payment success flow
  const isProcessingPaymentSuccess = useRef(false)
  const [showOrderNote, setShowOrderNote] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [showRewardsPanel, setShowRewardsPanel] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState(null)
  const trackingRef = useRef(null)
  const scrollToTracking = () => {
    if (trackingRef.current) {
      trackingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  const [emailUpdatesOptIn, setEmailUpdatesOptIn] = useState(true)
  const [smsUpdatesOptIn, setSmsUpdatesOptIn] = useState(true)

  // Discount code state
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [appliedDiscountCode, setAppliedDiscountCode] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountError, setDiscountError] = useState('')
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  // Refs for cleanup
  const successRedirectRef = useRef(null)
  const scheduledSlots = useMemo(
    () => [
      { value: 'asap', label: 'ASAP (30-40 min)' },
      { value: '18:00', label: '6:00 – 6:15 PM' },
      { value: '18:20', label: '6:20 – 6:35 PM' },
      { value: '18:40', label: '6:40 – 6:55 PM' },
      { value: '19:00', label: '7:00 – 7:15 PM' },
    ],
    []
  )

  const formatCurrency = (value) => `${getCurrencySymbol(CURRENCY_CODE)}${formatPrice(value, 0)}`

  // Handle selecting a saved address
  const handleSelectSavedAddress = useCallback((address) => {
    if (!address) return
    
    setSelectedSavedAddress(address)
    setUseManualAddress(false)

    // Pre-fill shipping address form with safe defaults
    setShippingAddress({
      fullName: address.fullName || '',
      streetAddress: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      stateProvince: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
      phoneNumber: address.phone || ''
    })
  }, [])

  // Auto-select default address when addresses are loaded
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedSavedAddress) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault)
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
    return cartItems.map(item => {
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
            stock: item.stock || null
          },
          resolvedProductType: item.menu_item_id ? 'menu_item' : item.product_id ? 'dish' : 'legacy'
        }
      }
      return item
    })
  }, [cartItems])

  // Reset order success state when cart has items (allows new checkout after successful order)
  useEffect(() => {
    // If cart has items and we're not showing payment/modal, reset success state
    // BUT only if we're not currently processing a payment success
    if (cartItems.length > 0 && !showPayment && !showSuccessModal && !isProcessingPaymentSuccess.current) {
      if (orderSuccess) {
        // Only log in development
        if (import.meta.env.DEV) {
          console.log('Resetting order success state - new items in cart')
        }
        setOrderSuccess(false)
        setCreatedOrderId(null)
        isProcessingPaymentSuccess.current = false
      }
    }
  }, [cartItems.length, showPayment, showSuccessModal, orderSuccess])

  // REAL-TIME SUBSCRIPTIONS FOR CHECKOUT
  // 1. Real-time subscription for product updates (menu_items, dishes, products)
  useEffect(() => {
    if (!cartItemsWithProducts || cartItemsWithProducts.length === 0) return
    if (showPayment || showSuccessModal || placingOrder) return // Don't update during payment
    
    // Get unique product IDs from cart items
    const menuItemIds = [...new Set(cartItemsWithProducts
      .filter(item => item.menu_item_id || item.resolvedProductType === 'menu_item')
      .map(item => item.menu_item_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )]
    
    const dishIds = [...new Set(cartItemsWithProducts
      .filter(item => item.product_id || item.resolvedProductType === 'dish')
      .map(item => item.product_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )]
    
    const productIds = [...new Set(cartItemsWithProducts
      .filter(item => item.product_id || item.resolvedProductType === 'legacy')
      .map(item => item.product_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )]

    const channels = []

    // Subscribe to menu_items updates
    // Note: Supabase real-time doesn't support 'in' filter, so we filter in callback
    // Also: Table might not exist, so we wrap in try-catch
    if (menuItemIds.length > 0) {
      try {
        const menuItemsSet = new Set(menuItemIds.map(id => String(id)))
        const menuItemsChannel = supabase
          .channel('checkout-menu-items-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'menu_items'
            },
            async (payload) => {
              // Filter by IDs in callback (Supabase doesn't support 'in' filter)
              const itemId = String(payload.new?.id || payload.old?.id)
              if (!menuItemsSet.has(itemId)) return
              
              // Log to logger only (remove duplicate console.log)
              logger.log('Menu item updated in checkout:', payload)
              
              // Check if price changed
              const oldPrice = payload.old?.price
              const newPrice = payload.new?.price
              
              if (oldPrice !== newPrice) {
                toast.info('Price updated for an item in your cart', {
                  icon: '💰',
                  duration: 4000
                })
              }
              
              // Check if item became unavailable
              if (payload.new?.is_available === false) {
                toast.error('An item in your cart is no longer available', {
                  icon: '⚠️',
                  duration: 5000
                })
              }
              
              // Refetch cart items to get updated product data (debounced)
              if (refetchCart) {
                // Debounce refetch to avoid too many requests
                setTimeout(() => {
                  refetchCart()
                }, 500)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Only log once per subscription - remove duplicate logs
              logger.log('Real-time subscription active for menu_items in checkout')
            } else if (status === 'CHANNEL_ERROR') {
              logger.warn('Real-time subscription error for menu_items (table might not exist or real-time not enabled)')
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for menu_items - retrying...')
              setTimeout(() => {
                try {
                  menuItemsChannel.subscribe()
                } catch (retryErr) {
                  logger.warn('Failed to retry menu_items subscription:', retryErr)
                }
              }, 2000)
            }
          })
        
        channels.push(menuItemsChannel)
      } catch (err) {
        // Table might not exist or real-time not enabled - skip silently
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          logger.warn('menu_items table does not exist or real-time not enabled - skipping subscription')
        } else {
          logger.warn('Failed to subscribe to menu_items updates:', err)
        }
      }
    }

    // Subscribe to dishes updates
    // Note: Supabase real-time doesn't support 'in' filter, so we filter in callback
    // Also: Table might not exist, so we wrap in try-catch
    if (dishIds.length > 0) {
      try {
        const dishesSet = new Set(dishIds.map(id => String(id)))
        const dishesChannel = supabase
          .channel('checkout-dishes-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'dishes'
            },
            async (payload) => {
              // Filter by IDs in callback (Supabase doesn't support 'in' filter)
              const itemId = String(payload.new?.id || payload.old?.id)
              if (!dishesSet.has(itemId)) return
              
              // Log to logger only (remove duplicate console.log)
              logger.log('Dish updated in checkout:', payload)
              
              // Check if price changed
              const oldPrice = payload.old?.price
              const newPrice = payload.new?.price
              
              if (oldPrice !== newPrice) {
                toast.info('Price updated for an item in your cart', {
                  icon: '💰',
                  duration: 4000
                })
              }
              
              // Check if item became unavailable
              if (payload.new?.is_available === false || payload.new?.stock === 0) {
                toast.error('An item in your cart is no longer available', {
                  icon: '⚠️',
                  duration: 5000
                })
              }
              
              // Refetch cart items to get updated product data (debounced)
              if (refetchCart) {
                setTimeout(() => {
                  refetchCart()
                }, 500)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Only log once per subscription - remove duplicate logs
              logger.log('Real-time subscription active for dishes in checkout')
            } else if (status === 'CHANNEL_ERROR') {
              logger.warn('Real-time subscription error for dishes (table might not exist or real-time not enabled)')
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for dishes - retrying...')
              setTimeout(() => {
                try {
                  dishesChannel.subscribe()
                } catch (retryErr) {
                  logger.warn('Failed to retry dishes subscription:', retryErr)
                }
              }, 2000)
            }
          })
        
        channels.push(dishesChannel)
      } catch (err) {
        // Table might not exist or real-time not enabled - skip silently
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          logger.warn('dishes table does not exist or real-time not enabled - skipping subscription')
        } else {
          logger.warn('Failed to subscribe to dishes updates:', err)
        }
      }
    }

    // Subscribe to products updates (legacy)
    // Note: Supabase real-time doesn't support 'in' filter, so we filter in callback
    // Also: Table might not exist, so we wrap in try-catch
    if (productIds.length > 0) {
      try {
        const productsSet = new Set(productIds.map(id => String(id)))
        const productsChannel = supabase
          .channel('checkout-products-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'products'
            },
            async (payload) => {
              // Filter by IDs in callback (Supabase doesn't support 'in' filter)
              const itemId = String(payload.new?.id || payload.old?.id)
              if (!productsSet.has(itemId)) return
              
              // Log to logger only (remove duplicate console.log)
              logger.log('Product updated in checkout:', payload)
              
              // Check if price changed
              const oldPrice = payload.old?.price
              const newPrice = payload.new?.price
              
              if (oldPrice !== newPrice) {
                toast.info('Price updated for an item in your cart', {
                  icon: '💰',
                  duration: 4000
                })
              }
              
              // Check if item became unavailable
              if (payload.new?.stock === 0) {
                toast.error('An item in your cart is out of stock', {
                  icon: '⚠️',
                  duration: 5000
                })
              }
              
              // Refetch cart items to get updated product data (debounced)
              if (refetchCart) {
                setTimeout(() => {
                  refetchCart()
                }, 500)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Only log once per subscription - remove duplicate logs
              logger.log('Real-time subscription active for products in checkout')
            } else if (status === 'CHANNEL_ERROR') {
              logger.warn('Real-time subscription error for products (table might not exist or real-time not enabled)')
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for products - retrying...')
              setTimeout(() => {
                try {
                  productsChannel.subscribe()
                } catch (retryErr) {
                  logger.warn('Failed to retry products subscription:', retryErr)
                }
              }, 2000)
            }
          })
        
        channels.push(productsChannel)
      } catch (err) {
        // Table might not exist or real-time not enabled - skip silently
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          logger.warn('products table does not exist or real-time not enabled - skipping subscription')
        } else {
          logger.warn('Failed to subscribe to products updates:', err)
        }
      }
    }

    // Cleanup subscriptions
    return () => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel)
        } catch (err) {
          logger.warn('Error removing real-time channel:', err)
        }
      })
    }
  }, [cartItemsWithProducts, showPayment, showSuccessModal, placingOrder, refetchCart])

  // 2. Real-time subscription for addresses updates
  useEffect(() => {
    if (!user) return
    if (showPayment || showSuccessModal || placingOrder) return // Don't update during payment
    
    try {
      const addressesChannel = supabase
        .channel('checkout-addresses-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'addresses',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('Address updated in real-time:', payload)
            logger.log('Address updated in checkout:', payload)
            
            // Refetch addresses to get updated data (debounced)
            if (refetchAddresses) {
              setTimeout(() => {
                refetchAddresses()
              }, 500)
            }
            
            // If current selected address was updated, refresh it
            if (selectedSavedAddress && payload.new?.id === selectedSavedAddress.id) {
              // Update selected address data
              handleSelectSavedAddress(payload.new)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Only log once per subscription - remove duplicate logs
            logger.log('Real-time subscription active for addresses in checkout')
          } else if (status === 'CHANNEL_ERROR') {
            logger.warn('Real-time subscription error for addresses (table might not exist or real-time not enabled)')
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
      if (err.code === '42P01' || err.message?.includes('does not exist')) {
        logger.warn('addresses table does not exist or real-time not enabled - skipping subscription')
      } else {
        logger.warn('Failed to subscribe to addresses updates:', err)
      }
    }
  }, [user, showPayment, showSuccessModal, placingOrder, refetchAddresses, selectedSavedAddress, handleSelectSavedAddress])

  // 3. Real-time subscription for store settings (already in StoreSettingsContext)
  // The context already handles this, so we don't need to add it here
  // Store settings changes will automatically update the checkout UI via context

  // REMOVED: Auto-redirect when cart is empty
  // This was causing navigation issues - let users navigate manually via the "Back to Menu" button
  // Only prevent redirects if modal/payment is active
  useEffect(() => {
    // Only prevent redirects during payment success flow
    // Don't auto-redirect anymore - let user manually navigate
    if (isProcessingPaymentSuccess.current || showSuccessModal || orderSuccess || showPayment || placingOrder) {
      console.log('Payment success flow active - preventing redirects', {
        isProcessingPaymentSuccess: isProcessingPaymentSuccess.current,
        showSuccessModal,
        orderSuccess,
        showPayment,
        placingOrder
      })
      return
    }
  }, [showSuccessModal, showPayment, placingOrder, orderSuccess])

  // Check if returning from Stripe redirect (payment success)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const orderId = urlParams.get('order_id')
    const paymentIntent = urlParams.get('payment_intent')
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret')
    
    if (orderId || paymentIntent || paymentIntentClientSecret) {
      console.log('Detected payment redirect return', { orderId, paymentIntent, paymentIntentClientSecret })
      
      // CRITICAL: Set flag immediately to prevent redirects
      isProcessingPaymentSuccess.current = true
      
      // If we have an order ID from redirect, show success modal
      if (orderId && orderId !== createdOrderId) {
        // Order ID from URL - payment was successful
        console.log('Showing success modal from Stripe redirect - BEFORE clearing cart', { orderId })
        
        // Show modal FIRST before clearing cart or doing anything else
        setCreatedOrderId(orderId)
        setShowPayment(false)
        setShowSuccessModal(true)
        setOrderSuccess(true)
        
        // Clear URL params immediately
        window.history.replaceState({}, '', window.location.pathname)
        
        // Delay cart clearing to ensure modal renders first
        setTimeout(async () => {
          try {
            if (user) {
              const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id)
              
              if (deleteError) {
                logger.error('Error clearing cart:', deleteError)
              } else {
                console.log('Cart cleared after modal shown (Stripe redirect)')
              }
            } else {
              clearGuestCart()
              console.log('Cart cleared after modal shown (Stripe redirect - guest)')
            }
          } catch (err) {
            logger.error('Error clearing cart:', err)
          }
        }, 300) // Delay to ensure modal is visible
        
        // Redirect will be handled by modal's countdown timer
      }
    }
  }, [createdOrderId, navigate, user])

  const handleFulfillmentChange = (mode) => {
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
      phoneNumber: ''
    })
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorClearRef.current) {
        errorClearRef.current()
      }
      if (successRedirectRef.current) {
        clearTimeout(successRedirectRef.current)
      }
    }
  }, [])
  
  // Loading state
  const loading = loadingCart || loadingAddresses

  // Calculate total number of items (sum of all quantities)
  const totalItemsCount = useMemo(() => {
    return cartItemsWithProducts.reduce(
      (sum, item) => sum + item.quantity,
      0
    )
  }, [cartItemsWithProducts])

  // Calculate subtotal (sum of all item prices * quantities)
  const subtotal = useMemo(() => {
    return cartItemsWithProducts.reduce((sum, item) => {
      // Use resolved product, fallback to embedded product, or use cart item data
      // Since cartItemsWithProducts creates fallback products, this should always exist
      const product = item.resolvedProduct || item.product || {
        price: item.price || item.price_at_purchase || 0
      }
      
      // Handle price - might be string or number, or use fallback from cart item
      const price = typeof product.price === 'number' 
        ? product.price 
        : parsePrice(product.price || item.price || item.price_at_purchase || '0')
      
      return sum + (price * item.quantity)
    }, 0)
  }, [cartItemsWithProducts])

  // Calculate shipping and tax
  const shipping = useMemo(() => {
    return subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  }, [subtotal])

  const tax = useMemo(() => {
    return subtotal * DEFAULT_TAX_RATE
  }, [subtotal])
  
  const taxRatePercent = DEFAULT_TAX_RATE * 100

  // Calculate grand total (subtotal + shipping + tax - discount)
  const grandTotal = useMemo(() => {
    const total = subtotal + shipping + tax
    return Math.max(0, total - discountAmount) // Ensure total doesn't go negative
  }, [subtotal, shipping, tax, discountAmount])

  const loyalty = useMemo(() => resolveLoyaltyState(grandTotal), [grandTotal])

  // Handle shipping address form input changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
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
        setAppliedDiscountCode(result.discountCode)
        setDiscountAmount(result.discountAmount)
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
    
    const baseValidation = (
      shippingAddress.fullName?.trim() &&
      shippingAddress.streetAddress?.trim() &&
      shippingAddress.city?.trim() &&
      shippingAddress.stateProvince?.trim() &&
      shippingAddress.postalCode?.trim() &&
      shippingAddress.country?.trim()
    )
    
    // Phone is required for manual addresses, optional for saved addresses
    if (requirePhone) {
      return baseValidation && shippingAddress.phoneNumber?.trim()
    }
    
    return baseValidation
  }, [shippingAddress, useManualAddress, selectedSavedAddress])

  // Get missing address fields for error display
  const getMissingAddressFields = useCallback(() => {
    const missing = []
    if (!shippingAddress.fullName?.trim()) missing.push('Full Name')
    if (!shippingAddress.streetAddress?.trim()) missing.push('Street Address')
    if (!shippingAddress.city?.trim()) missing.push('City')
    if (!shippingAddress.stateProvince?.trim()) missing.push('State/Province')
    if (!shippingAddress.postalCode?.trim()) missing.push('Postal Code')
    if (!shippingAddress.country?.trim()) missing.push('Country')
    // Phone is only required for manual addresses
    if ((useManualAddress || !selectedSavedAddress) && !shippingAddress.phoneNumber?.trim()) {
      missing.push('Phone Number')
    }
    return missing
  }, [shippingAddress, useManualAddress, selectedSavedAddress])

  // Handle order placement and payment intent creation
  const handlePlaceOrder = async (e) => {
    e.preventDefault()

    // Validate form
    if (!isAddressValid()) {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Please fill in all required shipping address fields.', 'error', 5000)
      return
    }

    // For guests: validate email
    if (!user && !guestEmail.trim()) {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Please provide your email address.', 'error', 5000)
      return
    }

    // Validate email format for guests
    if (!user && guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Please provide a valid email address.', 'error', 5000)
      return
    }

    // Check if we have any cart items with product data
    if (cartItemsWithProducts.length === 0) {
      // Check if we have raw cart items but products aren't resolved
      if (rawCartItems && rawCartItems.length > 0) {
        if (errorClearRef.current) errorClearRef.current()
        errorClearRef.current = setMessageWithAutoClear(
          setOrderError, 
          null, 
          'Unable to load product information. Please refresh the page and try again.', 
          'error', 
          5000
        )
      } else {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Your cart is empty.', 'error', 5000)
      }
      return
    }

    try {
      setPlacingOrder(true)
      setOrderError('')

      // Clear any existing timeouts
      if (errorClearRef.current) errorClearRef.current()
      if (successRedirectRef.current) clearTimeout(successRedirectRef.current)

      // Get customer email and guest info
      const customerEmail = user ? user.email : guestEmail

      if (!customerEmail || !customerEmail.trim()) {
        throw new Error('Customer email is required.')
      }

      // Prepare order items for service layer
      const orderItems = cartItemsWithProducts.map(item => {
        // Use resolved product from database, fallback to embedded product, or use cart item data
        // Since cartItemsWithProducts creates fallback products, this should always exist
        const resolvedProduct = item.resolvedProduct || item.product || {
          id: item.menu_item_id || item.product_id || item.id,
          name: item.name || `Item ${item.menu_item_id || item.product_id || item.id}`,
          price: item.price || item.price_at_purchase || 0
        }

        // Handle price - might be string or number, or use fallback from cart item
        const price = typeof resolvedProduct.price === 'number' 
          ? resolvedProduct.price 
          : parsePrice(resolvedProduct.price || item.price || item.price_at_purchase || '0')

        if (price <= 0) {
          throw new Error(`Invalid price for product: ${resolvedProduct.name || item.product_id || item.menu_item_id}`)
        }

        // Get product IDs - prefer actual IDs from cart item, fallback to resolved product ID
        const derivedMenuItemId = item.menu_item_id || (item.resolvedProductType === 'menu_item' ? (resolvedProduct?.id || item.product?.id) : null)
        const derivedLegacyProductId = item.product_id || (item.resolvedProductType === 'dish' ? (resolvedProduct?.id || item.product?.id) : null) || (item.resolvedProductType === 'legacy' ? (resolvedProduct?.id || item.product?.id) : null)

        let variantMetadata = item.variant_metadata || item.variantMetadata || null
        if (!variantMetadata && item.variant_snapshot) {
          variantMetadata = item.variant_snapshot
        } else if (!variantMetadata && item.variant_display) {
          variantMetadata = { display: item.variant_display }
        }

        if (variantMetadata && typeof variantMetadata === 'string') {
          try {
            variantMetadata = JSON.parse(variantMetadata)
          } catch {
            variantMetadata = { display: variantMetadata }
          }
        }

        return {
          product_id: derivedLegacyProductId || null,
          menu_item_id: derivedMenuItemId || null,
          quantity: item.quantity,
          price_at_purchase: price,
          variant_id: item.variant_id || item.variantId || null,
          combination_id: item.combination_id || item.combinationId || null,
          variant_metadata: variantMetadata
        }
      })

      // Create order atomically using service layer (RPC function)
      // This handles: stock validation, price validation, atomic transaction
      const guestSessionId = user?.id ? null : getGuestSessionId()

      const shippingPayload = {
        ...shippingAddress,
        fulfillmentMode,
        scheduledSlot,
        orderNote: orderNote?.trim() ? orderNote.trim() : undefined,
        marketingPreferences: enableMarketingOptins ? {
          email: emailUpdatesOptIn,
          sms: smsUpdatesOptIn,
        } : undefined,
      }

      const orderResult = await createOrderWithItems({
        userId: user?.id || null,
        customerEmail: customerEmail,
        customerName: shippingAddress.fullName,
        shippingAddress: shippingPayload,
        items: orderItems,
        discountCodeId: appliedDiscountCode?.id || null,
        discountAmount: discountAmount,
        guestSessionId,
        isGuest: !user
      })

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      const orderData = { id: orderResult.orderId }
      setTrackingStatus('pending')

      // Apply discount code usage tracking if one was used
      if (appliedDiscountCode && discountAmount > 0 && user?.id) {
        // Calculate order subtotal (before discount)
        const orderSubtotal = subtotal + shipping + tax

        const discountResult = await applyDiscountCodeToOrder(
          appliedDiscountCode.id,
          user.id,
          orderResult.orderId,
          discountAmount,
          orderSubtotal
        )

        if (!discountResult.success) {
          // Log error but don't fail the order - discount was already applied to order_total
          logger.error('Failed to record discount code usage:', discountResult.error)
          // If it's a duplicate usage error, the order was already created with discount
          // This is a race condition edge case that's handled by database constraints
        }
      }

      // Create Stripe Payment Intent using Edge Function client
      const paymentResponse = await edgeFunctionClient.invoke('create-payment-intent', {
        amount: Number(grandTotal.toFixed(2)),
        currency: CURRENCY_CODE,
        orderId: orderData.id,
        customerEmail: customerEmail
      })

      if (!paymentResponse.success || !paymentResponse.data?.clientSecret) {
        throw new Error(paymentResponse.message || 'Failed to initialize payment')
      }

      const secret = paymentResponse.data.clientSecret

      // Store order ID and client secret, then show payment form
      setCreatedOrderId(orderData.id)
      setClientSecret(secret)
      setShowPayment(true)

    } catch (err) {
      logger.error('Error placing order:', err)

      let errorMessage = 'Failed to place order. Please try again.'
      if (err.message) {
        errorMessage = err.message
      } else if (err.code === '42P01') {
        errorMessage = 'Database tables not found. Please run the migration first.'
      } else if (err.code === '42501') {
        errorMessage = 'Permission denied. Please ensure you are logged in.'
      }

      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, errorMessage, 'error', 8000)
    } finally {
      setPlacingOrder(false)
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    console.log('handlePaymentSuccess called', { user: !!user, createdOrderId, grandTotal })
    
    // CRITICAL: Set flag immediately to prevent any redirects
    isProcessingPaymentSuccess.current = true
    
    try {
      setTrackingStatus('processing')
      const customerEmail = user ? user.email : guestEmail
      console.log('Processing payment success for:', customerEmail)

      // FIRST: Hide payment form and show modal BEFORE clearing cart
      // This prevents the redirect useEffect from firing
      if (!user) {
        // Guest checkout - offer account creation
        console.log('Showing conversion modal for guest')
        const sessionId = getGuestSessionId()
        setGuestCheckoutData({
          email: guestEmail,
          orderId: createdOrderId,
          guestSessionId: sessionId ?? undefined
        })
        setShowConversionModal(true)
        setShowPayment(false)
        setOrderSuccess(true)
      } else {
        // Authenticated user - show success modal FIRST
        console.log('Showing success modal for authenticated user - BEFORE clearing cart', { 
          showSuccessModal: true, 
          createdOrderId, 
          grandTotal 
        })
        // Hide payment form and show modal IMMEDIATELY
        setShowPayment(false)
        setShowSuccessModal(true)
        setOrderSuccess(true)
      }

      // Wait for modal to fully render and be visible before clearing cart
      // This ensures modal is visible before cart state changes trigger redirects
      // Use requestAnimationFrame to ensure DOM has updated
      await new Promise(resolve => {
        // Wait for next frame to ensure modal has rendered
        requestAnimationFrame(() => {
          setTimeout(() => {
            resolve()
          }, 300) // Increased delay to ensure modal is visible
        })
      })

      // NOW clear cart (after modal is definitely showing)
      try {
        if (user) {
          // Clear database cart for authenticated users (async, non-blocking)
          supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .then(({ error: deleteError }) => {
              if (deleteError) {
                logger.error('Error clearing cart:', deleteError)
              } else {
                console.log('Cart cleared successfully for authenticated user')
              }
            })
            .catch((cartError) => {
              logger.error('Error clearing cart:', cartError)
            })
        } else {
          // Clear localStorage cart for guests (synchronous)
          clearGuestCart()
          console.log('Cart cleared successfully for guest')
        }
      } catch (cartError) {
        logger.error('Error clearing cart:', cartError)
        // Don't block the success flow if cart clearing fails
      }

      // Send order confirmation email (non-blocking)
      try {
        const apiUrl = import.meta.env.VITE_SUPABASE_URL
        const { data: { session } } = await supabase.auth.getSession()

        const authHeader = session?.access_token
          ? { 'Authorization': `Bearer ${session.access_token}` }
          : { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }

        const response = await fetch(`${apiUrl}/functions/v1/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader
          },
          body: JSON.stringify({
            orderId: createdOrderId,
            email: customerEmail
          })
        })

        if (response.ok) {
          const result = await response.json()
          logger.log('Order confirmation email sent successfully:', result)
        } else {
          const errorData = await response.text()
          logger.error('Failed to send confirmation email:', errorData)
        }
      } catch (emailError) {
        // Log error but don't block the success flow
        logger.error('Failed to send confirmation email:', emailError)
      }

      console.log('Payment success flow complete - modal should be visible')
    } catch (err) {
      console.error('Error in handlePaymentSuccess:', err)
      logger.error('Error after payment:', err)
      // On error, still try to show modal
      setShowPayment(false)
      // Reset flag on error
      isProcessingPaymentSuccess.current = false
    }
  }

  // Handle modal close (also redirects)
  const handleModalClose = () => {
    console.log('Payment success modal closed - redirecting to home')
    
    // Reset all payment success states
    setShowSuccessModal(false)
    setOrderSuccess(false)
    setCreatedOrderId(null)
    setShowPayment(false)
    
    // Reset the flag that prevents redirects
    isProcessingPaymentSuccess.current = false
    
    // Clear any existing redirect timeout
    if (successRedirectRef.current) {
      clearTimeout(successRedirectRef.current)
      successRedirectRef.current = null
    }
    
    // Small delay before redirect to ensure modal closes smoothly
    setTimeout(() => {
    navigate('/')
    }, 300)
  }

  // Handle payment error
  const handlePaymentError = (error) => {
    if (errorClearRef.current) errorClearRef.current()
    errorClearRef.current = setMessageWithAutoClear(setOrderError, null, error, 'error', 8000)
  }

  // Get product image (first image or placeholder)
  const getProductImage = (product) => {
    if (!product) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
    }

    if (product.image_url) {
      return product.image_url
    }

    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading checkout...</p>
        </div>
      </div>
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
  const shouldShowEmptyCart = !loadingCart && 
                               !loadingAddresses &&
                               !hasRawCartItems && 
                               !hasCartItems &&
                               !hasResolvedProducts &&
                               !showSuccessModal && 
                               !orderSuccess && 
                               !isProcessingPaymentSuccess.current &&
                               !showConversionModal &&
                               !showPayment &&
                               !placingOrder

  // Debug logging for cart state (only in development)
  if (import.meta.env.DEV) {
    console.log('Checkout cart state:', {
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
      sampleRawItem: rawCartItems?.[0],
      sampleCartItem: cartItems?.[0],
      sampleCartItemWithProduct: cartItemsWithProducts?.[0],
      user: user?.id || 'guest',
      isAuthenticated: !!user
    })
  }

  // Log warning if items exist but products aren't resolved (only in development)
  if (hasUnresolvedItems && import.meta.env.DEV) {
    console.warn('Cart has items but products are not resolved:', {
      rawCartItemsCount: rawCartItems.length,
      cartItemsCount: cartItems.length,
      cartItemsWithProductsCount: cartItemsWithProducts.length,
      sampleItem: rawCartItems[0]
    })
  }

  // Show empty cart message ONLY if:
  // - Cart is fully loaded
  // - No raw cart items exist at all
  // - Not in any payment/success flow
  if (shouldShowEmptyCart) {
    return (
      <motion.main
        className="min-h-screen flex items-center justify-center"
        variants={pageFade}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <UpdateTimestamp />
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
                console.log('Back to Menu clicked - navigating to /order')
                navigate('/order')
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 min-w-[160px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Menu
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Home clicked - navigating to /')
                navigate('/')
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </button>
          </div>
        </div>
      </motion.main>
    )
  }

  // If we have cart items but products aren't resolved, show error state
  // This happens when products were deleted or foreign keys are broken
  if (hasUnresolvedItems && !loadingCart) {
  return (
      <motion.main
        className="min-h-screen flex items-center justify-center"
        variants={pageFade}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <UpdateTimestamp />
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">Unable to load cart items</h1>
            <p className="text-muted">Some items in your cart are no longer available. Please refresh or clear your cart.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
            <button
              type="button"
              onClick={() => {
                console.log('Refreshing page to reload cart')
                window.location.reload()
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Back to Menu clicked - navigating to /order')
                navigate('/order')
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Menu
            </button>
          </div>
        </div>
      </motion.main>
    )
  }

  // Render checkout page (even if cart is empty, if modal is showing)
  return (
    <>
    <motion.main
      className="min-h-screen"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <UpdateTimestamp />
      {/* Header */}
      <motion.header
        className="bg-[var(--bg-main)] border-b border-theme"
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        custom={0.08}
      >
        <div className="app-container py-8">
          <Link
            to="/order"
            className="inline-flex items-center text-accent hover:text-accent/80 font-medium mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Menu
          </Link>
          <h1 className="text-4xl font-bold text-accent mb-2">Checkout</h1>
          <p className="text-muted">
            Review your order and complete payment
          </p>
        </div>
      </motion.header>

      <motion.section
        className="app-container py-8"
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        custom={0.18}
      >
        {/* Error Message */}
        {orderError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-800">{orderError}</p>
            </div>
          </div>
        )}

        {/* Guest Choice: Sign In OR Continue as Guest */}
        {!user && !continueAsGuest && (
          <div className="glow-surface glow-strong mb-8 bg-theme-elevated border border-theme rounded-2xl p-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-accent mb-2">How would you like to checkout?</h2>
                <p className="text-muted">Sign in for faster checkout or continue as a guest</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sign In / Sign Up Option */}
                <Link
                  to="/login"
                  state={{ from: { pathname: '/checkout' } }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-theme-medium rounded-xl hover:border-accent transition group"
                  style={{
                    backgroundColor: 'var(--bg-card)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }}
                >
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/30 transition">
                    <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">Sign In / Sign Up</h3>
                  <p className="text-sm text-muted text-center">
                    Access your account, view order history, and save addresses
                  </p>
                </Link>

                {/* Continue as Guest Option */}
                <button
                  onClick={() => setContinueAsGuest(true)}
                  className="flex flex-col items-center justify-center p-6 border-2 border-theme-medium rounded-xl hover:border-green-400 transition group"
                  style={{
                    backgroundColor: 'var(--bg-card)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }}
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">Continue as Guest</h3>
                  <p className="text-sm text-muted text-center">
                    Quick checkout without creating an account
                  </p>
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-muted">
                  Note: Guest orders cannot be tracked later. You can create an account after checkout.
                </p>
              </div>
            </div>
          </div>
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
                  : 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-accent">Order Summary</h2>
                <span className="text-sm text-muted">{cartItemsWithProducts.length} {cartItemsWithProducts.length === 1 ? 'dish' : 'dishes'}</span>
              </div>

              {/* Order Items List */}
              <div className="space-y-3">
                {cartItemsWithProducts.map((item) => {
                  // Use resolved product from database, fallback to embedded product, or use cart item data
                  // Since cartItemsWithProducts now creates fallback products, this should always exist
                  const product = item.resolvedProduct || item.product || {
                    id: item.menu_item_id || item.product_id || item.id,
                    name: item.name || `Item ${item.menu_item_id || item.product_id || item.id}`,
                    price: item.price || item.price_at_purchase || 0,
                    image_url: item.image_url || item.image || null,
                    description: item.description || null
                  }

                  // Handle price - might be string or number, or use fallback from cart item
                  const itemPrice = typeof product.price === 'number' 
                    ? product.price 
                    : parsePrice(product.price || item.price || item.price_at_purchase || '0')
                  const itemSubtotal = itemPrice * item.quantity

                  return (
                    <div
                      key={item.id}
                      className="glow-surface glow-soft border border-theme rounded-xl p-4 hover:border-accent/30 transition-all"
                      style={{
                        backgroundColor: isLightTheme
                          ? 'rgba(0, 0, 0, 0.04)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div className="flex gap-4">
                        {/* Dish Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={getProductImage(product)}
                            alt={product.name || 'Dish'}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
                            }}
                          />
                        </div>

                        {/* Dish Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 line-clamp-2">
                            {product.name || 'Unknown Dish'}
                          </h3>
                          <p className="text-sm text-muted mb-3">
                            Quantity: <span className="text-[var(--text-main)] font-medium">{item.quantity}</span>
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted">Price per dish</p>
                              <p className="text-base font-semibold text-accent">
                                {formatCurrency(itemPrice)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted">Subtotal</p>
                              <p className="text-xl font-bold text-accent">
                                {formatCurrency(itemSubtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {createdOrderId && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={scrollToTracking}
                  className="inline-flex items-center gap-2 rounded-xl border border-theme-strong bg-theme-elevated px-4 py-2.5 text-xs sm:text-sm font-semibold text-accent transition hover:border-theme-medium hover:text-[var(--text-main)] min-h-[44px]"
                >
                  View live tracking
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Guest Email Section - Only show if not logged in */}
            {!user && (
              <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-6 h-6 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Guest Checkout</h2>
                </div>
                <p className="text-sm text-muted mb-4">
                  Checking out as a guest. You&apos;ll receive your order confirmation at this email address.
                </p>
                <div>
                  <label htmlFor="guestEmail" className="block text-sm font-medium text-[var(--text-main)] mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="guestEmail"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={placingOrder || orderSuccess}
                    className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  />
                </div>
                <div className="mt-4 flex items-start gap-2 text-sm text-muted">
                  <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>
                    Want to save your order history? You can{' '}
                    <Link to="/signup" className="text-accent hover:text-accent/80 font-medium">
                      create an account
                    </Link>
                    {' '}or{' '}
                    <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
                      sign in
                    </Link>
                  </p>
                </div>
              </div>
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
                  <label htmlFor="scheduledSlot" className="block text-sm font-medium text-[var(--text-main)] mb-2">
                    {fulfillmentMode === 'delivery' ? 'Delivery window' : 'Pickup window'}
                  </label>
                  <select
                    id="scheduledSlot"
                    value={scheduledSlot}
                    onChange={(event) => setScheduledSlot(event.target.value)}
                    className="w-full rounded-lg border border-theme bg-theme-elevated px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
                  >
                    {scheduledSlots.map((slot) => (
                      <option key={slot.value} value={slot.value} className="bg-[var(--bg-main)] text-[var(--text-main)]">
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-theme bg-theme-elevated p-4 text-sm text-muted">
                  {fulfillmentMode === 'delivery' ? (
                    <p className="leading-snug">
                      Courier heads out once the kitchen marks your order ready. We’ll text live tracking the moment it’s on the road.
                    </p>
                  ) : (
                    <p className="leading-snug">
                      Collect from the host desk at 61 Orchard Street. We’ll ping you when the order is plated and ready to hand off.
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
                    : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-full">
                      <svg className="w-6 h-6 text-[var(--text-main)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text-main)]">Shipping To</h2>
                      <p className="text-sm text-muted">Ready to ship to your default address</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSavedAddress.isDefault && (
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
                    <p className="font-bold text-[var(--text-main)] text-lg">{selectedSavedAddress.fullName}</p>
                    <p className="text-muted">{selectedSavedAddress.addressLine1}</p>
                    {selectedSavedAddress.addressLine2 && (
                      <p className="text-muted">{selectedSavedAddress.addressLine2}</p>
                    )}
                    <p className="text-muted">
                      {selectedSavedAddress.city}, {selectedSavedAddress.state} {selectedSavedAddress.postalCode}
                    </p>
                    <p className="text-muted">{selectedSavedAddress.country}</p>
                    {selectedSavedAddress.phone && (
                      <p className="text-muted text-sm flex items-center gap-1 mt-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedSavedAddress.phone}
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
                        : 'rgba(255, 255, 255, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isLightTheme
                        ? 'var(--bg-hover)'
                        : 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isLightTheme
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Change Address
                  </button>
                  <Link
                    to="/addresses"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg transition min-h-[44px]"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.04)'
                        : undefined
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isLightTheme
                        ? 'var(--bg-hover)'
                        : 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isLightTheme
                        ? 'rgba(0, 0, 0, 0.04)'
                        : '';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage Addresses
                  </Link>
                </div>
              </div>
            )}

            {/* Continue to Payment Button - Prominent for saved address users */}
            {user && selectedSavedAddress && !useManualAddress && !showPayment && (() => {
              const addressValid = isAddressValid()
              const missingFields = getMissingAddressFields()
              
              return (
              <div className="glow-surface glow-strong bg-theme-elevated border border-theme rounded-xl p-6 mb-6">
                  {!addressValid && missingFields.length > 0 && (
                    <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Missing required information: {missingFields.join(', ')}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Your saved address is missing some required fields. Please{' '}
                            <button
                              type="button"
                              onClick={handleUseManualAddress}
                              className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100"
                            >
                              edit the address
                            </button>
                            {' '}or add the missing information.
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
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Order Created!
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      Continue to Payment
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-muted mt-3 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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
                    : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-xl font-bold text-[var(--text-main)]">Shipping Address</h2>
                  </div>
                  {user && savedAddresses.length === 0 && (
                    <Link
                      to="/addresses"
                      className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition min-h-[44px]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Save Address for Later
                    </Link>
                  )}
                </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-main)] mb-1">
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
                  <label htmlFor="streetAddress" className="block text-sm font-medium text-[var(--text-main)] mb-1">
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
                    <label htmlFor="city" className="block text-sm font-medium text-[var(--text-main)] mb-1">
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
                    <label htmlFor="stateProvince" className="block text-sm font-medium text-[var(--text-main)] mb-1">
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
                    <label htmlFor="postalCode" className="block text-sm font-medium text-[var(--text-main)] mb-1">
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
                    <label htmlFor="country" className="block text-sm font-medium text-[var(--text-main)] mb-1">
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
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-[var(--text-main)] mb-1">
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
                    onClick={() => setShowOrderNote((prev) => !prev)}
                    className="flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {showOrderNote ? 'Remove order note' : 'Add order note for the kitchen'}
                  </button>
                  {showOrderNote && (
                    <textarea
                      value={orderNote}
                      onChange={(event) => setOrderNote(event.target.value.slice(0, 240))}
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
                        onChange={(event) => setEmailUpdatesOptIn(event.target.checked)}
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
                        onChange={(event) => setSmsUpdatesOptIn(event.target.checked)}
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
                        const defaultAddress = savedAddresses.find(addr => addr.isDefault)
                        if (defaultAddress) {
                          handleSelectSavedAddress(defaultAddress)
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg transition cursor-pointer min-h-[44px]"
                      style={{
                        backgroundColor: isLightTheme
                          ? 'rgba(0, 0, 0, 0.04)'
                          : undefined
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Order Placed!
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
                    : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-6 h-6 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Payment Information</h2>
                </div>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckoutForm
                    orderId={createdOrderId}
                    amount={grandTotal}
                    currencySymbol={CURRENCY_SYMBOL}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              </div>
            )}

            {/* Security Info */}
            {!showPayment && !orderSuccess && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mt-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">Secure Payment</h3>
                    <p className="text-muted">
                      Your payment information is processed securely through Stripe. We never store your credit card details.
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
                  : 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Total</h2>

              {/* Only show loyalty program if enabled */}
              {enableLoyaltyProgram && (
              <div className="mb-4 rounded-xl border border-[#C59D5F]/30 bg-[#C59D5F]/10 p-4 text-xs text-amber-100/80">
                <div className="flex items-center justify-between uppercase tracking-[0.2em] text-[10px] text-amber-200/70">
                  <span>Loyalty</span>
                  <span>{loyalty?.tier || 'Member'}</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-main)]/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#D97706] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(loyalty?.progressPercent ?? 0, 4))}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-amber-100/90">
                  <span>{loyalty?.currentPoints ?? 0} pts</span>
                  <span>
                    {Math.max(0, loyalty?.pointsToNextTier ?? 0)} pts to {loyalty?.nextTierLabel || 'next tier'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-amber-100/80">
                  +{loyalty?.pointsEarnedThisOrder ?? 0} pts projected this order
                </div>
                <button
                  type="button"
                  onClick={() => setShowRewardsPanel((prev) => !prev)}
                  className="mt-3 w-full rounded-lg border border-theme bg-[var(--bg-main)]/30 px-3 py-3 text-xs sm:text-sm font-semibold text-[var(--text-main)] transition hover:border-[#C59D5F]/50 hover:text-[#C59D5F] min-h-[44px]"
                >
                  {showRewardsPanel ? 'Hide Rewards' : 'Apply Rewards'}
                </button>
                {showRewardsPanel && (
                  <div className="mt-3 space-y-2 rounded-lg border border-theme bg-[var(--bg-main)]/40 p-3">
                    {loyalty?.redeemableRewards?.length ? (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-[var(--text-main)]">Available now</p>
                        <ul className="space-y-1 text-[11px] text-amber-50/90">
                          {loyalty.redeemableRewards.map((reward) => (
                            <li 
                              key={reward.id} 
                              className="flex items-center justify-between rounded-md px-2 py-1"
                              style={{
                                backgroundColor: isLightTheme
                                  ? 'rgba(0, 0, 0, 0.04)'
                                  : 'rgba(255, 255, 255, 0.05)'
                              }}
                            >
                              <span className="truncate pr-2">{reward.label}</span>
                              <span className="text-amber-200 font-semibold">{reward.cost} pts</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-100/70">
                        Earn {Math.max(0, loyalty?.pointsToNextTier ?? 0)} more pts to unlock your next perk.
                      </p>
                    )}
                    {loyalty?.newlyUnlockedRewards?.length ? (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-[var(--text-main)]">Unlocking soon</p>
                        <ul className="space-y-1 text-[11px] text-amber-50/80">
                          {loyalty.newlyUnlockedRewards.map((reward) => (
                            <li key={reward.id} className="flex items-center justify-between px-2 py-1">
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
                    <label htmlFor="discountCode" className="block text-sm font-medium text-[var(--text-main)] mb-2">
                      Discount Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="discountCode"
                        value={discountCodeInput}
                        onChange={(e) => {
                          setDiscountCodeInput(e.target.value.toUpperCase())
                          setDiscountError('')
                        }}
                        onKeyPress={(e) => {
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
                        disabled={validatingDiscount || placingOrder || orderSuccess || !discountCodeInput.trim()}
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
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[var(--text-main)]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-green-400">FREE</span>
                    ) : (
                      <span className="text-[var(--text-main)]">{formatCurrency(shipping)}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Tax ({Math.round(taxRatePercent)}%)</span>
                  <span className="font-semibold text-[var(--text-main)]">{formatCurrency(tax)}</span>
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
                    <span className="text-2xl font-bold text-accent">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

            {createdOrderId && trackingStatus && enableOrderTracking && (
              <div 
                ref={trackingRef} 
                className="mt-6 space-y-3 rounded-2xl border border-theme p-4"
                style={{
                  backgroundColor: isLightTheme
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-muted">Order tracker</span>
                  <Link
                    to="/order-history"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80"
                  >
                    Order history
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="rounded-xl bg-[var(--bg-main)] p-3">
                  <OrderTimeline status={trackingStatus} />
                </div>
              </div>
            )}

              {/* Security Badge */}
              <div className="flex items-center justify-center text-sm text-muted mt-4 pt-4 border-t border-theme">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Checkout
              </div>
            </div>
          </div>
        </div>
        )}
      </motion.section>
      </motion.main>

      {/* Payment Success Modal - Render outside main to ensure it's always visible */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        orderId={createdOrderId}
        orderTotal={grandTotal}
        currencySymbol={CURRENCY_SYMBOL}
        onClose={handleModalClose}
      />

      {/* Guest Account Conversion Modal */}
      {showConversionModal && guestCheckoutData && (
        <GuestAccountConversionModal
          isOpen={showConversionModal}
          onClose={() => {
            setShowConversionModal(false)
            // Reset payment success flag
            isProcessingPaymentSuccess.current = false
            setOrderSuccess(false)
            navigate('/')
          }}
          guestEmail={guestCheckoutData.email}
          orderId={guestCheckoutData.orderId}
          guestSessionId={guestCheckoutData.guestSessionId}
        />
      )}
    </>
  )
}

export default Checkout

