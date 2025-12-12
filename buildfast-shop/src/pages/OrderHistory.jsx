import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import UpdateTimestamp from '../components/UpdateTimestamp'
import OrderTimeline from '../components/OrderTimeline'
import toast from 'react-hot-toast'
import { logger } from '../utils/logger'
import { addProductToCart, addMenuItemToCart } from '../lib/cartUtils'
import { addToGuestCart } from '../lib/guestSessionUtils'
import { pageFade, fadeSlideUp } from '../components/animations/menuAnimations'
import { resolveLoyaltyState, resolveReferralInfo } from '../lib/loyaltyUtils'
import CustomDropdown from '../components/ui/CustomDropdown'
import { OrderCardSkeleton } from '../components/skeletons/OrderCardSkeleton'

const CURRENCY_SYMBOL = '৳'

/**
 * Order History Page
 *
 * Displays all past orders for the logged-in customer
 * Shows order details with expandable sections
 */
function OrderHistory() {
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()
  const navigate = useNavigate()
  
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [orderItems, setOrderItems] = useState({}) // Map of orderId -> items
  const [loadingItems, setLoadingItems] = useState({}) // Map of orderId -> loading state
  const [itemsError, setItemsError] = useState({}) // Map of orderId -> error message
  const [returnRequests, setReturnRequests] = useState({}) // Map of orderId -> returnRequest

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all') // all, 7days, 30days, 90days
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, highest, lowest

  // Return request modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null)
  const [returnReason, setReturnReason] = useState('defective')
  const [returnDetails, setReturnDetails] = useState('')
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)
  const [returnError, setReturnError] = useState(null)
  const [returnSuccess, setReturnSuccess] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  
  // Feature flags - default to false during loading
  const enableLoyalty = settingsLoading ? false : (settings?.enable_loyalty_program ?? true)
  const enableOrderFeedback = settingsLoading ? false : (settings?.enable_order_feedback ?? true)
  const enableOrderTracking = settingsLoading ? false : (settings?.enable_order_tracking ?? true)

  const loyalty = useMemo(() => {
    if (!enableLoyalty) return null
    return resolveLoyaltyState()
  }, [enableLoyalty])
  const referral = useMemo(() => {
    if (!enableLoyalty || !user) return null
    return resolveReferralInfo(user)
  }, [user, enableLoyalty])
  const [feedbackOpenOrderId, setFeedbackOpenOrderId] = useState(null)
  const [feedbackRatings, setFeedbackRatings] = useState({})
  const [feedbackNotes, setFeedbackNotes] = useState({})
  const [feedbackSubmitting, setFeedbackSubmitting] = useState({})
  const [feedbackSubmitted, setFeedbackSubmitted] = useState({})

  const handleReferralShare = useCallback(async () => {
    if (!user) {
      toast.error('Sign in to share your referral invite.')
      return
    }

    const { shareUrl, code } = resolveReferralInfo(user)

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Star Café Invite',
          text: 'Use my Star Café invite link to unlock bonus treats on your first visit.',
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard?.writeText(shareUrl)
      toast.success('Referral link copied!')
    } catch (error) {
      logger.error('Failed to share referral link:', error)
      try {
        await navigator.clipboard?.writeText(`${shareUrl} (Code: ${code})`)
        toast.success('Copied invite link.')
      } catch (clipboardError) {
        logger.error('Clipboard write failed:', clipboardError)
        toast.error('Unable to copy invite link right now.')
      }
    }
  }, [user])

  const toggleFeedback = useCallback((orderId) => {
    setFeedbackOpenOrderId((prev) => (prev === orderId ? null : orderId))
  }, [])

  const handleFeedbackSubmit = useCallback(async (orderId) => {
    const rating = feedbackRatings[orderId]
    if (!rating) {
      toast.error('Select a rating before submitting.')
      return
    }

    setFeedbackSubmitting((prev) => ({ ...prev, [orderId]: true }))
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setFeedbackSubmitted((prev) => ({ ...prev, [orderId]: { rating, note: feedbackNotes[orderId] || '' } }))
      setFeedbackOpenOrderId(null)
      toast.success('Thanks for the feedback! The kitchen appreciates it.')
    } catch (error) {
      logger.error('Feedback submit failed:', error)
      toast.error('Unable to send feedback right now.')
    } finally {
      setFeedbackSubmitting((prev) => ({ ...prev, [orderId]: false }))
    }
  }, [feedbackRatings, feedbackNotes])

  const formatCurrency = (value) => `${CURRENCY_SYMBOL}${Number(value || 0).toFixed(2)}`

  // IMPORTANT: Define fetch functions BEFORE useEffect hooks
  const fetchOrders = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Newest first

      if (error) {
        logger.error('Error fetching orders:', error)
        return
      }

      setOrders(data || [])
    } catch (err) {
      logger.error('Error in fetchOrders:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchOrderItems = async (orderId) => {
    // Don't fetch if already loaded
    if (orderItems[orderId]) {
      return orderItems[orderId]
    }

    try {
      // Set loading state
      setLoadingItems(prev => ({ ...prev, [orderId]: true }))
      setItemsError(prev => ({ ...prev, [orderId]: null }))

      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_item:menu_item_id (
            id,
            name,
            description,
            price,
            image_url,
            dietary_tags,
            spice_level
          ),
          legacy_item:order_items_product_id_legacy_fkey (
            id,
            name,
            description,
            price,
            images
          )
        `)
        .eq('order_id', orderId)

      if (error) {
        logger.error('Error fetching order items:', error)
        setItemsError(prev => ({
          ...prev,
          [orderId]: 'Failed to load order items. Please try again.'
        }))
        return []
      }

      const normalized = (data || []).map((item) => {
        const { menu_item, legacy_item, ...rest } = item
        const resolvedProduct = menu_item || legacy_item || null
        const resolvedProductType = menu_item ? 'menu_item' : legacy_item ? 'legacy' : null

        return {
          ...rest,
          menu_items: menu_item || null,
          legacy_item: legacy_item || null,
          products: resolvedProduct,
          resolvedProduct,
          resolvedProductType
        }
      })

      setOrderItems(prev => ({
        ...prev,
        [orderId]: normalized
      }))
      return normalized
    } catch (err) {
      logger.error('Error in fetchOrderItems:', err)
      setItemsError(prev => ({
        ...prev,
        [orderId]: 'An error occurred while loading items.'
      }))
      return []
    } finally {
      // Clear loading state
      setLoadingItems(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const fetchReturnRequestsRef = useRef(null)
  
  const fetchReturnRequests = useCallback(async () => {
    if (!user) return

    // Cancel previous request if still pending
    if (fetchReturnRequestsRef.current) {
      fetchReturnRequestsRef.current.cancelled = true
    }

    // Create cancellation token for this request
    const cancelToken = { cancelled: false }
    fetchReturnRequestsRef.current = cancelToken

    try {
      // Capture current orders to avoid stale closure
      const orderIds = orders.map(o => o.id)
      if (orderIds.length === 0) return

      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .in('order_id', orderIds)

      // Check if this request was cancelled
      if (cancelToken.cancelled) return

      if (error) {
        logger.error('Error fetching return requests:', error)
        return
      }

      // Double-check cancellation before setting state
      if (cancelToken.cancelled) return

      const returnMap = {}
      data?.forEach(returnReq => {
        returnMap[returnReq.order_id] = returnReq
      })
      setReturnRequests(returnMap)
    } catch (err) {
      if (!cancelToken.cancelled) {
        logger.error('Error in fetchReturnRequests:', err)
      }
    } finally {
      // Clear ref if this was the active request
      if (fetchReturnRequestsRef.current === cancelToken) {
        fetchReturnRequestsRef.current = null
      }
    }
  }, [user, orders])

  // Fetch personalized recommendations based on order history
  const fetchRecommendations = useCallback(async () => {
    if (!user || orders.length === 0) return

    try {
      setLoadingRecommendations(true)

      // Simple recommendation logic: get products from same categories as ordered items
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .limit(6)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching recommendations:', error)
        return
      }

      setRecommendations(data || [])
    } catch (err) {
      logger.error('Error in fetchRecommendations:', err)
    } finally {
      setLoadingRecommendations(false)
    }
  }, [user, orders])

  // Check if order is eligible for return
  const isReturnEligible = (order) => {
    // Must be delivered
    if (order.status !== 'delivered') return false

    // Must be within 30 days
    const orderDate = new Date(order.created_at)
    const now = new Date()
    const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24)
    if (daysDiff > 30) return false

    // Must not have existing return request
    if (returnRequests[order.id]) return false

    return true
  }

  const getReturnStatusColor = (status) => {
     const colors = {
      requested: 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30',
      approved: 'bg-sky-500/10 text-sky-200 border-sky-500/30',
      denied: 'bg-red-500/15 text-red-200 border-red-500/40',
      received: 'bg-violet-500/10 text-violet-200 border-violet-500/30',
      refunded: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
    }
    return colors[status] || 'bg-white/10 text-muted border-theme-strong'
  }

  const handleReturnRequest = async (order) => {
    setReturnError(null)
    if (!orderItems[order.id]) {
      await fetchOrderItems(order.id)
    }
    setSelectedOrderForReturn(order)
    setReturnReason('defective')
    setReturnDetails('')
    setReturnModalOpen(true)
  }

  const handleReturnSuccess = () => {
    setReturnSuccess(true)
    // Refetch return requests after successful submission
    fetchReturnRequests()
    setTimeout(() => setReturnSuccess(false), 5000)
  }

  const closeReturnModal = () => {
    setReturnModalOpen(false)
    setSelectedOrderForReturn(null)
    setReturnReason('defective')
    setReturnDetails('')
    setReturnError(null)
  }

  const handleSubmitReturnRequest = async (event) => {
    event.preventDefault()
    if (!selectedOrderForReturn) return

    try {
      setIsSubmittingReturn(true)
      setReturnError(null)

      const { data: insertedRequest, error: requestError } = await supabase
        .from('return_requests')
        .insert({
          order_id: selectedOrderForReturn.id,
          user_id: user?.id ?? null,
          customer_email: user?.email ?? selectedOrderForReturn.customer_email,
          reason: returnReason,
          reason_details: returnDetails || null
        })
        .select()
        .single()

      if (requestError) {
        throw requestError
      }

      const itemsForReturn = orderItems[selectedOrderForReturn.id] || []
      if (itemsForReturn.length > 0) {
        const { error: itemsError } = await supabase
          .from('return_request_items')
          .insert(
            itemsForReturn.map(item => ({
              return_request_id: insertedRequest.id,
              order_item_id: item.id,
              quantity: item.quantity
            }))
          )

        if (itemsError) {
          throw itemsError
        }
      }

      closeReturnModal()
      handleReturnSuccess()
    } catch (error) {
      logger.error('Error submitting return request:', error)
      setReturnError(error.message || 'Failed to submit return request. Please try again.')
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  // NOW add useEffect hooks AFTER function declarations
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [user, navigate, fetchOrders])

  // Fetch return requests when orders are loaded (with race condition prevention)
  useEffect(() => {
    if (orders.length === 0) return

    // Fetch return requests and recommendations
    // fetchReturnRequests handles cancellation internally via ref
    fetchReturnRequests()
    fetchRecommendations()

    // Cleanup: cancel any pending requests
    return () => {
      if (fetchReturnRequestsRef.current) {
        fetchReturnRequestsRef.current.cancelled = true
        fetchReturnRequestsRef.current = null
      }
    }
  }, [orders.length, fetchReturnRequests, fetchRecommendations])

  // Set up real-time subscription (separate effect)
  useEffect(() => {
    if (!user) return

    const ordersChannel = supabase
      .channel(`orders-${user.id}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.log('🔄 Order updated in real-time!', payload.eventType)

          if (!payload || !payload.eventType) return

          if (payload.eventType === 'INSERT') {
            if (payload.new) {
              setOrders(prev => [payload.new, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new) {
              setOrders(prev =>
                prev.map(o => o.id === payload.new.id ? payload.new : o)
              )
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old) {
              setOrders(prev => prev.filter(o => o.id !== payload.old.id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
    }
  }, [user])

  const toggleOrderExpansion = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
    } else {
      setExpandedOrderId(orderId)
      await fetchOrderItems(orderId)
    }
  }

  const getStatusColor = (status) => {
     const colors = {
      pending: 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30',
      paid: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30',
      processing: 'bg-sky-500/10 text-sky-200 border-sky-500/30',
      shipped: 'bg-violet-500/10 text-violet-200 border-violet-500/30',
      delivered: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40',
      failed: 'bg-red-500/15 text-red-200 border-red-500/40',
      cancelled: 'bg-white/10 text-muted border-theme-strong'
    }
    return colors[status] || 'bg-white/10 text-muted border-theme-strong'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProductImage = (product) => {
    if (!product) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
    }

    if (product.image_url) {
      return product.image_url
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }

    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
  }

  // Helper function to get variant display text from order item
  const getVariantDisplay = (orderItem) => {
    if (!orderItem.variant_details) {
      return null
    }

    const variantDetails = orderItem.variant_details

    // Check if it's a variant combination (multiple variants)
    if (variantDetails.variant_values && typeof variantDetails.variant_values === 'object') {
      return Object.entries(variantDetails.variant_values)
        .map(([type, value]) => `${type}: ${value}`)
        .join(', ')
    }

    // Single variant
    if (variantDetails.variant_type && variantDetails.variant_value) {
      return `${variantDetails.variant_type}: ${variantDetails.variant_value}`
    }

    return null
  }

  // Quick Action Handlers
  const handleReorder = async (order) => {
    let items = orderItems[order.id]
    if (!items) {
      items = await fetchOrderItems(order.id)
    }

    if (!items || items.length === 0) {
      toast.error('We could not find any items to reorder.')
      return
    }

    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    const toastId = toast.loading(`Adding ${itemCount} item${itemCount === 1 ? '' : 's'} to your cart...`)

    try {
      for (const item of items) {
        const quantity = item.quantity || 1
        const menuItem = item.menu_items
        const product = item.products

        if (!product) {
          continue
        }

        if (menuItem) {
          if (user) {
            for (let i = 0; i < quantity; i += 1) {
              const result = await addMenuItemToCart(menuItem, user.id)
              if (!result?.success && result?.error) {
                throw result.error
              }
            }
          } else {
            addToGuestCart(menuItem, quantity, { isMenuItem: true })
          }
          continue
        }

        if (user) {
          for (let i = 0; i < quantity; i += 1) {
            const result = await addProductToCart(product, user.id)

            if (result.stockExceeded) {
              toast.error(
                result.stockLimit === 0
                  ? `${product.name} is currently out of stock.`
                  : `${product.name} is limited to ${result.stockLimit} unit${result.stockLimit === 1 ? '' : 's'}.`
              )
              break
            }

            if (result.error) {
              throw result.error
            }
          }
        } else {
          addToGuestCart(product, quantity)
        }
      }

      toast.dismiss(toastId)
      toast.success('Order items were added to your cart.')
    } catch (error) {
      logger.error('Error reordering items:', error)
      toast.dismiss(toastId)
      toast.error('Unable to add the order to your cart. Please try again.')
    }
  }

  const handleDownloadInvoice = (order) => {
    // Simple invoice download
      const invoiceText = `
ORDER INVOICE
Order #: ${order.id.slice(0, 8).toUpperCase()}
Date: ${formatDate(order.created_at)}
Customer: ${order.customer_name || 'Guest'}
Email: ${order.customer_email}
Total: ${formatCurrency(order.order_total || 0)}
Status: ${order.status.toUpperCase()}

Thank you for your order!
    `.trim()

    const blob = new Blob([invoiceText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${order.id.slice(0, 8)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }

    // Date filter
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at)
      const now = new Date()
      const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24)

      if (dateFilter === '7days' && daysDiff > 7) return false
      if (dateFilter === '30days' && daysDiff > 30) return false
      if (dateFilter === '90days' && daysDiff > 90) return false
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const orderNumber = order.id.slice(0, 8).toUpperCase()

      // Search by order number
      if (orderNumber.toLowerCase().includes(query)) {
        return true
      }

      // Search by product name (if items are loaded)
      const items = orderItems[order.id] || []
      const hasMatchingProduct = items.some(item =>
        item.products?.name?.toLowerCase().includes(query)
      )

      if (hasMatchingProduct) {
        return true
      }

      // No match found
      return false
    }

    return true
  })

  // Sort filtered orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'highest':
        return (b.order_total || 0) - (a.order_total || 0)
      case 'lowest':
        return (a.order_total || 0) - (b.order_total || 0)
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at)
    }
  })

  const statusButtons = useMemo(() => [
    { value: 'all', label: 'All Orders', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '🟡' },
    { value: 'paid', label: 'Paid', icon: '🟢' },
    { value: 'processing', label: 'Processing', icon: '🔵' },
    { value: 'shipped', label: 'Shipped', icon: '🟣' },
    { value: 'delivered', label: 'Delivered', icon: '✅' }
  ], [])

  // Memoize status counts for performance
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length }
    statusButtons.forEach(btn => {
      if (btn.value !== 'all') {
        counts[btn.value] = orders.filter(o => o.status === btn.value).length
      }
    })
    return counts
  }, [orders, statusButtons])

  const totalOrders = orders.length
  const activeStatuses = new Set(['pending', 'paid', 'processing', 'shipped'])
  const activeOrders = orders.filter(order => activeStatuses.has(order.status)).length
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length
  const totalSpent = orders.reduce((sum, order) => sum + (order.order_total || 0), 0)
  const lastOrder = orders[0] || null

  const summaryStats = [
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: '🧾'
    },
    {
      label: 'Active Orders',
      value: activeOrders,
      icon: '🚚'
    },
    {
      label: 'Delivered',
      value: deliveredOrders,
      icon: '✅'
    },
    {
      label: 'Lifetime Spend',
      value: formatCurrency(totalSpent),
      icon: '💳'
    }
  ]

  const quickActions = [
    {
      label: 'Track Active Orders',
      description: activeOrders > 0 ? `${activeOrders} order${activeOrders === 1 ? '' : 's'} in progress` : 'No active orders right now',
      onClick: () => setStatusFilter(activeOrders > 0 ? 'processing' : 'all'),
      icon: '📦'
    },
    {
      label: 'Reorder Latest Meal',
      description: lastOrder ? `Last order ${formatDate(lastOrder.created_at)}` : 'You have no previous orders yet',
      onClick: () => navigate('/order-online'),
      icon: '🍽️'
    },
    {
      label: 'Need Help?',
      description: 'Chat with support or leave a request',
      onClick: () => navigate('/contact'),
      icon: '💬'
    }
  ]

  if (!user) {
    return null
  }

  if (loading) {
     return (
      <m.main
        className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"
        variants={pageFade}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <UpdateTimestamp />
        <div className="app-container py-8 sm:py-12">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-[var(--bg-elevated)] rounded w-64"></div>
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-96"></div>
            </div>
            
            {/* Order cards skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </m.main>
     )
   }

  return (
   <m.main
     className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"
     data-animate="fade-scale"
     data-animate-active="false"
     variants={pageFade}
     initial="hidden"
     animate="visible"
     exit="exit"
   >
      <UpdateTimestamp />
      {/* Header */}
      <m.header
        className="border-b border-theme bg-[rgba(5,5,9,0.92)]"
        data-animate="fade-scale"
        data-animate-active="false"
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        custom={0.1}
      >
        <div className="app-container flex flex-col gap-3 sm:gap-4 md:gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="space-y-2"
            data-animate="fade-rise"
            data-animate-active="false"
          >
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted">Your Orders</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Order History</h1>
            <p className="text-sm sm:text-base text-muted">
              Review past purchases, track deliveries, and manage follow-up actions.
            </p>
          </div>
          <div
            className="flex flex-col gap-3 sm:gap-4 sm:flex-row"
            data-animate="fade-scale"
            data-animate-active="false"
            style={{ transitionDelay: '160ms' }}
          >
            <button
              onClick={() => navigate('/order-online')}
              className="btn-primary whitespace-nowrap min-h-[44px] py-3"
            >
              New Order
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="rounded-xl sm:rounded-2xl border border-theme bg-white/5 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold text-[var(--text-main)] transition hover:border-theme-medium hover:bg-white/10 min-h-[44px]"
            >
              Support
            </button>
          </div>
        </div>
      </m.header>

      <div className="app-container px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        {user ? (
          <>
            {enableLoyalty && loyalty && (
              <div className="glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 mb-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,157,95,0.25),transparent_60%)]" />
                <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2 max-w-xl">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#F5DEB3]/80">Loyalty Snapshot</p>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">
                      {loyalty.tier} · {loyalty.projectedPoints} pts
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--text-main)]/70">
                      {loyalty.pointsToNextTier > 0
                        ? `${loyalty.pointsToNextTier} points until ${loyalty.nextTierLabel}. ${orders.length} lifetime orders logged.`
                        : `You've maxed out ${loyalty.tier} benefits. Keep dining to maintain VIP status.`}
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="relative h-2 w-full max-w-xs rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#D97706] transition-all duration-700"
                          style={{ width: `${Math.min(100, Math.max(loyalty.progressPercent, 4))}%` }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-[#FDE68A] whitespace-nowrap">
                        {loyalty.progressPercent}%
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[var(--text-main)]/60">
                      {loyalty.redeemableRewards.length > 0
                        ? `${loyalty.redeemableRewards.length} rewards ready to redeem now.`
                        : 'Stack a few more visits to unlock your next chef perk.'}
                    </p>
                  </div>
                  {referral && (
                    <div className="flex w-full max-w-sm flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-sm">
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-[var(--text-main)]">{referral.headline}</p>
                        <p className="mt-1 text-[10px] sm:text-xs text-[var(--text-main)]/70">{referral.subcopy}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)]/30 px-4 sm:px-6 py-3">
                        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">Code</span>
                        <span className="font-semibold text-[#FDE68A] text-sm sm:text-base">{referral.code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleReferralShare}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#C59D5F] px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold text-black transition hover:bg-[#d6b37b] active:scale-95 min-h-[44px]"
                      >
                        Share Invite Link
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 12v7a1 1 0 0 0 1 1h7" />
                    <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                    <path d="M14 3h7v7" />
                    <path d="m10 14 11-11" />
                  </svg>
                </button>
              </div>
                  )}
                </div>
              </div>
            )}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((stat, index) => (
          <div
              key={stat.label}
            className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.03)] px-4 sm:px-6 py-3 sm:py-4 shadow-[0_18px_40px_-30px_rgba(197,157,95,0.6)]"
            data-animate="fade-rise"
            data-animate-active="false"
            style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-muted">{stat.label}</span>
                <span className="text-base sm:text-lg">{stat.icon}</span>
              </div>
              <p className="mt-2 text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="group glow-surface glow-soft flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 sm:px-6 py-3 sm:py-4 text-left transition hover:border-[var(--accent)]/70 hover:bg-[rgba(255,255,255,0.05)] min-h-[44px]"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <span className="mt-0.5 text-base sm:text-lg">{action.icon}</span>
              <span>
                <span className="block text-sm sm:text-base font-semibold text-[var(--text-main)] group-hover:text-[var(--accent)]">{action.label}</span>
                <span className="mt-1 block text-[10px] sm:text-xs text-muted">{action.description}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Return Request Success Message */}
        {returnSuccess && (
          <div className="mb-6 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 sm:px-6 py-3 sm:py-4 animate-fade-in">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm sm:text-base font-medium text-emerald-100">
                Return request submitted successfully! We&apos;ll review your request and send you an email with further instructions.
              </p>
            </div>
          </div>
        )}

        {/* Personalized Recommendations */}
        {orders.length > 0 && (
          <>
            {loadingRecommendations && (
              <div
                className="glow-surface glow-soft mb-8 rounded-xl sm:rounded-2xl border border-theme bg-gradient-to-r from-[rgba(197,157,95,0.1)] via-[rgba(255,255,255,0.03)] to-[rgba(197,157,95,0.05)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
                data-animate="fade-scale"
                data-animate-active="false"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-[var(--text-main)]">
                    <svg className="h-5 w-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Recommended for You
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-3 lg:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.05)] p-4 sm:p-6 animate-pulse"
                    >
                      <div className="mb-2 aspect-square bg-[var(--bg-elevated)] rounded-lg"></div>
                      <div className="h-4 bg-[var(--bg-elevated)] rounded mb-2"></div>
                      <div className="h-4 w-16 bg-[var(--bg-elevated)] rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!loadingRecommendations && recommendations.length > 0 && (
          <div
            className="glow-surface glow-soft mb-8 rounded-xl sm:rounded-2xl border border-theme bg-gradient-to-r from-[rgba(197,157,95,0.1)] via-[rgba(255,255,255,0.03)] to-[rgba(197,157,95,0.05)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 shadow-[0_20px_45px_-35px_rgba(197,157,95,0.65)]"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div
                data-animate="fade-rise"
                data-animate-active="false"
              >
                <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-[var(--text-main)]">
                  <svg className="h-5 w-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Recommended for You
                </h2>
                <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted">Based on your recent orders</p>
              </div>
              <button
                onClick={() => navigate('/products')}
                className="text-sm sm:text-base font-semibold text-[var(--accent)] transition hover:opacity-80"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {recommendations.slice(0, 6).map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/products`)}
                  className="group rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.05)] px-4 sm:px-6 py-3 sm:py-4 text-left transition hover:border-[var(--accent)]/70 hover:bg-[rgba(255,255,255,0.08)]"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="mb-2 aspect-square overflow-hidden rounded-lg">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-110"
                    />
                  </div>
                  <h3 className="mb-1 line-clamp-2 text-[10px] sm:text-xs font-semibold text-[var(--text-main)]">
                    {product.name}
                  </h3>
                  <p className="text-sm sm:text-base font-semibold text-[var(--accent)]">
                    {formatCurrency(product.price || 0)}
                  </p>
                </button>
              ))}
            </div>
          </div>
            )}
          </>
        )}

        {/* Search and Filter Bar */}
         {orders.length > 0 && (
          <div
            className="glow-surface glow-soft mb-8 space-y-4 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 sm:px-6 py-3 sm:py-4 md:py-5"
            data-animate="fade-scale"
            data-animate-active="false"
          >
             {/* Search Bar */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by order number or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.03)] pl-10 pr-3 py-3 text-sm sm:text-base text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)]/60 focus:bg-[rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 min-h-[44px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition hover:text-[var(--text-main)]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

             {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {statusButtons.map(button => (
                <button
                  key={button.value}
                  onClick={() => setStatusFilter(button.value)}
                  className={`min-h-[44px] touch-manipulation rounded-full px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all ${
                    statusFilter === button.value
                      ? 'bg-[var(--accent)] text-[#111] shadow-[0_12px_30px_-20px_rgba(197,157,95,0.65)]'
                      : 'border border-theme bg-[rgba(255,255,255,0.03)] text-muted hover:border-theme-medium hover:text-[var(--text-main)]'
                  }`}
                >
                  <span className="mr-1">{button.icon}</span>
                  {button.label}
                  {statusFilter === button.value && (
                    <span 
                      className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--modal-backdrop-light)',
                        color: '#FFFFFF'
                      }}
                    >
                      {statusCounts[button.value]}
                    </span>
                  )}
                </button>
              ))}
            </div>

             {/* Date Filter and Sort Options */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Date Filter */}
              <CustomDropdown
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: '7days', label: 'Last 7 Days' },
                  { value: '30days', label: 'Last 30 Days' },
                  { value: '90days', label: 'Last 90 Days' }
                ]}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="All Time"
                className="min-h-[44px]"
                maxVisibleItems={5}
              />

               {/* Sort Options */}
              <CustomDropdown
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'highest', label: 'Highest Amount' },
                  { value: 'lowest', label: 'Lowest Amount' }
                ]}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                placeholder="Newest First"
                className="min-h-[44px]"
                maxVisibleItems={5}
              />
            </div>

             {/* Active Filters Summary */}
            {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'newest') && (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted">
                <span>Showing {sortedOrders.length} of {orders.length} orders</span>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setDateFilter('all')
                    setSortBy('newest')
                  }}
                  className="font-semibold text-[var(--accent)] transition hover:opacity-80"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {orders.length === 0 ? (
           // Empty state - no orders at all
          <div
            className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <svg className="mx-auto mb-4 h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mb-2 text-base sm:text-lg font-semibold text-[var(--text-main)]">No orders yet</h3>
            <p className="mb-6 text-sm sm:text-base text-muted">
              You haven&apos;t placed any orders. Start shopping to see your order history here!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex min-h-[44px] items-center rounded-xl sm:rounded-2xl bg-[var(--accent)] px-4 sm:px-6 py-3 font-semibold text-[#111] transition hover:opacity-90"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Start Shopping
            </button>
          </div>
        ) : sortedOrders.length === 0 ? (
          // Empty state - no matches found
          <div
            className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <svg className="mx-auto mb-4 h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mb-2 text-base sm:text-lg font-semibold text-[var(--text-main)]">No orders found</h3>
            <p className="mb-6 text-sm sm:text-base text-muted">
              {searchQuery
                ? `No orders match "${searchQuery}"`
                : `No ${statusFilter} orders found`}
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setDateFilter('all')
                setSortBy('newest')
              }}
              className="inline-flex min-h-[44px] items-center rounded-xl sm:rounded-2xl bg-[var(--accent)] px-4 sm:px-6 py-3 font-semibold text-[#111] transition hover:opacity-90"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          // Orders list implementation
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {sortedOrders.map((order, index) => {
              const isExpanded = expandedOrderId === order.id
              const items = orderItems[order.id] || []
              const isLoadingItems = loadingItems[order.id]
              const itemsLoadError = itemsError[order.id]
              const returnRequest = returnRequests[order.id]
              const isEligibleForReturn = isReturnEligible(order)
              const feedbackData = feedbackSubmitted[order.id]
              const isFeedbackOpen = feedbackOpenOrderId === order.id

              return (
                <div
                  key={order.id}
                  className="glow-surface glow-soft overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] shadow-[0_20px_45px_-35px_rgba(197,157,95,0.65)] transition-all hover:border-[var(--accent)]/50"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
                    {/* Order Header */}
                    <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3 sm:gap-4">
                          <span className="text-sm sm:text-base font-mono font-semibold uppercase tracking-wider text-[var(--text-main)]">
                            #{order.order_number || order.id.substring(0, 8)}
                          </span>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {returnRequest && (
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${getReturnStatusColor(returnRequest.status)}`}>
                              Return: {returnRequest.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-muted">{formatDate(order.created_at)}</p>
                        {order.customer_name && (
                          <p className="mt-1 text-sm sm:text-base text-muted">Customer: {order.customer_name}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:gap-4 lg:items-end">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--accent)]">
                          {formatCurrency(order.order_total || 0)}
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="rounded-lg border border-theme bg-white/5 px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-[var(--text-main)] transition hover:border-theme-medium hover:bg-white/10 min-h-[44px]"
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-6 space-y-6 border-t border-theme pt-6">
                        {/* Order Items */}
                        <div>
                          <h3 className="mb-3 text-base sm:text-lg font-semibold text-[var(--text-main)]">Order Items</h3>

                          {isLoadingItems ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"></div>
                            </div>
                          ) : itemsLoadError ? (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-red-200">
                              {itemsLoadError}
                            </div>
                          ) : items.length === 0 ? (
                            <p className="text-sm sm:text-base text-muted">No items found for this order.</p>
                          ) : (
                            <div className="space-y-3 sm:space-y-4">
                              {items.map(item => {
                                const product = item.products
                                const variantText = getVariantDisplay(item)

                                return (
                                  <div
                                    key={item.id}
                                    className="flex gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.03)] px-4 sm:px-6 py-3 sm:py-4"
                                  >
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
                                      <img
                                        src={getProductImage(product)}
                                        alt={product?.name || 'Product'}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between">
                                      <div>
                                        <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                                          {product?.name || 'Unknown Item'}
                                        </h4>
                                        {variantText && (
                                          <p className="text-[10px] sm:text-xs text-muted">{variantText}</p>
                                        )}
                                        {item.customizations && (
                                          <p className="mt-1 text-[10px] sm:text-xs text-muted">
                                            Customizations: {item.customizations}
                                          </p>
                                        )}
                                      </div>
                                      <div className="mt-2 flex items-center justify-between">
                                        <span className="text-sm sm:text-base text-muted">Qty: {item.quantity}</span>
                                        <span className="text-sm sm:text-base font-semibold text-[var(--accent)]">
                                          {formatCurrency(item.unit_price * item.quantity)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Order Timeline */}
                        {enableOrderTracking && (
                          <div>
                            <h3 className="mb-3 text-base sm:text-lg font-semibold text-[var(--text-main)]">Order Timeline</h3>
                            <OrderTimeline status={order.status} createdAt={order.created_at} />
                          </div>
                        )}

                        {/* Delivery Information */}
                        {order.shipping_address && (
                          <div>
                            <h3 className="mb-3 text-base sm:text-lg font-semibold text-[var(--text-main)]">Delivery Address</h3>
                            <div className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 sm:px-6 py-3 sm:py-4">
                              <p className="text-sm sm:text-base text-[var(--text-main)] whitespace-pre-line">
                                {order.shipping_address}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Payment Information */}
                        <div>
                          <h3 className="mb-3 text-base sm:text-lg font-semibold text-[var(--text-main)]">Payment Details</h3>
                          <div className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 sm:px-6 py-3 sm:py-4 space-y-2">
                            <div className="flex justify-between text-sm sm:text-base">
                              <span className="text-muted">Payment Method:</span>
                              <span className="font-medium text-[var(--text-main)]">
                                {order.payment_method || 'Not specified'}
                              </span>
                            </div>
                            {order.subtotal && (
                              <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-muted">Subtotal:</span>
                                <span className="text-[var(--text-main)]">{formatCurrency(order.subtotal)}</span>
                              </div>
                            )}
                            {order.tax && (
                              <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-muted">Tax:</span>
                                <span className="text-[var(--text-main)]">{formatCurrency(order.tax)}</span>
                              </div>
                            )}
                            {order.shipping_cost && (
                              <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-muted">Shipping:</span>
                                <span className="text-[var(--text-main)]">{formatCurrency(order.shipping_cost)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-theme pt-2 text-sm sm:text-base font-semibold">
                              <span className="text-[var(--text-main)]">Total:</span>
                              <span className="text-[var(--accent)]">{formatCurrency(order.order_total || 0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Feedback Section */}
                        {enableOrderFeedback && order.status === 'delivered' && (
                          <div className="rounded-xl sm:rounded-2xl border border-theme bg-gradient-to-br from-[rgba(197,157,95,0.08)] to-[rgba(255,255,255,0.02)] px-4 sm:px-6 py-3 sm:py-4">
                            <button
                              type="button"
                              onClick={() => toggleFeedback(order.id)}
                              className="flex w-full items-center justify-between text-left"
                            >
                              <div>
                                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-main)]">
                                  {feedbackData ? 'Your Feedback' : 'Share Your Feedback'}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-muted">
                                  {feedbackData
                                    ? `You rated this order ${feedbackData.rating}/5`
                                    : 'Help us improve by rating this order'}
                                </p>
                              </div>
                              <svg
                                className={`h-5 w-5 text-[var(--accent)] transition-transform ${isFeedbackOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {isFeedbackOpen && !feedbackData && (
                              <div className="mt-4 space-y-4">
                                <div>
                                  <label className="mb-2 block text-sm sm:text-base font-semibold text-[var(--text-main)]">
                                    Rating
                                  </label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setFeedbackRatings({ ...feedbackRatings, [order.id]: rating })}
                                        className={`h-10 w-10 rounded-lg border transition min-h-[44px] ${
                                          (feedbackRatings[order.id] || 0) >= rating
                                            ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]'
                                            : 'border-theme bg-white/5 text-muted hover:border-theme-medium'
                                        }`}
                                      >
                                        ★
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label htmlFor={`feedback-note-${order.id}`} className="mb-2 block text-sm sm:text-base font-semibold text-[var(--text-main)]">
                                    Additional Comments (Optional)
                                  </label>
                                  <textarea
                                    id={`feedback-note-${order.id}`}
                                    value={feedbackNotes[order.id] || ''}
                                    onChange={(e) => setFeedbackNotes({ ...feedbackNotes, [order.id]: e.target.value })}
                                    rows="3"
                                    placeholder="Tell us about your experience..."
                                    className="block w-full rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.04)] px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 min-h-[44px]"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleFeedbackSubmit(order.id)}
                                  disabled={feedbackSubmitting[order.id]}
                                  className={`w-full rounded-lg px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold transition min-h-[44px] ${
                                    feedbackSubmitting[order.id]
                                      ? 'cursor-not-allowed border border-theme bg-white/10 text-muted'
                                      : 'bg-[var(--accent)] text-[#111] hover:opacity-90'
                                  }`}
                                >
                                  {feedbackSubmitting[order.id] ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                              </div>
                            )}

                            {feedbackData && (
                              <div className="mt-4 rounded-lg border border-theme bg-white/5 px-4 sm:px-6 py-3 sm:py-4">
                                <div className="mb-2 flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <span
                                      key={rating}
                                      className={rating <= feedbackData.rating ? 'text-[var(--accent)]' : 'text-muted'}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                {feedbackData.note && (
                                  <p className="text-sm sm:text-base text-[var(--text-main)]/80">{feedbackData.note}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          <button
                            onClick={() => handleReorder(order)}
                            className="inline-flex items-center gap-2 rounded-lg border border-theme bg-white/5 px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/70 hover:bg-[var(--accent)]/10 min-h-[44px]"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reorder
                          </button>

                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            className="inline-flex items-center gap-2 rounded-lg border border-theme bg-white/5 px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-[var(--text-main)] transition hover:border-theme-medium hover:bg-white/10 min-h-[44px]"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Invoice
                          </button>

                          {isEligibleForReturn && (
                            <button
                              onClick={() => handleReturnRequest(order)}
                              className="inline-flex items-center gap-2 rounded-lg border border-theme bg-white/5 px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-[var(--text-main)] transition hover:border-yellow-500/70 hover:bg-yellow-500/10 hover:text-yellow-200 min-h-[44px]"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Request Return
                            </button>
                          )}

                          <button
                            onClick={() => navigate('/contact')}
                            className="inline-flex items-center gap-2 rounded-lg border border-theme bg-white/5 px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-[var(--text-main)] transition hover:border-theme-medium hover:bg-white/10 min-h-[44px]"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Contact Support
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
          </>
        ) : null}
      </div>

      {returnModalOpen && selectedOrderForReturn && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center px-4 sm:px-6"
          style={{
            backgroundColor: 'var(--modal-backdrop)'
          }}
          onClick={() => setReturnModalOpen(false)}
        >
          <div 
            className="glow-surface glow-soft w-full max-w-lg overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)]"
            style={{
              boxShadow: isLightTheme 
                ? '0 35px 90px -45px rgba(197, 157, 95, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                : '0 35px 90px -45px rgba(197, 157, 95, 0.75)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-theme px-4 sm:px-6 py-3 sm:py-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-main)]">Request a Return</h3>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted">
                  Order #{selectedOrderForReturn.order_number || selectedOrderForReturn.id.substring(0, 8)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReturnModal}
                className="rounded-full border border-theme p-2 text-muted transition hover:border-theme-medium hover:text-[var(--text-main)]"
                aria-label="Close return request modal"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitReturnRequest} className="space-y-5 px-4 sm:px-6 py-3 sm:py-4 md:py-5 text-[var(--text-main)]">
              {returnError && (
                <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 sm:px-6 py-3 text-sm sm:text-base text-red-200">
                  {returnError}
                </div>
              )}

              <div className="rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 sm:px-6 py-3 sm:py-4">
                <h4 className="mb-2 text-sm sm:text-base font-semibold text-[var(--text-main)]">Items in this order</h4>
                <ul
                  data-overlay-scroll
                  className="max-h-40 space-y-2 overflow-y-auto pr-2 text-sm sm:text-base text-muted"
                >
                  {(orderItems[selectedOrderForReturn.id] || []).map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-theme bg-white/5 px-4 sm:px-6 py-3">
                      <span className="truncate text-[var(--text-main)]">{item.products?.name || 'Item'}</span>
                      <span className="text-muted/80">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label htmlFor="return-reason" className="mb-1 block text-sm sm:text-base font-semibold text-[var(--text-main)]">
                  Reason for return
                </label>
                <CustomDropdown
                  id="return-reason"
                  name="return-reason"
                  options={[
                    { value: 'defective', label: 'Defective or damaged product' },
                    { value: 'wrong', label: 'Wrong item received' },
                    { value: 'quality', label: 'Quality not as expected' },
                    { value: 'other', label: 'Other' }
                  ]}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Select reason"
                  className="min-h-[44px]"
                  required
                  maxVisibleItems={5}
                />
              </div>

              <div>
                <label htmlFor="return-details" className="mb-1 block text-sm sm:text-base font-semibold text-[var(--text-main)]">
                  Additional details
                </label>
                <textarea
                  id="return-details"
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  rows="4"
                  placeholder="Share any extra information that helps us review your request..."
                  className="block w-full rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.04)] px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 min-h-[44px]"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 pt-2 text-sm sm:text-base">
                <button
                  type="button"
                  onClick={closeReturnModal}
                  className="rounded-lg border border-theme px-4 sm:px-6 py-3 text-muted transition hover:border-theme-medium hover:text-[var(--text-main)] min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 sm:px-6 py-3 font-semibold transition min-h-[44px] ${isSubmittingReturn ? 'cursor-not-allowed border border-theme bg-white/10 text-muted' : 'bg-[var(--accent)] text-[#111] hover:opacity-90'}`}
                >
                  {isSubmittingReturn ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </m.main>
  )
}

export default OrderHistory
