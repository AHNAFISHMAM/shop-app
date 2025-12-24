# STEP 8: Payment Integration

## 📋 What This Step Does

Sets up payment processing integration (Stripe, PayPal, etc.) with secure payment handling patterns. This step is optional but recommended for e-commerce or payment-enabled applications.

**⭐ Before starting:** Ensure you have a payment provider account (Stripe, PayPal, etc.) and API keys.

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I'm setting up payment integration in my project. Please:

1. Create environment variable template (.env.example):
   - VITE_STRIPE_PUBLISHABLE_KEY=your-publishable-key (or similar for other providers)
   - Add note about server-side keys (never expose in frontend)

2. Install payment provider SDK:
   - For Stripe: @stripe/stripe-js and @stripe/react-stripe-js
   - For PayPal: @paypal/react-paypal-js (or similar)
   - Add to package.json dependencies

3. Create payment configuration file:
   - src/lib/payment.ts or src/config/payment.ts
   - Initialize payment provider client
   - Export payment utilities

4. Create payment components (if using React):
   - src/components/payment/ or src/features/payment/
   - Payment form components
   - Payment success/error handling

5. Create payment hooks (if using React):
   - src/hooks/usePayment.ts or src/features/payment/hooks/
   - Payment processing logic
   - Error handling
   - Success callbacks

6. Set up payment intent creation (server-side):
   - Create API endpoint or serverless function
   - Secure payment intent creation
   - Never expose secret keys in frontend

7. Add payment types (TypeScript):
   - src/types/payment.ts
   - Payment method types
   - Payment result types
   - Error types

8. Create payment utilities:
   - Format currency
   - Validate payment data
   - Handle payment errors

9. Add security best practices:
   - Never store payment details
   - Use payment intents/tokens
   - Validate on server-side
   - Use HTTPS only

10. Update README with payment setup:
    - Payment provider setup instructions
    - Environment variable documentation
    - Security considerations

My project path is: [YOUR_PROJECT_PATH]
My payment provider: [STRIPE/PAYPAL/OTHER]
My payment provider account: [SETUP/NOT_SETUP]
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] Payment provider SDK is installed
- [ ] Environment variables are set up
- [ ] Payment client is initialized
- [ ] Payment components/hooks are created
- [ ] TypeScript types are defined
- [ ] Server-side payment intent creation is set up
- [ ] Security best practices are followed
- [ ] README includes payment setup instructions

---

## 📝 Manual Steps (if needed)

### 1. Install Stripe (Example)

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Create Payment Client

```typescript
// src/lib/payment.ts
import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key')
}

export const stripePromise = loadStripe(stripePublishableKey)
```

### 3. Create Payment Component

```typescript
// src/components/payment/PaymentForm.tsx
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/payment'

export function PaymentForm({ clientSecret, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      {/* Payment form components */}
    </Elements>
  )
}
```

### 4. Set Up Environment Variables

```bash
# .env.example
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# .env (create from .env.example)
cp .env.example .env
# Then fill in your actual values
```

---

## 🎯 Common Patterns

### Payment Intent Creation (Server-Side)

```typescript
// API endpoint or serverless function
// NEVER do this in frontend code

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function createPaymentIntent(amount: number, currency: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
  })
  
  return { clientSecret: paymentIntent.client_secret }
}
```

### Payment Processing Hook

**Real Example from buildfast-shop (useCheckoutOrder hook):**

```typescript
// src/pages/Checkout/hooks/useCheckoutOrder.ts
export function useCheckoutOrder({
  user,
  cartItems,
  shippingAddress,
  grandTotal,
  // ... other options
}: UseCheckoutOrderOptions) {
  const [placingOrder, setPlacingOrder] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  
  const handlePlaceOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setPlacingOrder(true)
    
    try {
      // 1. Create order first
      const orderResult = await createOrderWithItems({
        userId: user?.id,
        cartItems,
        shippingAddress,
        grandTotal,
        // ... other order data
      })
      
      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || 'Failed to create order')
      }
      
      // 2. Create Stripe Payment Intent via Edge Function
      const paymentResponse = await edgeFunctionClient.invoke('create-payment-intent', {
        amount: Number(grandTotal.toFixed(2)),
        currency: 'usd',
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
  
  const handlePaymentSuccess = useCallback(async () => {
    try {
      // Update order status to paid
      await updateOrderStatus(createdOrderId, 'paid')
      
      // Clear cart
      if (user) {
        await clearUserCart(user.id)
      } else {
        clearGuestCart()
      }
      
      // Show success
      setShowSuccessModal(true)
      
    } catch (error) {
      handlePaymentError(error)
    }
  }, [createdOrderId, user])
  
  return {
    placingOrder,
    clientSecret,
    createdOrderId,
    handlePlaceOrder,
    handlePaymentSuccess,
    handlePaymentError,
  }
}
```

**Key Features:**
- Order creation before payment
- Payment intent via secure edge function
- Error handling with user-friendly messages
- Cart cleanup on success

### Error Handling

```typescript
// Payment error handling
function handlePaymentError(error: unknown) {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('card')) {
      return 'Card declined. Please check your card details.'
    }
    if (error.message.includes('network')) {
      return 'Network error. Please try again.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}
```

---

## 🔒 Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Use payment intents** instead of direct charges
3. **Validate on server-side** before processing
4. **Use HTTPS** for all payment operations
5. **Don't store payment details** - use tokens
6. **Implement rate limiting** on payment endpoints
7. **Log payment attempts** for security auditing
8. **Use webhooks** for payment status updates

---

## 🔗 Next Steps

After completing this step:

1. **STEP_5_VERIFY_SETUP.md** - Verify your setup works
2. Continue with your application development
3. Test payment flow in sandbox/test mode

---

## 📚 Related Documentation

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [PayPal Developer Docs](https://developer.paypal.com/docs)
- EvolveDoc: `master-prompts/MASTER_STRIPE_PAYMENT_PROMPT.md`
- EvolveDoc: `master-prompts/MASTER_CHECKOUT_FLOW_PROMPT.md`

---

## ⚠️ Important Notes

- **Test Mode**: Always test in sandbox/test mode first
- **PCI Compliance**: Follow PCI DSS guidelines if handling card data
- **Error Handling**: Always handle payment errors gracefully
- **User Experience**: Provide clear feedback during payment process
- **Refunds**: Implement refund handling if needed

---

**Note:** This step is optional. Skip if your project doesn't need payment processing.

