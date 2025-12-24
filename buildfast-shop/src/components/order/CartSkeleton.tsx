/**
 * CartSkeleton component props
 */
interface CartSkeletonProps {
  /** Number of skeleton items to display */
  count?: number
}

/**
 * Cart Skeleton Loader Component
 *
 * Shows loading placeholders for cart items.
 * Used while cart data is being fetched.
 *
 * Features:
 * - Configurable item count
 * - Accessibility compliant (aria-hidden for decorative content)
 */
const CartSkeleton = ({ count = 3 }: CartSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="cart-skeleton cart-skeleton-item"
          aria-hidden="true"
          role="presentation"
        >
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
  )
}

export default CartSkeleton
