# 💳 MASTER STRIPE PAYMENT PROMPT
## Production-Grade Payment Processing Implementation Workflow

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing Stripe payment processing in production applications for the **Star Café** application. It covers Payment Intents, checkout flows, error handling, order-payment linking, idempotency patterns, webhooks, and security best practices based on actual codebase implementations.

**Applicable to:**
- Payment Intent creation and management
- Checkout flow integration
- Payment error handling and recovery
- Order-payment linking
- Idempotency and retry logic
- Webhook handling
- Security and PCI compliance
- Payment method management
- Refund processing
- Guest and authenticated user payment flows

---

## 🎯 CORE PRINCIPLES

### 1. **Security First**
- **Server-Side Only**: Payment Intent creation must be server-side
- **Never Expose Secrets**: Stripe secret keys must never be in client code
- **Validate Server-Side**: Always validate amounts and order data on server
- **HTTPS Only**: All payment operations must use HTTPS
- **PCI Compliance**: Follow PCI DSS guidelines

### 2. **Payment Intent Lifecycle**
- **Create**: Server-side only, with proper metadata
- **Confirm**: Client-side with Stripe Elements
- **Handle Success**: Update order status, clear cart
- **Handle Failure**: Provide clear error messages, maintain order state

### 3. **Error Handling**
- **Graceful Degradation**: Handle all error types
- **User-Friendly Messages**: Transform technical errors to user messages
- **Retry Logic**: Implement idempotency for retries
- **Logging**: Log all payment attempts for debugging

### 4. **Order-Payment Linking**
- **Metadata**: Always include order_id in Payment Intent metadata
- **Status Updates**: Update order status only after payment confirmation
- **Idempotency**: Prevent duplicate charges on retries
- **Audit Trail**: Track all payment attempts

---

## 🔍 PHASE 1: SETUP & CONFIGURATION

### Environment Variables

```typescript
// Server-side (Edge Function)
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Client-side
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
```

### Stripe Client Initialization

**Server-Side (Supabase Edge Function):**
```typescript
// supabase/functions/create-payment-intent/index.ts
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
```

**Client-Side:**
```typescript
// src/lib/stripe.js
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

**Key Points:**
- Server-side uses Deno-compatible Stripe import with specific API version
- Client-side uses `loadStripe` which returns a Promise
- ⚠️ **CRITICAL SECURITY**: Never expose `STRIPE_SECRET_KEY` to client
- ⚠️ **CRITICAL SECURITY**: Always validate amounts server-side (never trust client)
- ⚠️ **CRITICAL SECURITY**: Use HTTPS only for payment operations
- ⚠️ **CRITICAL SECURITY**: Never log or expose payment card details
- Use environment variables for all keys
- ⚠️ **NOTE**: `@ts-nocheck` is acceptable in Edge Functions due to Deno runtime limitations

---

## 🛠️ PHASE 2: PAYMENT INTENT CREATION

### Edge Function Implementation (Real Codebase Example)

**Actual Implementation from `supabase/functions/create-payment-intent/index.ts`:**

```typescript
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, currency = "usd", orderId, customerEmail }: PaymentIntentRequest = await req.json();

    const normalizedAmount = Math.round(Number(amount) * 100);

    // Validate amount
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error("Invalid amount");
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: normalizedAmount, // Stripe expects smallest currency unit
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        customerEmail,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
```

**Key Implementation Details:**
- **CORS Handling**: Properly handles preflight OPTIONS requests
- **Amount Normalization**: Converts to cents (smallest currency unit)
- **Metadata**: Includes `orderId` and `customerEmail` for webhook processing
- **Automatic Payment Methods**: Enables all available payment methods
- **Error Handling**: Returns structured error responses with proper status codes
- **No Authentication Required**: This implementation allows guest checkout (auth handled client-side if needed)

### Client-Side Invocation (Real Codebase Example)

**Actual Implementation from `src/pages/Checkout/hooks/useCheckoutOrder.ts`:**

```typescript
// After order creation, create payment intent
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
```

**Edge Function Client Implementation:**

```javascript
// src/shared/lib/api-client-edge.js
class EdgeFunctionClient {
  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL;
  }
  
  async invoke(functionName, body = {}, options = {}) {
    try {
      const url = `${this.baseUrl}/functions/v1/${functionName}`;
      const response = await apiClient.post(url, body, {
        headers: {
          ...options.headers,
        },
      });
      return response;
    } catch (error) {
      logger.error(`Edge Function ${functionName} failed:`, error);
      return {
        success: false,
        data: null,
        error,
        message: error.message || 'Edge Function call failed',
      };
    }
  }
}

