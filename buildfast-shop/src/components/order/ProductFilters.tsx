import { useCallback, useMemo } from 'react'
import CustomDropdown from '../ui/CustomDropdown'

/**
 * Category interface
 */
interface Category {
  id: string
  name: string
  [key: string]: unknown
}

/**
 * ProductFilters component props
 */
interface ProductFiltersProps {
  /** Array of categories */
  categories: Category[]
  /** Currently selected category */
  selectedCategory?: Category | null
  /** Callback when category changes */
  onCategoryChange: (category: Category | null) => void
  /** Array of filtered subcategories */
  filteredSubcategories?: Category[]
  /** Currently selected subcategory */
  selectedSubcategory?: Category | null
  /** Callback when subcategory changes */
  onSubcategoryChange: (subcategory: Category | null) => void
  /** Current spice level (0-3) */
  spiceLevel?: number | null
  /** Callback when spice level changes */
  onSpiceLevelChange: (level: number | null) => void
  /** Array of selected dietary filters */
  dietaryFilters: string[]
  /** Callback when dietary filters change */
  onDietaryFiltersChange: (filters: string[]) => void
  /** Whether to show only chef specials */
  chefSpecialOnly: boolean
  /** Callback when chef special only changes */
  onChefSpecialOnlyChange: (value: boolean) => void
  /** Whether to show only in-stock items */
  inStockOnly: boolean
  /** Callback when in-stock only changes */
  onInStockOnlyChange: (value: boolean) => void
}

