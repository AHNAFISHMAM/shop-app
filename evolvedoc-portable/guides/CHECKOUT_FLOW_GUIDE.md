# Checkout Flow Development Guide

## 📋 Overview

Complete guide for building production-ready checkout flows, based on real patterns from buildfast-shop.

---

## 🏗️ Architecture

### Feature-Based Structure

**Real Structure from buildfast-shop:**

```
src/pages/Checkout/
├── Checkout.tsx                    # Main checkout page
├── components/                     # Checkout-specific components
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
├── hooks/                          # Checkout business logic
│   ├── useCheckoutOrder.ts         # Order placement & payment
│   ├── useCheckoutCalculations.ts  # Price calculations
│   └── useCheckoutRealtime.ts     # Real-time updates
├── utils/                          # Checkout utilities
│   ├── calculations.ts
│   ├── formatting.ts
│   └── validation.ts
├── constants.ts                    # Checkout constants
└── types.ts                        # Checkout type definitions
```

---

## 💳 Payment Integration

### Payment Intent Creation

**Real Example from buildfast-shop:**

```typescript
// src/pages/Checkout/hooks/useCheckoutOrder.ts
const handlePlaceOrder = useCallback(async (e: React.FormEvent) => {
  e.preventDefault()
  setPlacingOrder(true)
  
  try {
    // 1. Create order first (before payment)
    const orderResult = await createOrderWithItems({
      userId: user?.id,
      cartItems,
      shippingAddress,
      grandTotal,
      subtotal,
      shipping,
      tax,
      discountAmount,
      // ... other order data
    })
    
    if (!orderResult.success || !orderResult.orderId) {
      throw new Error(orderResult.error || 'Failed to create order')
    }
    
    // 2. Create Stripe Payment Intent via Edge Function (secure)
    const paymentResponse = await edgeFunctionClient.invoke('create-payment-intent', {
      amount: Number(grandTotal.toFixed(2)),
      currency: CURRENCY_CODE, // 'usd'
      orderId: orderResult.orderId,
      customerEmail: user?.email || guestEmail,
    })
    
    if (!paymentResponse.success || !paymentResponse.data?.clientSecret) {
      throw new Error(paymentResponse.message || 'Failed to initialize payment')
    }
    
    // 3. Set payment intent for Stripe Elements
    setCreatedOrderId(orderResult.orderId)
    setClientSecret(paymentResponse.data.clientSecret)
    setShowPayment(true)
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error 
      ? err.message 
      : 'Failed to place order'
    handlePaymentError(new Error(errorMessage))
  } finally {
    setPlacingOrder(false)
  }
}, [/* dependencies */])
```

**Key Points:**
- Create order before payment intent
- Use edge function for secure payment intent creation
- Never expose secret keys in frontend
- Handle errors gracefully

### Payment Success Handling

**Real Example:**

```typescript
const handlePaymentSuccess = useCallback(async () => {
  try {
    // Update order status to paid
    await updateOrderStatus(createdOrderId, 'paid')
    
    // Clear cart (user or guest)
    if (user) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
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
}, [createdOrderId, user, navigate])
```

---

## 🧮 Order Calculations

### Calculation Hook Pattern

**Real Example from buildfast-shop:**

