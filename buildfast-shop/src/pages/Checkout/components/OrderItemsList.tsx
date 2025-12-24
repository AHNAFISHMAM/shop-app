/**
 * OrderItemsList Component
 *
 * Displays list of cart items in checkout.
 */

import { parsePrice } from '../../../lib/priceUtils'
import { formatCurrency, getProductImage } from '../utils/formatting'

interface CartItem {
  id: string
  quantity: number
  menu_item_id?: string
  product_id?: string
  price?: number | string
  price_at_purchase?: number | string
  image_url?: string | null
  image?: string | null
  name?: string
  description?: string | null
  resolvedProduct?: {
    id?: string
    name?: string
    price?: number | string
    image_url?: string | null
    description?: string | null
  } | null
  product?: {
    id?: string
    name?: string
    price?: number | string
    image_url?: string | null
    description?: string | null
  } | null
}

interface OrderItemsListProps {
  items: CartItem[]
  isLightTheme: boolean
}

export function OrderItemsList({ items, isLightTheme }: OrderItemsListProps) {
  return (
    <div
      className="glow-surface glow-strong border border-theme rounded-2xl p-6 mb-6"
      style={{
        backgroundColor: isLightTheme ? 'var(--bg-elevated)' : 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-accent">Order Summary</h2>
        <span className="text-sm text-muted">
          {items.length} {items.length === 1 ? 'dish' : 'dishes'}
        </span>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          // Use resolved product from database, fallback to embedded product, or use cart item data
          const product = item.resolvedProduct ||
            item.product || {
              id: item.menu_item_id || item.product_id || item.id,
              name: item.name || `Item ${item.menu_item_id || item.product_id || item.id}`,
              price: item.price || item.price_at_purchase || 0,
              image_url: item.image_url || item.image || null,
              description: item.description || null,
            }

          // Handle price - might be string or number, or use fallback from cart item
          const itemPrice =
            typeof product.price === 'number'
              ? product.price
              : parsePrice(product.price || item.price || item.price_at_purchase || '0')
          const itemSubtotal = itemPrice * item.quantity

          return (
            <div
              key={item.id}
              className="glow-surface glow-soft border border-theme rounded-xl p-4 hover:border-accent/30 transition-all"
              style={{
                backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex gap-4">
                {/* Dish Image */}
                <div className="flex-shrink-0">
                  <img
                    src={getProductImage(product)}
                    alt={product.name || 'Dish'}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl"
                    onError={e => {
                      const target = e.target as HTMLImageElement
                      if (target) {
                        target.src =
                          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
                      }
                    }}
                  />
                </div>

                {/* Dish Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 line-clamp-2">
                    {product.name || 'Unknown Dish'}
                  </h3>
                  <p className="text-sm text-muted mb-3">
                    Quantity:{' '}
                    <span className="text-[var(--text-main)] font-medium">{item.quantity}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted">Price per dish</p>
                      <p className="text-base font-semibold text-accent">
                        {formatCurrency(itemPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">Subtotal</p>
                      <p className="text-xl font-bold text-accent">
                        {formatCurrency(itemSubtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