/**
 * Product Filters Panel Component
 *
 * Comprehensive filtering options for OrderPage.
 * Provides category, subcategory, spice level, dietary, and availability filters.
 *
 * Features:
 * - Category and subcategory filtering
 * - Spice level selection
 * - Dietary preference checkboxes
 * - Chef special and stock availability toggles
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 */
const ProductFilters = ({
  categories,
  selectedCategory = null,
  onCategoryChange,
  filteredSubcategories = [],
  selectedSubcategory = null,
  onSubcategoryChange,
  spiceLevel = null,
  onSpiceLevelChange,
  dietaryFilters,
  onDietaryFiltersChange,
  chefSpecialOnly,
  onChefSpecialOnlyChange,
  inStockOnly,
  onInStockOnlyChange,
}: ProductFiltersProps) => {
  // Handle category change with useCallback
  const handleCategoryChange = useCallback(
    (event: { target: { value: string | number; name?: string } }) => {
      const cat = categories.find(c => c.id === String(event.target.value))
      onCategoryChange(cat || null)
    },
    [categories, onCategoryChange]
  )

  // Handle subcategory change with useCallback
  const handleSubcategoryChange = useCallback(
    (event: { target: { value: string | number; name?: string } }) => {
      const sub = filteredSubcategories.find(s => s.id === String(event.target.value))
      onSubcategoryChange(sub || null)
    },
    [filteredSubcategories, onSubcategoryChange]
  )

  // Handle spice level change with useCallback
  const handleSpiceLevelChange = useCallback(
    (event: { target: { value: string | number; name?: string } }) => {
      onSpiceLevelChange(
        event.target.value === '' ? null : parseInt(String(event.target.value), 10)
      )
    },
    [onSpiceLevelChange]
  )

  // Handle dietary checkbox change
  const handleDietaryChange = useCallback(
    (tag: string, checked: boolean) => {
      if (checked) {
        onDietaryFiltersChange([...dietaryFilters, tag])
      } else {
        onDietaryFiltersChange(dietaryFilters.filter(t => t !== tag))
      }
    },
    [dietaryFilters, onDietaryFiltersChange]
  )

  // Memoized dropdown options
  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'All Categories' },
      ...categories.map(cat => ({ value: cat.id, label: cat.name })),
    ],
    [categories]
  )

  const subcategoryOptions = useMemo(
    () => [
      { value: '', label: 'All Subcategories' },
      ...filteredSubcategories.map(sub => ({ value: sub.id, label: sub.name })),
    ],
    [filteredSubcategories]
  )

  const spiceLevelOptions = useMemo(
    () => [
      { value: '', label: 'Any' },
      { value: '0', label: 'Mild' },
      { value: '1', label: 'Medium 🌶️' },
      { value: '2', label: 'Hot 🌶️🌶️' },
      { value: '3', label: 'Extra Hot 🌶️🌶️🌶️' },
    ],
    []
  )

  const dietaryTags = useMemo(() => ['vegetarian', 'vegan', 'gluten-free'], [])

  return (
    <section
      className="mb-6 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 space-y-4"
      aria-labelledby="product-filters-heading"
    >
      <h2 id="product-filters-heading" className="sr-only">
        Product Filters
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Category */}
        <div>
          <label
            htmlFor="category-filter"
            className="block text-sm sm:text-base text-[var(--text-muted)] mb-2"
          >
            Category
          </label>
          <CustomDropdown
            id="category-filter"
            options={categoryOptions}
            value={selectedCategory?.id || ''}
            onChange={handleCategoryChange}
            placeholder="All Categories"
            maxVisibleItems={5}
          />
        </div>

        {/* Subcategory */}
        <div>
          <label
            htmlFor="subcategory-filter"
            className="block text-sm sm:text-base text-[var(--text-muted)] mb-2"
          >
            Subcategory
          </label>
          <CustomDropdown
            id="subcategory-filter"
            options={subcategoryOptions}
            value={selectedSubcategory?.id || ''}
            onChange={handleSubcategoryChange}
            placeholder="All Subcategories"
            disabled={!selectedCategory}
            maxVisibleItems={5}
          />
        </div>

        {/* Spice Level */}
        <div>
          <label
            htmlFor="spice-level-filter"
            className="block text-sm sm:text-base text-[var(--text-muted)] mb-2"
          >
            Spice Level
          </label>
          <CustomDropdown
            id="spice-level-filter"
            options={spiceLevelOptions}
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
        <div
          className="flex flex-wrap gap-3 sm:gap-4"
          role="group"
          aria-label="Dietary preferences"
        >
          {dietaryTags.map(tag => (
            <label
              key={tag}
              htmlFor={`dietary-${tag}`}
              className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:text-[var(--text-main)] transition-colors min-h-[44px]"
            >
              <input
                id={`dietary-${tag}`}
                type="checkbox"
                checked={dietaryFilters.includes(tag)}
                onChange={e => handleDietaryChange(tag, e.target.checked)}
                className="w-5 h-5 min-w-[44px] min-h-[44px] rounded border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus-visible:outline-none"
                aria-label={`Filter by ${tag.replace('-', ' ')}`}
              />
              <span className="text-sm sm:text-base capitalize text-[var(--text-muted)]">
                {tag.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-3 sm:gap-4 md:gap-6" role="group" aria-label="Additional filters">
        <label
          htmlFor="chef-special-only"
          className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:text-[var(--text-main)] transition-colors min-h-[44px]"
        >
          <input
            id="chef-special-only"
            type="checkbox"
            checked={chefSpecialOnly}
            onChange={e => onChefSpecialOnlyChange(e.target.checked)}
            className="w-5 h-5 min-w-[44px] min-h-[44px] rounded border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus-visible:outline-none"
            aria-label="Show only chef specials"
          />
          <span className="text-sm sm:text-base text-[var(--text-muted)]">
            ⭐ Chef&apos;s Specials Only
          </span>
        </label>

        <label
          htmlFor="in-stock-only"
          className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:text-[var(--text-main)] transition-colors min-h-[44px]"
        >
          <input
            id="in-stock-only"
            type="checkbox"
            checked={inStockOnly}
            onChange={e => onInStockOnlyChange(e.target.checked)}
            className="w-5 h-5 min-w-[44px] min-h-[44px] rounded border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus-visible:outline-none"
            aria-label="Show only in-stock items"
          />
          <span className="text-sm sm:text-base text-[var(--text-muted)]">In Stock Only</span>
        </label>
      </div>
    </section>
  )
}

export default ProductFilters
