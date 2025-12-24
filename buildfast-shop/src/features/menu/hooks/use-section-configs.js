/**
 * useSectionConfigs Hook
 *
 * Custom hook for fetching special section configurations.
 * Provides default sections if table doesn't exist or query fails.
 *
 * @returns {Object} Section configs, loading state, and error
 *
 * @example
 * const { sectionConfigs, loading, error } = useSectionConfigs();
 */

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import { longLivedQueryConfig } from '../../../shared/lib/query-config'

/**
 * Default section configurations
 */
const DEFAULT_SECTION_CONFIGS = [
  {
    section_key: 'todays_menu',
    section_name: "Today's Menu",
    is_available: true,
    display_order: 1,
  },
  {
    section_key: 'daily_specials',
    section_name: 'Daily Specials',
    is_available: true,
    display_order: 2,
  },
  { section_key: 'new_dishes', section_name: 'New Dishes', is_available: true, display_order: 3 },
  {
    section_key: 'discount_combos',
    section_name: 'Discount Combos',
    is_available: true,
    display_order: 4,
  },
  {
    section_key: 'limited_time',
    section_name: 'Limited-Time Meals',
    is_available: true,
    display_order: 5,
  },
  {
    section_key: 'happy_hour',
    section_name: 'Happy Hour Offers',
    is_available: true,
    display_order: 6,
  },
]

/**
 * Fetch special section configurations
 *
 * @returns {Promise<Array>} Array of section configurations
 */
async function fetchSectionConfigs() {
  try {
    const { data, error } = await supabase
      .from('special_sections')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      logger.error('Error fetching section configs:', error)
      // Return default configs if table doesn't exist
      return DEFAULT_SECTION_CONFIGS
    }

    // If no data, return defaults
    if (!data || data.length === 0) {
      return DEFAULT_SECTION_CONFIGS
    }

    return data
  } catch (error) {
    logger.error('Error in fetchSectionConfigs:', error)
    // Return default configs on error
    return DEFAULT_SECTION_CONFIGS
  }
}

/**
 * useSectionConfigs Hook
 *
 * Fetches and manages section configurations with React Query.
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Section configs, loading state, and error
 */
export function useSectionConfigs(options = {}) {
  const { enabled = true } = options

  const {
    data: sectionConfigs = DEFAULT_SECTION_CONFIGS,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.menu.sections(),
    queryFn: fetchSectionConfigs,
    enabled,
    ...longLivedQueryConfig, // Sections change infrequently
    placeholderData: DEFAULT_SECTION_CONFIGS, // Use defaults while loading
  })

  return {
    sectionConfigs,
    loading: isLoading,
    error,
  }
}
