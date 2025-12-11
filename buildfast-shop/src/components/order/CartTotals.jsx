import PropTypes from 'prop-types';
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils';

/**
 * Enhanced Cart Totals Component
 * Displays price breakdown with trust badges and promo code
 */
const CartTotals = ({
  subtotal,
  deliveryFee,
  total,
  currency = 'BDT',
  discount = 0,
  showTrustBadges = true,
}) => {
  return (
    <div className="cart-totals">
      {/* Price Breakdown */}
      <div className="cart-totals-breakdown">
        <div className="cart-totals-row">
          <span className="cart-totals-label">Subtotal</span>
          <span className="cart-totals-value">
            {getCurrencySymbol(currency)}{formatPrice(subtotal, 0)}
          </span>
        </div>

        {discount > 0 && (
          <div className="cart-totals-row">
            <span className="cart-totals-discount">Discount</span>
            <span className="cart-totals-discount">
              -{getCurrencySymbol(currency)}{formatPrice(discount, 0)}
            </span>
          </div>
        )}

        <div className="cart-totals-row">
          <span className="cart-totals-label">Delivery</span>
          <span className="cart-totals-value">
            {deliveryFee === 0 ? (
              <span className="cart-totals-delivery-free">FREE</span>
            ) : (
              `${getCurrencySymbol(currency)}${formatPrice(deliveryFee, 0)}`
            )}
          </span>
        </div>

        <div className="cart-totals-total">
          <div className="cart-totals-total-row">
            <span className="cart-totals-total-label">Total</span>
            <span className="cart-totals-total-value">
              {getCurrencySymbol(currency)}{formatPrice(total, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      {showTrustBadges && (
        <div className="cart-trust-badges">
          <div className="cart-trust-badge">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Secure Checkout</span>
          </div>
          <div className="cart-trust-badge">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Money Back</span>
          </div>
        </div>
      )}
    </div>
  );
};

CartTotals.propTypes = {
  subtotal: PropTypes.number.isRequired,
  deliveryFee: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  currency: PropTypes.string,
  discount: PropTypes.number,
  showTrustBadges: PropTypes.bool,
};

export default CartTotals;

