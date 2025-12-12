import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getFavoriteItems, removeFromFavorites } from '../lib/favoritesUtils'
import { addProductToCart, addMenuItemToCart } from '../lib/cartUtils'
import { handleAuthError } from '../lib/authUtils'
import { getCurrencySymbol, formatPrice } from '../lib/priceUtils'
import UpdateTimestamp from '../components/UpdateTimestamp'
import FavoriteCommentsPanel from '../components/FavoriteCommentsPanel'
import { m } from 'framer-motion'
import { pageFade } from '../components/animations/menuAnimations'
import { logger } from '../utils/logger'

/**
 * Favorites Page - Star Cafe
 *
 * Displays all favorite dishes saved by the customer.
 * Shows stock status and allows moving items to cart for quick ordering.
 */
function Favorites() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [favoriteItems, setFavoriteItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingItems, setRemovingItems] = useState({}) // Track which items are being removed
  const [movingToCart, setMovingToCart] = useState({}) // Track which items are being moved to cart
  const [messages, setMessages] = useState({}) // Success/error messages per item
  const timeoutRefs = useRef({}) // Track timeout IDs for cleanup

  const fetchFavorites = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const result = await getFavoriteItems(user.id)

      if (result.success) {
        setFavoriteItems(result.data || [])
      } else if (result.error) {
        // Handle auth errors gracefully
        const wasAuthError = await handleAuthError(result.error, navigate)
        if (!wasAuthError) {
          logger.error('Error fetching favorites:', result.error)
        }
      }
    } catch (err) {
      logger.error('Error fetching favorites:', err)
      await handleAuthError(err, navigate)
    } finally {
      setLoading(false)
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/favorites' } } })
      return
    }

    fetchFavorites()

    // Set up real-time subscription for favorites changes
    const channel = supabase
      .channel('favorite-dishes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchFavorites()
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          logger.warn('Favorites subscription error:', err)
        }
        if (status === 'TIMED_OUT') {
          logger.warn('Favorites subscription timed out')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, navigate, fetchFavorites])

  const handleRemoveItem = async (favoriteItemId, targetId, isMenuItem) => {
    try {
      setRemovingItems(prev => ({ ...prev, [targetId]: true }))

      const result = await removeFromFavorites(targetId, user.id, { isMenuItem })

      if (result.success) {
        // Remove from local state
        setFavoriteItems(prev => prev.filter(item => item.id !== favoriteItemId))

        // Show success message briefly
        setMessages(prev => ({ ...prev, [targetId]: 'Removed from favorites' }))
        const timeoutId = setTimeout(() => {
          setMessages(prev => {
            const updated = { ...prev }
            delete updated[targetId]
            return updated
          })
          delete timeoutRefs.current[`remove-${targetId}`]
        }, 2000)
        timeoutRefs.current[`remove-${targetId}`] = timeoutId
      }
    } catch (err) {
      logger.error('Error removing item:', err)
      setMessages(prev => ({ ...prev, [targetId]: 'Failed to remove item' }))
      const timeoutId = setTimeout(() => {
        setMessages(prev => {
          const updated = { ...prev }
          delete updated[targetId]
          return updated
        })
        delete timeoutRefs.current[`remove-error-${targetId}`]
      }, 3000)
      timeoutRefs.current[`remove-error-${targetId}`] = timeoutId
    } finally {
      setRemovingItems(prev => {
        const updated = { ...prev }
        delete updated[targetId]
        return updated
      })
    }
  }

  const handleMoveToCart = async (favoriteItemId, product, targetId, isMenuItem) => {
    if (!product || !targetId) return

    try {
      setMovingToCart(prev => ({ ...prev, [targetId]: true }))

      let cartResult
      if (isMenuItem) {
        cartResult = await addMenuItemToCart(product, user.id)
      } else {
        cartResult = await addProductToCart(product, user.id)
      }

      if (cartResult.stockExceeded) {
        setMessages(prev => ({
          ...prev,
          [targetId]: `Only ${cartResult.stockLimit} item(s) available in stock`
        }))
        const timeoutId = setTimeout(() => {
          setMessages(prev => {
            const updated = { ...prev }
            delete updated[targetId]
            return updated
          })
          delete timeoutRefs.current[`stock-exceeded-${targetId}`]
        }, 5000)
        timeoutRefs.current[`stock-exceeded-${targetId}`] = timeoutId
        return
      }

      if (cartResult.error) {
        throw cartResult.error
      }

      if (cartResult.success) {
        const removeResult = await removeFromFavorites(targetId, user.id, { isMenuItem })

        if (removeResult.success) {
          setFavoriteItems(prev => prev.filter(item => item.id !== favoriteItemId))

          setMessages(prev => ({ ...prev, [targetId]: 'Moved to cart!' }))
          const timeoutId = setTimeout(() => {
            setMessages(prev => {
              const updated = { ...prev }
              delete updated[targetId]
              return updated
            })
            delete timeoutRefs.current[`move-${targetId}`]
          }, 2000)
          timeoutRefs.current[`move-${targetId}`] = timeoutId
        }
      }
    } catch (err) {
      logger.error('Error moving to cart:', err)
      setMessages(prev => ({ ...prev, [targetId]: 'Failed to move to cart' }))
      const timeoutId = setTimeout(() => {
        setMessages(prev => {
          const updated = { ...prev }
          delete updated[targetId]
          return updated
        })
        delete timeoutRefs.current[`move-error-${targetId}`]
      }, 3000)
      timeoutRefs.current[`move-error-${targetId}`] = timeoutId
    } finally {
      setMovingToCart(prev => {
        const updated = { ...prev }
        delete updated[targetId]
        return updated
      })
    }
  }

  // Cleanup all timeouts on component unmount
  useEffect(() => {
    const currentTimeouts = timeoutRefs.current
    return () => {
      Object.values(currentTimeouts).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId)
      })
    }
  }, [])

  const getProductImage = (product) => {
    if (!product) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
    }
    if (product.image_url) {
      return product.image_url
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] py-24 text-center text-[var(--text-main)]">
        <div className="app-container space-y-6">
          <div className="inline-flex h-14 w-14 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"></div>
          <div>
            <h1 className="text-3xl font-semibold">My Favorites</h1>
            <p className="mt-2 text-sm text-muted">Loading your saved dishes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <m.main
      className="min-h-screen bg-[var(--bg-main)] px-4 sm:px-6 pb-16 pt-10 sm:pt-12 text-[var(--text-main)]"
      data-animate="fade-scale"
      data-animate-active="false"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <UpdateTimestamp />

      <section
        className="app-container space-y-6 sm:space-y-8"
        data-animate="fade-rise"
        data-animate-active="false"
      >
        <div
          className="glow-surface glow-soft flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.03)] px-4 sm:px-6 py-4 sm:py-6 shadow-[0_35px_65px_-55px_rgba(197,157,95,0.65)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted">Saved Dishes</p>
            <h1 className="flex items-center gap-3 text-xl sm:text-2xl md:text-3xl font-semibold">
              <svg className="h-6 sm:h-8 w-6 sm:w-8 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              My Favorites
            </h1>
            <p className="text-[10px] sm:text-xs text-muted">
              {favoriteItems.length === 0
                ? 'No favorite dishes yet'
                : `${favoriteItems.length} favorite dish${favoriteItems.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <Link
            to="/menu"
            className="btn-primary whitespace-nowrap min-h-[44px] inline-flex items-center justify-center px-5 py-3"
            data-animate="fade-scale"
            data-animate-active="false"
            style={{ transitionDelay: '120ms' }}
          >
            Browse Menu
          </Link>
        </div>

        <FavoriteCommentsPanel favoriteItems={favoriteItems} userId={user?.id} />

        {favoriteItems.length === 0 ? (
          <div
            className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-8 sm:p-10 md:p-12 text-center shadow-[0_30px_70px_-60px_rgba(197,157,95,0.6)]"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="mx-auto mb-4 sm:mb-6 flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10">
              <svg className="h-8 sm:h-10 w-8 sm:w-10 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h3 className="mb-3 text-base sm:text-lg md:text-xl font-semibold">No favorite dishes yet</h3>
            <p className="mb-6 text-sm sm:text-base text-muted">
              Save your favorite dishes by tapping the star icon – perfect for fast reorders when cravings hit.
            </p>
            <Link to="/menu" className="btn-primary inline-flex min-h-[44px] items-center justify-center px-5 py-3">
              Explore Our Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteItems.map((item, index) => {
              const isMenuItem = !!item.menu_items
              const product = isMenuItem ? item.menu_items : item.dishes
              const targetId = isMenuItem
                ? item.menu_item_id || item.menu_items?.id
                : item.product_id || item.dishes?.id

              if (!product || !product.id || !product.name || !targetId) return null

              const isRemoving = removingItems[targetId]
              const isMoving = movingToCart[targetId]
              const message = messages[targetId]
              const isOutOfStock = isMenuItem
                ? product.is_available === false
                : typeof product.stock_quantity === 'number' && product.stock_quantity <= 0
              const detailPath = `/products/${product.id}`

              return (
                <div
                  key={item.id}
                  className="group glow-surface glow-soft flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_28px_55px_-45px_rgba(197,157,95,0.65)]"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  {/* Product Image */}
                  <Link to={detailPath}>
                    <div className="relative aspect-square overflow-hidden bg-[var(--bg-main)]/20">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
                        }}
                      />
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <Link to={detailPath}>
                      <h3 className="min-h-[3.5rem] text-sm sm:text-base font-semibold leading-snug text-[var(--text-main)] transition hover:text-[var(--accent)]">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mb-3 text-lg sm:text-xl font-semibold text-[var(--accent)]">
                      {getCurrencySymbol(product.currency)}{formatPrice(product.price, 0)}
                    </div>

                    {/* Availability Status */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center gap-2">
                        {isOutOfStock ? (
                          <>
                            <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[10px] sm:text-xs font-medium text-red-300">
                              Currently unavailable
                            </p>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-[10px] sm:text-xs font-medium text-emerald-200">
                              Available Now
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    {message && (
                      <div
                        className={`mb-3 rounded-lg px-3 py-2 text-[10px] sm:text-xs font-medium ${
                          message.includes('Moved') || message.includes('Removed')
                            ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                            : 'bg-red-500/15 text-red-200 ring-1 ring-red-400/30'
                        }`}
                      >
                        {message}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-2 sm:space-y-3">
                      <button
                        onClick={() => handleMoveToCart(item.id, product, targetId, isMenuItem)}
                        disabled={isMoving || isRemoving}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl px-4 py-3 min-h-[44px] text-sm sm:text-base font-medium transition ${
                          isMoving || isRemoving
                            ? 'cursor-not-allowed bg-white/10 text-muted'
                            : 'bg-[var(--accent)] text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]'
                        }`}
                      >
                        {isMoving ? (
                          <>
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                            Moving to Cart...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Move to Cart
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveItem(item.id, targetId, isMenuItem)}
                        disabled={isRemoving || isMoving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-theme px-4 py-3 min-h-[44px] text-sm sm:text-base font-medium text-muted transition hover:border-theme-medium hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] disabled:opacity-50"
                      >
                        {isRemoving ? (
                          <>
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Removing...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </m.main>
  )
}

export default Favorites
