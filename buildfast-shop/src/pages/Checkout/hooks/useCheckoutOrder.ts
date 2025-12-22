/**
 * useCheckoutOrder Hook
 *
 * Handles order placement, payment intent creation, and payment success flow.
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { parsePrice } from '../../../lib/priceUtils'
import { createOrderWithItems } from '../../../lib/orderService'
import { applyDiscountCodeToOrder } from '../../../lib/discountUtils'
import { getGuestSessionId, clearGuestCart } from '../../../lib/guestSessionUtils'
import { edgeFunctionClient } from '../../../shared/lib'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import { setMessageWithAutoClear } from '../../../utils/messageUtils'
import { CURRENCY_CODE } from '../constants'
import { validateEmail } from '../utils/validation'
import type { ShippingAddress, FulfillmentMode, ScheduledSlot } from '../types'

interface CartItem {
  id: string
  quantity: number
  menu_item_id?: string
  product_id?: string
  price?: number | string
  price_at_purchase?: number | string
  name?: string
  resolvedProduct?: {
    id?: string
    name?: string
    price?: number | string
  } | null
  product?: {
    id?: string
    name?: string
    price?: number | string
  } | null
  resolvedProductType?: 'menu_item' | 'dish' | 'legacy' | null
  variant_id?: string | null
  variantId?: string | null
  combination_id?: string | null
  combinationId?: string | null
  variant_metadata?: unknown
  variantMetadata?: unknown
  variant_snapshot?: unknown
  variant_display?: string | null
}

interface UseCheckoutOrderOptions {
  user: { id: string; email?: string | null } | null
  guestEmail: string
  cartItems: CartItem[]
  shippingAddress: ShippingAddress
  fulfillmentMode: FulfillmentMode
  scheduledSlot: ScheduledSlot
  orderNote: string
  enableMarketingOptins: boolean
  emailUpdatesOptIn: boolean
  smsUpdatesOptIn: boolean
  appliedDiscountCode: unknown | null
  discountAmount: number
  grandTotal: number
  subtotal: number
  shipping: number
  tax: number
  isAddressValid: () => boolean
  getMissingAddressFields: () => { missing: string[]; errors: string[] }
}

interface UseCheckoutOrderReturn {
  placingOrder: boolean
  orderSuccess: boolean
  orderError: string
  showPayment: boolean
  clientSecret: string
  createdOrderId: string | null
  showSuccessModal: boolean
  showConversionModal: boolean
  guestCheckoutData: unknown | null
  trackingStatus: unknown | null
  handlePlaceOrder: (e: React.FormEvent) => Promise<void>
  handlePaymentSuccess: () => Promise<void>
  handlePaymentError: (error: Error) => void
  handleModalClose: () => void
  setShowConversionModal: (show: boolean) => void
  setShowSuccessModal: (show: boolean) => void
  setOrderError: (error: string) => void
}

/**
 * Hook for managing checkout order placement and payment
 */
