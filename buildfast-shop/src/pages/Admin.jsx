import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/admin/StatCard'
import QuickActions from '../components/admin/QuickActions'
import RecentActivity from '../components/admin/RecentActivity'
import LowStockAlerts from '../components/admin/LowStockAlerts'
import UpdateTimestamp from '../components/UpdateTimestamp'
import { useViewportAnimationTrigger } from '../hooks/useViewportAnimationTrigger'
import { pageFade } from '../components/animations/menuAnimations'
import { logger } from '../utils/logger'

/**
 * Admin Dashboard - Professional Outstanding Edition
 *
 * Premium admin dashboard with Dark Luxe design featuring:
 * - Animated stat cards with count-up effect
 * - Skeleton loading states
 * - Real-time updates and status monitoring
 * - Quick action buttons for common tasks
 * - Recent activity feed
 * - Low stock alerts
 * - Sophisticated micro-interactions
 * - Entrance animations with stagger
 *
 * Design: Professional, minimalist, Dark Luxe (#050509 + #C59D5F)
 */
function Admin() {
  const { user } = useAuth()
  const containerRef = useViewportAnimationTrigger()

  // Dashboard statistics
  const [stats, setStats] = useState({
    menuItems: 0,
    orders: 0,
    ordersToday: 0,
    ordersPending: 0,
    customers: 0,
    reservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    totalRevenue: 0,
    revenueToday: 0,
    averageOrderValue: 0
  })

  const [loading, setLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  // Get personalized greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Fetch menu items count function (for real-time updates)
  const fetchMenuItemsCount = async () => {
    try {
      const { count } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true)
      if (count !== null) {
        setStats(prev => ({ ...prev, menuItems: count }))
      }
    } catch (err) {
      logger.error('Error fetching menu items count:', err)
    }
  }

  // Fetch all dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Fetch all counts in parallel for optimal performance
      const [
        { count: menuItemsCount },
        { count: ordersCount },
        { count: ordersTodayCount },
        { count: ordersPendingCount },
        { count: customersCount },
        { count: reservationsCount },
        { count: pendingReservationsCount },
        { count: confirmedReservationsCount },
        { data: revenueData },
        { data: revenueTodayData }
      ] = await Promise.all([
        // Total menu items (available only)
        supabase.from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', true),

        // Total orders
        supabase.from('orders').select('*', { count: 'exact', head: true }),

        // Today's orders
        supabase.from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`),

        // Pending orders
        supabase.from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Total customers
        supabase.from('customers').select('*', { count: 'exact', head: true }),

        // Total reservations
        supabase.from('reservations').select('*', { count: 'exact', head: true }),

        // Pending reservations
        supabase.from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Confirmed reservations
        supabase.from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed'),

        // Calculate total revenue from completed/paid orders
        supabase.from('orders')
          .select('order_total')
          .in('status', ['delivered', 'completed'])
          .eq('payment_status', 'paid'),

        // Today's revenue
        supabase.from('orders')
          .select('order_total')
          .in('status', ['delivered', 'completed'])
          .eq('payment_status', 'paid')
          .gte('created_at', `${today}T00:00:00`)
      ])

      // Calculate total revenue with type safety
      const totalRevenue = revenueData?.reduce((sum, order) => {
        const amount = typeof order.order_total === 'string'
          ? parseFloat(order.order_total)
          : order.order_total
        return sum + (amount || 0)
      }, 0) || 0

      // Calculate today's revenue
      const revenueToday = revenueTodayData?.reduce((sum, order) => {
        const amount = typeof order.order_total === 'string'
          ? parseFloat(order.order_total)
          : order.order_total
        return sum + (amount || 0)
      }, 0) || 0

      // Calculate average order value
      const averageOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0

      // Update all stats
      setStats({
        menuItems: menuItemsCount || 0,
        orders: ordersCount || 0,
        ordersToday: ordersTodayCount || 0,
        ordersPending: ordersPendingCount || 0,
        customers: customersCount || 0,
        reservations: reservationsCount || 0,
        pendingReservations: pendingReservationsCount || 0,
        confirmedReservations: confirmedReservationsCount || 0,
        totalRevenue: totalRevenue,
        revenueToday: revenueToday,
        averageOrderValue: averageOrderValue
      })
    } catch (err) {
      logger.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time subscriptions on mount
  useEffect(() => {
    fetchStats()

    // Set up real-time subscription for menu items
    const menuItemsChannel = supabase
      .channel('dashboard-menu-items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => {
          fetchMenuItemsCount()
        }
      )
      .subscribe((status) => {
        updateRealtimeStatus(status)
      })

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(menuItemsChannel)
    }
  }, [])

  const updateRealtimeStatus = (status) => {
    if (status === 'SUBSCRIBED') {
      setRealtimeStatus('connected')
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      setRealtimeStatus('disconnected')
    } else if (status === 'CLOSED') {
      setRealtimeStatus('connecting')
    }
  }

  return (
    <motion.main
      ref={containerRef}
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <UpdateTimestamp />

      {/* Page Header with Greeting and Real-time Status */}
      <div
        className="mb-12 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 md:gap-6"
        data-animate="fade-rise"
        data-animate-active="false"
      >
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight gradient-text">
            {getGreeting()}, {user?.email?.split('@')[0] || 'Admin'}
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-subtitle)' }}>
            Welcome to your Star Café admin dashboard
          </p>
        </div>

        {/* Enhanced Real-time Status Badge */}
        <div
          className="flex items-center gap-2.5 px-4 sm:px-6 md:px-10 py-3 rounded-xl sm:rounded-2xl backdrop-blur-xl border min-h-[44px]"
          data-animate="fade-rise"
          data-animate-active="false"
          style={{
            backgroundColor: realtimeStatus === 'connected'
              ? 'var(--status-success-bg)'
              : realtimeStatus === 'connecting'
                ? 'var(--status-warning-bg)'
                : 'var(--status-error-bg)',
            borderColor: realtimeStatus === 'connected'
              ? 'var(--status-success-border)'
              : realtimeStatus === 'connecting'
                ? 'var(--status-warning-border)'
                : 'var(--status-error-border)'
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse-glow"
            style={{
              backgroundColor: realtimeStatus === 'connected'
                ? '#10b981'
                : realtimeStatus === 'connecting'
                ? '#f59e0b'
                : '#ef4444'
            }}
          />
          {realtimeStatus !== 'connected' && (
            <span
              className="text-[10px] sm:text-xs font-semibold tracking-wide"
              style={{
                color: realtimeStatus === 'connecting' ? '#f59e0b' : '#ef4444'
              }}
            >
              {realtimeStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
          )}
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div
        className="mb-12"
        data-animate="fade-scale"
        data-animate-active="false"
      >
        <LowStockAlerts />
      </div>

      {/* Stats Grid with Animated Cards - Row 1 */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6"
        data-animate="fade-rise"
        data-animate-active="false"
      >
        {/* Total Menu Items Card */}
        <StatCard
          title="Menu Items"
          value={stats.menuItems}
          subtitle={`${stats.menuItems} dishes available`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          iconColor="text-[#C59D5F]"
          iconBg="bg-[#C59D5F]/20"
          link="/admin/menu-items"
          loading={loading}
          animationDelay={0}
        />

        {/* Total Orders Card */}
        <StatCard
          title="Total Orders"
          value={stats.orders}
          subtitle={`${stats.ordersPending} pending | ${stats.ordersToday} today`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          link="/admin/orders"
          loading={loading}
          trend={stats.ordersToday > 0 && stats.orders > 0 ? { value: Math.round((stats.ordersToday / stats.orders) * 100), direction: 'up', label: 'today' } : null}
          animationDelay={100}
        />

        {/* Reservations Card */}
        <StatCard
          title="Reservations"
          value={stats.reservations}
          subtitle={`${stats.confirmedReservations} confirmed | ${stats.pendingReservations} pending`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          link="/admin/reservations"
          loading={loading}
          animationDelay={200}
        />

        {/* Customers Card */}
        <StatCard
          title="Customers"
          value={stats.customers}
          subtitle={`${stats.customers} registered customers`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
          link="/admin/customers"
          loading={loading}
          animationDelay={300}
        />
      </div>

      {/* Stats Grid - Row 2: Revenue Metrics */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-12"
        data-animate="fade-rise"
        data-animate-active="false"
      >
        {/* Total Revenue Card */}
        <StatCard
          title="Total Revenue"
          value={`৳${Math.round(stats.totalRevenue).toLocaleString()}`}
          subtitle="All-time revenue"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconColor="text-[#C59D5F]"
          iconBg="bg-[#C59D5F]/20"
          link="/admin/orders"
          loading={loading}
          animationDelay={400}
        />

        {/* Today's Revenue Card */}
        <StatCard
          title="Today's Revenue"
          value={`৳${Math.round(stats.revenueToday).toLocaleString()}`}
          subtitle={`${stats.ordersToday} orders today`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          iconColor="text-green-400"
          iconBg="bg-green-500/20"
          link="/admin/orders"
          loading={loading}
          trend={stats.revenueToday > 0 && stats.totalRevenue > 0 ? { value: Math.round((stats.revenueToday / stats.totalRevenue) * 100), direction: 'up', label: 'of total' } : null}
          animationDelay={500}
        />

        {/* Average Order Value Card */}
        <StatCard
          title="Avg Order Value"
          value={`৳${Math.round(stats.averageOrderValue).toLocaleString()}`}
          subtitle="Per order average"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconColor="text-orange-400"
          iconBg="bg-orange-500/20"
          link="/admin/orders"
          loading={loading}
          animationDelay={600}
        />
      </div>

      {/* Welcome Section with Quick Actions and Recent Activity */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-12"
        data-animate="fade-scale"
        data-animate-active="false"
      >
        {/* Welcome Message (1 column) */}
        <div
          className="rounded-xl sm:rounded-2xl border backdrop-blur-xl px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          data-animate="fade-scale"
          data-animate-active="false"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            transitionDelay: '400ms'
          }}
        >
          <div className="flex items-start gap-3 sm:gap-4 md:gap-6 mb-4">
            <div
              className="p-3 rounded-xl sm:rounded-2xl min-h-[44px] flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(197, 157, 95, 0.2)',
                color: '#C59D5F'
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>
                Dashboard Ready
              </h3>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-subtitle)' }}>
                All systems operational
              </p>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs leading-relaxed" style={{ color: 'var(--text-body-muted)' }}>
            Your admin dashboard is live with real-time updates. Use the sidebar to navigate and the quick actions below for common tasks.
          </p>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium" style={{ color: 'var(--status-success-border)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Real-time updates enabled</span>
            </div>
          </div>
        </div>

        {/* Recent Activity (2 columns) */}
        <div
          className="lg:col-span-2 rounded-xl sm:rounded-2xl border backdrop-blur-xl px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          data-animate="fade-scale"
          data-animate-active="false"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            transitionDelay: '500ms'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                Recent Activity
              </h3>
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--text-body-muted)' }}>
                Latest orders and reservations
              </p>
            </div>
            <div
              className="p-2 rounded-xl sm:rounded-2xl min-h-[44px] flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(197, 157, 95, 0.1)',
                color: '#C59D5F'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions Section */}
      <div
        className="mb-8"
        data-animate="fade-scale"
        data-animate-active="false"
      >
        <div
          className="mb-6"
          data-animate="fade-rise"
          data-animate-active="false"
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-heading)' }}>
            Quick Actions
          </h2>
          <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-body-muted)' }}>
            Jump to common administrative tasks
          </p>
        </div>
        <QuickActions />
      </div>

    </motion.main>
  )
}

export default Admin
