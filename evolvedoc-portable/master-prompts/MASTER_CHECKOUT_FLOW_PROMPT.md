# 🛒 Master Checkout Flow Prompt

> **Comprehensive guide for building production-ready multi-step checkout flows with payment integration**

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Multi-Step Flow Design](#multi-step-flow-design)
3. [State Management](#state-management)
4. [Payment Integration](#payment-integration)
5. [Guest Checkout](#guest-checkout)
6. [Address Management](#address-management)
7. [Order Calculations](#order-calculations)
8. [Discount Codes](#discount-codes)
9. [Error Handling](#error-handling)
10. [Real-time Updates](#real-time-updates)
11. [Testing Patterns](#testing-patterns)

---

## 1. Architecture Overview

### Feature-Based Structure

```
src/pages/Checkout/
├── Checkout.tsx              # Main checkout page component
├── components/               # Checkout-specific components
│   ├── CheckoutHeader.tsx
│   ├── FulfillmentSection.tsx
│   ├── GuestChoiceSection.tsx
│   ├── GuestEmailSection.tsx
│   ├── OrderError.tsx
│   ├── OrderItemsList.tsx
│   ├── OrderSummarySidebar.tsx
│   ├── PaymentSection.tsx
│   ├── SavedAddressDisplay.tsx
│   └── ShippingAddressForm.tsx
├── hooks/                    # Checkout-specific hooks
│   ├── useCheckoutOrder.ts
│   ├── useCheckoutCalculations.ts
│   └── useCheckoutRealtime.ts
├── utils/                    # Checkout utilities
│   ├── calculations.ts
│   ├── formatting.ts
│   └── validation.ts
├── constants.ts             # Checkout constants
└── types.ts                 # Checkout type definitions
```

### Core Principles

1. **Separation of Concerns**: Business logic in hooks, UI in components
2. **Type Safety**: Full TypeScript coverage with strict types
3. **Error Recovery**: Graceful error handling with user-friendly messages
4. **Real-time Updates**: Live updates for cart and order status
5. **Progressive Enhancement**: Works for both authenticated and guest users

---

## 2. Multi-Step Flow Design

### Step Flow Pattern

```typescript
// Checkout flow states
type CheckoutStep = 
  | 'address'      // Shipping address selection/entry
  | 'payment'      // Payment information
  | 'review'       // Order review
  | 'processing'   // Order placement
  | 'success'      // Order confirmation

// State management
const [currentStep, setCurrentStep] = useState<CheckoutStep>('address')
const [showPayment, setShowPayment] = useState(false)
const [placingOrder, setPlacingOrder] = useState(false)
const [orderSuccess, setOrderSuccess] = useState(false)
```

### Step Validation

```typescript
// Validate before proceeding to next step
const canProceedToPayment = useMemo(() => {
  if (!isAddressValid()) return false
  if (placingOrder || orderSuccess) return false
  return true
}, [shippingAddress, placingOrder, orderSuccess])

// Conditional rendering
{!showPayment && (
  <ShippingAddressForm 
    onSubmit={handlePlaceOrder}
    disabled={placingOrder || orderSuccess}
  />
)}

{showPayment && clientSecret && (
  <PaymentSection
    clientSecret={clientSecret}
    onSuccess={handlePaymentSuccess}
    onError={handlePaymentError}
  />
)}
```

---

## 3. State Management

### Custom Hook Pattern

```typescript
// hooks/useCheckoutOrder.ts
export function useCheckoutOrder({
  cartItems,
  user,
  shippingAddress,
  discountCode,
  // ... other dependencies
}) {
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  
  const handlePlaceOrder = useCallback(async () => {
    setPlacingOrder(true)
    setOrderError(null)
    
    try {
      // Order creation logic
      const orderResult = await createOrder(/* ... */)
      
      if (!orderResult.success) {
        throw new Error(orderResult.error)
      }
      
      setCreatedOrderId(orderResult.orderId)
      
      // Create payment intent
      const paymentResult = await createPaymentIntent(/* ... */)
      setClientSecret(paymentResult.clientSecret)
      setShowPayment(true)
      
    } catch (error) {
      handlePaymentError(error)
    } finally {
      setPlacingOrder(false)
    }
  }, [/* dependencies */])
  
  return {
    placingOrder,
    orderError,
    createdOrderId,
    clientSecret,
    handlePlaceOrder,
    handlePaymentSuccess,
    handlePaymentError,
  }
}
```

### State Composition

```typescript
// Combine multiple hooks
const {
  placingOrder,
  orderError,
  createdOrderId,
  clientSecret,
  handlePlaceOrder,
  handlePaymentSuccess,
  handlePaymentError,
} = useCheckoutOrder({
  cartItems: cartItemsWithProducts,
  user,
  shippingAddress,
  appliedDiscountCode,
  // ...
})

const {
  subtotal,
  shipping,
  tax,
  discountAmount,
  grandTotal,
} = useCheckoutCalculations({
  cartItems: cartItemsWithProducts,
  shippingAddress,
  appliedDiscountCode,
  // ...
})
```

---

## 4. Payment Integration

### Stripe Setup

```typescript
// Initialize Stripe
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Payment section component
{showPayment && clientSecret && (
  <Elements stripe={stripePromise} options={{ clientSecret }}>
    <StripeCheckoutForm
      orderId={createdOrderId || ''}
      amount={grandTotal}
      currencySymbol={CURRENCY_SYMBOL}
      onSuccess={handlePaymentSuccess}
      onError={(error: string | Error) => {
        handlePaymentError(error instanceof Error ? error : new Error(error))
      }}
    />
  </Elements>
)}
```

### Payment Intent Creation

```typescript
// Create payment intent on backend
const createPaymentIntent = async (
  orderId: string,
  amount: number,
  currency: string = 'usd'
) => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount, currency }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create payment intent')
  }
  
  const { clientSecret } = await response.json()
  return { clientSecret }
}
```

### Payment Success Handling

```typescript
const handlePaymentSuccess = useCallback(async () => {
  try {
    // Update order status
    await updateOrderStatus(createdOrderId, 'paid')
    
    // Clear cart
    if (user) {
      await clearUserCart(user.id)
    } else {
      clearGuestCart()
    }
    
    // Show success modal
    setShowSuccessModal(true)
    setOrderSuccess(true)
    
    // Redirect after delay
    setTimeout(() => {
      navigate(`/order-confirmation/${createdOrderId}`)
    }, 3000)
  } catch (error) {
    handlePaymentError(error)
  }
}, [createdOrderId, user])
```

---

## 5. Guest Checkout

### Guest Flow Pattern

```typescript
// Guest choice component
const [isGuest, setIsGuest] = useState(false)
const [guestEmail, setGuestEmail] = useState('')

{!user && (
  <GuestChoiceSection
    onGuestChoice={(choice: boolean) => {
      setIsGuest(choice)
      if (choice) {
        setShowGuestEmail(true)
      }
    }}
  />
)}

{isGuest && showGuestEmail && (
  <GuestEmailSection
    email={guestEmail}
    onChange={setGuestEmail}
    onSubmit={() => {
      // Validate email and proceed
      if (isValidEmail(guestEmail)) {
        setShowGuestEmail(false)
      }
    }}
  />
)}
```

### Guest Order Creation

```typescript
// Create guest order
const createGuestOrder = async (
  cartItems: CartItem[],
  shippingAddress: ShippingAddress,
  guestEmail: string,
  guestSessionId: string
) => {
  const orderData = {
    is_guest: true,
    customer_email: guestEmail,
    guest_session_id: guestSessionId,
    shipping_address: shippingAddress,
    order_items: cartItems.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
    })),
    // ... other order data
  }
  
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

---

## 6. Address Management

### Saved Addresses

```typescript
// Fetch saved addresses
const { data: savedAddresses, refetch: refetchAddresses } = useQuery({
  queryKey: ['addresses', user?.id],
  queryFn: () => fetchUserAddresses(user?.id),
  enabled: !!user,
})

// Address selection
const [selectedSavedAddress, setSelectedSavedAddress] = 
  useState<SavedAddress | null>(null)
const [useManualAddress, setUseManualAddress] = useState(false)

// Use saved address or manual entry
const shippingAddress = useMemo(() => {
  if (selectedSavedAddress && !useManualAddress) {
    return {
      fullName: selectedSavedAddress.full_name,
      streetAddress: selectedSavedAddress.street_address,
      city: selectedSavedAddress.city,
      stateProvince: selectedSavedAddress.state_province,
      postalCode: selectedSavedAddress.postal_code,
      country: selectedSavedAddress.country,
      phoneNumber: selectedSavedAddress.phone_number,
    }
  }
  return manualShippingAddress
}, [selectedSavedAddress, useManualAddress, manualShippingAddress])
```

### Address Validation

```typescript
// utils/validation.ts
export const isAddressValid = (address: ShippingAddress): boolean => {
  return !!(
    address.fullName?.trim() &&
    address.streetAddress?.trim() &&
    address.city?.trim() &&
    address.stateProvince?.trim() &&
    address.postalCode?.trim() &&
    address.country?.trim() &&
    address.phoneNumber?.trim()
  )
}

export const getMissingAddressFields = (
  address: ShippingAddress
): string[] => {
  const required = [
    'fullName',
    'streetAddress',
    'city',
    'stateProvince',
    'postalCode',
    'country',
    'phoneNumber',
  ]
  
  return required.filter(field => !address[field]?.trim())
}
```

---

## 7. Order Calculations

### Calculation Hook

```typescript
// hooks/useCheckoutCalculations.ts
export function useCheckoutCalculations({
  cartItems,
  shippingAddress,
  appliedDiscountCode,
  storeSettings,
}) {
  // Subtotal
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
  }, [cartItems])
  
  // Shipping
  const shipping = useMemo(() => {
    if (storeSettings.free_shipping_threshold && 
        subtotal >= storeSettings.free_shipping_threshold) {
      return 0
    }
    return storeSettings.shipping_cost || 0
  }, [subtotal, storeSettings])
  
  // Tax
  const tax = useMemo(() => {
    const taxableAmount = subtotal + shipping
    return taxableAmount * (storeSettings.tax_rate / 100)
  }, [subtotal, shipping, storeSettings.tax_rate])
  
  // Discount
  const discountAmount = useMemo(() => {
    if (!appliedDiscountCode) return 0
    
    if (appliedDiscountCode.discount_type === 'percentage') {
      return subtotal * (appliedDiscountCode.discount_value / 100)
    } else {
      return Math.min(
        appliedDiscountCode.discount_value,
        subtotal
      )
    }
  }, [appliedDiscountCode, subtotal])
  
  // Grand total
  const grandTotal = useMemo(() => {
    return subtotal + shipping + tax - discountAmount
  }, [subtotal, shipping, tax, discountAmount])
  
  return {
    subtotal,
    shipping,
    tax,
    discountAmount,
    grandTotal,
    taxRatePercent: storeSettings.tax_rate,
  }
}
```

### Calculation Utilities

```typescript
// utils/calculations.ts
export const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity))
  }, 0)
}

export const calculateShipping = (
  subtotal: number,
  settings: StoreSettings
): number => {
  if (settings.free_shipping_threshold && 
      subtotal >= settings.free_shipping_threshold) {
    return 0
  }
  return settings.shipping_cost || 0
}

export const calculateTax = (
  amount: number,
  taxRate: number
): number => {
  return amount * (taxRate / 100)
}

export const calculateDiscount = (
  subtotal: number,
  discountCode: DiscountCode | null
): number => {
  if (!discountCode) return 0
  
  if (discountCode.discount_type === 'percentage') {
    const discount = subtotal * (discountCode.discount_value / 100)
    return discountCode.max_discount_amount
      ? Math.min(discount, discountCode.max_discount_amount)
      : discount
  } else {
    return Math.min(discountCode.discount_value, subtotal)
  }
}
```

---

## 8. Discount Codes

### Discount Code Application

```typescript
// Discount code state
const [discountCodeInput, setDiscountCodeInput] = useState('')
const [appliedDiscountCode, setAppliedDiscountCode] = 
  useState<DiscountCode | null>(null)
const [validatingDiscount, setValidatingDiscount] = useState(false)
const [discountError, setDiscountError] = useState('')

// Validate and apply discount code
const handleApplyDiscountCode = useCallback(async () => {
  if (!discountCodeInput.trim()) return
  
  setValidatingDiscount(true)
  setDiscountError('')
  
  try {
    const result = await validateDiscountCode(
      discountCodeInput.trim().toUpperCase(),
      subtotal
    )
    
    if (result.success && result.discount) {
      setAppliedDiscountCode(result.discount)
      setDiscountCodeInput('')
    } else {
      setDiscountError(result.error || 'Invalid discount code')
    }
  } catch (error) {
    setDiscountError('Failed to validate discount code')
  } finally {
    setValidatingDiscount(false)
  }
}, [discountCodeInput, subtotal])

// Remove discount code
const handleRemoveDiscountCode = useCallback(() => {
  setAppliedDiscountCode(null)
  setDiscountCodeInput('')
  setDiscountError('')
}, [])
```

### Discount Code Validation

```typescript
// Validate discount code
const validateDiscountCode = async (
  code: string,
  orderSubtotal: number
): Promise<{
  success: boolean
  discount?: DiscountCode
  error?: string
}> => {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    return { success: false, error: 'Discount code not found' }
  }
  
  // Check minimum order amount
  if (data.min_order_amount && orderSubtotal < data.min_order_amount) {
    return {
      success: false,
      error: `Minimum order amount: ${formatCurrency(data.min_order_amount)}`,
    }
  }
  
  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { success: false, error: 'Discount code has expired' }
  }
  
  return { success: true, discount: data }
}
```

---

## 9. Error Handling

### Error State Management

```typescript
// Error handling in checkout hook
const [orderError, setOrderError] = useState<string | null>(null)

const handlePaymentError = useCallback((error: string | Error) => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : error
  
  setOrderError(errorMessage)
  setPlacingOrder(false)
  setShowPayment(false)
  
  // Auto-clear error after 5 seconds
  setTimeout(() => {
    setOrderError(null)
  }, 5000)
}, [])

