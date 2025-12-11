import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProductCard from '../menu/ProductCard';

/**
 * Professional Section Carousel Component
 * - Netflix-style horizontal scrolling
 * - Mobile-optimized with swipe support
 * - Smart visibility controls
 */
const SectionCarousel = ({
  sectionName,
  dishes,
  isAvailable = true,
  customMessage,
  onAddToCart,
  getImageUrl,
  defaultExpanded = true,
}) => {
  // Theme detection - must be before early returns
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

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

  // Validate required props
  if (!sectionName || typeof sectionName !== 'string') {
    return null;
  }

  if (!Array.isArray(dishes)) {
    return null;
  }

  if (typeof onAddToCart !== 'function' || typeof getImageUrl !== 'function') {
    return null;
  }

  // Use prop directly - fully controlled by parent
  const isExpanded = defaultExpanded;
  const hasDishes = dishes.length > 0;
  const showContent = isExpanded && isAvailable && hasDishes;
  const showEmpty = isExpanded && (!isAvailable || !hasDishes);

  // Hide empty sections completely from Order page
  if (!hasDishes) {
    return null; // Don't render empty sections at all
  }

  return (
    <section className="mb-6 animate-fade-in">
      {/* Section Header - Clean & Professional */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-theme-subtle">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent)]">{sectionName}</h2>
        {hasDishes && (
          <span className="px-3 py-1.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full text-xs md:text-sm font-semibold">
            {dishes.length}
          </span>
        )}
      </div>

      {/* Products Carousel with Always-Visible Controls */}
      {showContent && (
        <div className="relative max-w-full overflow-hidden">
          {/* RESPONSIVE CONTAINER - Square cards (1:1) - Shows 2.5 cards desktop, 1.3 mobile */}
          <div className="overflow-x-auto scroll-smooth flex gap-4 sm:gap-6 pb-4 px-6 snap-x snap-mandatory">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className="flex-shrink-0 w-[calc((100%-3rem)/2)] sm:w-[calc((100%-4rem-1.5rem)/4)] lg:w-[186.5px] snap-start"
              >
                <ProductCard
                  product={dish}
                  onAddToCart={onAddToCart}
                  getImageUrl={getImageUrl}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty/Unavailable State - Inline Message */}
      {showEmpty && (
        <div 
          className="border border-theme rounded-xl p-6 text-center"
          style={{
            backgroundColor: isLightTheme 
              ? 'rgba(0, 0, 0, 0.04)' 
              : 'rgba(255, 255, 255, 0.05)',
            borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
          }}
        >
          <p className="text-sm text-[var(--text-muted)] italic">
            {customMessage || `No ${sectionName.toLowerCase()} available right now`}
          </p>
        </div>
      )}
    </section>
  );
};

SectionCarousel.propTypes = {
  sectionName: PropTypes.string.isRequired,
  dishes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      stock_quantity: PropTypes.number,
      chef_special: PropTypes.bool,
      dietary_tags: PropTypes.arrayOf(PropTypes.string),
      spice_level: PropTypes.number,
      prep_time: PropTypes.number,
    })
  ).isRequired,
  isAvailable: PropTypes.bool,
  customMessage: PropTypes.string,
  onAddToCart: PropTypes.func.isRequired,
  getImageUrl: PropTypes.func.isRequired,
  defaultExpanded: PropTypes.bool,
};

export default SectionCarousel;
