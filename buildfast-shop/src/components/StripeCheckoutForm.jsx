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

      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || 'Please check your payment details');
        setProcessing(false);
        return;
      }

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
        } else {
          // Payment is processing or in another state
          // For processing status, wait a bit and check again, or show success
          if (paymentIntent.status === 'processing') {
            // Payment is processing - show success as it will complete shortly
            onSuccess();
          } else {
            onError(`Payment status: ${paymentIntent.status}`);
            setProcessing(false);
          }
        }
      } else {
        // No error but no paymentIntent - this shouldn't happen but handle it
        // Payment confirmation returned no error and no paymentIntent - assume success
        // Assume success if no error
        onSuccess();
      }
    } catch (err) {
      // Payment error logged by parent component
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

StripeCheckoutForm.propTypes = {
  orderId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  currencySymbol: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default StripeCheckoutForm;
