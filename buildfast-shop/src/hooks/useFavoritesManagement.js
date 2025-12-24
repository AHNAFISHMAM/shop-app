import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toggleFavorites } from '../lib/favoritesUtils'
import { logger } from '../utils/logger'

/**
 * Custom hook for managing favorites functionality
 * Extracts all favorites-related state and logic
 *
 * @param {Object} user - Current authenticated user
 * @returns {Object} Favorites state and handlers
 */
export const useFavoritesManagement = user => {
  const navigate = useNavigate()
  const [favoriteItems, setFavoriteItems] = useState(new Set())
  const [togglingFavorites, setTogglingFavorites] = useState({})

  // Fetch user's favorite items
  const fetchFavoriteItems = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id)

      if (error) {
        logger.error('Error fetching favorites:', error)
        return
      }

      const favoriteMealIds = new Set(data.map(item => item.product_id))
      setFavoriteItems(favoriteMealIds)
    } catch (err) {
      logger.error('Error in fetchFavoriteItems:', err)
    }
  }, [user])

  // Initial fetch on mount or when user changes
  useEffect(() => {
    fetchFavoriteItems()
  }, [fetchFavoriteItems])

  // Toggle favorite status for a meal
  const handleToggleFavorites = async (e, meal) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/order-online' } } })
      return
    }

    const mealId = meal.id
    const isMenuItem = meal.category_id !== undefined && meal.is_available !== undefined

    try {
      setTogglingFavorites(prev => ({ ...prev, [mealId]: true }))

      const result = await toggleFavorites(mealId, user.id, { isMenuItem })

      if (result.success) {
        setFavoriteItems(prev => {
          const newSet = new Set(prev)
          if (result.action === 'added') {
            newSet.add(mealId)
          } else {
            newSet.delete(mealId)
          }
          return newSet
        })
      }
    } catch (err) {
      logger.error('Error toggling favorites:', err)
    } finally {
      setTogglingFavorites(prev => {
        const updated = { ...prev }
        delete updated[mealId]
        return updated
      })
    }
  }

  return {
    favoriteItems,
    togglingFavorites,
    fetchFavoriteItems,
    handleToggleFavorites,
  }
}
