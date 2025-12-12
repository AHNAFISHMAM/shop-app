import { memo, useMemo, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils';

const resolveAllergens = (product) => {
  if (Array.isArray(product?.allergens)) return product.allergens;
  if (Array.isArray(product?.allergen_tags)) return product.allergen_tags;
  if (typeof product?.allergen_info === 'string') {
    return product.allergen_info
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
};

const buildExtras = (product) => {
  if (Array.isArray(product?.customization_options?.extras)) {
    return product.customization_options.extras;
  }
  if (Array.isArray(product?.available_extras)) {
    return product.available_extras;
  }

  return [
    { id: 'extra-rice', label: 'Extra Jasmine Rice', price: 2.5 },
    { id: 'extra-sauce', label: 'Extra Sauce', price: 1.5 },
    { id: 'add-side', label: 'Add Seasonal Side', price: 3.5 },
  ];
};

const formatExtraPrice = (price, currency = 'BDT') => {
  if (price === undefined || price === null || Number.isNaN(price)) return '';
  return `+${getCurrencySymbol(currency || 'BDT')}${formatPrice(price, 2)}`;
};

const ProductCard = memo(({ product, onAddToCart, getImageUrl, enableCustomization = false, compact = false }) => {
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

  const imageUrl = getImageUrl(product);
  const isOutOfStock = product.stock_quantity !== undefined
    ? product.stock_quantity === 0
    : product.is_available === false;
  const isFeatured = product.is_featured || product.chef_special;
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const extrasOptions = useMemo(() => buildExtras(product), [product]);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [preferredSpiceLevel, setPreferredSpiceLevel] = useState(
    typeof product.spice_level === 'number' ? product.spice_level : 1
  );
  const allergenBadges = useMemo(() => resolveAllergens(product), [product]);
  const reviewSnippet = product.review_snippet || product.reviewSnippet || product.review_highlight || product.reviewHighlight || null;

  const toggleExtra = (extraId) => {
    setSelectedExtras((prev) => (
      prev.includes(extraId)
        ? prev.filter((id) => id !== extraId)
        : [...prev, extraId]
    ));
  };

  const selectedExtrasSummary = useMemo(() => {
    if (!selectedExtras.length) return 'No add-ons selected';
    return selectedExtras
      .map((id) => extrasOptions.find((option) => option.id === id)?.label || id)
      .join(', ');
  }, [selectedExtras, extrasOptions]);

  return (
    <div 
      className={`group border border-theme bg-theme-elevated backdrop-blur-sm overflow-hidden transition-transform transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-rotate-1 hover:border-[var(--accent)]/60 min-w-0 h-full flex flex-col will-change-transform ${
        compact 
          ? 'rounded-lg sm:rounded-xl hover:-translate-y-1' 
          : 'rounded-xl sm:rounded-2xl hover:-translate-y-2'
      }`}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isLightTheme 
          ? 'rgba(0, 0, 0, 0.04)' 
          : 'rgba(255, 255, 255, 0.04)';
        e.currentTarget.style.boxShadow = isLightTheme
          ? '0 35px 70px -40px rgba(197, 157, 95, 0.5), 0 0 0 1px rgba(197, 157, 95, 0.3)'
          : '0 35px 70px -40px rgba(197, 157, 95, 0.75)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div 
        className="relative aspect-square w-full overflow-hidden"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(5, 5, 9, 0.95)'
        }}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:brightness-110"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
          }}
        />

        <AnimatePresence>
          {isFeatured && (
            <m.div
              key="featured"
              className={`absolute bg-[var(--accent)] text-black rounded-md text-[10px] font-bold flex items-center gap-1 z-10 ${
                compact 
                  ? 'top-1 left-1 px-1 py-0.5' 
                  : 'top-2 left-2 px-2 py-1 sm:text-xs'
              }`}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <span>⭐</span>
              <span>Chef&apos;s Pick</span>
            </m.div>
          )}

          {isOutOfStock && (
            <m.div
              key="out-of-stock"
              className={`absolute bg-red-600 text-black rounded-md text-[10px] font-bold z-10 ${
                compact 
                  ? 'top-1 right-1 px-1 py-0.5' 
                  : 'top-2 right-2 px-2 py-1 sm:text-xs'
              }`}
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              Unavailable
            </m.div>
          )}

          {product.spice_level > 0 && !isOutOfStock && (
            <m.div
              key="spice-level"
              className={`absolute bg-red-900/90 text-red-100 rounded-md text-[10px] font-bold backdrop-blur-sm z-10 ${
                compact 
                  ? 'top-1 right-1 px-1 py-0.5' 
                  : 'top-2 right-2 px-2 py-1 sm:text-xs'
              }`}
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {'🌶️'.repeat(product.spice_level)}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`flex flex-col flex-1 ${compact ? 'px-2 sm:px-3 py-1.5 sm:py-2' : 'px-4 sm:px-6 py-3 sm:py-4'}`}>
        <h3 className={`font-bold text-[var(--text-main)] line-clamp-2 ${
          compact 
            ? 'text-sm sm:text-base mb-1 min-h-[1.75rem]' 
            : 'text-base sm:text-lg mb-2 min-h-[3.5rem]'
        }`}>
          {product.name}
        </h3>

        <p className={`text-[var(--text-muted)] line-clamp-2 ${
          compact 
            ? 'text-xs sm:text-sm mb-1.5 min-h-[1.25rem]' 
            : 'text-sm sm:text-base mb-3 min-h-[2.5rem]'
        }`}>
          {product.description || 'Delicious dish prepared with quality ingredients and served fresh.'}
        </p>

        <m.div
          className={`flex flex-wrap mb-3 ${
            compact 
              ? 'gap-1.5 sm:gap-2 min-h-[0.75rem]' 
              : 'gap-3 sm:gap-4 min-h-[1.5rem]'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {product.dietary_tags && product.dietary_tags.length > 0 && (
            <>
              {product.dietary_tags.slice(0, 3).map((tag, index) => (
                <m.span
                  key={tag}
                  className={`py-0.5 text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 rounded-full capitalize ${
                    compact ? 'px-1' : 'px-2 sm:text-xs'
                  }`}
                  initial={{ opacity: 0, scale: 0.8, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  {tag.replace('-', ' ')}
                </m.span>
              ))}
              {product.dietary_tags.length > 3 && (
                <m.span
                  className={`py-0.5 text-[10px] bg-theme-elevated text-[var(--text-muted)] border border-theme rounded-full ${
                    compact ? 'px-1' : 'px-2 sm:text-xs'
                  }`}
                  initial={{ opacity: 0, scale: 0.8, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  +{product.dietary_tags.length - 3} more
                </m.span>
              )}
            </>
          )}

          {product.prep_time && (
            <m.span
              className={`py-0.5 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1 ${
                compact ? 'px-1' : 'px-2 sm:text-xs'
              }`}
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <span>⏱️</span>
              <span>{product.prep_time}m</span>
            </m.span>
          )}
        </m.div>

        {/* Allergen badges, stock info, review snippet, and customization - Before price/button */}
        {allergenBadges.length > 0 && (
          <m.div
            className={`flex flex-wrap ${
              compact 
                ? 'mb-1.5 gap-1.5 sm:gap-2' 
                : 'mb-3 gap-3 sm:gap-4'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            {allergenBadges.slice(0, 4).map((tag, index) => (
                <m.span
                  key={tag}
                  className={`py-0.5 text-[10px] uppercase tracking-wide bg-amber-400/15 text-amber-100 border border-amber-400/30 rounded-full ${
                    compact ? 'px-1' : 'px-2 sm:text-xs'
                  }`}
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                {tag}
              </m.span>
            ))}
            {allergenBadges.length > 4 && (
                <m.span
                  className={`py-0.5 text-[10px] uppercase tracking-wide text-muted border border-theme rounded-full ${
                    compact ? 'px-1' : 'px-2 sm:text-xs'
                  }`}
                  style={{
                    backgroundColor: isLightTheme 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(255, 255, 255, 0.05)'
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  +{allergenBadges.length - 4}
                </m.span>
            )}
          </m.div>
        )}

        {!isOutOfStock && product.stock_quantity !== undefined && product.stock_quantity <= (product.low_stock_threshold || 10) && (
          <p className={`text-[10px] text-orange-400 ${
            compact ? 'mb-1' : 'mb-2 sm:text-xs'
          }`}>
            Only {product.stock_quantity} left in stock!
          </p>
        )}

        {reviewSnippet && (
          <p className={`text-[10px] italic text-[var(--text-main)]/70 line-clamp-2 ${
            compact ? 'mb-1.5' : 'mb-3 sm:text-xs'
          }`}>
            &ldquo;{reviewSnippet}&rdquo;
          </p>
        )}

        {enableCustomization && (
          <m.div
            className={`border-t border-theme ${
              compact ? 'mt-2 pt-2' : 'mt-4 pt-4'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <m.button
              type="button"
              onClick={() => setCustomizerOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-lg border border-theme bg-theme-elevated font-medium text-[var(--text-main)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] ${
                compact 
                  ? 'min-h-[36px] px-2 sm:px-3 py-1.5 text-xs sm:text-sm' 
                  : 'min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              <span>Customize</span>
              <m.svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ rotate: customizerOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <path d="M6 9l6 6 6-6" />
              </m.svg>
            </m.button>

            <AnimatePresence>
              {customizerOpen && (
                <m.div
                  className={`${
                    compact ? 'mt-1.5 space-y-2' : 'mt-3 space-y-4'
                  }`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <m.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted">Add-ons</p>
                    <div className={`flex flex-wrap ${
                      compact ? 'gap-1.5 sm:gap-2' : 'gap-3 sm:gap-4'
                    }`}>
                      {extrasOptions.map((extra, index) => {
                        const isActive = selectedExtras.includes(extra.id);
                        return (
                          <m.button
                            key={extra.id}
                            type="button"
                            onClick={() => toggleExtra(extra.id)}
                            className={`rounded-full border text-[10px] font-medium transition-all ${
                              compact 
                                ? 'min-h-[36px] px-2 sm:px-3 py-1.5' 
                                : 'min-h-[44px] px-4 sm:px-6 py-3 sm:text-xs'
                            } ${
                              isActive
                                ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]'
                                : 'border-theme bg-theme-elevated text-muted hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]'
                            }`}
                            initial={{ opacity: 0, scale: 0.8, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = isLightTheme 
                                  ? 'rgba(0, 0, 0, 0.08)' 
                                  : 'rgba(255, 255, 255, 0.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = '';
                              }
                            }}
                          >
                            <span>{extra.label}</span>
                            {extra.price ? (
                              <span className="ml-2 text-[10px] sm:text-xs uppercase text-muted/80">
                                {formatExtraPrice(extra.price, product.currency)}
                              </span>
                            ) : null}
                          </m.button>
                        );
                      })}
                    </div>
                  </m.div>

                  <m.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted">Spice Level</p>
                    <div className={`flex items-center ${
                      compact ? 'gap-1.5 sm:gap-2' : 'gap-3 sm:gap-4'
                    }`}>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={preferredSpiceLevel}
                        onChange={(event) => setPreferredSpiceLevel(Number(event.target.value))}
                        className={`w-full accent-[var(--accent)] ${
                          compact ? 'min-h-[36px]' : 'min-h-[44px]'
                        }`}
                      />
                      <span className="text-[10px] sm:text-xs text-muted">
                        {preferredSpiceLevel === 0 && 'Mild'}
                        {preferredSpiceLevel === 1 && 'Medium'}
                        {preferredSpiceLevel === 2 && 'Hot'}
                        {preferredSpiceLevel === 3 && 'Fiery'}
                      </span>
                    </div>
                  </m.div>

                  <m.p
                    className="text-[10px] sm:text-xs text-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {selectedExtrasSummary}
                  </m.p>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
        )}

        {/* Price and Add to Cart - Always at bottom */}
        <div className={`flex items-center justify-between mt-auto ${
          compact ? 'gap-2' : 'gap-3 sm:gap-4'
        }`}>
          <div className={`font-bold text-[var(--accent)] ${
            compact 
              ? 'text-base sm:text-lg md:text-xl' 
              : 'text-base sm:text-lg md:text-xl'
          }`}>
            {getCurrencySymbol(product.currency || 'BDT')}{formatPrice(product.price, 0)}
          </div>

          <m.button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`rounded-lg font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              compact 
                ? 'min-h-[36px] px-2 sm:px-3 py-1.5 text-xs sm:text-sm' 
                : 'min-h-[36px] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm'
            } ${
              isOutOfStock
                ? 'bg-gray-600 text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--accent)] text-black hover:bg-[#D4B078] hover:shadow-[0_20px_35px_-20px_rgba(197,157,95,0.7)]'
            }`}
            whileHover={!isOutOfStock ? { scale: 1.06, y: -2 } : {}}
            whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </m.button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    currency: PropTypes.string,
    stock_quantity: PropTypes.number,
    low_stock_threshold: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    chef_special: PropTypes.bool,
    is_available: PropTypes.bool,
    is_featured: PropTypes.bool,
    image_url: PropTypes.string,
    spice_level: PropTypes.number,
    prep_time: PropTypes.number,
    dietary_tags: PropTypes.arrayOf(PropTypes.string),
    allergens: PropTypes.arrayOf(PropTypes.string),
    allergen_tags: PropTypes.arrayOf(PropTypes.string),
    customization_options: PropTypes.shape({
      extras: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          label: PropTypes.string.isRequired,
          price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        })
      ),
    }),
    available_extras: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      })
    ),
    review_snippet: PropTypes.string,
    reviewSnippet: PropTypes.string,
    review_highlight: PropTypes.string,
    reviewHighlight: PropTypes.string,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  getImageUrl: PropTypes.func.isRequired,
  enableCustomization: PropTypes.bool,
  compact: PropTypes.bool,
};


export default ProductCard;