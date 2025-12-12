import { useCallback } from 'react';
import PropTypes from 'prop-types';
import CustomDropdown from '../ui/CustomDropdown';

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
          <CustomDropdown
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat.id, label: cat.name }))
            ]}
            value={selectedCategory?.id || ''}
            onChange={handleCategoryChange}
            placeholder="All Categories"
            maxVisibleItems={5}
          />
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-sm sm:text-base text-[var(--text-muted)] mb-2">
            Subcategory
          </label>
          <CustomDropdown
            options={[
              { value: '', label: 'All Subcategories' },
              ...filteredSubcategories.map(sub => ({ value: sub.id, label: sub.name }))
            ]}
            value={selectedSubcategory?.id || ''}
            onChange={handleSubcategoryChange}
            placeholder="All Subcategories"
            disabled={!selectedCategory}
            maxVisibleItems={5}
          />
        </div>

        {/* Spice Level */}
        <div>
          <label className="block text-sm sm:text-base text-[var(--text-muted)] mb-2">
            Spice Level
          </label>
          <CustomDropdown
            options={[
              { value: '', label: 'Any' },
              { value: '0', label: 'Mild' },
              { value: '1', label: 'Medium 🌶️' },
              { value: '2', label: 'Hot 🌶️🌶️' },
              { value: '3', label: 'Extra Hot 🌶️🌶️🌶️' }
            ]}
            value={spiceLevel !== null ? String(spiceLevel) : ''}
            onChange={handleSpiceLevelChange}
            placeholder="Any"
            maxVisibleItems={5}
          />
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