export function useCheckoutOrder({
  user,
  guestEmail,
  cartItems,
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
}: UseCheckoutOrderOptions): UseCheckoutOrderReturn {
  const navigate = useNavigate()
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [guestCheckoutData, setGuestCheckoutData] = useState<unknown | null>(null)
  const [trackingStatus, setTrackingStatus] = useState<unknown | null>(null)
  
  const errorClearRef = useRef<(() => void) | null>(null)
  const successRedirectRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingPaymentSuccess = useRef(false)

  const handlePlaceOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!isAddressValid()) {
      if (errorClearRef.current) errorClearRef.current()
      const { missing, errors } = getMissingAddressFields()
      let errorMessage = 'Please fill in all required shipping address fields.'
      if (errors.length > 0) {
        errorMessage = errors[0]
      } else if (missing.length > 0) {
        errorMessage = `Missing required fields: ${missing.join(', ')}`
      }
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, errorMessage, 'error', 5000)
      return
    }

    // Validate email
    if (!user) {
      if (!guestEmail.trim()) {
        if (errorClearRef.current) errorClearRef.current()
        errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Please provide your email address.', 'error', 5000)
        return
      }
      if (!validateEmail(guestEmail)) {
        if (errorClearRef.current) errorClearRef.current()
        errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Please provide a valid email address.', 'error', 5000)
        return
      }
    } else {
      if (!user.email || !user.email.trim()) {
        if (errorClearRef.current) errorClearRef.current()
        errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Your account email is missing. Please update your profile.', 'error', 5000)
        return
      }
      if (!validateEmail(user.email)) {
        if (errorClearRef.current) errorClearRef.current()
        errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Your account email is invalid. Please update your profile.', 'error', 5000)
        return
      }
    }

    // Check cart items
    if (cartItems.length === 0) {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Your cart is empty.', 'error', 5000)
      return
    }

    try {
      setPlacingOrder(true)
      setOrderError('')

      if (errorClearRef.current) errorClearRef.current()
      if (successRedirectRef.current) clearTimeout(successRedirectRef.current)

      const customerEmail = user ? user.email! : guestEmail

      // Prepare order items
      const orderItems = cartItems.map(item => {
        const resolvedProduct = item.resolvedProduct || item.product || {
          id: item.menu_item_id || item.product_id || item.id,
          name: item.name || `Item ${item.menu_item_id || item.product_id || item.id}`,
          price: item.price || item.price_at_purchase || 0
        }

        const price = typeof resolvedProduct.price === 'number'
          ? resolvedProduct.price
          : parsePrice(resolvedProduct.price || item.price || item.price_at_purchase || '0')

        if (price <= 0) {
          throw new Error(`Invalid price for product: ${resolvedProduct.name || item.product_id || item.menu_item_id}`)
        }

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
          variant_metadata: variantMetadata as Record<string, unknown> | null | undefined
        }
      })

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
        discountCodeId: appliedDiscountCode ? (appliedDiscountCode as { id: string }).id : null,
        discountAmount: discountAmount,
        guestSessionId,
        isGuest: !user
      })

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      const orderData = { id: orderResult.orderId }
      setTrackingStatus('pending')

      // Apply discount code usage tracking
      if (appliedDiscountCode && discountAmount > 0 && user?.id) {
        const orderSubtotal = subtotal + shipping + tax
        const discountResult = await applyDiscountCodeToOrder(
          (appliedDiscountCode as { id: string }).id,
          user.id,
          orderResult.orderId,
          discountAmount,
          orderSubtotal
        )

        if (!discountResult.success) {
          logger.error('Failed to record discount code usage:', discountResult.error)
        }
      }

      // Create Stripe Payment Intent
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

      setCreatedOrderId(orderData.id)
      setClientSecret(secret)
      setShowPayment(true)

    } catch (err) {
      logger.error('Error placing order:', err)

      let errorMessage = 'Failed to place order. Please try again.'
      if (err instanceof Error && err.message) {
        errorMessage = err.message
      } else if (err && typeof err === 'object' && 'code' in err) {
        if (err.code === '42P01') {
          errorMessage = 'Database tables not found. Please run the migration first.'
        } else if (err.code === '42501') {
          errorMessage = 'Permission denied. Please ensure you are logged in.'
        }
      }

      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, errorMessage, 'error', 8000)
    } finally {
      setPlacingOrder(false)
    }
  }, [
    user,
    guestEmail,
    cartItems,
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
  ])

  const handlePaymentSuccess = useCallback(async () => {
    logger.log('handlePaymentSuccess called', { user: !!user, createdOrderId, grandTotal })
    
    isProcessingPaymentSuccess.current = true
    
    try {
      setTrackingStatus('processing')
      const customerEmail = user ? user.email! : guestEmail
      logger.log('Processing payment success for:', customerEmail)

      if (!user) {
        logger.log('Showing conversion modal for guest')
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
        logger.log('Showing success modal for authenticated user - BEFORE clearing cart', { 
          showSuccessModal: true, 
          createdOrderId, 
          grandTotal 
        })
        setShowPayment(false)
        setShowSuccessModal(true)
        setOrderSuccess(true)
      }

      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            resolve(undefined)
          }, 300)
        })
      })

      try {
        if (user) {
          supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .then(({ error: deleteError }) => {
              if (deleteError) {
                logger.error('Error clearing cart:', deleteError)
              } else {
                logger.log('Cart cleared successfully for authenticated user')
              }
            })
            .catch((cartError: unknown) => {
              logger.error('Error clearing cart:', cartError)
            })
        } else {
          clearGuestCart()
          logger.log('Cart cleared successfully for guest')
        }
      } catch (cartError) {
        logger.error('Error clearing cart:', cartError)
      }

      try {
        const apiUrl = (import.meta as { env?: { VITE_SUPABASE_URL?: string } }).env?.VITE_SUPABASE_URL || ''
        const { data: { session } } = await supabase.auth.getSession()

        const anonKey = (import.meta as { env?: { VITE_SUPABASE_ANON_KEY?: string } }).env?.VITE_SUPABASE_ANON_KEY || ''
        const authHeader = session?.access_token
          ? { 'Authorization': `Bearer ${session.access_token}` }
          : { 'Authorization': `Bearer ${anonKey}` }

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
        logger.error('Failed to send confirmation email:', emailError)
      }

      logger.log('Payment success flow complete - modal should be visible')
    } catch (err) {
      logger.error('Error in handlePaymentSuccess:', err)
      setShowPayment(false)
      isProcessingPaymentSuccess.current = false
    }
  }, [user, guestEmail, createdOrderId, grandTotal])

  const handlePaymentError = useCallback((error: Error) => {
    logger.error('Payment error:', error)
    if (errorClearRef.current) errorClearRef.current()
    errorClearRef.current = setMessageWithAutoClear(
      setOrderError,
      null,
      error.message || 'Payment failed. Please try again.',
      'error',
      8000
    )
  }, [])

  const handleModalClose = useCallback(() => {
    setShowSuccessModal(false)
    setShowConversionModal(false)
    isProcessingPaymentSuccess.current = false
    
    if (successRedirectRef.current) {
      clearTimeout(successRedirectRef.current)
    }
    
    successRedirectRef.current = setTimeout(() => {
      navigate('/order')
    }, 500)
  }, [navigate])

  return {
    placingOrder,
    orderSuccess,
    orderError,
    showPayment,
    clientSecret,
    createdOrderId,
    showSuccessModal,
    showConversionModal,
    guestCheckoutData,
    trackingStatus,
    handlePlaceOrder,
    handlePaymentSuccess,
    handlePaymentError,
    handleModalClose,
    setShowConversionModal,
    setShowSuccessModal,
    setOrderError,
  }
}

