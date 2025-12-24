/**
 * Product Utility Functions
 *
 * Provides consistent product type detection and validation across the application.
 */

/**
 * Detect if a product is a menu item or a regular product/dish
 *
 * Menu items have:
 * - category_id (not subcategory_id)
 * - is_available (boolean)
 *
 * Regular products/dishes have:
 * - subcategory_id (or category_id in legacy)
 * - stock_quantity (number)
 *
 * @param {Object} product - Product object to check
 * @param {boolean|null} explicitValue - Explicit value to override detection (optional)
 * @returns {boolean} true if menu item, false if regular product/dish
 *
 * @example
 * const isMenuItem = detectMenuItemType(product);
 * const isMenuItem = detectMenuItemType(product, true); // Force menu item
 */
export function detectMenuItemType(product, explicitValue = null) {
  // If explicit value provided, use it
  if (explicitValue !== null && explicitValue !== undefined) {
    return Boolean(explicitValue)
  }

  // Check if product has explicit isMenuItem flag
  if (product?.isMenuItem !== undefined) {
    return Boolean(product.isMenuItem)
  }

  // Detection logic: menu items have category_id and is_available
  return product?.category_id !== undefined && product?.is_available !== undefined
}

/**
 * Check if a product is out of stock
 *
 * @param {Object} product - Product object to check
 * @param {boolean|null} isMenuItem - Whether product is a menu item (optional, auto-detected if not provided)
 * @returns {boolean} true if out of stock, false otherwise
 *
 * @example
 * const outOfStock = isProductOutOfStock(product);
 * const outOfStock = isProductOutOfStock(product, true); // Explicit menu item
 */
export function isProductOutOfStock(product, isMenuItem = null) {
  if (!product) return true

  const itemType = isMenuItem !== null ? isMenuItem : detectMenuItemType(product)

  if (itemType) {
    // Menu item: check is_available
    return product.is_available === false
  } else {
    // Regular product: check stock_quantity
    const stockQuantity = product.stock_quantity
    const hasFiniteStock = stockQuantity !== null && stockQuantity !== undefined
    return hasFiniteStock && stockQuantity === 0
  }
}

/**
 * Get the product ID field name based on product type
 *
 * @param {Object} product - Product object
 * @param {boolean|null} isMenuItem - Whether product is a menu item (optional, auto-detected if not provided)
 * @returns {Object} Object with productId and menuItemId fields
 *
 * @example
 * const { productId, menuItemId } = getProductIds(product);
 * // For menu item: { productId: null, menuItemId: 'uuid' }
 * // For product: { productId: 'uuid', menuItemId: null }
 */
export function getProductIds(product, isMenuItem = null) {
  if (!product) {
    return { productId: null, menuItemId: null }
  }

  const itemType = isMenuItem !== null ? isMenuItem : detectMenuItemType(product)

  return {
    productId: itemType ? null : product.id,
    menuItemId: itemType ? product.id : null,
  }
}
