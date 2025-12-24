import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { addProductToCart } from '../lib/cartUtils'
import { toggleFavorites, isInFavorites } from '../lib/favoritesUtils'
import { getCurrencySymbol, formatPrice } from '../lib/priceUtils'
import { calculateVariantPrice } from '../lib/variantUtils'
import { calculateCombinationPrice } from '../lib/variantCombinationsUtils'
import { addToGuestCart } from '../lib/guestSessionUtils'
import ProductRatingSummary from '../components/ProductRatingSummary'
import ReviewsList from '../components/ReviewsList'
import ReviewForm from '../components/ReviewForm'
import ProductDetailSkeleton from '../components/product/ProductDetailSkeleton'
import ProductImageGallery from '../components/product/ProductImageGallery'
import VariantSelector from '../components/product/VariantSelector'
import { pageFade, fadeSlideUp } from '../components/animations/menuAnimations'
import { logger } from '../utils/logger'
import { setMessageWithAutoClear } from '../utils/messageUtils'
import { useTheme } from '../shared/hooks/use-theme'
import { useProduct, useProductVariants } from '../features/products/hooks'
import { useReviewEligibility } from '../features/reviews/hooks'

/**
 * Product Detail Page
 *
 * Displays detailed information about a single product.
 * Shows all images, description, price, stock, and Add to Cart button.
 *
 * @component
 */