```typescript
// src/pages/Checkout/hooks/useCheckoutCalculations.ts
export function useCheckoutCalculations({
  cartItems,
  shippingAddress,
  appliedDiscountCode,
  storeSettings,
}) {
  // Subtotal: sum of all items
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = parsePrice(item.price || item.resolvedProduct?.price || 0)
      return sum + (price * item.quantity)
    }, 0)
  }, [cartItems])
  
  // Shipping: free if over threshold
  const shipping = useMemo(() => {
    if (storeSettings.free_shipping_threshold && 
        subtotal >= storeSettings.free_shipping_threshold) {
      return 0
    }
    return storeSettings.shipping_cost || 0
  }, [subtotal, storeSettings])
  
  // Tax: calculated on subtotal + shipping
  const tax = useMemo(() => {
    const taxableAmount = subtotal + shipping
    return taxableAmount * (storeSettings.tax_rate / 100)
  }, [subtotal, shipping, storeSettings.tax_rate])
  
  // Discount: percentage or fixed
  const discountAmount = useMemo(() => {
    if (!appliedDiscountCode) return 0
    
    if (appliedDiscountCode.discount_type === 'percentage') {
      const discount = subtotal * (appliedDiscountCode.discount_value / 100)
      // Apply max discount if set
      return appliedDiscountCode.max_discount_amount
        ? Math.min(discount, appliedDiscountCode.max_discount_amount)
        : discount
    } else {
      // Fixed discount
      return Math.min(appliedDiscountCode.discount_value, subtotal)
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

---

## 👤 Guest Checkout

### Guest Flow Pattern

**Real Example from buildfast-shop:**

```typescript
// Guest choice and email collection
const [isGuest, setIsGuest] = useState(false)
const [guestEmail, setGuestEmail] = useState('')
const [showGuestEmail, setShowGuestEmail] = useState(false)

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
      if (validateEmail(guestEmail)) {
        setShowGuestEmail(false)
      }
    }}
  />
)}

// Guest order creation
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
    order_total: grandTotal,
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

## 🔄 Real-time Updates

### Checkout Real-time Hook

**Real Example from buildfast-shop:**

```typescript
// src/pages/Checkout/hooks/useCheckoutRealtime.ts
export function useCheckoutRealtime({
  cartItems,
  user,
  showPayment,
  placingOrder,
  refetchCart,
  refetchAddresses,
  onProductUpdate,
}: UseCheckoutRealtimeOptions) {
  const channelsRef = useRef<Array<ReturnType<typeof supabase.channel>>>([])
  
  useEffect(() => {
    // Don't subscribe during payment or if no user
    if (!user || showPayment || placingOrder) return
    
    const channels: Array<ReturnType<typeof supabase.channel>> = []
    
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
        
        // Debounced refetch
        if (refetchCart) {
          setTimeout(() => refetchCart(), 500)
        }
      })
      .subscribe()
    
    // Subscribe to address updates
    const addressesChannel = supabase
      .channel('checkout-addresses-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'addresses',
        filter: `user_id=eq.${user.id}`,
      }, (payload: unknown) => {
        if (refetchAddresses) {
          setTimeout(() => refetchAddresses(), 500)
        }
      })
      .subscribe()
    
    channels.push(cartChannel, addressesChannel)
    channelsRef.current = channels
    
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [user, showPayment, placingOrder, refetchCart, refetchAddresses])
}
```

---

## ✅ Validation Patterns

### Address Validation

**Real Example:**

```typescript
// src/pages/Checkout/utils/validation.ts
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
): { missing: string[]; errors: string[] } => {
  const required = [
    'fullName',
    'streetAddress',
    'city',
    'stateProvince',
    'postalCode',
    'country',
    'phoneNumber',
  ]
  
  const missing = required.filter(field => !address[field]?.trim())
  const errors: string[] = []
  
  // Email validation if provided
  if (address.email && !validateEmail(address.email)) {
    errors.push('Invalid email address')
  }
  
  return { missing, errors }
}
```

---

## 🎯 Best Practices

1. **Order Before Payment**: Always create order before payment intent
2. **Secure Payment**: Use edge functions for payment intent creation
3. **Error Recovery**: Provide retry mechanisms for failed operations
4. **Real-time Sync**: Keep cart and addresses in sync with real-time
5. **Guest Support**: Support both authenticated and guest checkout
6. **Validation**: Validate at each step before proceeding
7. **Type Safety**: Use strict TypeScript types throughout
8. **User Feedback**: Show loading states and progress indicators

---

## 📚 Related Resources

- EvolveDoc: `master-prompts/MASTER_CHECKOUT_FLOW_PROMPT.md`
- EvolveDoc: `master-prompts/MASTER_STRIPE_PAYMENT_PROMPT.md`
- EvolveDoc: `master-prompts/MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md`

---

**Last Updated:** 2025-01-27  
**Version:** 1.4.0  
**Based on:** buildfast-shop checkout implementation

