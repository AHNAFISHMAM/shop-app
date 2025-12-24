import { useState, useMemo } from 'react'
import { parsePrice, formatPrice, getCurrencySymbol } from '../lib/priceUtils'

/**
 * Custom hook for managing OrderPage filters and sorting
 * Extracts all filter-related state and logic from OrderPage
 *
 * @param {Array} meals - Array of meal/menu items to filter
 * @returns {Object} Filter state, filtered/sorted meals, and filter controls
 */
export const useOrderFilters = (meals = []) => {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // Filter meals based on all criteria
  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      // Filter by category (menu_items use category_id)
      if (selectedCategory !== 'all' && meal.category_id !== selectedCategory) {
        return false
      }

      // Filter by price range
      const mealPrice = parsePrice(meal.price)

      if (minPrice && String(minPrice).trim() !== '' && !isNaN(parseFloat(minPrice))) {
        const min = parseFloat(minPrice)
        if (mealPrice < min) {
          return false
        }
      }

      if (maxPrice && String(maxPrice).trim() !== '' && !isNaN(parseFloat(maxPrice))) {
        const max = parseFloat(maxPrice)
        if (mealPrice > max) {
          return false
        }
      }

      // Filter by search query (name or description)
      if (!searchQuery.trim()) {
        return true
      }

      const query = searchQuery.toLowerCase().trim()
      const nameMatch = meal.name?.toLowerCase().includes(query) || false
      const descriptionMatch = meal.description?.toLowerCase().includes(query) || false

      return nameMatch || descriptionMatch
    })
  }, [meals, selectedCategory, minPrice, maxPrice, searchQuery])

  // Sort filtered meals
  const sortedMeals = useMemo(() => {
    return [...filteredMeals].sort((a, b) => {
      switch (sortBy) {
        case 'price-low': {
          const priceA = parsePrice(a.price)
          const priceB = parsePrice(b.price)
          return priceA - priceB
        }
        case 'price-high': {
          const priceA = parsePrice(a.price)
          const priceB = parsePrice(b.price)
          return priceB - priceA
        }
        case 'name-asc': {
          const nameA = (a.name || '').toLowerCase()
          const nameB = (b.name || '').toLowerCase()
          return nameA.localeCompare(nameB)
        }
        case 'newest':
        default: {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        }
      }
    })
  }, [filteredMeals, sortBy])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedCategory !== 'all' ||
      (minPrice && String(minPrice).trim() !== '' && !isNaN(parseFloat(minPrice))) ||
      (maxPrice && String(maxPrice).trim() !== '' && !isNaN(parseFloat(maxPrice))) ||
      sortBy !== 'newest'
    )
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy])

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
  }

  // Price range summary text
  const priceRangeSummary = useMemo(() => {
    const parsedMin = parseFloat(minPrice)
    const parsedMax = parseFloat(maxPrice)
    const hasValidMin = minPrice && String(minPrice).trim() !== '' && !Number.isNaN(parsedMin)
    const hasValidMax = maxPrice && String(maxPrice).trim() !== '' && !Number.isNaN(parsedMax)
    const currencySymbol = getCurrencySymbol('BDT')

    if (hasValidMin && hasValidMax) {
      return `Showing ${sortedMeals.length} meal${sortedMeals.length !== 1 ? 's' : ''} between ${currencySymbol}${formatPrice(parsedMin, 0)} and ${currencySymbol}${formatPrice(parsedMax, 0)}`
    } else if (hasValidMin) {
      return `Showing ${sortedMeals.length} meal${sortedMeals.length !== 1 ? 's' : ''} from ${currencySymbol}${formatPrice(parsedMin, 0)} and up`
    } else if (hasValidMax) {
      return `Showing ${sortedMeals.length} meal${sortedMeals.length !== 1 ? 's' : ''} up to ${currencySymbol}${formatPrice(parsedMax, 0)}`
    }
    return ''
  }, [minPrice, maxPrice, sortedMeals.length])

  return {
    // State values
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,

    // State setters
    setSearchQuery,
    setSelectedCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,

    // Computed values
    filteredMeals,
    sortedMeals,
    hasActiveFilters,
    priceRangeSummary,

    // Actions
    clearAllFilters,
  }
}
