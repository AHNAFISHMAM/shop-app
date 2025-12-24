import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import GlowPanel from '../ui/GlowPanel'
import { logger } from '../../utils/logger'

interface CustomerHistoryProps {
  customerEmail: string
}

interface CustomerStats {
  total_visits?: number
  total_spent?: number
  is_vip?: boolean
  tags?: string[]
  dietary_restrictions?: string[]
  notes?: string
  [key: string]: unknown
}

interface Reservation {
  id: string
  reservation_date: string
  reservation_time: string
  party_size: number
  table_number?: string
  status: string
  [key: string]: unknown
}

/**
 * Customer History Component
 * Displays customer's past reservations and visit statistics
 */
function CustomerHistory({ customerEmail }: CustomerHistoryProps): JSX.Element {
  const [history, setHistory] = useState<Reservation[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomerHistory = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch customer stats
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', customerEmail)
        .single()

      if (!customerError && customer) {
        setCustomerStats(customer)
      }

      // Fetch past reservations
      const { data: reservations, error: resError } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('customer_email', customerEmail)
        .order('reservation_date', { ascending: false })
        .order('reservation_time', { ascending: false })
        .limit(10)

      if (resError) throw resError

      setHistory(reservations || [])
    } catch (err) {
      logger.error('Error fetching customer history:', err)
      toast.error('Failed to load customer history')
    } finally {
      setLoading(false)
    }
  }, [customerEmail])

  useEffect(() => {
    if (customerEmail) {
      fetchCustomerHistory()
    }
  }, [customerEmail, fetchCustomerHistory])

  if (loading) {
    return (
      <GlowPanel
        glow="soft"
        radius="rounded-lg"
        padding="p-6"
        background="bg-[rgba(255,255,255,0.02)]"
      >
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-[var(--accent)]"></div>
        </div>
      </GlowPanel>
    )
  }

  const totalVisits =
    customerStats?.total_visits || history.filter(r => r.status === 'completed').length
  const totalSpent = customerStats?.total_spent || 0
  const isVIP = customerStats?.is_vip || false

  return (
    <div className="space-y-4">
      {/* Customer Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlowPanel
          glow="soft"
          radius="rounded-lg"
          padding="p-3"
          background="bg-[rgba(255,255,255,0.03)]"
        >
          <p className="text-xs text-muted">Total Visits</p>
          <p className="text-xl font-bold text-[var(--text-main)]">{totalVisits}</p>
        </GlowPanel>
        <GlowPanel
          glow="soft"
          radius="rounded-lg"
          padding="p-3"
          background="bg-[rgba(255,255,255,0.03)]"
        >
          <p className="text-xs text-muted">Total Spent</p>
          <p className="text-xl font-bold text-[var(--accent)]">৳{totalSpent.toLocaleString()}</p>
        </GlowPanel>
        <GlowPanel
          glow="soft"
          radius="rounded-lg"
          padding="p-3"
          background="bg-[rgba(255,255,255,0.03)]"
        >
          <p className="text-xs text-muted">Status</p>
          <p className="text-xl font-bold">
            {isVIP ? (
              <span className="text-amber-300">⭐ VIP</span>
            ) : (
              <span className="text-muted">Regular</span>
            )}
          </p>
        </GlowPanel>
      </div>

      {/* Tags */}
      {customerStats?.tags && customerStats.tags.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Customer Tags</p>
          <div className="flex flex-wrap gap-2">
            {customerStats.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dietary Restrictions */}
      {customerStats?.dietary_restrictions && customerStats.dietary_restrictions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Dietary Restrictions</p>
          <div className="flex flex-wrap gap-2">
            {customerStats.dietary_restrictions.map((restriction, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {restriction}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Customer Notes */}
      {customerStats?.notes && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Customer Notes</p>
          <GlowPanel
            glow="soft"
            radius="rounded-lg"
            padding="p-3"
            background="bg-[rgba(255,255,255,0.05)]"
            className="text-sm text-[var(--text-main)]"
          >
            {customerStats.notes}
          </GlowPanel>
        </div>
      )}

      {/* Reservation History */}
      <div>
        <p className="mb-3 text-sm font-medium text-[var(--text-main)]">Recent Reservations</p>
        {history.length === 0 ? (
          <p className="text-center text-sm text-muted">No previous reservations</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map(reservation => (
              <GlowPanel
                glow="soft"
                key={reservation.id}
                radius="rounded-lg"
                padding="p-3"
                background="bg-[rgba(255,255,255,0.02)]"
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--text-main)]">
                    {new Date(reservation.reservation_date + 'T00:00:00').toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {reservation.reservation_time} • {reservation.party_size} guests
                    {reservation.table_number && ` • Table ${reservation.table_number}`}
                  </p>
                </div>
                <div>
                  {reservation.status === 'completed' && (
                    <span className="text-xs text-emerald-400">✓ Completed</span>
                  )}
                  {reservation.status === 'confirmed' && (
                    <span className="text-xs text-blue-400">Confirmed</span>
                  )}
                  {reservation.status === 'no_show' && (
                    <span className="text-xs text-orange-400">No Show</span>
                  )}
                  {reservation.status === 'cancelled' && (
                    <span className="text-xs text-[var(--text-muted)]">Cancelled</span>
                  )}
                </div>
              </GlowPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerHistory
