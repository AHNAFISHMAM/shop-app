import { useMemo } from 'react';

/**
 * Custom hook for filtering menu products
 * FIXED: Handles products without subcategories correctly
 *
 * @param {Array} products - Array of product objects
 * @param {string} searchQuery - Search term for filtering
 * @param {Object} selectedMainCategory - Selected main category object {id, name}
 * @param {Object} selectedSubcategory - Selected subcategory object {id, name}
 * @returns {Array} Filtered products array
 */
export const useMenuFiltering = (
  products,
  searchQuery,
  selectedMainCategory,
  selectedSubcategory
) => {
  return useMemo(() => {
    let results = products;

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.subcategories?.name?.toLowerCase().includes(query)
      );
    }

    // Apply subcategory filter (most specific)
    if (selectedSubcategory) {
      results = results.filter((p) => p.subcategory_id === selectedSubcategory.id);
    }
    // Apply main category filter
    // FIXED: Handles products without subcategories
    else if (selectedMainCategory) {
      results = results.filter((p) => {
        // Products with subcategories: check nested relation
        if (p.subcategory_id && p.subcategories?.categories?.id) {
          return p.subcategories.categories.id === selectedMainCategory.id;
        }
        // Products without subcategories: check direct category_id
        return p.category_id === selectedMainCategory.id;
      });
    }

    return results;
  }, [products, searchQuery, selectedMainCategory, selectedSubcategory]);
};

/**
 * Get chef's picks from products
 * @param {Array} products - Array of product objects
 * @param {number} limit - Maximum number of picks to return (default: 4)
 * @returns {Array} Chef's special products
 */
export const useChefsPicks = (products, limit = 4) => {
  return useMemo(() => {
    return products.filter((p) => p.chef_special).slice(0, limit);
  }, [products, limit]);
};

/**
 * Get filtered subcategories for selected category
 * @param {Array} subcategories - All subcategories
 * @param {Object} selectedMainCategory - Selected main category
 * @returns {Array} Filtered subcategories
 */
export const useFilteredSubcategories = (subcategories, selectedMainCategory) => {
  return useMemo(() => {
    if (!selectedMainCategory) return [];
    return subcategories.filter(
      (sub) => sub.categories?.id === selectedMainCategory.id
    );
  }, [subcategories, selectedMainCategory]);
};
