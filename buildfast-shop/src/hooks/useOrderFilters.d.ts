export interface Meal {
  id: string;
  name?: string;
  price?: number | string;
  category_id?: string;
  [key: string]: unknown;
}

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
  filteredMeals: Meal[];
  clearFilters: () => void;
}

export function useOrderFilters(meals?: Meal[]): UseOrderFiltersReturn;

