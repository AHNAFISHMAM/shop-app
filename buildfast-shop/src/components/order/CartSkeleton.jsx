import PropTypes from 'prop-types';

/**
 * Cart Skeleton Loader Component
 * Shows loading placeholders for cart items
 */
const CartSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="cart-skeleton cart-skeleton-item">
          <div className="cart-skeleton-container">
            <div className="cart-skeleton cart-skeleton-image" />
            <div className="cart-skeleton-content">
              <div className="cart-skeleton cart-skeleton-text" />
              <div className="cart-skeleton cart-skeleton-text" />
              <div className="cart-skeleton-footer">
                <div className="cart-skeleton cart-skeleton-text cart-skeleton-text-24" />
                <div className="cart-skeleton cart-skeleton-text cart-skeleton-text-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

CartSkeleton.propTypes = {
  count: PropTypes.number,
};

export default CartSkeleton;

