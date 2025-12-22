import { useState, useEffect, useCallback, useRef } from 'react'
import { m } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { parsePrice } from '../../lib/priceUtils'
import { getAllOrders, updateOrderStatus as updateOrderStatusService, getOrderById } from '../../lib/orderService'
import toast from 'react-hot-toast'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { pageFade } from '../../components/animations/menuAnimations'
import { logger } from '../../utils/logger'
import { TableSkeleton } from '../../components/skeletons/TableSkeleton'
import CustomDropdown from '../../components/ui/CustomDropdown'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

interface ShippingAddress {
  fullName?: string;
  streetAddress?: string;
  apartment?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  order_total: string | number;
  shipping_address?: ShippingAddress | string;
  is_guest?: boolean;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  order_items?: Array<{
    products?: {
      name?: string;
      images?: string[];
    };
    quantity?: number;
    price?: number | string;
  }>;
  [key: string]: unknown;
}

interface AdminOrdersProps {
  fullPage?: boolean;
}

/**
 * Admin Orders Page
 *
 * View and manage all customer orders (including guest orders).
 * 
 * @param {boolean} fullPage - If true, renders in full-page mode without admin layout
 */
function AdminOrders({ fullPage = false }: AdminOrdersProps) {
  const navigate = useNavigate()
  const containerRef = useViewportAnimationTrigger()
  const datePickerRef = useRef<HTMLDivElement>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'guest' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [ordersPerPage] = useState(50) // Load 50 orders at a time
  const [hasMoreOrders, setHasMoreOrders] = useState(true)
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Lock body scroll when modal is open
  useBodyScrollLock(showDetailsModal)

  // Close date picker when clicking outside
  useEffect(() => {
    if (!showDatePicker) return

    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && event.target && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    // Use setTimeout to ensure this runs after the button's onClick
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  // IMPORTANT: Define fetch functions BEFORE useEffect hooks
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Build filters for service layer
      const filters: Record<string, any> = {}
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }
      
      // Date filters
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        filters.startDate = today
        filters.endDate = today
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        filters.startDate = sevenDaysAgo.toISOString().split('T')[0]
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        filters.startDate = thirtyDaysAgo.toISOString().split('T')[0]
      } else if (dateFilter === 'custom' && startDate) {
        filters.startDate = startDate
        if (endDate) {
          filters.endDate = endDate
        }
      }

      // Add pagination to filters
      const offset = (currentPage - 1) * ordersPerPage
      filters.limit = ordersPerPage
      filters.offset = offset

      // Use service layer for fetching orders
      const result = await getAllOrders(filters)

      if (!result.success) {
        throw new Error(result.error || 'Failed to load orders')
      }

      // Apply guest/user filter (client-side filtering)
      let filteredData = result.data || []
      if (filter === 'guest') {
        filteredData = filteredData.filter(order => order.is_guest === true)
      } else if (filter === 'user') {
        filteredData = filteredData.filter(order => order.is_guest === false)
      }

      // Update orders
      if (currentPage === 1) {
        setOrders(filteredData)
      } else {
        setOrders(prev => [...prev, ...filteredData])
      }

      // Update pagination state
      const resultCount = (result as any).count || 0
      setTotalOrdersCount(resultCount)
      setHasMoreOrders(filteredData.length === ordersPerPage && resultCount > offset + ordersPerPage)
    } catch (err) {
      logger.error('Error fetching orders:', err)
      setError('Failed to load orders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [filter, statusFilter, dateFilter, startDate, endDate, currentPage, ordersPerPage])

  // Load more orders function
  const loadMoreOrders = useCallback(async () => {
    if (!hasMoreOrders || loading) return
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
  }, [hasMoreOrders, loading, currentPage])

  // NOW add useEffect hooks AFTER function declarations
  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(1)
    setHasMoreOrders(true)
    fetchOrders()
  }, [fetchOrders, filter, statusFilter, dateFilter, startDate, endDate])
  
  // Set up real-time subscription (separate effect to prevent re-subscription on filter change)
  useEffect(() => {
    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          logger.log('🔄 Admin: Order updated in real-time!', payload.eventType)
          
          if (!payload || !payload.eventType) return
          
          // Re-fetch orders to get updated data with relations
          fetchOrders()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(ordersChannel)
    }
  }, [fetchOrders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
      case 'shipped':
        return 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30'
      case 'processing':
        return 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30'
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30'
      default:
        return 'bg-slate-700/40 text-slate-200 ring-1 ring-slate-600/40'
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Use service layer for status updates
      const result = await updateOrderStatusService(orderId, newStatus)

      if (!result.success) {
        toast.error(result.error || 'Failed to update order status')
        return
      }

      toast.success('Order status updated successfully')
      // Refresh orders
      fetchOrders()
    } catch (err) {
      logger.error('Error updating order status:', err)
      toast.error('Failed to update order status: ' + err.message)
    }
  }

  const getTotalItemsCount = (order) => {
    return order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  }

  const openCancelConfirm = (orderId) => {
    setOrderToCancel(orderId)
    setShowCancelConfirm(true)
  }

  const cancelOrder = async () => {
    if (!orderToCancel) return

    try {
      // Use service layer for cancellation (just a status update)
      const result = await updateOrderStatusService(orderToCancel, 'cancelled')

      if (!result.success) {
        toast.error(result.error || 'Failed to cancel order')
        return
      }

      // Refresh orders
      fetchOrders()
      setShowCancelConfirm(false)
      setOrderToCancel(null)
      toast.success('Order cancelled successfully')
    } catch (err) {
      logger.error('Error cancelling order:', err)
      toast.error('Failed to cancel order: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Filter orders by search query (client-side)
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()

    // Safely search order ID (full UUID and shortened display version)
    const matchesId = order.id?.toLowerCase().includes(query) || false

    // Safely search customer name with null/undefined handling
    const matchesName = (order.customer_name || '').toLowerCase().includes(query)

    // Safely search customer email with null/undefined handling
    const matchesEmail = (order.customer_email || '').toLowerCase().includes(query)

    // Search shipping address name as fallback
    const shippingAddr = typeof order.shipping_address === 'object' ? order.shipping_address : null
    const matchesShippingName = (shippingAddr?.fullName || '').toLowerCase().includes(query)

    // Search by phone number (strip formatting for better matching)
    const phoneNumber = shippingAddr?.phoneNumber || ''
    const normalizedPhone = phoneNumber.replace(/[\s\-().]/g, '') // Remove spaces, dashes, parentheses, dots
    const normalizedQuery = query.replace(/[\s\-().]/g, '')
    const matchesPhone = normalizedPhone.toLowerCase().includes(normalizedQuery) || phoneNumber.toLowerCase().includes(query)

    // Search by product names in order items
    const matchesProduct = order.order_items?.some((item) => {
      const productName = (item.products?.name || '').toLowerCase()
      return productName.includes(query)
    }) || false

    // Search by order status
    const matchesStatus = (order.status || '').toLowerCase().includes(query)

    // Search by order total (convert to string for matching)
    const orderTotal = parsePrice(order.order_total).toFixed(2)
    const matchesTotal = orderTotal.includes(query)

    // Search by shipping address components
    const shippingAddr = typeof order.shipping_address === 'object' ? order.shipping_address : null
    const matchesCity = (shippingAddr?.city || '').toLowerCase().includes(query)
    const matchesState = (shippingAddr?.stateProvince || '').toLowerCase().includes(query)
    const matchesPostal = (shippingAddr?.postalCode || '').toLowerCase().includes(query)
    const matchesCountry = (shippingAddr?.country || '').toLowerCase().includes(query)
    const matchesStreet = (shippingAddr?.streetAddress || '').toLowerCase().includes(query)

    return matchesId || matchesName || matchesEmail || matchesShippingName || matchesPhone ||
           matchesProduct || matchesStatus || matchesTotal || matchesCity || matchesState ||
           matchesPostal || matchesCountry || matchesStreet
  })

  return (
    <m.main
      ref={containerRef}
      className={`w-full bg-[var(--bg-main)] text-[var(--text-main)] ${fullPage ? 'py-4 sm:py-6' : 'py-8 sm:py-12 md:py-16'}`}
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ 
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
    >
      <div className={`mx-auto ${fullPage ? 'max-w-[1920px] px-4 sm:px-6 lg:px-8' : 'max-w-[1700px] px-4 sm:px-6 md:px-10'}`}>
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 md:mb-12 flex flex-col gap-4 sm:gap-5 md:gap-6 md:flex-row md:items-end md:justify-between" data-animate="fade-rise" data-animate-active="false">
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted">Operations</p>
            <h1 className="mt-2 text-lg sm:text-xl md:text-2xl font-semibold">Order Management</h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-muted">
              Monitor and update every order across the restaurant quickly. Filters update in real time with Supabase.
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-2">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'user', label: 'Registered' },
              { key: 'guest', label: 'Guest' },
            ].map(({ key, label }) => {
              const isActive = filter === key
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key as 'all' | 'guest' | 'user')}
                  className={`group relative overflow-hidden rounded-lg min-h-[44px] px-4 py-3 text-sm sm:text-base font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--accent)] text-black shadow-[0_15px_30px_-15px_rgba(197,157,95,0.65)]'
                      : 'text-muted hover:text-[var(--text-main)]'
                  }`}
                >
                  {!isActive && (
                    <span className="absolute inset-0 rounded-lg bg-[rgba(197,157,95,0.12)] opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                  <span className="relative">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Search and Filters Container */}
        <div
          className="mb-8 sm:mb-10 md:mb-12 glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-5 md:p-6"
          data-animate="fade-rise"
          data-animate-active="false"
          style={{ position: 'relative', overflow: 'visible' }}
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order ID, customer, email, phone, product, address, status..."
                className="input-themed w-full rounded-lg sm:rounded-xl border border-theme bg-[var(--bg-main)] px-4 py-3 pl-11 text-sm sm:text-base min-h-[44px] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/30 placeholder:text-muted transition"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-muted pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-muted transition hover:text-[var(--text-main)] min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
                  aria-label="Clear search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status Filter Buttons and Date Filter */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3" style={{ position: 'relative', zIndex: 1 }}>
              {/* Date Filter Button */}
              <div className="relative date-picker-container" ref={datePickerRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    logger.log('Calendar button clicked, showDatePicker:', showDatePicker)
                    setShowDatePicker(prev => {
                      logger.log('Toggling from', prev, 'to', !prev)
                      return !prev
                    })
                  }}
                  className={`flex items-center gap-2 rounded-xl sm:rounded-2xl min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all border border-theme ${
                    dateFilter !== 'all' || showDatePicker
                      ? 'bg-[var(--accent)] text-black'
                      : 'bg-[rgba(255,255,255,0.05)] text-muted hover:bg-[rgba(255,255,255,0.1)]'
                  }`}
                  aria-label="Open date filter"
                  aria-expanded={showDatePicker}
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Calendar</span>
                </button>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div 
                    className="absolute top-full left-0 mt-2 z-[100] w-64 sm:w-72 rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)] shadow-2xl p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-[var(--text-main)]">Filter by Date</h3>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-muted hover:text-[var(--text-main)] transition"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Quick Date Filters */}
                      <div className="space-y-2">
                        {[
                          { key: 'all', label: 'All Dates' },
                          { key: 'today', label: 'Today' },
                          { key: '7days', label: 'Last 7 Days' },
                          { key: '30days', label: 'Last 30 Days' },
                          { key: 'custom', label: 'Custom Range' }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => {
                              if (key === 'custom') {
                                setDateFilter('custom')
                              } else {
                                setDateFilter(key as 'all' | 'today' | '7days' | '30days' | 'custom')
                                setStartDate('')
                                setEndDate('')
                                setShowDatePicker(false)
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition ${
                              dateFilter === key
                                ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                                : 'text-muted hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Date Range */}
                      {dateFilter === 'custom' && (
                        <div className="space-y-3 pt-3 border-t border-theme">
                          <div>
                            <label className="block text-xs text-muted mb-1.5">Start Date</label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full rounded-lg border border-theme bg-[var(--bg-main)] px-3 py-2 text-xs sm:text-sm min-h-[36px] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/30"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1.5">End Date</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              min={startDate}
                              className="w-full rounded-lg border border-theme bg-[var(--bg-main)] px-3 py-2 text-xs sm:text-sm min-h-[36px] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/30"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (startDate) {
                                setShowDatePicker(false)
                              }
                            }}
                            className="w-full rounded-lg bg-[var(--accent)] text-black px-3 py-2 text-xs sm:text-sm font-medium hover:opacity-90 transition min-h-[36px]"
                          >
                            Apply Filter
                          </button>
                        </div>
                      )}

                      {/* Clear Date Filter */}
                      {dateFilter !== 'all' && (
                        <button
                          onClick={() => {
                            setDateFilter('all')
                            setStartDate('')
                            setEndDate('')
                            setShowDatePicker(false)
                          }}
                          className="w-full text-center px-3 py-2 rounded-lg text-xs sm:text-sm text-muted hover:text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.05)] transition"
                        >
                          Clear Date Filter
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter Buttons */}
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 min-h-[40px] sm:min-h-[44px] text-[10px] sm:text-xs font-medium uppercase tracking-wide transition ${
                    statusFilter === status
                      ? 'border-[var(--accent)]/80 bg-[var(--accent)]/15 text-[var(--accent)] shadow-[0_12px_30px_-18px_rgba(197,157,95,0.6)]'
                      : 'border-theme bg-[rgba(255,255,255,0.02)] text-muted hover:border-theme-strong hover:text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        {!loading && (searchQuery || statusFilter !== 'all' || filter !== 'all' || dateFilter !== 'all') && (
          <div className="mb-6 sm:mb-8 flex items-center justify-between" data-animate="fade-rise" data-animate-active="false">
            <p className="text-sm sm:text-base text-muted">
              Showing <span className="font-semibold text-[var(--text-main)]">{filteredOrders.length}</span> of{' '}
              <span className="font-semibold text-[var(--text-main)]">{orders.length}</span> order{orders.length !== 1 ? 's' : ''}
            </p>
            {(searchQuery || statusFilter !== 'all' || filter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setFilter('all')
                  setDateFilter('all')
                  setStartDate('')
                  setEndDate('')
                  setShowDatePicker(false)
                }}
                className="text-sm sm:text-base font-medium text-[var(--accent)] transition hover:opacity-80 min-h-[44px] py-3"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 sm:mb-10 rounded-xl sm:rounded-2xl border border-red-500/30 bg-red-500/10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 md:py-6 shadow-[0_18px_45px_-30px_rgba(248,113,113,0.6)]" data-animate="fade-scale" data-animate-active="false">
            <p className="text-sm sm:text-base font-medium text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center py-6 sm:py-8 md:py-10">
              <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)]/70 border-t-transparent"></div>
              <p className="mt-4 text-sm sm:text-base text-muted">Loading orders...</p>
            </div>
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div
            className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-12 sm:p-16 md:p-20 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="mx-auto mb-6 sm:mb-8 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-theme bg-[rgba(255,255,255,0.03)]">
              <svg
                className="h-8 w-8 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-muted mb-2">
              {searchQuery ? `No orders found matching "${searchQuery}"` :
               filter === 'user' ? 'No user orders found' :
               filter === 'guest' ? 'No guest orders found' :
               'No orders found'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-6 sm:mt-8 text-sm sm:text-base font-medium text-[var(--accent)] transition hover:opacity-80 min-h-[44px] px-6 py-3"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Orders Table */}
            <div
              className={`glow-surface glow-soft overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] shadow-[0_35px_80px_-60px_rgba(5,5,9,0.85)] ${fullPage ? 'w-full' : ''}`}
              data-animate="fade-scale"
              data-animate-active="false"
            >
            <div className="w-full overflow-hidden">
              <div className="w-full">
                <table className="w-full table-fixed divide-y divide-white/10 text-xs sm:text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col className="w-[10%]" />
                    <col className="w-[20%] sm:w-[18%]" />
                    <col className="hidden sm:table-column w-[10%]" />
                    <col className="w-[8%] sm:w-[7%]" />
                    <col className="w-[10%] sm:w-[9%]" />
                    <col className="w-[15%] sm:w-[14%]" />
                    <col className="hidden md:table-column w-[10%]" />
                    <col className="w-[17%] sm:w-[12%] md:w-[12%]" />
                  </colgroup>
                  <thead className="bg-[rgba(255,255,255,0.03)]">
                    <tr>
                      <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Order ID
                      </th>
                      <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Customer
                      </th>
                      <th className="hidden sm:table-cell px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Type
                      </th>
                      <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Items
                      </th>
                      <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Total
                      </th>
                      <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Date
                      </th>
                      <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-white/10 bg-[rgba(255,255,255,0.01)]">
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-[rgba(255,255,255,0.04)]"
                      data-animate="fade-rise"
                      data-animate-active="false"
                      style={{ transitionDelay: `${index * 60}ms` }}
                    >
                      <td className="px-2 sm:px-3 py-2.5 sm:py-3">
                        <span className="font-mono text-[10px] sm:text-xs text-[var(--accent)]">
                          {order.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 sm:py-3">
                        <div className="text-[10px] sm:text-xs font-medium text-[var(--text-main)] truncate max-w-[120px] sm:max-w-none">
                          {String(order.customer_name || 'N/A')}
                        </div>
                        <div className="mt-0.5 text-[9px] sm:text-[10px] text-muted truncate max-w-[120px] sm:max-w-none">
                          {String(order.customer_email || '')}
                        </div>
                        {/* Show type on mobile when hidden */}
                        <div className="mt-1 sm:hidden">
                          <span
                            className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                              order.is_guest
                                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                                : 'bg-emerald-500/15 text-emerald-200'
                            }`}
                          >
                            {order.is_guest ? 'Guest' : 'Reg'}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-3 py-2.5 sm:py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] sm:text-xs font-semibold ${
                            order.is_guest
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/40'
                              : 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                          }`}
                        >
                          {order.is_guest ? 'Guest' : 'Registered'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-[10px] sm:text-xs text-[var(--text-main)]">
                        {getTotalItemsCount(order)}
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-[10px] sm:text-xs font-semibold text-amber-200">
                        ${parsePrice(order.order_total).toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 sm:py-3">
                        <CustomDropdown
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'shipped', label: 'Shipped' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'cancelled', label: 'Cancelled' }
                          ]}
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          placeholder="Select status"
                          className={`inline-flex rounded-full px-2 py-1.5 min-h-[32px] sm:min-h-[36px] text-[9px] sm:text-[10px] font-semibold capitalize leading-none transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${getStatusColor(
                            order.status
                          )}`}
                          maxVisibleItems={5}
                        />
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-3 py-2.5 sm:py-3 text-[10px] sm:text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-[10px] sm:text-xs">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowDetailsModal(true)
                            }}
                            className="font-medium text-[var(--accent)] transition hover:opacity-80 min-h-[32px] sm:min-h-[36px] px-2 py-1 text-left sm:text-center"
                          >
                            View
                          </button>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button
                              onClick={() => openCancelConfirm(order.id)}
                              className="font-medium text-red-300 transition hover:text-red-200 min-h-[32px] sm:min-h-[36px] px-2 py-1 text-left sm:text-center"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Load More Button */}
            {hasMoreOrders && filteredOrders.length > 0 && (
              <div className="flex justify-center pt-6 sm:pt-8">
                <button
                  onClick={loadMoreOrders}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm sm:text-base font-medium transition min-h-[44px] ${
                    loading
                      ? 'cursor-not-allowed border-theme bg-white/5 text-muted'
                      : 'border-[var(--accent)]/70 bg-[var(--accent)]/10 text-[var(--text-main)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/20'
                  }`}
                  aria-label="Load more orders"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More ({totalOrdersCount - filteredOrders.length} remaining)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          </>
        )}

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4"
            style={{
              backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('theme-light') 
                ? 'rgba(0, 0, 0, 0.75)' 
                : 'rgba(0, 0, 0, 0.8)'
            }}
            onClick={() => {
              setShowDetailsModal(false)
              setSelectedOrder(null)
            }}
          >
            <div
              className="glow-surface glow-soft w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl sm:rounded-2xl border border-theme overflow-hidden"
              style={{
                backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('theme-light') 
                  ? '#ffffff' 
                  : '#0a0a0f',
                boxShadow: typeof window !== 'undefined' && document.documentElement.classList.contains('theme-light') 
                  ? '0 40px 90px -65px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                  : '0 40px 90px -65px rgba(5, 5, 9, 0.9)'
              }}
              data-animate="fade-scale"
              data-animate-active="false"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div 
                className="sticky top-0 z-10 flex items-center justify-between border-b border-theme px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
                style={{
                  backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('theme-light') 
                    ? '#ffffff' 
                    : '#0a0a0f'
                }}
              >
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Order Details</h2>
                  <p className="mt-1 font-mono text-[10px] sm:text-xs text-muted">
                    Order ID: {selectedOrder.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedOrder(null)
                  }}
                  className="text-muted transition hover:text-[var(--text-main)]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto space-y-8 sm:space-y-10 md:space-y-12 px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10">
                {/* Order Status & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  <div>
                    <h3 className="mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted">Order Status</h3>
                    <span className={`inline-flex rounded-full px-4 py-3 min-h-[44px] text-sm sm:text-base font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {String(selectedOrder.status).charAt(0).toUpperCase() + String(selectedOrder.status).slice(1)}
                    </span>
                  </div>
                  <div>
                    <h3 className="mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted">Order Date</h3>
                    <p className="text-sm sm:text-base text-[var(--text-main)]">
                      {new Date(String(selectedOrder.created_at)).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-5 sm:p-6 md:p-8">
                  <h3 className="mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">Name</p>
                      <p className="mt-1 font-medium text-sm sm:text-base text-[var(--text-main)]">{selectedOrder.customer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">Email</p>
                      <p className="mt-1 font-medium text-sm sm:text-base text-[var(--text-main)]">{selectedOrder.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">Customer Type</p>
                      <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold ${
                        selectedOrder.is_guest
                          ? 'bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/40'
                          : 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                      }`}>
                        {selectedOrder.is_guest ? 'Guest' : 'Registered User'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-5 sm:p-6 md:p-8">
                  <h3 className="mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">Shipping Address</h3>
                  {selectedOrder.shipping_address && typeof selectedOrder.shipping_address === 'object' && (
                    <div className="space-y-2 sm:space-y-3 text-[var(--text-main)]">
                      <p className="font-medium text-sm sm:text-base">{selectedOrder.shipping_address.fullName || ''}</p>
                      <p className="text-sm sm:text-base text-muted">{selectedOrder.shipping_address.streetAddress || ''}</p>
                      {selectedOrder.shipping_address.apartment && (
                        <p className="text-sm sm:text-base text-muted">{selectedOrder.shipping_address.apartment}</p>
                      )}
                      <p className="text-sm sm:text-base text-muted">
                        {selectedOrder.shipping_address.city || ''}, {selectedOrder.shipping_address.stateProvince || ''} {selectedOrder.shipping_address.postalCode || ''}
                      </p>
                      <p className="text-sm sm:text-base text-muted">{selectedOrder.shipping_address.country || ''}</p>
                      <p className="pt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">
                        Phone
                      </p>
                      <p className="text-sm sm:text-base text-[var(--text-main)]">{selectedOrder.shipping_address.phoneNumber || ''}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">Order Items</h3>
                  <div className="divide-y divide-white/10 overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] text-[var(--text-main)]">
                    {(selectedOrder.order_items || []).map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 sm:gap-5 md:gap-6 p-5 sm:p-6 md:p-8">
                        {/* Product Image */}
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-theme bg-[rgba(255,255,255,0.03)]">
                          {item.products?.images?.[0] ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-medium text-sm sm:text-base text-[var(--text-main)]">
                            {item.products?.name || 'Unknown Product'}
                          </h4>
                          {item.variant_display && (
                            <p className="mt-1 text-sm sm:text-base text-muted">Variant: {item.variant_display}</p>
                          )}
                          <p className="mt-1 text-sm sm:text-base text-muted">Quantity: {item.quantity}</p>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-semibold text-sm sm:text-base text-[var(--accent)]">
                            ${parsePrice(item.price).toFixed(2)}
                          </p>
                          <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">
                            Total
                          </p>
                          <p className="text-sm sm:text-base text-muted">
                            ${(parsePrice(item.price) * item.quantity).toFixed(2)} total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="mt-6 sm:mt-8 md:mt-10 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-5 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">Order Total</span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--accent)]">
                        ${parsePrice(selectedOrder.order_total).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">
                      Total includes {getTotalItemsCount(selectedOrder)} item(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 flex justify-end gap-4 sm:gap-5 md:gap-6 border-t border-theme bg-[rgba(5,5,9,0.98)] px-4 sm:px-6 md:px-10 py-4 sm:py-5 md:py-6">
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      openCancelConfirm(selectedOrder.id)
                      setShowDetailsModal(false)
                      setSelectedOrder(null)
                    }}
                    className="rounded-lg bg-red-600 px-4 py-3 min-h-[44px] font-medium text-sm sm:text-base text-black transition hover:bg-red-500"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedOrder(null)
                  }}
                  className="rounded-lg border border-theme bg-[rgba(255,255,255,0.02)] px-4 py-3 min-h-[44px] font-medium text-sm sm:text-base text-muted transition hover:border-theme-medium hover:text-[var(--text-main)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Order Confirmation Modal */}
        <ConfirmationModal
          isOpen={showCancelConfirm}
          onClose={() => {
            setShowCancelConfirm(false)
            setOrderToCancel(null)
          }}
          onConfirm={cancelOrder}
          title="Cancel Order"
          message={`Are you sure you want to cancel this order? This action cannot be undone.`}
          confirmText="Cancel Order"
          cancelText="Keep Order"
          variant="danger"
        />
      </div>
    </m.main>
  )
}

export default AdminOrders