// Error display component
{orderError && (
  <OrderError
    message={orderError}
    onDismiss={() => setOrderError(null)}
  />
)}
```

### Error Recovery

```typescript
// Retry logic for failed operations
const handlePlaceOrder = useCallback(async (retryCount = 0) => {
  const MAX_RETRIES = 3
  
  try {
    await createOrder(/* ... */)
  } catch (error) {
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      )
      return handlePlaceOrder(retryCount + 1)
    }
    handlePaymentError(error)
  }
}, [/* dependencies */])

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('ECONNREFUSED')
  }
  return false
}
```

---

## 10. Real-time Updates

### Real-time Subscription Hook

```typescript
// hooks/useCheckoutRealtime.ts
export function useCheckoutRealtime({
  cartItems,
  user,
  showPayment,
  placingOrder,
  refetchCart,
  refetchAddresses,
  onProductUpdate,
}) {
  useEffect(() => {
    if (!user || showPayment || placingOrder) return
    
    // Subscribe to cart updates
    const cartChannel = supabase
      .channel('checkout-cart-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload: unknown) => {
        const typedPayload = payload as {
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }
        logger.log('Cart updated in checkout:', typedPayload)
        if (refetchCart) {
          setTimeout(() => refetchCart(), 500)
        }
      })
      .subscribe()
    
    // Subscribe to product updates
    const productChannel = supabase
      .channel('checkout-product-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
      }, (payload: unknown) => {
        onProductUpdate(payload)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(cartChannel)
      supabase.removeChannel(productChannel)
    }
  }, [user, showPayment, placingOrder, refetchCart, onProductUpdate])
}
```

---

## 11. Testing Patterns

### Unit Tests for Calculations

```typescript
// utils/calculations.test.ts
import { describe, it, expect } from 'vitest'
import {
  calculateSubtotal,
  calculateShipping,
  calculateTax,
  calculateDiscount,
} from './calculations'

