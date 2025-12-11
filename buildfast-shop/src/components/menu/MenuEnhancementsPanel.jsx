import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { fadeSlideUp, staggerContainer, fadeSlideFromRight, batchFadeSlideUp } from '../animations/menuAnimations';

const formatLabel = (label) => {
  if (!label) return '';
  const normalized = label.replace(/[-_]/g, ' ').toLowerCase();
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveImage = (item) =>
  item?.image_url || item?.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop';

const MenuEnhancementsPanel = ({
  searchQuery,
  onSearchChange,
  dietaryTags,
  activeDietaryTags,
  onDietaryToggle,
  allergenTags,
  activeAllergenTags,
  onAllergenToggle,
  quickReorderItems,
  onQuickReorder,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const hasDietaryFilters = dietaryTags.length > 0;
  const hasAllergenFilters = allergenTags.length > 0;
  const hasQuickReorder = quickReorderItems.length > 0;

  const quickReorderCards = useMemo(() => quickReorderItems.slice(0, 3), [quickReorderItems]);

  // Theme detection
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

  return (
    <motion.aside
      className="hidden xl:block w-80 flex-shrink-0"
      variants={fadeSlideFromRight}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={0.3}
    >
      <div className="sticky top-20">
        <motion.div
          className="rounded-xl sm:rounded-2xl border border-theme backdrop-blur-md overflow-hidden"
          style={{
            backgroundColor: isLightTheme 
              ? 'rgba(0, 0, 0, 0.02)' 
              : 'rgba(255, 255, 255, 0.02)',
            boxShadow: isLightTheme 
              ? '0 25px 60px -20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
              : '0 25px 60px -20px rgba(0, 0, 0, 0.45)',
            borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
          }}
          layout
        >
          <motion.div
            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-theme"
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted/70">Refine</p>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-main)]">Flavor Controls</h3>
            </div>
            <motion.button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-xl sm:rounded-2xl border border-theme px-4 sm:px-6 py-3 min-h-[44px] text-[10px] sm:text-xs text-muted hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {collapsed ? 'Open' : 'Hide'}
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 md:space-y-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                <motion.div
                  className="space-y-3 sm:space-y-4 md:space-y-6"
                  variants={fadeSlideUp}
                >
                  <motion.label
                    htmlFor="refine-search"
                    className="text-sm sm:text-base font-medium text-[var(--text-main)]/80"
                    variants={fadeSlideUp}
                  >
                    Quick Search
                  </motion.label>
                  <motion.div
                    className="relative"
                    variants={fadeSlideUp}
                  >
                    <input
                      id="refine-search"
                      type="search"
                      value={searchQuery}
                      onChange={(event) => onSearchChange(event.target.value)}
                      placeholder="Search dishes"
                      className="w-full rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 min-h-[44px] text-sm sm:text-base text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                    />
                    <svg
                      className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </motion.div>
                </motion.div>

                {hasDietaryFilters && (
                  <motion.section
                    className="space-y-3 sm:space-y-4 md:space-y-6"
                    variants={fadeSlideUp}
                  >
                    <motion.div
                      className="flex items-center justify-between"
                      variants={fadeSlideUp}
                    >
                      <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">Dietary Focus</h4>
                      {activeDietaryTags.length > 0 && (
                        <motion.button
                          type="button"
                          onClick={() => {
                            // Clear all active dietary tags by finding original format and toggling
                            activeDietaryTags.forEach((normalizedTag) => {
                              // Find the original tag format from dietaryTags array
                              const originalTag = dietaryTags.find(t =>
                                t.toLowerCase() === normalizedTag.toLowerCase()
                              );
                              if (originalTag) {
                                onDietaryToggle(originalTag);
                              } else {
                                // Fallback: try toggling with the normalized tag
                                onDietaryToggle(normalizedTag);
                              }
                            });
                          }}
                          className="text-[10px] sm:text-xs text-muted underline-offset-4 hover:text-[var(--accent)]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Clear
                        </motion.button>
                      )}
                    </motion.div>
                    <motion.div
                      className="flex flex-wrap gap-3 sm:gap-4 md:gap-6"
                      variants={staggerContainer}
                    >
                      {dietaryTags.map((tag, index) => {
                        const normalized = tag.toLowerCase();
                        const isActive = activeDietaryTags.includes(normalized);

                        return (
                          <motion.button
                            key={tag}
                            type="button"
                            onClick={() => onDietaryToggle(tag)}
                            className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 shadow-inner'
                                : 'bg-theme-elevated text-muted border border-theme hover:border-emerald-300/40 hover:text-[var(--text-main)]'
                            }`}
                            variants={fadeSlideUp}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            custom={index * 0.05}
                          >
                            {formatLabel(tag)}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </motion.section>
                )}

                {hasAllergenFilters && (
                  <motion.section
                    className="space-y-3 sm:space-y-4 md:space-y-6"
                    variants={fadeSlideUp}
                  >
                    <motion.div
                      className="flex items-center justify-between"
                      variants={fadeSlideUp}
                    >
                      <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">Avoid Allergens</h4>
                      {activeAllergenTags.length > 0 && (
                        <motion.button
                          type="button"
                          onClick={() => {
                            // Clear all active allergen tags by finding original format and toggling
                            activeAllergenTags.forEach((normalizedTag) => {
                              // Find the original tag format from allergenTags array
                              const originalTag = allergenTags.find(t =>
                                t.toLowerCase() === normalizedTag.toLowerCase()
                              );
                              if (originalTag) {
                                onAllergenToggle(originalTag);
                              } else {
                                // Fallback: try toggling with the normalized tag
                                onAllergenToggle(normalizedTag);
                              }
                            });
                          }}
                          className="text-[10px] sm:text-xs text-muted underline-offset-4 hover:text-[var(--accent)]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Clear
                        </motion.button>
                      )}
                    </motion.div>
                    <motion.div
                      className="flex flex-wrap gap-3 sm:gap-4 md:gap-6"
                      variants={staggerContainer}
                    >
                      {allergenTags.map((tag, index) => {
                        const normalized = tag.toLowerCase();
                        const isActive = activeAllergenTags.includes(normalized);

                        return (
                          <motion.button
                            key={tag}
                            type="button"
                            onClick={() => onAllergenToggle(tag)}
                            className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-inner'
                                : 'bg-theme-elevated text-muted border border-theme hover:border-amber-300/40 hover:text-[var(--text-main)]'
                            }`}
                            variants={fadeSlideUp}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            custom={index * 0.05}
                          >
                            {formatLabel(tag)}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </motion.section>
                )}

                <motion.section
                  className="space-y-3 sm:space-y-4 md:space-y-6"
                  variants={fadeSlideUp}
                >
                  <motion.div
                    className="flex items-center justify-between"
                    variants={fadeSlideUp}
                  >
                    <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">Quick Reorder</h4>
                    <span className="text-[10px] sm:text-xs text-muted">{hasQuickReorder ? 'Last enjoyed' : 'No history yet'}</span>
                  </motion.div>

                  {hasQuickReorder ? (
                    <motion.div
                      className="space-y-3 sm:space-y-4 md:space-y-6"
                      variants={staggerContainer}
                    >
                      {quickReorderCards.map((item, index) => (
                        <motion.div
                          key={item.id}
                          className="flex gap-3 sm:gap-4 md:gap-6 rounded-xl sm:rounded-2xl border border-theme px-4 sm:px-6 py-3 sm:py-4"
                          style={{
                            backgroundColor: isLightTheme 
                              ? 'rgba(0, 0, 0, 0.04)' 
                              : 'rgba(255, 255, 255, 0.05)',
                            boxShadow: isLightTheme 
                              ? '0 1px 2px 0 rgba(0, 0, 0, 0.1)' 
                              : '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
                            borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
                          }}
                          variants={batchFadeSlideUp}
                          whileHover={{ scale: 1.02, y: -2 }}
                          custom={index * 0.08}
                        >
                          <div className="h-14 w-14 overflow-hidden rounded-xl sm:rounded-2xl border border-theme">
                            <img
                              src={resolveImage(item)}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-[var(--text-main)] line-clamp-1">{item.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted/80 line-clamp-1">
                              {(item.dietary_tags || [])
                                .slice(0, 2)
                                .map((tag) => formatLabel(tag))
                                .join(' • ')}
                            </p>
                            <motion.button
                              type="button"
                              onClick={() => {
                                if (onQuickReorder) {
                                  onQuickReorder(item.id);
                                }
                              }}
                              className="mt-2 inline-flex items-center gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs font-medium text-[var(--accent)] hover:text-[var(--text-main)] transition-colors py-3 min-h-[44px]"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Order again
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
                                <path d="M14 2.5v4h-4" />
                              </svg>
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="rounded-xl sm:rounded-2xl border border-dashed border-theme px-4 sm:px-6 py-3 sm:py-4 text-center"
                      style={{
                        backgroundColor: isLightTheme 
                          ? 'rgba(0, 0, 0, 0.04)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
                      }}
                      variants={fadeSlideUp}
                    >
                      <p className="text-[10px] sm:text-xs text-muted">
                        Your picks will land here after the next order.
                      </p>
                    </motion.div>
                  )}
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  );
};

MenuEnhancementsPanel.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  dietaryTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeDietaryTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDietaryToggle: PropTypes.func.isRequired,
  allergenTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeAllergenTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAllergenToggle: PropTypes.func.isRequired,
  quickReorderItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      image_url: PropTypes.string,
      image: PropTypes.string,
      dietary_tags: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  onQuickReorder: PropTypes.func, // Optional - can be null when quick reorder is disabled
};

export default MenuEnhancementsPanel;