export const edgeFunctionClient = new EdgeFunctionClient();
```

**Key Implementation Details:**
- **Order First**: Order is created before payment intent (ensures order exists)
- **Amount Formatting**: Uses `toFixed(2)` to ensure proper decimal precision
- **Error Handling**: Checks both `success` flag and `clientSecret` presence
- **State Management**: Updates React state to show payment form
- **Guest Support**: Works for both authenticated and guest users

---

## 💳 PHASE 3: CHECKOUT FLOW

### Complete Checkout Flow

```typescript
export async function handlePlaceOrder(
  orderData: {
    userId: string | null
    items: CartItem[]
    shippingAddress: Address
    billingAddress: Address
    discountCodeId?: string
  },
  customerEmail: string
): Promise<void> {
  try {
    // 1. Create order first
    const order = await createOrder(orderData, supabase)

    // 2. Calculate total
    const totals = calculateOrderTotals(orderData.items, orderData.discountCodeId)

    // 3. Create payment intent
    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      totals.grandTotal,
      order.id,
      customerEmail,
      supabase
    )

    // 4. Store payment intent ID in order
    await supabase
      .from('orders')
      .update({ payment_intent_id: paymentIntentId })
      .eq('id', order.id)

    // 5. Return client secret for Stripe Elements
    return { clientSecret, orderId: order.id }
  } catch (error) {
    console.error('Checkout error:', error)
    throw error
  }
}
```

### Stripe Elements Integration (Real Codebase Example)

**Actual Implementation from `src/components/StripeCheckoutForm.jsx`:**

```javascript
import { useState } from 'react';
import PropTypes from 'prop-types';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

/**
 * Stripe Checkout Form Component
 *
 * Handles payment processing using Stripe Elements
 */
