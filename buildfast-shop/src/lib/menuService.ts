/**
 * Menu Service
 *
 * Service layer for menu-related operations.
 * Abstracts Supabase RPC calls for menu data.
 */

import { supabase } from './supabase'
import { logger } from '../utils/logger'
import type { GetPublicMenuResult, MenuCategory, MenuItem } from './database.types'

/**
 * Service response type
 */
export interface ServiceResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

/**
 * Dish filters interface
 */
export interface DishFilters {
  categoryId?: string
  subcategoryId?: string
  chefSpecial?: boolean
}

/**
 * Get the complete public menu using RPC function
 *
 * Returns organized menu data with categories, subcategories, and dishes.
 * Much faster than making 3 separate queries.
 *
 * @returns Promise with menu data or error
 */
export async function getPublicMenu(): Promise<ServiceResponse<GetPublicMenuResult>> {
  try {
    const { data, error } = await supabase.rpc('get_public_menu')

    if (error) {
      logger.error('Error fetching public menu:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load menu',
      }
    }

    return {
      success: true,
      data: data || { categories: [], items: [] },
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getPublicMenu:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred while loading the menu',
    }
  }
}

/**
 * Get all categories
 *
 * Fallback method if RPC is not available.
 *
 * @returns Promise with categories data or error
 */
export async function getCategories(): Promise<ServiceResponse<MenuCategory[]>> {
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order')

    if (error) {
      logger.error('Error fetching categories:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load categories',
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getCategories:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all subcategories with their parent categories
 *
 * @returns Promise with subcategories data or error
 */
export async function getSubcategories(): Promise<ServiceResponse<unknown[]>> {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select(`
        *,
        categories (id, name)
      `)
      .order('display_order')

    if (error) {
      logger.error('Error fetching subcategories:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load subcategories',
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getSubcategories:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all active dishes
 *
 * @param filters - Optional filters
 * @param filters.categoryId - Filter by category ID
 * @param filters.subcategoryId - Filter by subcategory ID
 * @param filters.chefSpecial - Filter chef's specials only
 * @returns Promise with dishes data or error
 */
export async function getDishes(
  filters: DishFilters = {}
): Promise<ServiceResponse<MenuItem[]>> {
  try {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name,
          slug
        )
      `)
      .eq('is_available', true)

    // Apply filters
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters.subcategoryId) {
      // Note: This assumes subcategory relationship exists
      // Adjust based on actual schema
      query = query.eq('subcategory_id', filters.subcategoryId)
    }

    if (filters.chefSpecial) {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching dishes:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load dishes',
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getDishes:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a single dish by ID
 *
 * @param dishId - The dish ID to fetch
 * @returns Promise with dish data or error
 */
export async function getDishById(dishId: string): Promise<ServiceResponse<MenuItem>> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name,
          slug
        )
      `)
      .eq('id', dishId)
      .single()

    if (error) {
      logger.error('Error fetching dish:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load dish',
      }
    }

    return {
      success: true,
      data: data,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getDishById:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Search dishes by name or description
 *
 * @param searchTerm - The search term
 * @returns Promise with matching dishes or error
 */
export async function searchDishes(
  searchTerm: string
): Promise<ServiceResponse<MenuItem[]>> {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return {
        success: true,
        data: [],
        error: null,
      }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name,
          slug
        )
      `)
      .eq('is_available', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error searching dishes:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to search dishes',
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in searchDishes:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

export default {
  getPublicMenu,
  getCategories,
  getSubcategories,
  getDishes,
  getDishById,
  searchDishes,
}

