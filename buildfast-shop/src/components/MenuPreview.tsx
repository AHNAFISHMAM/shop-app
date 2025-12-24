import { Link } from 'react-router-dom'

/**
 * Menu item interface
 */
interface MenuItem {
  name: string
  image?: string
  description?: string
  price: number | string
  category?: string
}

/**
 * MenuPreview component props
 */
interface MenuPreviewProps {
  /** Array of menu items to display */
  items?: MenuItem[]
  /** Whether to show the "View All" button */
  showViewAllButton?: boolean
}

/**
 * MenuPreview Component
 *
 * Displays a preview grid of menu items with optional "View All" button.
 *
 * Features:
 * - Responsive grid layout
 * - Hover effects and transitions
 * - Image support
 * - Category and price display
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 */
const MenuPreview = ({ items = [], showViewAllButton = true }: MenuPreviewProps) => {
  return (
    <section className="space-y-8" aria-labelledby="menu-preview-heading">
      {/* Grid of Menu Items */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        role="list"
        aria-label="Menu items"
      >
        {items.map(item => (
          <article
            key={item.name}
            className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-default)] hover:shadow-lg transition-all duration-300 group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            role="listitem"
          >
            {item.image && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="space-y-2 p-4">
              <h3
                className="text-lg font-semibold text-[var(--text-main)]"
                id={`menu-item-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {item.name}
              </h3>
              {item.description && (
                <p className="text-sm text-[var(--text-muted)] line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                <span
                  className="text-lg font-bold text-[var(--accent)]"
                  aria-label={`Price: ${item.price}`}
                >
                  ৳{item.price}
                </span>
                {item.category && (
                  <span
                    className="text-xs uppercase tracking-wide text-[var(--text-muted)]"
                    aria-label={`Category: ${item.category}`}
                  >
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* View All Button */}
      {showViewAllButton && (
        <div className="text-center pt-4">
          <Link
            to="/menu"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] border border-[var(--border-default)] rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="View full menu"
          >
            View Full Menu
          </Link>
        </div>
      )}
    </section>
  )
}

export default MenuPreview