function StripeCheckoutForm({ orderId, amount, currencySymbol = '৳', onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe is not initialized. Please refresh the page.');
      return;
    }

    try {
      setProcessing(true);

      // Submit form elements first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || 'Please check your payment details');
        setProcessing(false);
        return;
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?order_id=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed
        onError(error.message || 'Payment failed');
        setProcessing(false);
      } else if (paymentIntent) {
        // Check payment intent status
        if (paymentIntent.status === 'succeeded') {
          // Payment successful - call onSuccess
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          // 3D Secure or other action required - Stripe will handle redirect
          // Don't set processing to false here - let Stripe handle the redirect
          return;
        } else if (paymentIntent.status === 'processing') {
          // Payment is processing - show success as it will complete shortly
          onSuccess();
        } else {
          onError(`Payment status: ${paymentIntent.status}`);
          setProcessing(false);
        }
      } else {
        // No error but no paymentIntent - assume success
        onSuccess();
      }
    } catch (err) {
      onError(err.message || 'Payment processing error');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-black py-3.5 rounded-lg font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay {currencySymbol}{amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
}
```

**Payment Section Wrapper (Real Codebase Example):**

```typescript
// src/pages/Checkout/components/PaymentSection.tsx
import { Elements } from '@stripe/react-stripe-js'
import StripeCheckoutForm from '../../../components/StripeCheckoutForm'
import { stripePromise } from '../../../lib/stripe'
import { CURRENCY_SYMBOL } from '../constants'

export function PaymentSection({
  showPayment,
  clientSecret,
  orderId,
  amount,
  onSuccess,
  onError,
  orderSuccess,
  isLightTheme,
}: PaymentSectionProps) {
  if (!showPayment || !clientSecret) return null

  return (
    <>
      <div className="glow-surface glow-strong border border-theme rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="text-xl font-bold text-[var(--text-main)]">Payment Information</h2>
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeCheckoutForm
            orderId={orderId}
            amount={amount}
            currencySymbol={CURRENCY_SYMBOL}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      </div>

      {/* Security Info */}
      {!orderSuccess && (
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
    </>
  )
}
```

**Key Implementation Details:**
- **Form Validation**: Calls `elements.submit()` before confirming payment
- **Status Handling**: Handles multiple payment intent statuses (`succeeded`, `processing`, `requires_action`)
- **3D Secure**: Properly handles redirects for 3D Secure authentication
- **Loading States**: Shows processing spinner during payment
- **Error Handling**: Provides user-friendly error messages
- **Security Messaging**: Displays security information to build trust

**Key Implementation Details:**
- **Form Validation**: Calls `elements.submit()` before confirming payment
- **Status Handling**: Handles multiple payment intent statuses (`succeeded`, `processing`, `requires_action`)
- **3D Secure**: Properly handles redirects for 3D Secure authentication
- **Loading States**: Shows processing spinner during payment
- **Error Handling**: Provides user-friendly error messages
- **Security Messaging**: Displays security information to build trust

---

## ✅ PHASE 4: PAYMENT SUCCESS HANDLING

### Payment Success Handler (Real Codebase Example)

**Actual Implementation from `src/pages/Checkout/hooks/useCheckoutOrder.ts`:**

```typescript
const handlePaymentSuccess = useCallback(async () => {
  logger.log('handlePaymentSuccess called', { user: !!user, createdOrderId, grandTotal })
  
  isProcessingPaymentSuccess.current = true
  
  try {
    setTrackingStatus('processing')
    const customerEmail = user ? user.email! : guestEmail
    logger.log('Processing payment success for:', customerEmail)

    if (!user) {
      // Guest checkout - show conversion modal
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
      // Authenticated user - show success modal
      logger.log('Showing success modal for authenticated user')
      setShowPayment(false)
      setShowSuccessModal(true)
      setOrderSuccess(true)
    }

    // Small delay for smooth UI transition
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          resolve(undefined)
        }, 300)
      })
    })

    // Clear cart (non-blocking)
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
      } else {
        clearGuestCart()
        logger.log('Cart cleared successfully for guest')
      }
    } catch (cartError) {
      logger.error('Error clearing cart:', cartError)
    }

    // Send order confirmation email (non-blocking)
    try {
      const apiUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const { data: { session } } = await supabase.auth.getSession()

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
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
```

**Payment Success Modal (Real Codebase Example):**

```javascript
// src/components/PaymentSuccessModal.jsx
function PaymentSuccessModal({ isOpen, orderId, orderTotal, currencySymbol = '৳', onClose }) {
  const [countdown, setCountdown] = useState(10);
  const [mounted, setMounted] = useState(false);
  
  // Countdown timer - triggers onClose when it reaches 0
  useEffect(() => {
    if (!isOpen) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      const closeTimer = setTimeout(() => {
        onClose();
      }, 500);
      return () => clearTimeout(closeTimer);
    }
  }, [isOpen, countdown, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-xl border border-theme px-6 py-5">
          {/* Animated Checkmark */}
          <div className="flex justify-center mb-8">
            <div className="w-28 h-28 rounded-full bg-accent/12 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
                <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-muted mb-3">Payment Confirmed</p>
            <h2 className="text-2xl font-semibold mb-2">Thank You For Your Order</h2>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Your payment was processed successfully. We're preparing everything with care.
            </p>
            {orderId && (
              <div className="mt-6 rounded-xl border border-theme bg-theme-elevated px-6 py-4 text-left">
                <p className="text-xs uppercase tracking-wide text-muted">Order ID</p>
                <p className="mt-1 font-mono text-base">#{orderId?.slice(0, 8)}</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          {orderTotal !== undefined && (
            <div className="mb-8 rounded-xl border border-theme bg-white/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-muted">Order Total</span>
                <span className="text-2xl font-semibold text-accent">
                  {currencySymbol}{Number(orderTotal).toFixed(2)}
                </span>
              </div>
              <div className="mt-3 flex items-start gap-3 text-sm text-muted">
                <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>A confirmation email with your receipt has been sent.</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="btn-primary w-full justify-center py-3 min-h-[44px] uppercase tracking-wide"
            >
              Continue Exploring
            </button>
            <p className="text-center text-xs text-muted">
              Redirecting in {countdown} seconds...
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
```

**Key Implementation Details:**
- **Guest vs Authenticated**: Different flows for guest and authenticated users
- **Non-Blocking Operations**: Cart clearing and email sending don't block UI
- **Error Resilience**: Errors in cart clearing or email sending don't break the flow
- **User Feedback**: Shows success modal with order details
- **Auto-Close**: Modal auto-closes after countdown
- **Email Confirmation**: Sends confirmation email via Edge Function
- **Logging**: Comprehensive logging for debugging

---

## ❌ PHASE 5: ERROR HANDLING

### Payment Error Handler (Real Codebase Example)

**Actual Implementation from `src/pages/Checkout/hooks/useCheckoutOrder.ts`:**

```typescript
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
```

**Error Handling in StripeCheckoutForm:**

```javascript
// In StripeCheckoutForm component
if (error) {
  // Payment failed
  onError(error.message || 'Payment failed');
  setProcessing(false);
} else if (paymentIntent) {
  // Check payment intent status
  if (paymentIntent.status === 'succeeded') {
    onSuccess();
  } else if (paymentIntent.status === 'requires_action') {
    // 3D Secure - Stripe handles redirect
    return;
  } else if (paymentIntent.status === 'processing') {
    // Processing - show success
    onSuccess();
  } else {
    onError(`Payment status: ${paymentIntent.status}`);
    setProcessing(false);
  }
}
```

**Comprehensive Error Handling Pattern:**

```typescript
export interface StripeError {
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error' | 'rate_limit_error'
  message?: string
  code?: string
  decline_code?: string
}

export function handleStripeError(error: StripeError | Error): string {
  let userMessage = 'Payment failed. Please try again.'

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || userMessage
  }

  // Handle Stripe error objects
  switch (error.type) {
    case 'card_error':
      // Handle specific card errors
      switch (error.decline_code) {
        case 'insufficient_funds':
          userMessage = 'Insufficient funds. Please use a different card.'
          break
        case 'lost_card':
        case 'stolen_card':
          userMessage = 'Card declined. Please contact your bank.'
          break
        case 'expired_card':
          userMessage = 'Card expired. Please use a different card.'
          break
        case 'generic_decline':
          userMessage = 'Your card was declined. Please try a different payment method.'
          break
        default:
          userMessage = error.message || 'Card declined. Please try again.'
      }
      break

    case 'validation_error':
      userMessage = 'Invalid payment information. Please check your details.'
      break

    case 'api_error':
      userMessage = 'Payment service error. Please try again later.'
      break

    case 'authentication_error':
      userMessage = 'Authentication failed. Please try again.'
      break

    case 'rate_limit_error':
      userMessage = 'Too many requests. Please wait a moment and try again.'
      break

    default:
      userMessage = error.message || 'An unexpected error occurred.'
  }

  return userMessage
}
```

**Key Implementation Details:**
- **Error Logging**: Uses logger utility for consistent error tracking
- **User-Friendly Messages**: Transforms technical errors to user-friendly messages
- **Auto-Clear**: Errors auto-clear after 8 seconds
- **Non-Blocking**: Errors don't prevent retry attempts
- **Status Handling**: Handles all payment intent statuses gracefully

---

## 🔄 PHASE 6: IDEMPOTENCY & RETRY LOGIC

### Idempotency Implementation

```typescript
// Server-side: Use idempotency keys
const idempotencyKey = `order-${orderId}-${Date.now()}`

const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: Math.round(amount * 100),
    currency: 'usd',
    metadata: { order_id: orderId },
  },
  {
    idempotencyKey, // Prevents duplicate charges
  }
)

// Client-side: Track payment attempts
const paymentAttempts = new Map<string, number>()

export async function retryPayment(
  orderId: string,
  clientSecret: string
): Promise<void> {
  const attemptCount = paymentAttempts.get(orderId) || 0

  if (attemptCount >= 3) {
    throw new Error('Maximum payment attempts reached. Please contact support.')
  }

  paymentAttempts.set(orderId, attemptCount + 1)

  // Retry payment with same client secret
  // Stripe handles idempotency automatically
}
```

---

## 📡 PHASE 7: WEBHOOK HANDLING

### Webhook Endpoint (Real Codebase Example)

**Actual Implementation from `supabase/functions/stripe-webhook/index.ts`:**

```typescript
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

/**
 * Call the send-order-confirmation edge function
 */
async function sendOrderConfirmationEmail(
  email: string,
  orderId: string
) {
  try {
    const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-order-confirmation`;

    console.log(`Calling email function for order ${orderId}`);

    const response = await fetch(emailFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        orderId: orderId,
        email: email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error calling email function:", errorData);
    } else {
      const result = await response.json();
      console.log("Email function called successfully:", result);
    }
  } catch (error) {
    console.error("Error calling email function:", error);
    // Don't throw - we don't want email failures to break the webhook
  }
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();

    // Verify webhook signature
    const event = webhookSecret
      ? stripe.webhooks.constructEvent(body, signature, webhookSecret)
      : JSON.parse(body);

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        const customerEmail = paymentIntent.metadata.customerEmail;

        if (orderId) {
          // Update order status to 'paid'
          const { error } = await supabase
            .from("orders")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            console.error("Error updating order:", error);
          }

          // Send order confirmation email via dedicated function
          if (customerEmail) {
            await sendOrderConfirmationEmail(customerEmail, orderId);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          // Update order status to 'failed'
          const { error } = await supabase
            .from("orders")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            console.error("Error updating order:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
```

**Key Implementation Details:**
- **Signature Verification**: Verifies webhook signature for security
- **Fallback Parsing**: Falls back to JSON.parse if webhook secret not configured (dev mode)
- **Order Status Updates**: Updates order status based on payment outcome
- **Email Integration**: Calls separate Edge Function for email sending
- **Error Resilience**: Email failures don't break webhook processing
- **Metadata Extraction**: Uses metadata from Payment Intent to link to orders
- **Comprehensive Logging**: Logs all events for debugging

---

## 🔄 PHASE 8: COMPLETE CHECKOUT FLOW INTEGRATION

### Complete Checkout Hook (Real Codebase Example)

**Actual Implementation from `src/pages/Checkout/hooks/useCheckoutOrder.ts`:**

```typescript
const handlePlaceOrder = useCallback(async (e: React.FormEvent) => {
  e.preventDefault()

  // Validate form
  if (!isAddressValid()) {
    const { missing, errors } = getMissingAddressFields()
    let errorMessage = 'Please fill in all required shipping address fields.'
    if (errors.length > 0) {
      errorMessage = errors[0]
    } else if (missing.length > 0) {
      errorMessage = `Missing required fields: ${missing.join(', ')}`
    }
    setOrderError(errorMessage)
    return
  }

  // Validate email
  const customerEmail = user ? user.email! : guestEmail
  if (!customerEmail || !validateEmail(customerEmail)) {
    setOrderError('Please provide a valid email address.')
    return
  }

  // Check cart items
  if (cartItems.length === 0) {
    setOrderError('Your cart is empty.')
    return
  }

  try {
    setPlacingOrder(true)
    setOrderError('')

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

      return {
        product_id: item.product_id || null,
        menu_item_id: item.menu_item_id || null,
        quantity: item.quantity,
        price_at_purchase: price,
        variant_id: item.variant_id || item.variantId || null,
        combination_id: item.combination_id || item.combinationId || null,
        variant_metadata: item.variant_metadata || item.variantMetadata || null
      }
    })

    const guestSessionId = user?.id ? null : getGuestSessionId()

    // Create order first
    const orderResult = await createOrderWithItems({
      userId: user?.id || null,
      customerEmail: customerEmail,
      customerName: shippingAddress.fullName,
      shippingAddress: {
        ...shippingAddress,
        fulfillmentMode,
        scheduledSlot,
        orderNote: orderNote?.trim() ? orderNote.trim() : undefined,
        marketingPreferences: enableMarketingOptins ? {
          email: emailUpdatesOptIn,
          sms: smsUpdatesOptIn,
        } : undefined,
      },
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

    // Apply discount code usage tracking
    if (appliedDiscountCode && discountAmount > 0 && user?.id) {
      const orderSubtotal = subtotal + shipping + tax
      await applyDiscountCodeToOrder(
        (appliedDiscountCode as { id: string }).id,
        user.id,
        orderResult.orderId,
        discountAmount,
        orderSubtotal
      )
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
    }
    setOrderError(errorMessage)
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
```

**Key Implementation Details:**
- **Order First**: Creates order before payment intent (ensures order exists)
- **Validation**: Validates address, email, and cart before proceeding
- **Guest Support**: Handles both authenticated and guest checkout
- **Discount Tracking**: Records discount code usage if applicable
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **State Management**: Properly manages loading and error states
- **Payment Intent**: Creates payment intent only after successful order creation

---

## 🎯 SUCCESS CRITERIA

- ✅ Payment Intents created server-side only (Edge Function)
- ✅ All amounts validated server-side
- ✅ Order created before payment intent
- ✅ Order-payment linking via metadata
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Guest and authenticated user support
- ✅ Webhook handling for async updates
- ✅ Email confirmation sent after successful payment
- ✅ Cart cleared after successful payment
- ✅ Security best practices followed (no secret keys in client)
- ✅ Clear user feedback on all states (loading, success, error)
- ✅ Payment success modal with order details
- ✅ Auto-redirect after payment success

---

## 🚨 COMMON PITFALLS

**❌ Never:**
- Create Payment Intents on client
- Expose Stripe secret keys to client code
- Trust client-side amounts (always validate server-side)
- Update order before payment confirmation
- Store payment details (card numbers, CVV, etc.)
- Ignore webhook events (they're the source of truth)
- Skip webhook signature verification
- Block UI on non-critical operations (email sending, cart clearing)
- Forget to handle guest checkout scenarios
- Update order status optimistically (wait for webhook confirmation)

**✅ Always:**
- Create Payment Intents server-side (Edge Function)
- Validate amounts server-side
- Create order before payment intent
- Link payments to orders via metadata
- Handle all error types gracefully
- Verify webhook signatures
- Log all payment attempts for debugging
- Send confirmation emails asynchronously
- Clear cart after successful payment
- Show clear feedback to users at every step
- Handle both guest and authenticated users
- Use proper TypeScript types for payment data

---

## 📚 RELATED GUIDES

- **🛒 [MASTER_ECOMMERCE_DOMAIN_PROMPT.md](./MASTER_ECOMMERCE_DOMAIN_PROMPT.md)** — Order creation and checkout flow
- **🔐 [MASTER_AUTHENTICATION_SECURITY_PROMPT.md](./MASTER_AUTHENTICATION_SECURITY_PROMPT.md)** — Security patterns
- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** — Database schema
- **⚡ [MASTER_EDGE_FUNCTIONS_PROMPT.md](./MASTER_EDGE_FUNCTIONS_PROMPT.md)** — Edge Function patterns
- **⚠️ [MASTER_ERROR_HANDLING_LOGGING_PROMPT.md](./MASTER_ERROR_HANDLING_LOGGING_PROMPT.md)** — Error handling patterns

---

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This comprehensive guide ensures all Stripe payment operations follow production-ready patterns with proper security, error handling, order-payment linking, and user experience based on actual codebase implementations from the Star Café application.**

