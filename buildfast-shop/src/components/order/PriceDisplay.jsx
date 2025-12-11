import PropTypes from 'prop-types';
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils';

/**
 * Enhanced Price Display Component
 * Shows unit price, quantity, and total with visual breakdown
 */
const PriceDisplay = ({
  unitPrice,
  quantity,
  currency = 'BDT',
  showBreakdown = true,
  size = 'default',
}) => {
  const total = unitPrice * quantity;
  const sizeClasses = {
    small: 'cart-price-display-small',
    default: 'cart-price-display-default',
    large: 'cart-price-display-large',
  };

  return (
    <div className="cart-price-display">
      {showBreakdown && quantity > 1 && (
        <div className="cart-price-breakdown">
          <span>
            {getCurrencySymbol(currency)}{formatPrice(unitPrice, 0)} × {quantity}
          </span>
        </div>
      )}
      <div className={`cart-price-total ${sizeClasses[size]}`}>
        {getCurrencySymbol(currency)}{formatPrice(total, 0)}
      </div>
      {showBreakdown && quantity === 1 && (
        <div className="cart-price-unit">
          {getCurrencySymbol(currency)}{formatPrice(unitPrice, 0)} each
        </div>
      )}
    </div>
  );
};

PriceDisplay.propTypes = {
  unitPrice: PropTypes.number.isRequired,
  quantity: PropTypes.number.isRequired,
  currency: PropTypes.string,
  showBreakdown: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'default', 'large']),
};

export default PriceDisplay;

