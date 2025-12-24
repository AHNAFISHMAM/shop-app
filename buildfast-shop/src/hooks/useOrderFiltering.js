import { useMemo } from 'react'

/**
 * Custom hook for filtering and sorting products on OrderPage
 * More comprehensive than useMenuFiltering (includes price, dietary, spice level, etc.)
 * Handles both subcategorized and non-subcategorized products correctly
 */

/**
 * Filter and sort products based on multiple criteria
 */
export const useOrderFiltering = (
  products,
  {
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    priceRange,
    dietaryFilters,
    spiceLevel,
    chefSpecialOnly,
    inStockOnly,
    sortBy,
  }
) => {
  return useMemo(() => {
    let results = products

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query)
      )
    }

    // Subcategory filter (most specific)
    if (selectedSubcategory) {
      results = results.filter(p => p.subcategory_id === selectedSubcategory.id)
    }
    // Category filter
    // FIXED: Handles both subcategorized and non-subcategorized products
    else if (selectedCategory) {
      results = results.filter(p => {
        // Products with subcategories: check nested relation
        if (p.subcategory_id && p.subcategories?.categories?.id) {
          return p.subcategories.categories.id === selectedCategory.id
        }
        // Products without subcategories: check direct category_id
        return p.category_id === selectedCategory.id
      })
    }

    // Price range filter
    if (priceRange && priceRange.length === 2) {
      results = results.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    }

    // Dietary filters (must have ALL selected tags)
    if (dietaryFilters && dietaryFilters.length > 0) {
      results = results.filter(p =>
        dietaryFilters.every(filter => p.dietary_tags?.includes(filter))
      )
    }

    // Spice level filter
    if (spiceLevel !== null && spiceLevel !== undefined) {
      results = results.filter(p => p.spice_level === spiceLevel)
    }

    // Chef's special filter
    if (chefSpecialOnly) {
      results = results.filter(p => p.chef_special)
    }

    // In stock filter
    if (inStockOnly) {
      // Note: menu_items doesn't have stock_quantity, use is_available instead
      results = results.filter(p => p.is_available !== false)
    }

    // Sorting
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        default:
          return 0
      }
    })

    return results
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    priceRange,
    dietaryFilters,
    spiceLevel,
    chefSpecialOnly,
    inStockOnly,
    sortBy,
  ])
}

/**
 * Get subcategories for selected category
 */
export const useFilteredSubcategories = (subcategories, selectedCategory) => {
  return useMemo(() => {
    if (!selectedCategory) return []
    return subcategories.filter(sub => sub.categories?.id === selectedCategory.id)
  }, [subcategories, selectedCategory])
}
