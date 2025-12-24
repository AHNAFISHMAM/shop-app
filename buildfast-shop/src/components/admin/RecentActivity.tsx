import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { logger } from '../../utils/logger'

interface Activity {
  id: string
  created_at: string
  status: string
  type: 'order' | 'reservation'
  order_total?: string | number
  customer_name?: string
  party_size?: number
  [key: string]: unknown
}

/**
 * Recent Activity Component
 * Displays latest orders and reservations in a compact timeline
 *
 * Features:
 * - Real-time updates
 * - Status indicators
 * - Time ago formatting
 * - Links to full views
 */
function RecentActivity(): JSX.Element {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)

      // Fetch last 3 orders and 2 reservations in parallel
      const [{ data: orders }, { data: reservations }] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, status, order_total')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('table_reservations')
          .select('id, created_at, status, customer_name, party_size')
          .order('created_at', { ascending: false })
          .limit(2),
      ])

      // Combine and sort by created_at
      const combined: Activity[] = [
        ...(orders || []).map(
          (o: Record<string, unknown>) => ({ ...o, type: 'order' as const }) as Activity
        ),
        ...(reservations || []).map(
          (r: Record<string, unknown>) => ({ ...r, type: 'reservation' as const }) as Activity
        ),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setActivities(combined)
    } catch (error) {
      logger.error('Error fetching recent activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 1000 / 60)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#f59e0b' // amber
      case 'confirmed':
      case 'paid':
      case 'delivered':
      case 'completed':
        return '#10b981' // emerald
      case 'cancelled':
      case 'rejected':
        return '#ef4444' // red
      case 'processing':
      case 'preparing':
        return '#3b82f6' // blue
      default:
        return '#6b7280' // gray
    }
  }

  const getActivityIcon = (type: 'order' | 'reservation') => {
    if (type === 'order') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-sm text-[var(--text-muted)]">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <Link
          key={`${activity.type}-${activity.id}`}
          to={activity.type === 'order' ? '/admin/orders' : '/admin/reservations'}
          className="group flex items-start gap-3 transition-all duration-200 hover:translate-x-1 animate-fade-in-up"
          style={{ animationDelay: `${600 + index * 100}ms` }}
        >
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
            style={{
              backgroundColor: `${getStatusColor(activity.status)}20`,
              color: getStatusColor(activity.status),
            }}
          >
            {getActivityIcon(activity.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-heading)' }}>
                  {activity.type === 'order' ? (
                    <>
                      Order <span className="text-[var(--accent)]">#{activity.id.slice(0, 8)}</span>
                    </>
                  ) : (
                    <>
                      Reservation for{' '}
                      <span className="text-[var(--accent)]">
                        {activity.customer_name || 'Guest'}
                      </span>
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {/* Status badge */}
                  <span
                    className="px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${getStatusColor(activity.status)}20`,
                      color: getStatusColor(activity.status),
                    }}
                  >
                    {activity.status}
                  </span>
                  {/* Details */}
                  <span style={{ color: 'var(--text-body-muted-light)' }}>
                    {activity.type === 'order'
                      ? `৳${parseFloat(String(activity.order_total || 0)).toFixed(2)}`
                      : `${activity.party_size} guests`}
                  </span>
                </div>
              </div>
              {/* Time ago */}
              <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                {getTimeAgo(activity.created_at)}
              </span>
            </div>
          </div>
        </Link>
      ))}

      {/* View all link */}
      <Link
        to="/admin/orders"
        className="block text-center text-sm font-medium transition-colors duration-200 hover:text-[var(--accent)] pt-2"
        style={{ color: 'var(--text-body-muted)' }}
      >
        View all activity →
      </Link>
    </div>
  )
}

export default RecentActivity