const ProductDetail = memo((): JSX.Element => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { settings } = useStoreSettings()
  const isLightTheme = useTheme()

  // State management
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [success, setSuccess] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const errorClearRef = useRef<(() => void) | null>(null)
  const [addingToCart, setAddingToCart] = useState<boolean>(false)
  const [isProductInFavorites, setIsProductInFavorites] = useState<boolean>(false)
  const [togglingFavorites, setTogglingFavorites] = useState<boolean>(false)
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false)
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState<number>(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  const reviewsEnabled = settings?.show_public_reviews ?? false
  const itemType = 'product' // Will be determined from product data

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent | { matches: boolean }): void => {
      setPrefersReducedMotion('matches' in e ? e.matches : false)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
    return undefined
  }, [])

  // Data fetching using new hooks
  const { product, isMenuItem, loading, error } = useProduct(id)
  const {
    variants,
    selectedVariants,
    selectedCombination,
    loading: loadingVariants,
    handleVariantSelect,
  } = useProductVariants(id, isMenuItem, { enabled: !!product && !isMenuItem })
  const { canReview, orderId, orderItemId } = useReviewEligibility(user, id || '', reviewsEnabled)

  // Check favorites status
  useEffect(() => {
    const checkFavorites = async () => {
      if (!user || !id) {
        setIsProductInFavorites(false)
        return
      }
      const inFavorites = await isInFavorites(id, user.id, { isMenuItem })
      setIsProductInFavorites(inFavorites)
    }
    checkFavorites()
  }, [user, id, isMenuItem])

  useEffect(() => {
    if (!reviewsEnabled) {
      setShowReviewForm(false)
    }
  }, [reviewsEnabled])

  // Get the currently selected variant (for single-variant products only)
  const getSelectedVariant = useCallback((): {
    id: string
    price_adjustment?: number
    stock_quantity?: number
    variant_type?: string
    variant_value?: string
  } | null => {
    const variantTypes = Object.keys(variants)
    if (variantTypes.length === 0) return null

    // For single variant type, return the selected one
    if (variantTypes.length === 1) {
      return selectedVariants[variantTypes[0]]
    }

    // For multiple variant types, use combinations instead
    return null
  }, [variants, selectedVariants])

  // Calculate the current display price
  const getCurrentPrice = useCallback((): number => {
    if (!product) return 0

    const basePrice =
      typeof product.price === 'number' ? product.price : parseFloat(product.price || 0)

    const variantTypes = Object.keys(variants)

    // Multi-variant product: use combination price
    if (variantTypes.length > 1 && selectedCombination) {
      return calculateCombinationPrice(basePrice, selectedCombination.price_adjustment || 0)
    }

    // Single-variant product: use variant price
    const selectedVariant = getSelectedVariant()
    if (selectedVariant) {
      return calculateVariantPrice(basePrice, selectedVariant.price_adjustment || 0)
    }

    // No variants: use base price
    return basePrice
  }, [product, variants, selectedCombination, getSelectedVariant])

  // Get current stock quantity
  const getCurrentStock = useCallback((): number | null => {
    if (product?.isMenuItem) {
      return product.is_available === false ? 0 : null
    }

    const variantTypes = Object.keys(variants)

    // Multi-variant product: use combination stock
    if (variantTypes.length > 1) {
      return selectedCombination?.stock_quantity || 0
    }

    // Single-variant product: use variant stock
    const selectedVariant = getSelectedVariant()
    if (selectedVariant) {
      return selectedVariant.stock_quantity ?? null
    }

    // No variants: use product stock
    return product?.stock_quantity || 0
  }, [product, variants, selectedCombination, getSelectedVariant])

  const handleToggleFavorites = useCallback(async (): Promise<void> => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } })
      return
    }

    try {
      setTogglingFavorites(true)
      const result = await toggleFavorites(id, user.id, { isMenuItem })

      if (result.success) {
        setIsProductInFavorites(result.action === 'added')

        // Show success message
        setSuccessMessage(
          result.action === 'added' ? 'Added to favorites!' : 'Removed from favorites!'
        )
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setSuccessMessage('')
        }, 3000)
      }
    } catch (err: unknown) {
      logger.error('Error toggling favorites:', err)
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(
        setErrorMessage,
        null,
        'Failed to update favorites',
        'error',
        3000
      )
    } finally {
      setTogglingFavorites(false)
    }
  }, [user, id, isMenuItem, navigate])

  const handleImageSelect = useCallback((index: number) => {
    setSelectedImageIndex(index)
  }, [])

  // Wrapper to convert VariantSelector's (type, value) to hook's (type, variant object)
  const handleVariantChange = useCallback(
    (type: string, value: string) => {
      const variantType = variants[type]
      if (!variantType) return

      const variant = variantType.find((v: { variant_value: string }) => v.variant_value === value)
      if (variant) {
        handleVariantSelect(type, variant)
      }
    },
    [variants, handleVariantSelect]
  )

  const handleAddToCart = useCallback(async (): Promise<void> => {
    // Check if product is out of stock
    if (!product || currentStock === 0) {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(
        setErrorMessage,
        null,
        `${hasVariants ? 'Selected variant is' : 'Product is'} out of stock`,
        'error',
        5000
      )
      return
    }

    // Check if all required variants are selected
    if (hasVariants) {
      const variantTypes = Object.keys(variants)
      const missingVariants = variantTypes.filter(type => !selectedVariants[type])
      if (missingVariants.length > 0) {
        if (errorClearRef.current) errorClearRef.current()
        errorClearRef.current = setMessageWithAutoClear(
          setErrorMessage,
          null,
          `Please select ${missingVariants.join(', ')}`,
          'error',
          5000
        )
        return
      }
    }

    try {
      setAddingToCart(true)
      if (errorClearRef.current) errorClearRef.current()
      setErrorMessage('')
      setSuccess(false)

      const variantTypes = Object.keys(variants)
      let variantParam = null
      let combinationParam = null

      // Multi-variant product: use combination
      if (variantTypes.length > 1) {
        if (!selectedCombination) {
          if (errorClearRef.current) errorClearRef.current()
          errorClearRef.current = setMessageWithAutoClear(
            setErrorMessage,
            null,
            'This combination is not available',
            'error',
            5000
          )
          setAddingToCart(false)
          return
        }
        combinationParam = selectedCombination
      }
      // Single-variant product: use variant
      else if (variantTypes.length === 1) {
        variantParam = getSelectedVariant() as {
          id: string
          variant_type?: string
          variant_value?: string
          type?: string
          value?: string
        } | null
      }

      // GUEST USER: Add to localStorage cart
      if (!user) {
        // For guests, we only support single variant (not combinations)
        const variantId = variantParam?.id || null
        const variantDisplay = variantParam
          ? `${variantParam.variant_type || variantParam.type}: ${variantParam.variant_value || variantParam.value}`
          : null

        // Add to guest cart (localStorage)
        addToGuestCart(product, 1, {
          isMenuItem,
          variantId,
          variantDisplay,
        })

        setSuccess(true)
        setSuccessMessage('Added to cart!')

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false)
          setSuccessMessage('')
        }, 5000)
        return
      }

      // AUTHENTICATED USER: Use database cart with variant/combination support
      const result = await addProductToCart(product, user.id, variantParam, combinationParam)

      if (result.stockExceeded) {
        if (errorClearRef.current) errorClearRef.current()
        errorClearRef.current = setMessageWithAutoClear(
          setErrorMessage,
          null,
          `Only ${result.stockLimit} item(s) available in stock`,
          'error',
          5000
        )
        return
      }

      if (result.error) {
        throw result.error
      }

      if (result.success) {
        setSuccess(true)
        setSuccessMessage('Added to cart!')
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false)
        setSuccessMessage('')
      }, 5000)
    } catch (err: unknown) {
      logger.error('Error adding to cart:', err)
      let errorMessage = 'Failed to add product to cart. Please try again.'

      if (err && typeof err === 'object' && 'code' in err) {
        if (err.code === '42501') {
          errorMessage += ' Check TROUBLESHOOTING.md for help setting up access.'
        } else if (err.code === '42P01') {
          errorMessage += ' Cart table does not exist. Please run the database migration first.'
        }
      }
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message
      }

      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(
        setErrorMessage,
        null,
        errorMessage,
        'error',
        5000
      )
    } finally {
      setAddingToCart(false)
    }
  }, [
    product,
    variants,
    selectedVariants,
    selectedCombination,
    getSelectedVariant,
    user,
    isMenuItem,
    currentStock,
    hasVariants,
  ])
  // navigate from useNavigate() is stable, doesn't need to be in deps

  const handleWriteReview = useCallback((): void => {
    if (!reviewsEnabled) return
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } })
      return
    }
    setShowReviewForm(true)
  }, [reviewsEnabled, user, navigate, id])

  const handleReviewSuccess = useCallback((_data: unknown, warning?: string): void => {
    setShowReviewForm(false)
    setReviewRefreshTrigger(prev => prev + 1)
    // Eligibility will be refreshed by the hook

    let message = 'Review submitted successfully!'
    if (warning) {
      message += ' ' + warning
    }

    setSuccessMessage(message)
    setSuccess(true)
    setTimeout(
      () => {
        setSuccess(false)
        setSuccessMessage('')
      },
      warning ? 8000 : 5000
    ) // Show warning longer
  }, [])

  const handleReviewCancel = useCallback((): void => {
    setShowReviewForm(false)
  }, [])

  // Get all product images or use placeholder
  const getProductImages = useCallback((): string[] => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images
    }
    // Fallback placeholder image
    return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop']
  }, [product])

  // Memoized values - must be before early returns
  const images = useMemo(() => getProductImages(), [getProductImages])
  const currentStock = useMemo(() => getCurrentStock(), [getCurrentStock])
  const isOutOfStock = useMemo(() => currentStock === 0, [currentStock])
  const currentPrice = useMemo(() => getCurrentPrice(), [getCurrentPrice])
  const showStockCount = useMemo(
    () => typeof currentStock === 'number' && currentStock !== null,
    [currentStock]
  )
  const hasVariants = useMemo(() => Object.keys(variants).length > 0, [variants])

  if (loading) {
    return (
      <ProductDetailSkeleton
        isLightTheme={isLightTheme}
        prefersReducedMotion={prefersReducedMotion}
      />
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4 text-[var(--text-main)]">
        <div
          className="glow-surface glow-strong w-full max-w-md rounded-2xl border-[var(--status-error-border)] bg-[var(--status-error-bg)] p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--status-error-bg)]"
            aria-hidden="true"
          >
            <svg
              className="h-8 w-8 text-[var(--color-red)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-main)]">Product Not Found</h2>
          <p className="mb-6 text-sm text-[var(--color-red)]">
            {error || 'The product you are looking for does not exist.'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 min-h-[44px] font-semibold text-[#111] transition hover:opacity-90 text-sm sm:text-base"
            aria-label="Go back to products page"
          >
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <m.main
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={prefersReducedMotion ? {} : pageFade}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      style={{
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible',
      }}
      role="main"
      aria-label="Product details"
    >
      {/* Breadcrumb Navigation */}
      <m.div
        className="border-b border-theme bg-[var(--bg-main)]/92"
        variants={prefersReducedMotion ? {} : fadeSlideUp}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
        custom={0.1}
        role="navigation"
        aria-label="Breadcrumb navigation"
      >
        <div className="app-container py-3 sm:py-4">
          <nav
            className="flex items-center space-x-2 text-sm sm:text-xs uppercase tracking-[0.25em] text-muted"
            aria-label="Breadcrumb"
          >
            <Link
              to="/"
              className="transition hover:text-[var(--accent)]"
              aria-label="Go to home page"
            >
              Home
            </Link>
            <svg
              className="h-3 w-3 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link
              to="/products"
              className="transition hover:text-[var(--accent)]"
              aria-label="Go to products page"
            >
              Products
            </Link>
            <svg
              className="h-3 w-3 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span
              className="line-clamp-1 font-semibold text-[var(--text-main)]"
              aria-current="page"
            >
              {product.name}
            </span>
          </nav>
        </div>
      </m.div>

      {/* Product Content */}
      <m.section
        className="app-container py-6 sm:py-8"
        variants={prefersReducedMotion ? {} : fadeSlideUp}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
        custom={0.18}
        aria-labelledby="product-details-heading"
      >
        <div className="glow-surface glow-strong overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] shadow-[0_35px_90px_-55px_rgba(var(--accent-rgb),0.55)]">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 p-4 sm:p-6 md:p-10 lg:grid-cols-2">
            {/* Image Gallery */}
            <div className="space-y-3 sm:space-y-4">
              <ProductImageGallery
                images={images}
                selectedIndex={selectedImageIndex}
                onImageSelect={handleImageSelect}
                productName={product.name}
                prefersReducedMotion={prefersReducedMotion}
              />
              {isOutOfStock && (
                <div
                  className="rounded-lg bg-[var(--status-error-bg)] px-3 sm:px-4 py-2 text-sm sm:text-xs font-semibold text-[var(--color-red)] shadow-lg text-center"
                  role="status"
                  aria-live="polite"
                  aria-label="Product is out of stock"
                >
                  Out of Stock
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="flex flex-col">
              {/* Success/Error Messages */}
              {success && successMessage && (
                <div
                  className="glow-surface glow-soft mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border-[var(--status-success-border)] bg-[var(--status-success-bg)] p-3 sm:p-4"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-3 text-sm sm:text-xs text-[var(--color-emerald)]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-medium">{successMessage}</p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="glow-surface glow-soft mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border-[var(--status-error-border)] bg-[var(--status-error-bg)] p-3 sm:p-4"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-center gap-3 text-sm sm:text-xs text-[var(--color-red)]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-medium">{errorMessage || error}</p>
                  </div>
                </div>
              )}

              {/* Category Badge */}
              {product.category && (
                <div className="mb-3 sm:mb-4">
                  <span
                    className="inline-block rounded-full bg-[var(--accent)]/15 px-3 py-1 text-sm sm:text-xs font-semibold text-[var(--accent)]"
                    role="status"
                    aria-label={`Category: ${product.category}`}
                  >
                    {product.category}
                  </span>
                </div>
              )}

              {/* Product Name */}
              <h1
                id="product-details-heading"
                className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold"
              >
                {product.name}
              </h1>

              {/* Variant Selectors */}
              {hasVariants && !loadingVariants && (
                <div className="mb-4 sm:mb-6">
                  <VariantSelector
                    groupedVariants={variants}
                    selectedVariants={selectedVariants}
                    onVariantChange={handleVariantChange}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                </div>
              )}

              {/* Price and Stock Info */}
              <div className="mb-4 sm:mb-6">
                <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[var(--accent)]">
                  {getCurrencySymbol(product?.currency)}
                  {formatPrice(currentPrice, 0)}
                </p>
                {hasVariants && selectedCombination && (
                  <p className="mt-1 text-sm sm:text-xs text-muted">
                    Stock: {selectedCombination.stock_quantity}
                  </p>
                )}
              </div>

              {/* Stock Availability */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <>
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <p className="text-sm sm:text-base font-medium text-red-600">
                        {hasVariants ? 'Selected variant is out of stock' : 'Out of Stock'}
                      </p>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm sm:text-base font-medium text-green-600">
                        {showStockCount
                          ? `In Stock (${currentStock} ${currentStock === 1 ? 'item' : 'items'} available)`
                          : 'Available'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6 sm:mb-8">
                <h2 className="mb-3 text-base sm:text-lg font-semibold text-[var(--text-main)]">
                  Description
                </h2>
                <div className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-3 sm:p-4">
                  <p className="whitespace-pre-wrap text-sm sm:text-base text-muted leading-relaxed">
                    {product.description || 'No description available.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-3 border-t border-theme pt-4 sm:pt-6">
                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addingToCart}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl px-6 py-3 min-h-[44px] text-sm sm:text-base font-semibold transition ${
                    isOutOfStock || addingToCart
                      ? 'cursor-not-allowed bg-white/10 text-muted'
                      : 'bg-[var(--accent)] text-[#111] shadow-[0_18px_45px_-30px_rgba(var(--accent-rgb),0.7)] hover:opacity-90'
                  }`}
                  aria-label={
                    isOutOfStock
                      ? 'Product is out of stock'
                      : addingToCart
                        ? 'Adding to cart'
                        : 'Add product to cart'
                  }
                  aria-disabled={isOutOfStock || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black/40 border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </>
                  )}
                </button>

                {/* Add to Favorites Button */}
                <button
                  onClick={handleToggleFavorites}
                  disabled={togglingFavorites}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl border px-6 py-3 min-h-[44px] text-sm sm:text-base font-semibold transition ${
                    isProductInFavorites
                      ? 'border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--color-red)]'
                      : 'border-theme bg-white/5 text-[var(--text-main)] hover:border-[var(--accent)]/60 hover:text-[var(--accent)]'
                  } disabled:opacity-50`}
                  aria-label={isProductInFavorites ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={isProductInFavorites}
                >
                  {togglingFavorites ? (
                    <>
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg
                        className={`w-5 h-5 transition-colors ${
                          isProductInFavorites
                            ? 'fill-current text-[var(--color-red)]'
                            : 'fill-none'
                        }`}
                        aria-hidden="true"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                      </svg>
                      {isProductInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </m.section>

      {/* Reviews Section */}
      {(reviewsEnabled || isAdmin) && (
        <m.section
          className="app-container py-8 sm:py-10 md:py-12"
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
          custom={0.26}
          aria-labelledby="reviews-heading"
        >
          <h2 id="reviews-heading" className="sr-only">
            Product Reviews
          </h2>
          {reviewsEnabled ? (
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
              {/* Rating Summary - Left Column */}
              <div className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-6 lg:col-span-1">
                <ProductRatingSummary
                  productId={id}
                  itemType={itemType}
                  showWriteButton={canReview && !showReviewForm}
                  onWriteReview={handleWriteReview}
                  refreshTrigger={reviewRefreshTrigger}
                />
              </div>

              {/* Reviews List - Right Column */}
              <div className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-6 lg:col-span-2">
                {/* Review Form */}
                {showReviewForm && canReview && orderId && orderItemId && (
                  <div className="mb-8">
                    <ReviewForm
                      productId={id}
                      itemType={itemType}
                      orderId={orderId}
                      orderItemId={orderItemId}
                      onSuccess={handleReviewSuccess}
                      onCancel={handleReviewCancel}
                    />
                  </div>
                )}

                {/* Reviews List */}
                <ReviewsList
                  productId={id}
                  itemType={itemType}
                  refreshTrigger={reviewRefreshTrigger}
                />
              </div>
            </div>
          ) : (
            <div className="glow-surface glow-strong rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-8 sm:p-10 md:p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full border border-theme bg-[rgba(255,255,255,0.03)]">
                <svg
                  className="h-8 sm:h-10 w-8 sm:w-10 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--text-main)]">
                Customer reviews are hidden
              </h3>
              <p className="mt-2 text-sm sm:text-base text-muted">
                Customers cannot see reviews right now. Enable public reviews when you are ready to
                showcase feedback.
              </p>
              <Link
                to="/admin/settings"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[var(--accent)] px-5 py-3 min-h-[44px] text-sm sm:text-base font-semibold text-black transition hover:opacity-90"
              >
                Manage visibility
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}
        </m.section>
      )}

      {/* Recommended Products / Similar Items */}
      {settings?.show_related_products && (
        <div className="app-container py-8 sm:py-10 md:py-12">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            <div className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-6">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[var(--text-main)]">
                Related Products
              </h3>
              <p className="text-sm sm:text-base text-muted">
                Discover similar items that might interest you.
              </p>
            </div>
            <div className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-6">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[var(--text-main)]">
                Similar Items
              </h3>
              <p className="text-sm sm:text-base text-muted">
                Check out other items that share similar characteristics.
              </p>
            </div>
            <div className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-6">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[var(--text-main)]">
                You May Also Like
              </h3>
              <p className="text-sm sm:text-base text-muted">See what others are looking at.</p>
            </div>
          </div>
        </div>
      )}
    </m.main>
  )
})

ProductDetail.displayName = 'ProductDetail'

export default ProductDetail
