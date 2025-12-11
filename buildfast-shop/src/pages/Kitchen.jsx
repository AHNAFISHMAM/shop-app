import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useViewportAnimationTrigger } from '../hooks/useViewportAnimationTrigger'
import { pageFade } from '../components/animations/menuAnimations'
import { logger } from '../utils/logger'

/**
 * Kitchen Display System (KDS)
 * Real-time order display for kitchen staff
 * Shows active orders that need to be prepared
 */

function Kitchen() {
  const containerRef = useViewportAnimationTrigger()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, processing

  useEffect(() => {
    fetchActiveOrders()

    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('kitchen-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          logger.log('📦 Order updated in kitchen:', payload)
          fetchActiveOrders()
        }
      )
      .subscribe()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveOrders()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const fetchActiveOrders = async () => {
    try {
      setLoading(true)

      // Fetch orders that are pending or processing (not yet delivered/shipped)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            product_id,
            quantity,
            price_at_purchase,
            menu_item:menu_item_id (
              id,
              name,
              price,
              image_url
            ),
            legacy_item:order_items_product_id_legacy_fkey (
              id,
              name,
              price,
              images
            )
          )
        `)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: true })

      if (error) throw error

      const normalizedOrders = (data || []).map((order) => {
        const normalizedItems = (order.order_items || []).map((item) => {
          const { menu_item, legacy_item, ...rest } = item
          const resolvedProduct = menu_item || legacy_item || null

          return {
            ...rest,
            menu_items: menu_item || null,
            legacy_item: legacy_item || null,
            products: resolvedProduct,
            resolvedProduct
          }
        })

        return {
          ...order,
          order_items: normalizedItems
        }
      })

      setOrders(normalizedOrders)
    } catch (err) {
      logger.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      fetchActiveOrders()
    } catch (err) {
      logger.error('Error updating order:', err)
      alert('Failed to update order status')
    }
  }

  const getOrderAge = (createdAt) => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffMinutes = Math.floor((now - orderTime) / (1000 * 60))

    return diffMinutes
  }

  const getOrderAgeColor = (minutes) => {
    if (minutes < 10) return 'text-emerald-300'
    if (minutes < 20) return 'text-amber-300'
    return 'text-rose-300'
  }

  const getOrderAgeClass = (minutes) => {
    if (minutes < 10) return 'border-emerald-400/40 bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
    if (minutes < 20) return 'border-amber-400/40 bg-amber-500/5 shadow-[0_0_25px_rgba(251,191,36,0.12)]'
    return 'border-rose-400/40 bg-rose-500/5 shadow-[0_0_30px_rgba(244,114,182,0.14)]'
  }

  const getOrderAgeAccent = (minutes) => {
    if (minutes < 10) return 'from-emerald-400/60 to-emerald-500/10'
    if (minutes < 20) return 'from-amber-400/60 to-amber-500/10'
    return 'from-rose-400/60 to-rose-500/10'
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending:
        'bg-gradient-to-r from-amber-700/70 via-amber-600/60 to-amber-500/45 text-amber-100 ring-1 ring-inset ring-amber-500/40 shadow-[0_10px_28px_rgba(155,98,18,0.22)]',
      processing:
        'bg-gradient-to-r from-sky-700/70 via-sky-600/60 to-sky-500/45 text-sky-50 ring-1 ring-inset ring-sky-400/45 shadow-[0_10px_28px_rgba(37,99,235,0.2)]',
      shipped:
        'bg-gradient-to-r from-emerald-700/70 via-emerald-600/60 to-emerald-500/45 text-emerald-100 ring-1 ring-inset ring-emerald-500/45 shadow-[0_10px_28px_rgba(14,159,110,0.22)]',
      delivered:
        'bg-gradient-to-r from-slate-700/70 via-slate-600/60 to-slate-500/45 text-slate-100 ring-1 ring-inset ring-slate-400/45 shadow-[0_10px_28px_rgba(71,85,105,0.22)]'
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] drop-shadow-sm ${styles[status] || 'bg-slate-700/70 text-slate-100 ring-1 ring-inset ring-slate-400/50 shadow-[0_8px_22px_rgba(30,41,59,0.24)]'}`}
      >
        <span className="tracking-[0.18em] text-[0.65rem] sm:text-[0.7rem]">{status}</span>
      </span>
    )
  }

  const statusMetrics = [
    {
      key: 'pending',
      label: 'New Orders',
      value: orders.filter(o => o.status === 'pending').length,
      accent: 'from-amber-400/80 to-amber-500/20',
      trend: '+ Live queue'
    },
    {
      key: 'processing',
      label: 'In Progress',
      value: orders.filter(o => o.status === 'processing').length,
      accent: 'from-sky-400/80 to-sky-500/20',
      trend: 'Kitchen focused'
    },
    {
      key: 'shipped',
      label: 'Out for Delivery',
      value: orders.filter(o => o.status === 'shipped').length,
      accent: 'from-emerald-400/80 to-emerald-500/20',
      trend: 'Courier pickup'
    },
    {
      key: 'delivered',
      label: 'Completed',
      value: orders.filter(o => o.status === 'delivered').length,
      accent: 'from-slate-400/80 to-slate-500/20',
      trend: 'Closed today'
    }
  ]

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const filterTabs = [
    {
      key: 'all',
      label: 'All Orders',
      count: orders.length,
      accent: 'from-text-main/30 to-text-main/5'
    },
    {
      key: 'pending',
      label: 'New Tickets',
      count: orders.filter(o => o.status === 'pending').length,
      accent: 'from-amber-400/40 to-amber-500/10'
    },
    {
      key: 'processing',
      label: 'In Production',
      count: orders.filter(o => o.status === 'processing').length,
      accent: 'from-sky-400/40 to-sky-500/10'
    }
  ]

  return (
    <motion.main
      ref={containerRef}
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] py-12"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div data-animate="fade-rise" data-animate-active="false" className="mb-12 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3 sm:space-y-4">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-text-muted">Kitchen Ops</p>
            <div className="flex items-center gap-3 sm:gap-4 text-2xl sm:text-3xl md:text-4xl font-semibold">
              <span>🍳</span>
              <span>Back-of-House Command</span>
            </div>
            <p className="max-w-xl text-sm sm:text-base text-text-muted">
              Real-time production board for Star Café. Prioritize, prep, and release orders with a luxe-dark dashboard
              calibrated to our admin system.
            </p>
          </div>
          <div data-animate="fade-scale" data-animate-active="false" className="card-soft flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg shadow-black/40">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-accent/20 text-xl sm:text-2xl md:text-3xl font-semibold text-accent">
              {loading ? '—' : orders.length}
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-text-muted">Total Active</p>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-text-main">
                {loading ? 'Updating…' : `${filteredOrders.length} showing`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 md:gap-12 lg:grid-cols-[360px,1fr]">
          {/* Sidebar */}
          <aside className="space-y-4 sm:space-y-6 lg:sticky lg:top-28">
            {/* Filters */}
            <div data-animate="fade-scale" data-animate-active="false" className="card-soft rounded-xl sm:rounded-2xl md:rounded-3xl border border-theme bg-gradient-to-br from-white/4 via-white/2 to-transparent px-4 sm:px-6 py-4 sm:py-5 md:py-6 shadow-[0_25px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-accent/15 text-base sm:text-lg text-accent">
                    🔍
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-text-main">Live Filters</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-text-muted">Prioritize tickets instantly</p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-text-muted/70">Auto-sync</span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {filterTabs.map((tab, index) => {
                  const isActive = filter === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      data-animate="fade-rise"
                      data-animate-active="false"
                      className={`group relative flex w-full transform-gpu items-center justify-between overflow-hidden rounded-xl sm:rounded-2xl border px-4 sm:px-6 py-3 min-h-[44px] text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050509] active:opacity-100 active:shadow-inner ${
                        isActive
                          ? 'border-amber-500/30 text-text-main shadow-[0_20px_48px_rgba(12,8,4,0.55)]'
                          : 'border-theme text-text-muted hover:border-accent/50 hover:text-text-main active:text-text-main'
                      }`}
                      style={{
                        transitionDelay: `${index * 70}ms`,
                        transform: 'translateZ(0)',
                        WebkitFontSmoothing: 'antialiased',
                        ...(isActive
                          ? {
                              background: 'linear-gradient(135deg, rgba(34, 27, 18, 0.96), rgba(16, 12, 8, 0.9))',
                              boxShadow: '0 18px 46px rgba(10, 6, 2, 0.55)'
                            }
                          : {
                              background: 'rgba(10, 16, 24, 0.55)'
                            })
                      }}
                    >
                      <div className="relative z-[1]">
                        <p
                          className={`text-sm sm:text-base font-semibold transition-colors ${
                            isActive
                              ? 'text-text-main'
                              : 'text-text-muted/90 group-hover:text-text-main group-focus:text-text-main group-active:text-text-main'
                          }`}
                        >
                          {tab.label}
                        </p>
                        <p
                          className={`text-[10px] sm:text-xs transition-colors ${
                            isActive
                              ? 'text-text-muted/75'
                              : 'text-text-muted/70 group-hover:text-text-muted/60 group-focus:text-text-muted/60 group-active:text-text-muted/60'
                          }`}
                        >
                          Updated live
                        </p>
                      </div>
                      <div
                        className={`relative z-[1] flex items-center gap-2 rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] transition ${
                          isActive
                            ? 'bg-[var(--bg-main)]/70 text-accent shadow-[0_18px_34px_rgba(8,10,14,0.52)]'
                            : 'bg-white/15 text-text-main/85 hover:text-text-main group-hover:text-text-main group-focus:text-text-main group-active:text-text-main'
                        }`}
                      >
                        <span className="font-bold tracking-[0.12em]">{tab.count}</span>
                        <span className="text-[0.62rem]">orders</span>
                      </div>
                      <div
                        className={`pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 ${
                          isActive ? 'opacity-100' : ''
                        }`}
                        style={{
                          backgroundImage: `linear-gradient(120deg, rgba(197,157,95,0.15), rgba(255,255,255,0.02))`
                        }}
                      />
                      <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tab.accent} ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-active:opacity-100'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3 sm:space-y-4">
              {statusMetrics.map((metric, index) => (
                <div
                  key={metric.key}
                  className="glow-surface relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-theme bg-elevated/70 px-4 sm:px-6 py-4 sm:py-5 md:py-6"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.accent} opacity-20`} />
                  <div className="relative flex flex-col gap-3 sm:gap-4">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-text-muted">{metric.label}</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-semibold">{metric.value}</p>
                    <p className="text-[10px] sm:text-xs text-text-muted">{metric.trend}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div data-animate="fade-scale" data-animate-active="false" className="card-soft rounded-xl sm:rounded-2xl md:rounded-3xl border border-theme px-4 sm:px-6 py-4 sm:py-5 md:py-6">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-text-muted">Timer Key</p>
              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 text-sm sm:text-base text-text-muted">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <span>0 - 10 minutes · Fresh</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span>10 - 20 minutes · Attention</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <span>20+ minutes · Urgent escalation</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Orders */}
          <section className="space-y-6 sm:space-y-8">
            {loading ? (
              <div data-animate="fade-scale" data-animate-active="false" className="glow-surface flex flex-col items-center justify-center rounded-xl sm:rounded-2xl md:rounded-3xl border border-theme-subtle bg-elevated/50 py-12 sm:py-16 md:py-20 text-text-muted">
                <div className="mb-4 sm:mb-6 h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                <p className="text-base sm:text-lg">Pulling in the latest orders…</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div data-animate="fade-scale" data-animate-active="false" className="card-soft rounded-xl sm:rounded-2xl md:rounded-3xl border border-theme py-12 sm:py-16 text-center">
                <div className="mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-accent/10 text-xl sm:text-2xl">
                  ✅
                </div>
                <p className="text-lg sm:text-xl font-semibold text-text-main">Kitchen is clear</p>
                <p className="mt-2 text-sm sm:text-base text-text-muted">No active tickets in this view.</p>
              </div>
            ) : (
              <div data-animate="fade-scale" data-animate-active="false" className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {filteredOrders.map((order, index) => {
                  const orderAge = getOrderAge(order.created_at)
                  const orderAgeClass = getOrderAgeClass(orderAge)
                  const orderAgeColor = getOrderAgeColor(orderAge)
                  const orderAccent = getOrderAgeAccent(orderAge)

                  return (
                    <div
                      key={order.id}
                      className={`card-soft relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-theme transition-transform duration-200 hover:-translate-y-1 hover:border-accent/40 ${orderAgeClass}`}
                      data-animate="fade-rise"
                      data-animate-active="false"
                      style={{ transitionDelay: `${index * 70}ms` }}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${orderAccent}`} />

                      {/* Order Header */}
                      <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3 sm:gap-4">
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
                            Order #{order.id.slice(0, 6)}
                          </p>
                          <p className={`mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold ${orderAgeColor}`}>
                            {orderAge}
                            <span className="ml-1 text-sm sm:text-base text-text-muted">min</span>
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      {/* Customer Info */}
                      <div className="mb-4 sm:mb-5 space-y-1 text-sm sm:text-base text-text-muted">
                        <p className="text-sm sm:text-base font-medium text-text-main">{order.customer_email}</p>
                        {order.customer_name && <p>{order.customer_name}</p>}
                        {(order.order_type || order.table_number) && (
                          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                            {order.order_type === 'dine-in' && 'Dine-In'}
                            {order.order_type === 'pickup' && 'Pickup'}
                            {order.order_type === 'delivery' && 'Delivery'}
                            {order.table_number && <span className="text-text-main">· Table {order.table_number}</span>}
                          </p>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                        {order.order_items?.map((item, index) => (
                          <div
                            key={item.id || index}
                            className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-white/5 px-3 sm:px-4 py-3 min-h-[44px] text-sm sm:text-base text-text-main"
                          >
                            <p className="font-medium">{item.products?.name || 'Unknown Item'}</p>
                            <span className="text-sm sm:text-base font-semibold text-text-main/80">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Special Instructions */}
                      {order.special_instructions && (
                        <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-amber-100">
                          <p className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                            Special Instructions
                          </p>
                          <p className="leading-6">{order.special_instructions}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 sm:gap-4">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                            className="flex-1 rounded-xl sm:rounded-2xl bg-accent px-4 sm:px-6 py-3 min-h-[44px] text-sm sm:text-base font-semibold text-[#111] transition hover:opacity-90"
                          >
                            Start Preparing
                          </button>
                        )}

                        {order.status === 'processing' && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, order.order_type === 'delivery' ? 'shipped' : 'delivered')
                            }
                            className="flex-1 rounded-xl sm:rounded-2xl bg-emerald-500 px-4 sm:px-6 py-3 min-h-[44px] text-sm sm:text-base font-semibold text-emerald-950 transition hover:bg-emerald-400"
                          >
                            {order.order_type === 'delivery' ? 'Ready for Delivery' : 'Mark as Ready'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.main>
  )
}

export default Kitchen
