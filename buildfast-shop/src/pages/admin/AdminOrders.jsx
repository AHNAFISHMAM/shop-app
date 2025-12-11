import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { parsePrice } from '../../lib/priceUtils'
import { getAllOrders, updateOrderStatus as updateOrderStatusService, getOrderById } from '../../lib/orderService'
import toast from 'react-hot-toast'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { logger } from '../../utils/logger'
import { TableSkeleton } from '../../components/skeletons/TableSkeleton'

/**
 * Admin Orders Page
 *
 * View and manage all customer orders (including guest orders).
 */
function AdminOrders() {
  const containerRef = useViewportAnimationTrigger()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, guest, user
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, processing, shipped, delivered, cancelled
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [error, setError] = useState('')

  // IMPORTANT: Define fetch functions BEFORE useEffect hooks
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Build filters for service layer
      const filters = {}
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }

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

      // Fetch order items for each order (since service doesn't include relations yet)
      const ordersWithItems = await Promise.all(
        filteredData.map(async (order) => {
          const itemsResult = await getOrderById(order.id)
          return itemsResult.success ? itemsResult.data : order
        })
      )

      setOrders(ordersWithItems)
    } catch (err) {
      logger.error('Error fetching orders:', err)
      setError('Failed to load orders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [filter, statusFilter])

  // NOW add useEffect hooks AFTER function declarations
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])
  
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

  const getStatusColor = (status) => {
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

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    try {
      // Use service layer for cancellation (just a status update)
      const result = await updateOrderStatusService(orderId, 'cancelled')

      if (!result.success) {
        toast.error(result.error || 'Failed to cancel order')
        return
      }

      // Refresh orders
      fetchOrders()
      toast.success('Order cancelled successfully')
    } catch (err) {
      logger.error('Error cancelling order:', err)
      toast.error('Failed to cancel order: ' + err.message)
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
    const matchesShippingName = (order.shipping_address?.fullName || '').toLowerCase().includes(query)

    // Search by phone number (strip formatting for better matching)
    const phoneNumber = order.shipping_address?.phoneNumber || ''
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
    const matchesCity = (order.shipping_address?.city || '').toLowerCase().includes(query)
    const matchesState = (order.shipping_address?.stateProvince || '').toLowerCase().includes(query)
    const matchesPostal = (order.shipping_address?.postalCode || '').toLowerCase().includes(query)
    const matchesCountry = (order.shipping_address?.country || '').toLowerCase().includes(query)
    const matchesStreet = (order.shipping_address?.streetAddress || '').toLowerCase().includes(query)

    return matchesId || matchesName || matchesEmail || matchesShippingName || matchesPhone ||
           matchesProduct || matchesStatus || matchesTotal || matchesCity || matchesState ||
           matchesPostal || matchesCountry || matchesStreet
  })

  return (
    <motion.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)] py-12"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6 md:px-10">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-end md:justify-between" data-animate="fade-rise" data-animate-active="false">
          <div>
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
                  onClick={() => setFilter(key)}
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

        {/* Search Bar and Status Filters */}
        <div
          className="mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row"
          data-animate="fade-rise"
          data-animate-active="false"
        >
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order ID, customer, email, phone, product, address, status..."
                className="input-themed w-full rounded-xl sm:rounded-2xl border px-4 py-3 pl-11 text-sm sm:text-base min-h-[44px] focus:border-transparent focus:ring-2 focus:ring-[var(--accent)]/70 placeholder:text-muted"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-muted"
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
                  className="absolute right-3 top-3.5 text-muted transition hover:text-[var(--text-main)]/80"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg border px-3 py-3 min-h-[44px] text-[10px] sm:text-xs font-medium uppercase tracking-wide transition ${
                  statusFilter === status
                    ? 'border-[var(--accent)]/80 bg-[var(--accent)]/15 text-[var(--accent)] shadow-[0_12px_30px_-18px_rgba(197,157,95,0.6)]'
                    : 'border-theme bg-[rgba(255,255,255,0.02)] text-muted hover:border-theme-strong hover:text-[var(--text-main)]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        {!loading && (searchQuery || statusFilter !== 'all' || filter !== 'all') && (
          <div className="mb-4 flex items-center justify-between" data-animate="fade-rise" data-animate-active="false">
            <p className="text-sm sm:text-base text-muted">
              Showing <span className="font-semibold text-[var(--text-main)]">{filteredOrders.length}</span> of{' '}
              <span className="font-semibold text-[var(--text-main)]">{orders.length}</span> order{orders.length !== 1 ? 's' : ''}
            </p>
            {(searchQuery || statusFilter !== 'all' || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setFilter('all')
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
          <div className="mb-6 rounded-xl sm:rounded-2xl border border-red-500/30 bg-red-500/10 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 shadow-[0_18px_45px_-30px_rgba(248,113,113,0.6)]" data-animate="fade-scale" data-animate-active="false">
            <p className="text-sm sm:text-base font-medium text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            <div className="text-center py-3 sm:py-4 md:py-5">
              <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)]/70 border-t-transparent"></div>
              <p className="mt-4 text-sm sm:text-base text-muted">Loading orders...</p>
            </div>
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div
            className="glow-surface glow-strong rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-12 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-theme bg-[rgba(255,255,255,0.03)]">
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
            <p className="text-sm sm:text-base text-muted">
              {searchQuery ? `No orders found matching "${searchQuery}"` :
               filter === 'user' ? 'No user orders found' :
               filter === 'guest' ? 'No guest orders found' :
               'No orders found'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm sm:text-base font-medium text-[var(--accent)] transition hover:opacity-80 min-h-[44px] py-3"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          /* Orders Table */
          <div
            className="glow-surface glow-strong overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] shadow-[0_35px_80px_-60px_rgba(5,5,9,0.85)]"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm sm:text-base">
                <thead className="bg-[rgba(255,255,255,0.03)]">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Order ID
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Customer
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Type
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Items
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Total
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted">
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
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="font-mono text-sm sm:text-base text-[var(--accent)]">
                          {order.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="text-sm sm:text-base font-medium text-[var(--text-main)]">
                          {order.customer_name || 'N/A'}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted">
                          {order.customer_email}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold ${
                            order.is_guest
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/40'
                              : 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                          }`}
                        >
                          {order.is_guest ? 'Guest' : 'Registered'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-[var(--text-main)]">
                        {getTotalItemsCount(order)} items
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-amber-200">
                        ${parsePrice(order.order_total).toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`inline-flex rounded-full px-3 py-3 min-h-[44px] text-[10px] sm:text-xs font-semibold capitalize leading-none transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${getStatusColor(
                            order.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base">
                        <div className="flex gap-3 sm:gap-4">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowDetailsModal(true)
                            }}
                            className="font-medium text-[var(--accent)] transition hover:opacity-80 min-h-[44px] py-3"
                          >
                            View
                          </button>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="font-medium text-red-300 transition hover:text-red-200 min-h-[44px] py-3"
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
        )}

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
            style={{
              backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('theme-light') 
                ? 'rgba(0, 0, 0, 0.45)' 
                : 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={() => {
              setShowDetailsModal(false)
              setSelectedOrder(null)
            }}
          >
            <div
              data-overlay-scroll
              className="glow-surface glow-strong w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)]"
              style={{
                boxShadow: typeof window !== 'undefined' && document.documentElement.classList.contains('theme-light') 
                  ? '0 40px 90px -65px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                  : '0 40px 90px -65px rgba(5, 5, 9, 0.9)'
              }}
              data-animate="fade-scale"
              data-animate-active="false"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between border-b border-theme bg-[rgba(5,5,9,0.98)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
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

              {/* Modal Body */}
              <div className="space-y-6 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
                {/* Order Status & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <h3 className="mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted">Order Status</h3>
                    <span className={`inline-flex rounded-full px-4 py-3 min-h-[44px] text-sm sm:text-base font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <h3 className="mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted">Order Date</h3>
                    <p className="text-sm sm:text-base text-[var(--text-main)]">
                      {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
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
                <div className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-[var(--text-main)]">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-[var(--text-main)]">Shipping Address</h3>
                  {selectedOrder.shipping_address && (
                    <div className="space-y-1 text-[var(--text-main)]">
                      <p className="font-medium text-sm sm:text-base">{selectedOrder.shipping_address.fullName}</p>
                      <p className="text-sm sm:text-base text-muted">{selectedOrder.shipping_address.streetAddress}</p>
                      {selectedOrder.shipping_address.apartment && (
                        <p className="text-sm sm:text-base text-muted">{selectedOrder.shipping_address.apartment}</p>
                      )}
                      <p className="text-sm sm:text-base text-muted">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.stateProvince} {selectedOrder.shipping_address.postalCode}
                      </p>
                      <p className="text-sm sm:text-base text-muted">{selectedOrder.shipping_address.country}</p>
                      <p className="pt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">
                        Phone
                      </p>
                      <p className="text-sm sm:text-base text-[var(--text-main)]">{selectedOrder.shipping_address.phoneNumber}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-[var(--text-main)]">Order Items</h3>
                  <div className="divide-y divide-white/10 overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] text-[var(--text-main)]">
                    {selectedOrder.order_items?.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 sm:gap-4 md:gap-6 p-4 sm:p-5">
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
                  <div className="mt-4 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-xl font-semibold text-[var(--text-main)]">Order Total</span>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--accent)]">
                        ${parsePrice(selectedOrder.order_total).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">
                      Total includes {getTotalItemsCount(selectedOrder)} item(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 flex justify-end gap-3 sm:gap-4 border-t border-theme bg-[rgba(5,5,9,0.98)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      cancelOrder(selectedOrder.id)
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
      </div>
    </motion.main>
  )
}

export default AdminOrders
