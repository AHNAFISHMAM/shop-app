/**
 * Type declarations for useOrderFilters hook
 */
export interface UseOrderFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  filteredMeals: any[];
  clearFilters: () => void;
}

export function useOrderFilters(meals?: any[]): UseOrderFiltersReturn;

