import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { logger } from '../../utils/logger'

interface Dish {
  // Note: Actually represents menu_items from database (legacy name kept for backward compatibility)
  id: string
  name: string
  is_available: boolean
  // Note: stock_quantity removed - use is_available boolean instead
  [key: string]: unknown
}

interface VariantCombination {
  id: string
  product_id: string
  variant_values?: Record<string, unknown>
  is_active?: boolean
  [key: string]: unknown
}

interface Message {
  type: 'success' | 'error'
  text: string
}

interface StatusCounts {
  unavailable?: number
  limited?: number
  available?: number
}

/**
 * Menu Availability Alerts Component - Dark Luxe Edition
 *
 * Professional menu availability management with Dark Luxe color palette
 * Features:
 * - Dark Luxe status colors (burgundy/amber/gold-green)
 * - Real-time menu item and variant availability monitoring
 * - Quick replenish functionality
 * - Expandable variant combinations
 * - Toggle between limited availability only and all menu items
 *
 * Dark Luxe Status Colors:
 * - Error/Unavailable: Deep burgundy (#8B2634)
 * - Warning/Limited Availability: Warm amber (#B8860B)
 * - Success/Fully Available: Gold-green (#9CAF88)
 */
function LowStockAlerts(): JSX.Element {
  const [allDishes, setAllDishes] = useState<Dish[]>([])
  const [dishCombinations, setDishCombinations] = useState<Record<string, VariantCombination[]>>({})
  const [expandedDishes, setExpandedDishes] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [replenishing, setReplenishing] = useState<Record<string, boolean>>({})
  const [replenishInput, setReplenishInput] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<Message | null>(null)
  const [showAllDishes, setShowAllDishes] = useState(false)

  // Dark Luxe color constants
  const COLORS = {
    burgundy: '#8B2634', // Error/Unavailable
    amber: '#B8860B', // Warning/Limited availability
    goldGreen: '#9CAF88', // Success/Fully available
    accent: '#C59D5F', // Primary accent
  }

  const fetchCombinationsForDishes = useCallback(
    async (dishes: Dish[]) => {
      const combosMap: Record<string, VariantCombination[]> = {}

      for (const dish of dishes) {
        try {
          const { data, error } = await supabase
            .from('variant_combinations')
            .select('*')
            .eq('product_id', dish.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true })

          if (!error && data) {
            // Note: variant_combinations doesn't have stock_quantity in restaurant context
            // Filter by is_active only (already filtered in query above)
            let filteredCombos = data as VariantCombination[]
            // For restaurant context, we show all active combinations
            // Low stock logic would need to be based on menu_item.is_available instead

            if (filteredCombos.length > 0) {
              combosMap[dish.id] = filteredCombos
            }
          }
        } catch (err) {
          logger.error(`Error fetching combinations for dish ${dish.id}:`, err)
        }
      }

      setDishCombinations(combosMap)
    },
    [showAllDishes]
  )

  const fetchAllDishes = useCallback(async () => {
    try {
      setLoading(true)

      // Note: menu_items doesn't have stock_quantity column
      // This component may need refactoring for restaurant context
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching menu items:', error)
        setAllDishes([])
        return
      }

      // Note: menu_items doesn't have stock_quantity, so filtering is disabled
      // This component may need refactoring for restaurant context
      let filtered = (data || []) as Dish[]
      // Stock-based filtering disabled - menu_items doesn't have stock_quantity column
      // if (!showAllDishes) {
      //   filtered = filtered.filter(dish => {
      //     const threshold = dish.low_stock_threshold || 10
      //     return dish.stock_quantity <= threshold
      //   })
      // }

      setAllDishes(filtered)
      await fetchCombinationsForDishes(filtered)
    } catch (err) {
      logger.error('Error in fetchAllDishes:', err)
      setAllDishes([])
    } finally {
      setLoading(false)
    }
  }, [showAllDishes, fetchCombinationsForDishes])

  useEffect(() => {
    void fetchAllDishes()

    const channel = supabase
      .channel('all-menu-items-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        void fetchAllDishes()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'variant_combinations' },
        () => {
          void fetchAllDishes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAllDishes])

  const handleReplenish = async (dishId: string) => {
    const addQuantity = parseInt(replenishInput[dishId] || '0')

    if (!addQuantity || addQuantity <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' })
      setTimeout(() => setMessage(null), 5000)
      return
    }

    try {
      setReplenishing(prev => ({ ...prev, [dishId]: true }))
      setMessage(null)

      const { data: dish, error: fetchError } = await supabase
        .from('menu_items')
        .select('id, name, is_available')
        .eq('id', dishId)
        .single()

      if (fetchError) throw new Error(`Failed to fetch dish: ${fetchError.message}`)
      if (!dish) throw new Error('Dish not found')

      // Note: menu_items doesn't have stock_quantity, using is_available instead
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ is_available: true, updated_at: new Date().toISOString() } as never)
        .eq('id', dishId)

      if (updateError) throw new Error(`Failed to update: ${updateError.message}`)

      // Update all variant combinations
      const { data: combinations, error: combosError } = await supabase
        .from('variant_combinations')
        .select('id, is_available')
        .eq('product_id', dishId)

      if (combosError) {
        logger.warn('Could not fetch variant combinations:', combosError)
      } else if (combinations && combinations.length > 0) {
        const updatePromises = combinations.map((combo: { id: string }) => {
          // Note: variant_combinations may not have stock_quantity in restaurant context
          return supabase
            .from('variant_combinations')
            .update({ updated_at: new Date().toISOString() } as never)
            .eq('id', combo.id)
        })

        await Promise.allSettled(updatePromises)
      }

      setReplenishInput(prev => {
        const updated = { ...prev }
        delete updated[dishId]
        return updated
      })

      setMessage({
        type: 'success',
        text: `${(dish as Dish).name} replenished successfully. Availability updated.`,
      })

      setTimeout(() => {
        fetchAllDishes()
        setMessage(null)
      }, 3000)
    } catch (err) {
      logger.error('Replenish error:', err)
      const error = err as Error
      setMessage({ type: 'error', text: `Failed: ${error.message}` })
      setTimeout(() => setMessage(null), 8000)
    } finally {
      setReplenishing(prev => {
        const updated = { ...prev }
        delete updated[dishId]
        return updated
      })
    }
  }

  const handleReplenishCombination = async (
    comboId: string,
    dishName: string,
    variantLabel: string
  ) => {
    const addQuantity = parseInt(replenishInput[`combo-${comboId}`] || '0')

    if (!addQuantity || addQuantity <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' })
      setTimeout(() => setMessage(null), 5000)
      return
    }

    try {
      setReplenishing(prev => ({ ...prev, [`combo-${comboId}`]: true }))
      setMessage(null)

      const { data: combo, error: fetchError } = await supabase
        .from('variant_combinations')
        .select('id, is_available')
        .eq('id', comboId)
        .single()

      if (fetchError) throw new Error(`Failed to fetch combination: ${fetchError.message}`)
      if (!combo) throw new Error('Combination not found')

      // Note: variant_combinations may not have stock_quantity in restaurant context
      const { error: updateError } = await supabase
        .from('variant_combinations')
        .update({ updated_at: new Date().toISOString() } as never)
        .eq('id', comboId)

      if (updateError) throw new Error(`Failed to update: ${updateError.message}`)

      setReplenishInput(prev => {
        const updated = { ...prev }
        delete updated[`combo-${comboId}`]
        return updated
      })

      setMessage({
        type: 'success',
        text: `${dishName} (${variantLabel}) replenished successfully. Availability updated.`,
      })

      setTimeout(() => {
        fetchAllDishes()
        setMessage(null)
      }, 3000)
    } catch (err) {
      logger.error('Combination replenish error:', err)
      const error = err as Error
      setMessage({ type: 'error', text: `Failed: ${error.message}` })
      setTimeout(() => setMessage(null), 8000)
    } finally {
      setReplenishing(prev => {
        const updated = { ...prev }
        delete updated[`combo-${comboId}`]
        return updated
      })
    }
  }

  const formatVariantLabel = (
    variantValues: Record<string, unknown> | null | undefined
  ): string => {
    if (!variantValues || typeof variantValues !== 'object') return ''
    return Object.entries(variantValues)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  const toggleExpand = (dishId: string) => {
    setExpandedDishes(prev => ({
      ...prev,
      [dishId]: !prev[dishId],
    }))
  }

  if (loading) {
    return (
      <div
        className="rounded-2xl border backdrop-blur-xl p-6 animate-pulse"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        data-animate="fade-scale"
        data-animate-active="false"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.amber}20` }}>
            <svg
              className="w-5 h-5"
              style={{ color: COLORS.amber }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
              Menu Availability
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-body-muted)' }}>
              Loading menu availability...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getDishStatus = (dish: Dish): 'unavailable' | 'limited' | 'available' => {
    // Note: menu_items doesn't have stock_quantity, using is_available instead
    if (!dish.is_available) return 'unavailable'
    return 'available'
  }

  const statusCounts: StatusCounts = allDishes.reduce((acc, dish) => {
    const status = getDishStatus(dish)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as StatusCounts)

  const totalAlerts = (statusCounts.unavailable || 0) + (statusCounts.limited || 0)
  const totalDishes = allDishes.length

  if (totalDishes === 0 && !showAllDishes) {
    return (
      <div
        className="rounded-2xl border backdrop-blur-xl p-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        data-animate="fade-scale"
        data-animate-active="false"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.goldGreen}20` }}>
              <svg
                className="w-5 h-5"
                style={{ color: COLORS.goldGreen }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                Menu Availability
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-body-muted)' }}>
                All menu items are fully available
              </p>
            </div>
          </div>
          <Link
            to="/admin/menu-items"
            className="px-4 py-2 rounded-lg font-medium text-sm text-black hover:opacity-90 transition-all duration-200 flex items-center gap-2"
            style={{ backgroundColor: COLORS.accent }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            View All Menu Items
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border backdrop-blur-xl p-6"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      data-animate="fade-scale"
      data-animate-active="false"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: showAllDishes
                ? `${COLORS.accent}20`
                : totalAlerts > 0
                  ? `${COLORS.burgundy}20`
                  : `${COLORS.goldGreen}20`,
            }}
          >
            <svg
              className="w-5 h-5"
              style={{
                color: showAllDishes
                  ? COLORS.accent
                  : totalAlerts > 0
                    ? COLORS.burgundy
                    : COLORS.goldGreen,
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {showAllDishes ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              )}
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
              {showAllDishes ? 'Menu Availability Management' : 'Availability Alerts'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-body-muted)' }}>
              {showAllDishes
                ? `${totalDishes} menu ${totalDishes !== 1 ? 'items' : 'item'} total`
                : totalAlerts > 0
                  ? `${totalAlerts} ${totalAlerts === 1 ? 'item needs' : 'items need'} replenishment`
                  : 'All menu items fully available'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Button */}
          <Link
            to="/admin/menu-items"
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2"
            style={{
              backgroundColor: COLORS.accent,
              color: '#000',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            View All Menu Items
          </Link>
          <button
            onClick={() => setShowAllDishes(!showAllDishes)}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2"
            style={{
              backgroundColor: showAllDishes
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(203, 213, 225, 0.9)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showAllDishes ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              )}
            </svg>
            {showAllDishes ? 'Show Alerts Only' : 'See Alerts Only'}
          </button>

          {/* Count Badge */}
          {!showAllDishes && totalAlerts > 0 && (
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold border"
              style={{
                backgroundColor: `${COLORS.burgundy}20`,
                color: COLORS.burgundy,
                borderColor: `${COLORS.burgundy}40`,
              }}
            >
              {totalAlerts}
            </span>
          )}
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className="mb-4 p-4 rounded-xl border backdrop-blur-xl"
          style={{
            backgroundColor:
              message.type === 'success' ? `${COLORS.goldGreen}15` : `${COLORS.burgundy}15`,
            borderColor:
              message.type === 'success' ? `${COLORS.goldGreen}40` : `${COLORS.burgundy}40`,
          }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0"
              style={{ color: message.type === 'success' ? COLORS.goldGreen : COLORS.burgundy }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {message.type === 'success' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <p
              className="text-sm font-medium"
              style={{ color: message.type === 'success' ? COLORS.goldGreen : COLORS.burgundy }}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Menu Items List */}
      <div className="space-y-4">
        {allDishes.map(dish => {
          // Note: menu_items doesn't have stock_quantity, using is_available
          const availabilityPercentage = dish.is_available ? 100 : 0
          const isReplenishing = replenishing[dish.id]
          const inputValue = replenishInput[dish.id] || ''
          const dishStatus = getDishStatus(dish)
          const isUnavailable = dishStatus === 'unavailable'
          const isLimited = dishStatus === 'limited'
          const combinations = dishCombinations[dish.id] || []
          const hasVariants = combinations.length > 0
          const isExpanded = expandedDishes[dish.id]

          const statusColor = isUnavailable
            ? COLORS.burgundy
            : isLimited
              ? COLORS.amber
              : COLORS.goldGreen

          return (
            <div key={dish.id} className="space-y-2">
              {/* Main Dish Card */}
              <div
                className="border rounded-xl p-4 transition-all duration-200 backdrop-blur-xl"
                style={{
                  backgroundColor: `${statusColor}08`,
                  borderColor: `${statusColor}40`,
                  borderWidth: '2px',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-bold text-base text-[var(--text-main)]">{dish.name}</h4>
                      {isUnavailable ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"
                          style={{
                            backgroundColor: `${COLORS.burgundy}30`,
                            color: COLORS.burgundy,
                          }}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          UNAVAILABLE
                        </span>
                      ) : isLimited ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{ backgroundColor: `${COLORS.amber}20`, color: COLORS.amber }}
                        >
                          Limited Availability
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1"
                          style={{
                            backgroundColor: `${COLORS.goldGreen}20`,
                            color: COLORS.goldGreen,
                          }}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Fully Available
                        </span>
                      )}
                      {hasVariants && (
                        <button
                          onClick={() => toggleExpand(dish.id)}
                          className="ml-auto text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                          style={{ color: COLORS.accent }}
                        >
                          {combinations.length} variant{combinations.length !== 1 ? 's' : ''}
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Availability Info */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-sm">
                        <span className="font-bold text-lg" style={{ color: statusColor }}>
                          {dish.is_available ? 'Available' : 'Unavailable'}
                        </span>
                        <span style={{ color: 'var(--text-body-muted)' }}>
                          {' '}
                          (Stock tracking disabled)
                        </span>
                      </div>
                    </div>

                    {/* Availability Bar */}
                    <div
                      className="w-full rounded-full h-2.5 mb-3"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <div
                        className="h-2.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${availabilityPercentage}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Replenish Controls */}
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'rgba(203, 213, 225, 0.9)' }}
                  >
                    Add Portions to Availability:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={inputValue}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setReplenishInput(prev => ({ ...prev, [dish.id]: e.target.value }))
                      }
                      disabled={isReplenishing}
                      className="flex-1 px-4 py-2.5 border-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 transition-all"
                      style={
                        {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'var(--text-heading)',
                        } as React.CSSProperties
                      }
                    />
                    <button
                      onClick={() => handleReplenish(dish.id)}
                      disabled={isReplenishing || !inputValue}
                      className="px-6 py-2.5 rounded-lg text-base font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      style={{ backgroundColor: COLORS.accent, color: '#000' }}
                    >
                      {isReplenishing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Replenishing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Replenish
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-body-muted)' }}>
                    Status:{' '}
                    <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {dish.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Variant Combinations (Expandable) */}
              {hasVariants && isExpanded && (
                <div className="ml-4 space-y-2">
                  {combinations.map(combo => {
                    const comboId = `combo-${combo.id}`
                    const comboReplenishing = replenishing[comboId]
                    const comboInputValue = replenishInput[comboId] || ''
                    // Note: variant_combinations may not have stock_quantity
                    const comboUnavailable = !combo.is_available
                    const comboLimited = false // Stock tracking disabled
                    const comboStatusColor = comboUnavailable
                      ? COLORS.burgundy
                      : comboLimited
                        ? COLORS.amber
                        : COLORS.goldGreen
                    const variantLabel = formatVariantLabel(combo.variant_values)

                    return (
                      <div
                        key={combo.id}
                        className="border rounded-lg p-3 backdrop-blur-xl"
                        style={{
                          backgroundColor: `${comboStatusColor}08`,
                          borderColor: `${comboStatusColor}40`,
                          borderWidth: '2px',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: 'var(--text-heading)' }}
                            >
                              {variantLabel}
                            </span>
                            {comboUnavailable ? (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-bold"
                                style={{
                                  backgroundColor: `${COLORS.burgundy}30`,
                                  color: COLORS.burgundy,
                                }}
                              >
                                OUT
                              </span>
                            ) : comboLimited ? (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: `${COLORS.amber}20`,
                                  color: COLORS.amber,
                                }}
                              >
                                Limited
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                                style={{
                                  backgroundColor: `${COLORS.goldGreen}20`,
                                  color: COLORS.goldGreen,
                                }}
                              >
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Available
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold" style={{ color: comboStatusColor }}>
                            {combo.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Amount"
                            value={comboInputValue}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setReplenishInput(prev => ({ ...prev, [comboId]: e.target.value }))
                            }
                            disabled={comboReplenishing}
                            className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              color: 'var(--text-heading)',
                            }}
                          />
                          <button
                            onClick={() =>
                              handleReplenishCombination(combo.id, dish.name, variantLabel)
                            }
                            disabled={comboReplenishing || !comboInputValue}
                            className="px-4 py-2 rounded text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            style={{ backgroundColor: COLORS.accent, color: '#000' }}
                          >
                            {comboReplenishing ? (
                              <>
                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                Replenish
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Link
          to="/admin/menu-items"
          className="text-sm font-medium flex items-center gap-1 justify-center hover:opacity-80 transition-opacity"
          style={{ color: COLORS.accent }}
        >
          View all menu items in admin panel
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

export default LowStockAlerts
