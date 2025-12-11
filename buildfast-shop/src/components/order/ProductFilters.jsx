import { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Product Filters Panel Component
 * Comprehensive filtering options for OrderPage
 */
const ProductFilters = ({
  // Categories
  categories,
  selectedCategory,
  onCategoryChange,
  // Subcategories
  filteredSubcategories,
  selectedSubcategory,
  onSubcategoryChange,
  // Spice level
  spiceLevel,
  onSpiceLevelChange,
  // Dietary filters
  dietaryFilters,
  onDietaryFiltersChange,
  // Toggles
  chefSpecialOnly,
  onChefSpecialOnlyChange,
  inStockOnly,
  onInStockOnlyChange,
}) => {
  // Handle category change with useCallback
  const handleCategoryChange = useCallback(
    (e) => {
      const cat = categories.find((c) => c.id === e.target.value);
      onCategoryChange(cat || null);
    },
    [categories, onCategoryChange]
  );

  // Handle subcategory change with useCallback
  const handleSubcategoryChange = useCallback(
    (e) => {
      const sub = filteredSubcategories.find((s) => s.id === e.target.value);
      onSubcategoryChange(sub || null);
    },
    [filteredSubcategories, onSubcategoryChange]
  );

  // Handle spice level change with useCallback
  const handleSpiceLevelChange = useCallback(
    (e) => {
      onSpiceLevelChange(
        e.target.value === '' ? null : parseInt(e.target.value)
      );
    },
    [onSpiceLevelChange]
  );

  // Handle dietary checkbox change
  const handleDietaryChange = useCallback(
    (tag, checked) => {
      if (checked) {
        onDietaryFiltersChange([...dietaryFilters, tag]);
      } else {
        onDietaryFiltersChange(dietaryFilters.filter((t) => t !== tag));
      }
    },
    [dietaryFilters, onDietaryFiltersChange]
  );

  return (
    <div className="mb-6 bg-elevated border border-theme rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Category */}
        <div>
          <label className="block text-sm sm:text-base text-[var(--text-muted)] mb-2">Category</label>
          <select
            value={selectedCategory?.id || ''}
            onChange={handleCategoryChange}
            className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-elevated border border-theme rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-sm sm:text-base text-[var(--text-muted)] mb-2">
            Subcategory
          </label>
          <select
            value={selectedSubcategory?.id || ''}
            onChange={handleSubcategoryChange}
            className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-elevated border border-theme rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedCategory}
          >
            <option value="">All Subcategories</option>
            {filteredSubcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Spice Level */}
        <div>
          <label className="block text-sm sm:text-base text-[var(--text-muted)] mb-2">
            Spice Level
          </label>
          <select
            value={spiceLevel !== null ? spiceLevel : ''}
            onChange={handleSpiceLevelChange}
            className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-elevated border border-theme rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
          >
            <option value="">Any</option>
            <option value="0">Mild</option>
            <option value="1">Medium 🌶️</option>
            <option value="2">Hot 🌶️🌶️</option>
            <option value="3">Extra Hot 🌶️🌶️🌶️</option>
          </select>
        </div>
      </div>

      {/* Dietary Tags */}
      <div>
        <label className="block text-sm sm:text-base text-[var(--text-muted)] mb-2">
          Dietary Preferences
        </label>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {['vegetarian', 'vegan', 'gluten-free'].map((tag) => (
            <label
              key={tag}
              className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:text-[var(--text-main)] transition-colors"
            >
              <input
                type="checkbox"
                checked={dietaryFilters.includes(tag)}
                onChange={(e) => handleDietaryChange(tag, e.target.checked)}
                className="w-4 h-4 rounded border-theme bg-elevated text-accent focus:ring-2 focus:ring-accent/20"
              />
              <span className="text-sm sm:text-base capitalize text-[var(--text-muted)]">
                {tag.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-3 sm:gap-4 md:gap-6">
        <label className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="checkbox"
            checked={chefSpecialOnly}
            onChange={(e) => onChefSpecialOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded border-theme bg-elevated text-accent focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-sm sm:text-base text-[var(--text-muted)]">⭐ Chef&apos;s Specials Only</span>
        </label>

        <label className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded border-theme bg-elevated text-accent focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-sm sm:text-base text-[var(--text-muted)]">In Stock Only</span>
        </label>
      </div>
    </div>
  );
};

ProductFilters.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedCategory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onCategoryChange: PropTypes.func.isRequired,
  filteredSubcategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  selectedSubcategory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onSubcategoryChange: PropTypes.func.isRequired,
  spiceLevel: PropTypes.number,
  onSpiceLevelChange: PropTypes.func.isRequired,
  dietaryFilters: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDietaryFiltersChange: PropTypes.func.isRequired,
  chefSpecialOnly: PropTypes.bool.isRequired,
  onChefSpecialOnlyChange: PropTypes.func.isRequired,
  inStockOnly: PropTypes.bool.isRequired,
  onInStockOnlyChange: PropTypes.func.isRequired,
};

ProductFilters.defaultProps = {
  selectedCategory: null,
  filteredSubcategories: [],
  selectedSubcategory: null,
  spiceLevel: null,
};

export default ProductFilters;
