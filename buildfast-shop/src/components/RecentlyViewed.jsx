import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRecentlyViewed } from '../lib/recentlyViewedUtils'
import { parsePrice } from '../lib/priceUtils'
import { logger } from '../utils/logger'

/**
 * RecentlyViewed Component
 *
 * Displays recently viewed products at the bottom of the homepage
 * Uses localStorage to track product views
 */
function RecentlyViewed() {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentlyViewedProducts()
  }, [])

  const loadRecentlyViewedProducts = async () => {
    try {
      setLoading(true)

      // Get product IDs from localStorage
      const entries = getRecentlyViewed()

      if (entries.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      const menuEntries = entries.filter(entry => entry.itemType === 'menu_item')
      const productEntries = entries.filter(entry => entry.itemType !== 'menu_item')

      const menuIds = Array.from(new Set(menuEntries.map(entry => entry.productId)))
      const productIds = Array.from(new Set(productEntries.map(entry => entry.productId)))

      const [
        menuResult,
        dishesResult,
        legacyProductResult
      ] = await Promise.all([
        menuIds.length
          ? supabase.from('menu_items').select('*').in('id', menuIds)
          : Promise.resolve({ data: [], error: null }),
        productIds.length
          ? supabase.from('dishes').select('*').in('id', productIds)
          : Promise.resolve({ data: [], error: null }),
        productIds.length
          ? supabase.from('products').select('*').in('id', productIds)
          : Promise.resolve({ data: [], error: null })
      ])

      if (menuResult.error || dishesResult.error || legacyProductResult.error) {
        logger.error('Error fetching recently viewed products:', {
          menuError: menuResult.error,
          dishesError: dishesResult.error,
          legacyError: legacyProductResult.error
        })
        setProducts([])
        setLoading(false)
        return
      }

      const lookup = new Map()

      ;(dishesResult.data || []).forEach(item => {
        lookup.set(item.id, { ...item, __entryType: 'product', __sourceTable: 'dishes' })
      })

      ;(legacyProductResult.data || []).forEach(item => {
        if (!lookup.has(item.id)) {
          lookup.set(item.id, { ...item, __entryType: 'product', __sourceTable: 'products' })
        }
      })

      ;(menuResult.data || []).forEach(item => {
        lookup.set(item.id, { ...item, __entryType: 'menu_item', __sourceTable: 'menu_items' })
      })

      const sortedProducts = entries
        .map(entry => {
          const resolved = lookup.get(entry.productId)
          if (!resolved) return null
          return {
            ...resolved,
            __entryType: entry.itemType,
            __timestamp: entry.timestamp
          }
        })
        .filter(Boolean)

      setProducts(sortedProducts)
    } catch (err) {
      logger.error('Error loading recently viewed products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Get product image (first image or placeholder)
  const getProductImage = (product) => {
    if (!product) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
    }

    if (product.image_url) {
      return product.image_url
    }

    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
  }

  // Show loading skeleton
  if (loading) {
    const skeletonBg = isLightTheme
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.1)';
    
    return (
      <div 
        className="py-12 border-t border-theme"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(5, 5, 9, 0.95)'
        }}
      >
        <div className="app-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 w-48 bg-theme-elevated rounded animate-pulse mb-2" style={{ backgroundColor: skeletonBg }}></div>
              <div className="h-4 w-64 bg-theme-elevated rounded animate-pulse" style={{ backgroundColor: skeletonBg }}></div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-theme-elevated rounded-lg border border-theme overflow-hidden animate-pulse">
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
    );
  }

  // Don't render if no products
  if (products.length === 0) {
    return null
  }

  return (
    <div 
      className="py-12 border-t border-theme"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(5, 5, 9, 0.95)'
      }}
    >
      <div className="app-container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-main)]">Recently Viewed</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Products you&apos;ve checked out recently
            </p>
          </div>
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>

        {/* Products Grid - Horizontal scroll on mobile, grid on desktop */}
        <div className="relative">
          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {products.map((product) => {
              const isOutOfStock = product.__entryType === 'menu_item'
                ? product.is_available === false
                : product.stock_quantity === 0

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex-shrink-0 w-48 bg-theme-elevated rounded-lg shadow-sm border border-theme overflow-hidden hover:shadow-md transition-all duration-200 snap-start"
                >
                  {/* Product Image */}
                  <div 
                    className="relative w-full aspect-square overflow-hidden"
                    style={{
                      backgroundColor: isLightTheme 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(5, 5, 9, 0.3)'
                    }}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                      }}
                    />
                    {isOutOfStock && (
                      <div className="absolute top-2 left-2 bg-red-500 text-black px-2 py-1 rounded text-xs font-semibold">
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
          <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {products.map((product) => {
              const isOutOfStock = product.__entryType === 'menu_item'
                ? product.is_available === false
                : product.stock_quantity === 0

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="bg-theme-elevated rounded-lg shadow-sm border border-theme overflow-hidden hover:shadow-md transition-all duration-200 group"
                >
                  {/* Product Image */}
                  <div 
                    className="relative w-full aspect-square overflow-hidden"
                    style={{
                      backgroundColor: isLightTheme 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(5, 5, 9, 0.3)'
                    }}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                      }}
                    />
                    {isOutOfStock && (
                      <div className="absolute top-2 left-2 bg-red-500 text-black px-2 py-1 rounded text-xs font-semibold">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1.5 line-clamp-2 min-h-[2.5rem] hover:text-blue-600 transition">
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
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
            >
              View All Products
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
    </div>
  )
}

export default RecentlyViewed
