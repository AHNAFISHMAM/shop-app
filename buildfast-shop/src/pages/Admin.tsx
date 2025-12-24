import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { m } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/admin/StatCard'
import RecentActivity from '../components/admin/RecentActivity'
import LowStockAlerts from '../components/admin/LowStockAlerts'
import { useViewportAnimationTrigger } from '../hooks/useViewportAnimationTrigger'
import { useTheme as _useTheme } from '../shared/hooks/use-theme'
import { pageFade } from '../components/animations/menuAnimations'
import { logger } from '../utils/logger'

/**
 * Dashboard statistics interface
 */
interface DashboardStats {
  menuItems: number
  unavailableMenuItems: number
  orders: number
  ordersToday: number
  ordersPending: number
  customers: number
  reservations: number
  pendingReservations: number
  confirmedReservations: number
  totalRevenue: number
  revenueToday: number
  averageOrderValue: number
}

/**
 * Admin Dashboard Component
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
 * @component
 */
const Admin = memo((): JSX.Element => {
  const { user } = useAuth()
  // const isLightTheme = useTheme()
  const containerRef = useViewportAnimationTrigger()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  // Dashboard statistics
  const [stats, setStats] = useState<DashboardStats>({
    menuItems: 0,
    unavailableMenuItems: 0,
    orders: 0,
    ordersToday: 0,
    ordersPending: 0,
    customers: 0,
    reservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    totalRevenue: 0,
    revenueToday: 0,
    averageOrderValue: 0,
  })

  const [loading, setLoading] = useState<boolean>(true)

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent | { matches: boolean }): void => {
      setPrefersReducedMotion('matches' in e ? e.matches : false)
    }

    if (mediaQuery.addEventListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
    return undefined
  }, [])

  // Get personalized greeting based on time of day
  const getGreeting = useCallback((): string => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Fetch menu items count function (for real-time updates)
  const fetchMenuItemsCount = useCallback(async (): Promise<void> => {
    try {
      const [availableResult, unavailableResult] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', true),
        supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', false),
      ])

      if (availableResult.count !== null) {
        setStats(prev => ({ ...prev, menuItems: availableResult.count || 0 }))
      }
      if (unavailableResult.count !== null) {
        setStats(prev => ({ ...prev, unavailableMenuItems: unavailableResult.count || 0 }))
      }
    } catch (err) {
      logger.error('Error fetching menu items count:', err)
    }
  }, [])

  // Fetch all dashboard statistics
  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Fetch all counts in parallel for optimal performance
      const [
        { count: menuItemsCount },
        { count: unavailableMenuItemsCount },
        { count: ordersCount },
        { count: ordersTodayCount },
        { count: ordersPendingCount },
        { count: customersCount },
        { count: reservationsCount },
        { count: pendingReservationsCount },
        { count: confirmedReservationsCount },
        { data: revenueData },
        { data: revenueTodayData },
      ] = await Promise.all([
        // Total menu items (available only)
        supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', true),
        // Unavailable menu items
        supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', false),

        // Total orders
        supabase.from('orders').select('*', { count: 'exact', head: true }),

        // Today's orders
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`),

        // Pending orders
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

        // Total customers
        supabase.from('customers').select('*', { count: 'exact', head: true }),

        // Total reservations
        supabase.from('table_reservations').select('*', { count: 'exact', head: true }),

        // Pending reservations
        supabase
          .from('table_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Confirmed reservations
        supabase
          .from('table_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed'),

        // Calculate total revenue from completed orders
        supabase.from('orders').select('order_total').in('status', ['delivered', 'completed']),

        // Today's revenue
        supabase
          .from('orders')
          .select('order_total')
          .in('status', ['delivered', 'completed'])
          .gte('created_at', `${today}T00:00:00`),
      ])

      // Calculate total revenue with type safety
      const totalRevenue =
        revenueData?.reduce((sum: number, order: { order_total?: string | number }) => {
          const amount =
            typeof order.order_total === 'string'
              ? parseFloat(order.order_total)
              : order.order_total
          return sum + (amount || 0)
        }, 0) || 0

      // Calculate today's revenue
      const revenueToday =
        revenueTodayData?.reduce((sum: number, order: { order_total?: string | number }) => {
          const amount =
            typeof order.order_total === 'string'
              ? parseFloat(order.order_total)
              : order.order_total
          return sum + (amount || 0)
        }, 0) || 0

      // Calculate average order value
      const averageOrderValue = ordersCount && ordersCount > 0 ? totalRevenue / ordersCount : 0

      // Update all stats
      setStats({
        menuItems: menuItemsCount || 0,
        unavailableMenuItems: unavailableMenuItemsCount || 0,
        orders: ordersCount || 0,
        ordersToday: ordersTodayCount || 0,
        ordersPending: ordersPendingCount || 0,
        customers: customersCount || 0,
        reservations: reservationsCount || 0,
        pendingReservations: pendingReservationsCount || 0,
        confirmedReservations: confirmedReservationsCount || 0,
        totalRevenue: totalRevenue,
        revenueToday: revenueToday,
        averageOrderValue: averageOrderValue,
      })
    } catch (err) {
      logger.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
          table: 'menu_items',
        },
        () => {
          fetchMenuItemsCount()
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(menuItemsChannel)
    }
  }, [fetchStats, fetchMenuItemsCount])

  const greeting = useMemo(() => getGreeting(), [getGreeting])
  const userName = useMemo(() => user?.email?.split('@')[0] || 'Admin', [user])

  return (
    <m.main
      ref={containerRef}
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={prefersReducedMotion ? {} : pageFade}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      style={{
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible',
      }}
      role="main"
      aria-label="Admin dashboard"
    >
      {/* Page Header with Greeting */}
      <div className="mb-12" data-animate="fade-rise" data-animate-active="false">
        <div className="space-y-2">
          <h1
            className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight gradient-text"
            id="admin-dashboard-heading"
          >
            {greeting}, {userName}
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-subtitle)' }}>
            Welcome to your Star Café admin dashboard
          </p>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div
        className="mb-12"
        data-animate="fade-scale"
        data-animate-active="false"
        aria-labelledby="low-stock-alerts-heading"
      >
        <LowStockAlerts />
      </div>

      {/* Stats Grid with Animated Cards - Row 1 */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6"
        data-animate="fade-rise"
        data-animate-active="false"
        role="region"
        aria-label="Dashboard statistics"
      >
        {/* Total Menu Items Card */}
        <StatCard
          title="Menu Items"
          value={stats.menuItems}
          subtitle={
            stats.unavailableMenuItems > 0
              ? `${stats.unavailableMenuItems} unavailable`
              : `${stats.menuItems} available`
          }
          subtitleColor={
            stats.unavailableMenuItems > 0 ? 'var(--color-red)' : 'var(--color-emerald)'
          }
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          }
          iconColor="text-[var(--accent)]"
          iconBg="bg-[var(--accent)]/20"
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
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
          iconColor="text-[var(--color-emerald)]"
          iconBg="bg-[var(--color-emerald)]/20"
          link="/admin/orders"
          loading={loading}
          trend={
            stats.ordersToday > 0 && stats.orders > 0
              ? {
                  value: Math.round((stats.ordersToday / stats.orders) * 100),
                  direction: 'up',
                  label: 'today',
                }
              : undefined
          }
          animationDelay={100}
        />

        {/* Reservations Card */}
        <StatCard
          title="Reservations"
          value={stats.reservations}
          subtitle={`${stats.confirmedReservations} confirmed | ${stats.pendingReservations} pending`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          iconColor="text-[var(--color-blue)]"
          iconBg="bg-[var(--color-blue)]/20"
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
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          iconColor="text-[var(--color-purple)]"
          iconBg="bg-[var(--color-purple)]/20"
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
        role="region"
        aria-label="Revenue metrics"
      >
        {/* Total Revenue Card */}
        <StatCard
          title="Total Revenue"
          value={`৳${Math.round(stats.totalRevenue).toLocaleString()}`}
          subtitle="All-time revenue"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          iconColor="text-[var(--accent)]"
          iconBg="bg-[var(--accent)]/20"
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
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          iconColor="text-[var(--color-green)]"
          iconBg="bg-[var(--color-green)]/20"
          link="/admin/orders"
          loading={loading}
          trend={
            stats.revenueToday > 0 && stats.totalRevenue > 0
              ? {
                  value: Math.round((stats.revenueToday / stats.totalRevenue) * 100),
                  direction: 'up',
                  label: 'of total',
                }
              : undefined
          }
          animationDelay={500}
        />

        {/* Average Order Value Card */}
        <StatCard
          title="Avg Order Value"
          value={`৳${Math.round(stats.averageOrderValue).toLocaleString()}`}
          subtitle="Per order average"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          iconColor="text-[var(--color-orange)]"
          iconBg="bg-[var(--color-orange)]/20"
          link="/admin/orders"
          loading={loading}
          animationDelay={600}
        />
      </div>

      {/* Recent Activity Section */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-12"
        data-animate="fade-scale"
        data-animate-active="false"
        role="region"
        aria-label="Recent activity"
      >
        {/* Welcome Message (1 column) */}
        <div
          className="rounded-xl sm:rounded-2xl border backdrop-blur-xl px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          data-animate="fade-scale"
          data-animate-active="false"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            transitionDelay: '400ms',
          }}
        >
          <div className="flex items-start gap-3 sm:gap-4 md:gap-6 mb-4">
            <div
              className="p-3 rounded-xl sm:rounded-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.2)',
                color: 'var(--accent)',
              }}
              aria-hidden="true"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
              <h3
                className="text-sm sm:text-base font-semibold mb-1"
                style={{ color: 'var(--text-heading)' }}
              >
                Dashboard Ready
              </h3>
              <p className="text-sm sm:text-xs" style={{ color: 'var(--text-subtitle)' }}>
                All systems operational
              </p>
            </div>
          </div>
          <p
            className="text-sm sm:text-xs leading-relaxed"
            style={{ color: 'var(--text-body-muted)' }}
          >
            Your admin dashboard is live with real-time updates. Use the sidebar to navigate and the
            quick actions below for common tasks.
          </p>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <div
              className="flex items-center gap-2 text-sm sm:text-xs font-medium"
              style={{ color: 'var(--status-success-border)' }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
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
            transitionDelay: '500ms',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className="text-sm sm:text-base font-semibold"
                style={{ color: 'var(--text-heading)' }}
                id="recent-activity-heading"
              >
                Recent Activity
              </h3>
              <p className="text-sm sm:text-xs mt-1" style={{ color: 'var(--text-body-muted)' }}>
                Latest orders and reservations
              </p>
            </div>
            <div
              className="p-2 rounded-xl sm:rounded-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
                color: 'var(--accent)',
              }}
              aria-hidden="true"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <RecentActivity />
        </div>
      </div>
    </m.main>
  )
})

Admin.displayName = 'Admin'

export default Admin
