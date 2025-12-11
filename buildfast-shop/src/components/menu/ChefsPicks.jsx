import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, fadeSlideUp, batchFadeSlideUp } from '../animations/menuAnimations';

/**
 * Chef's Picks Section Component
 * Displays featured products marked as chef_special
 * Compact card design for visual distinction from regular menu items
 */
const ChefsPicks = ({ products, onAddToCart, getImageUrl }) => {
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

  const navigate = useNavigate();

  // Handle card click with useCallback
  const handleCardClick = useCallback(
    (productId) => {
      navigate(`/products/${productId}`);
    },
    [navigate]
  );

  // Handle add to cart with event stop propagation
  const handleAddClick = useCallback(
    (e, product) => {
      e.stopPropagation();
      onAddToCart(product);
    },
    [onAddToCart]
  );

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Section Header */}
      <motion.h3
        className="text-2xl font-bold text-[var(--accent)] mb-6 text-center flex items-center justify-center gap-2"
        variants={fadeSlideUp}
        custom={0.1}
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          ⭐
        </motion.span>
        Chef&apos;s Picks
        <motion.span
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          ⭐
        </motion.span>
      </motion.h3>

      {/* Products Grid - Responsive: 2 cols mobile, 4 cols desktop */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={staggerContainer}
      >
        {products.map((item, index) => (
          <motion.div
            key={item.id}
            className="border border-theme rounded-xl overflow-hidden group cursor-pointer hover:border-[var(--accent)]/50 transition-all duration-300"
            style={{
              backgroundColor: isLightTheme 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'rgba(255, 255, 255, 0.05)'
            }}
            onClick={() => handleCardClick(item.id)}
            variants={batchFadeSlideUp}
            custom={index * 0.08}
            whileHover={{ scale: 1.05, y: -5, rotate: 1 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Product Image */}
            <div className="mb-3 rounded-xl overflow-hidden relative">
              <img
                src={getImageUrl(item)}
                alt={item.name}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
                }}
              />

              {/* Chef's Pick Badge */}
              <motion.div
                className="absolute top-2 right-2 bg-[var(--accent)]/90 backdrop-blur text-black px-2 py-1 rounded-full text-[10px] font-bold z-10"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                ⭐ Chef&apos;s Pick
              </motion.div>
            </div>

            {/* Product Info */}
            <div className="px-3 pb-3">
              {/* Product Name */}
              <motion.h4
                className="text-sm font-semibold mb-1 text-[var(--text-main)] line-clamp-1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {item.name}
              </motion.h4>

              {/* Product Description */}
              <motion.p
                className="text-xs text-[var(--text-muted)] mb-2 line-clamp-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                {item.description}
              </motion.p>

              {/* Price and Add Button */}
              <motion.div
                className="flex justify-between items-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <p className="text-sm font-bold text-[var(--accent)]">
                  ৳{typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
                </p>
                <motion.button
                  onClick={(e) => handleAddClick(e, item)}
                  disabled={item.stock_quantity === 0}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                    item.stock_quantity === 0
                      ? 'bg-gray-600 text-[var(--text-muted)] cursor-not-allowed'
                      : 'bg-[var(--accent)] text-black hover:bg-[#D4B078]'
                  }`}
                  aria-label={`Add ${item.name} to cart`}
                  whileHover={item.stock_quantity !== 0 ? { scale: 1.1, y: -2 } : {}}
                  whileTap={item.stock_quantity !== 0 ? { scale: 0.95 } : {}}
                >
                  {item.stock_quantity === 0 ? 'Out' : 'Add'}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

ChefsPicks.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      stock_quantity: PropTypes.number.isRequired,
      chef_special: PropTypes.bool,
    })
  ).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  getImageUrl: PropTypes.func.isRequired,
};

export default ChefsPicks;
