/**
 * PaymentSection Component
 *
 * Stripe payment form wrapper and security info.
 */

import { Elements } from '@stripe/react-stripe-js'
import StripeCheckoutForm from '../../../components/StripeCheckoutForm'
import { stripePromise } from '../../../lib/stripe'
import { CURRENCY_SYMBOL } from '../constants'

interface PaymentSectionProps {
  showPayment: boolean
  clientSecret: string
  orderId: string | null
  amount: number
  onSuccess: () => void
  onError: (error: Error) => void
  orderSuccess: boolean
  isLightTheme: boolean
}

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
      <div
        className="glow-surface glow-strong border border-theme rounded-xl p-6 mt-6"
        style={{
          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
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
          <h2 className="text-xl font-bold text-[var(--text-main)]">Payment Information</h2>
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret: clientSecret || '' }}>
          {orderId && (
            <StripeCheckoutForm
              orderId={orderId}
              amount={amount}
              currencySymbol={CURRENCY_SYMBOL}
              onSuccess={onSuccess}
              onError={(error: string | Error) => {
                const errorMessage = typeof error === 'string' ? error : error.message
                onError(new Error(errorMessage))
              }}
            />
          )}
        </Elements>
      </div>

      {/* Security Info */}
      {!orderSuccess && (
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
              <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">Secure Payment</h3>
              <p className="text-muted">
                Your payment information is processed securely through Stripe. We never store your
                credit card details.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
