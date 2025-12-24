import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRecentlyViewed } from '../lib/recentlyViewedUtils'
import { parsePrice } from '../lib/priceUtils'
import { logger } from '../utils/logger'

/**
 * Product interface for recently viewed items
 */
interface RecentlyViewedProduct {
  id: string
  name: string
  price: number
  image_url?: string | null
  images?: string[]
  is_available?: boolean
  stock_quantity?: number
  __entryType?: 'menu_item' | 'product'
  __sourceTable?: 'menu_items' | 'dishes' | 'products'
  __timestamp?: number
  [key: string]: unknown
}

/**
 * RecentlyViewed Component
 *
 * Displays recently viewed products at the bottom of the homepage.
 * Uses localStorage to track product views.
 *
 * Features:
 * - Fetches products from multiple tables (menu_items, dishes, products)
 * - Horizontal scroll on mobile, grid on desktop
 * - Loading skeleton states
 * - Theme-aware styling
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 */
function RecentlyViewed() {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const [products, setProducts] = useState<RecentlyViewedProduct[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadRecentlyViewedProducts = useCallback(async () => {
    try {
      setLoading(true)

      // Get product IDs from localStorage
      const entries = getRecentlyViewed()

      if (entries.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      interface Entry {
        itemType?: string
        productId: string
        timestamp: number
        [key: string]: unknown
      }

      const menuEntries = entries.filter(
        (entry: Entry): entry is Entry => entry.itemType === 'menu_item'
      )
      const productEntries = entries.filter(
        (entry: Entry): entry is Entry => entry.itemType !== 'menu_item'
      )

      const menuIds = Array.from(new Set(menuEntries.map((entry: Entry) => entry.productId)))
      const productIds = Array.from(new Set(productEntries.map((entry: Entry) => entry.productId)))

      const [menuResult, dishesResult, legacyProductResult] = await Promise.all([
        menuIds.length
          ? supabase.from('menu_items').select('*').in('id', menuIds)
          : Promise.resolve({ data: [], error: null }),
        productIds.length
          ? supabase.from('menu_items').select('*').in('id', productIds)
          : Promise.resolve({ data: [], error: null }),
        productIds.length
          ? supabase.from('menu_items').select('*').in('id', productIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (menuResult.error || dishesResult.error || legacyProductResult.error) {
        logger.error('Error fetching recently viewed products:', {
          menuError: menuResult.error,
          dishesError: dishesResult.error,
          legacyError: legacyProductResult.error,
        })
        setProducts([])
        setLoading(false)
        return
      }

      const lookup = new Map<string, RecentlyViewedProduct>()

      ;(dishesResult.data || []).forEach((item: RecentlyViewedProduct) => {
        lookup.set(item.id, { ...item, __entryType: 'product', __sourceTable: 'dishes' })
      })
      ;(legacyProductResult.data || []).forEach((item: RecentlyViewedProduct) => {
        if (!lookup.has(item.id)) {
          lookup.set(item.id, { ...item, __entryType: 'product', __sourceTable: 'products' })
        }
      })
      ;(menuResult.data || []).forEach((item: RecentlyViewedProduct) => {
        lookup.set(item.id, { ...item, __entryType: 'menu_item', __sourceTable: 'menu_items' })
      })

      const sortedProducts: RecentlyViewedProduct[] = entries
        .map((entry: Entry): RecentlyViewedProduct | null => {
          const resolved = lookup.get(entry.productId)
          if (!resolved) return null
          return {
            ...resolved,
            __entryType: (entry.itemType ?? 'product') as 'menu_item' | 'product',
            __timestamp: entry.timestamp,
          }
        })
        .filter(
          (item: RecentlyViewedProduct | null): item is RecentlyViewedProduct => item !== null
        )

      setProducts(sortedProducts)
    } catch (err) {
      logger.error('Error loading recently viewed products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecentlyViewedProducts()
  }, [loadRecentlyViewedProducts])

  // Get product image (first image or placeholder)
  const getProductImage = useCallback((product: RecentlyViewedProduct | null): string => {
    if (!product) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
    }

    if (product.image_url) {
      return product.image_url
    }

    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0]
      if (firstImage && typeof firstImage === 'string') {
        return firstImage
      }
    }
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
  }, [])

  // Memoized skeleton background color
  const skeletonBg = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.08)' : 'rgba(var(--text-main-rgb), 0.1)'
  }, [isLightTheme])

  // Memoized background color
  const backgroundColor = useMemo((): string => {
    return isLightTheme ? 'rgba(var(--text-main-rgb), 0.95)' : 'rgba(var(--bg-dark-rgb), 0.95)'
  }, [isLightTheme])

  // Memoized image background color
  const imageBgColor = useMemo(() => {
    return isLightTheme ? 'rgba(var(--text-main-rgb), 0.3)' : 'rgba(var(--bg-dark-rgb), 0.3)'
  }, [isLightTheme])

  // Show loading skeleton
  if (loading) {
    return (
      <div
        className="py-12 border-t border-[var(--border-default)]"
        style={{ backgroundColor }}
        role="status"
        aria-live="polite"
        aria-label="Loading recently viewed products"
      >
        <div className="app-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div
                className="h-8 w-48 bg-[var(--bg-elevated)] rounded animate-pulse mb-2"
                style={{ backgroundColor: skeletonBg }}
              ></div>
              <div
                className="h-4 w-64 bg-[var(--bg-elevated)] rounded animate-pulse"
                style={{ backgroundColor: skeletonBg }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-default)] overflow-hidden animate-pulse"
                aria-hidden="true"
              >
                <div className="w-full aspect-square" style={{ backgroundColor: skeletonBg }}></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 rounded" style={{ backgroundColor: skeletonBg }}></div>
                  <div className="h-5 w-20 rounded" style={{ backgroundColor: skeletonBg }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Don't render if no products
  if (products.length === 0) {
    return null
  }

  return (
    <section
      className="py-12 border-t border-[var(--border-default)]"
      style={{ backgroundColor }}
      aria-labelledby="recently-viewed-heading"
    >
      <div className="app-container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="recently-viewed-heading" className="text-2xl font-bold text-[var(--text-main)]">
              Recently Viewed
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Products you&apos;ve checked out recently
            </p>
          </div>
          <svg
            className="w-8 h-8 text-[var(--color-blue)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>

        {/* Products Grid - Horizontal scroll on mobile, grid on desktop */}
        <div className="relative">
          {/* Mobile: Horizontal Scroll */}
          <div
            className="lg:hidden flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            role="list"
            aria-label="Recently viewed products"
          >
            {products.map(product => {
              const isOutOfStock =
                product.__entryType === 'menu_item'
                  ? product.is_available === false
                  : product.stock_quantity !== undefined && product.stock_quantity === 0

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex-shrink-0 w-48 bg-[var(--bg-elevated)] rounded-lg shadow-sm border border-[var(--border-default)] overflow-hidden hover:shadow-md transition-all duration-200 snap-start min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                  role="listitem"
                  aria-label={`View ${product.name || 'product'}`}
                >
                  {/* Product Image */}
                  <div
                    className="relative w-full aspect-square overflow-hidden"
                    style={{ backgroundColor: imageBgColor }}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={e => {
                        const target = e.target as HTMLImageElement
                        target.src =
                          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                      }}
                    />
                    {isOutOfStock && (
                      <div
                        className="absolute top-2 left-2 bg-[var(--color-red)] text-white px-2 py-1 rounded text-sm font-semibold min-h-[44px] flex items-center"
                        role="status"
                        aria-label="Out of stock"
                      >
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1.5 line-clamp-2 min-h-[2.5rem]">
                      {product.name || 'Product'}
                    </h3>
                    <p className="text-base font-bold text-[var(--text-main)]">
                      ${parsePrice(product.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Desktop: Grid Layout */}
          <div
            className="hidden lg:grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
            role="list"
            aria-label="Recently viewed products"
          >
            {products.map(product => {
              const isOutOfStock =
                product.__entryType === 'menu_item'
                  ? product.is_available === false
                  : product.stock_quantity !== undefined && product.stock_quantity === 0

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="bg-[var(--bg-elevated)] rounded-lg shadow-sm border border-[var(--border-default)] overflow-hidden hover:shadow-md transition-all duration-200 group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                  role="listitem"
                  aria-label={`View ${product.name || 'product'}`}
                >
                  {/* Product Image */}
                  <div
                    className="relative w-full aspect-square overflow-hidden"
                    style={{ backgroundColor: imageBgColor }}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => {
                        const target = e.target as HTMLImageElement
                        target.src =
                          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                      }}
                    />
                    {isOutOfStock && (
                      <div
                        className="absolute top-2 left-2 bg-[var(--color-red)] text-white px-2 py-1 rounded text-sm font-semibold min-h-[44px] flex items-center"
                        role="status"
                        aria-label="Out of stock"
                      >
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1.5 line-clamp-2 min-h-[2.5rem] hover:text-[var(--color-blue)] transition">
                      {product.name || 'Product'}
                    </h3>
                    <p className="text-base font-bold text-[var(--text-main)]">
                      ${parsePrice(product.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* View All Products Link */}
        {products.length >= 5 && (
          <div className="mt-6 text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-[var(--color-blue)] hover:text-[var(--color-blue)]/80 font-medium transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2"
              aria-label="View all products"
            >
              View All Products
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Add scrollbar hiding CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}

export default RecentlyViewed
