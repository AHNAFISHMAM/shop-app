import { Navigate } from 'react-router-dom'

/**
 * Products Page Component
 *
 * Redirects to /menu where products are displayed.
 * This maintains backward compatibility for /products route.
 */
function Products() {
  return <Navigate to="/menu" replace />
}

export default Products