describe('Checkout Calculations', () => {
  it('calculates subtotal correctly', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ]
    expect(calculateSubtotal(items)).toBe(35)
  })
  
  it('applies free shipping threshold', () => {
    const settings = {
      shipping_cost: 10,
      free_shipping_threshold: 50,
    }
    expect(calculateShipping(60, settings)).toBe(0)
    expect(calculateShipping(40, settings)).toBe(10)
  })
  
  it('calculates percentage discount', () => {
    const discountCode = {
      discount_type: 'percentage',
      discount_value: 20,
    }
    expect(calculateDiscount(100, discountCode)).toBe(20)
  })
})
```

### Integration Test Pattern

```typescript
// Checkout flow integration test
describe('Checkout Flow', () => {
  it('completes full checkout flow', async () => {
    // 1. Add items to cart
    await addToCart(productId, quantity)
    
    // 2. Navigate to checkout
    await navigate('/checkout')
    
    // 3. Fill shipping address
    await fillShippingAddress(validAddress)
    
    // 4. Apply discount code
    await applyDiscountCode('SAVE10')
    
    // 5. Place order
    await clickPlaceOrder()
    
    // 6. Complete payment
    await completePayment(mockPaymentMethod)
    
    // 7. Verify success
    expect(await screen.findByText('Order Placed!')).toBeInTheDocument()
  })
})
```

---

## 🎯 Best Practices

1. **Type Safety**: Use strict TypeScript types for all checkout data
2. **Error Recovery**: Always provide retry mechanisms for network errors
3. **User Feedback**: Show loading states and progress indicators
4. **Validation**: Validate at each step before proceeding
5. **Security**: Never store payment details, use payment intents
6. **Performance**: Debounce calculations and API calls
7. **Accessibility**: Ensure keyboard navigation and screen reader support
8. **Testing**: Test all calculation paths and error scenarios

---

**Version:** 1.4.0  
**Last Updated:** 2025-01-27  
**Based on:** buildfast-shop checkout implementation

