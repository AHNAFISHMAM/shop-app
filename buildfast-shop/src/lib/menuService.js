/**
 * Menu Service
 *
 * Service layer for menu-related operations.
 * Abstracts Supabase RPC calls for menu data.
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';

/**
 * Get the complete public menu using RPC function
 *
 * Returns organized menu data with categories, subcategories, and dishes.
 * Much faster than making 3 separate queries.
 *
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getPublicMenu() {
  try {
    const { data, error } = await supabase.rpc('get_public_menu');

    if (error) {
      logger.error('Error fetching public menu:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load menu'
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getPublicMenu:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred while loading the menu'
    };
  }
}

/**
 * Get all categories
 *
 * Fallback method if RPC is not available.
 *
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      logger.error('Error fetching categories:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load categories'
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getCategories:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get all subcategories with their parent categories
 *
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getSubcategories() {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select(`
        *,
        categories (id, name)
      `)
      .order('display_order');

    if (error) {
      logger.error('Error fetching subcategories:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load subcategories'
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getSubcategories:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get all active dishes
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.categoryId - Filter by category ID
 * @param {string} filters.subcategoryId - Filter by subcategory ID
 * @param {boolean} filters.chefSpecial - Filter chef's specials only
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getDishes(filters = {}) {
  try {
    let query = supabase
      .from('dishes')
      .select(`
        *,
        subcategories (
          id,
          name,
          display_order,
          categories (id, name)
        )
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.subcategoryId) {
      query = query.eq('subcategory_id', filters.subcategoryId);
    }

    if (filters.chefSpecial) {
      query = query.eq('chef_special', true);
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching dishes:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load dishes'
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getDishes:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get a single dish by ID
 *
 * @param {string} dishId - The dish ID
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getDishById(dishId) {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .select(`
        *,
        subcategories (
          id,
          name,
          categories (id, name)
        )
      `)
      .eq('id', dishId)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching dish:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Dish not found'
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getDishById:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Search dishes by name or description
 *
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function searchDishes(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return {
        success: true,
        data: [],
        error: null
      };
    }

    const { data, error } = await supabase
      .from('dishes')
      .select(`
        *,
        subcategories (
          id,
          name,
          categories (id, name)
        )
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('name');

    if (error) {
      logger.error('Error searching dishes:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Search failed'
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in searchDishes:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

export default {
  getPublicMenu,
  getCategories,
  getSubcategories,
  getDishes,
  getDishById,
  searchDishes
};
