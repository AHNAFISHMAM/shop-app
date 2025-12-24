import { useEffect, useMemo, useState, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import GlowPanel from '../ui/GlowPanel'
import { logger } from '../../utils/logger'

interface Customer {
  id?: string
  email?: string
  name?: string
  joinedAt?: Date | string
  isVip?: boolean
  isBlacklisted?: boolean
  blacklistReason?: string
  tags?: string[]
  notes?: string
  preferences?: Record<string, unknown>
  lastVisitDate?: Date | string
  totalSpent?: number
  totalVisits?: number
  dietaryRestrictions?: string[]
  location?: string
  lifetimeValue?: number
  ordersCount?: number
  lastOrderAt?: Date | string
  status?: string
  [key: string]: unknown
}

interface CustomerProfileDrawerProps {
  customer: Customer | null
  onClose: () => void
}

interface Order {
  id: string
  created_at: string
  status: string
  order_total: string | number
  shipping_address?: string
  [key: string]: unknown
}

interface Reservation {
  id: string
  reservation_date: string
  reservation_time: string
  status: string
  party_size: number
  table_number?: string
  occasion?: string
  [key: string]: unknown
}

interface InsightRow {
  label: string
  value: string
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const CustomerProfileDrawer = ({
  customer,
  onClose,
}: CustomerProfileDrawerProps): JSX.Element | null => {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [noteDraft, setNoteDraft] = useState(customer?.notes || '')

  const customerEmail = customer?.email ? customer.email.trim().toLowerCase() : null
  const customerId = customer?.id || null

  useEffect(() => {
    if (!customer) return

    const fetchDetails = async () => {
      setLoading(true)
      setError('')

      try {
        if (!customerId && !customerEmail) {
          setOrders([])
          setReservations([])
          return
        }

        let ordersQuery = supabase
          .from('orders')
          .select('id, created_at, status, order_total, shipping_address')
          .order('created_at', { ascending: false })
          .limit(20)

        if (customerId && customerEmail) {
          ordersQuery = ordersQuery.or(
            `user_id.eq.${customerId},customer_email.eq.${customerEmail}`
          )
        } else if (customerId) {
          ordersQuery = ordersQuery.eq('user_id', customerId)
        } else if (customerEmail) {
          ordersQuery = ordersQuery.eq('customer_email', customerEmail)
        }

        const reservationsQuery = customerEmail
          ? supabase
              .from('table_reservations')
              .select(
                'id, reservation_date, reservation_time, status, party_size, table_number, occasion'
              )
              .eq('customer_email', customer.email || '')
              .order('reservation_date', { ascending: false })
              .order('reservation_time', { ascending: false })
              .limit(10)
          : null

        const [{ data: ordersData, error: ordersError }, reservationsResult] = await Promise.all([
          ordersQuery,
          reservationsQuery ? reservationsQuery : Promise.resolve({ data: [], error: null }),
        ])

        if (ordersError) throw ordersError
        if (reservationsResult?.error) throw reservationsResult.error

        setOrders(ordersData || [])
        setReservations(reservationsResult?.data || [])
      } catch (err) {
        logger.error('Failed to load customer profile details:', err)
        const error = err as Error
        setError(error.message || 'Failed to load profile details')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [customer, customerEmail, customerId])

  const insightRows = useMemo((): InsightRow[] => {
    if (!customer) return []

    return [
      {
        label: 'Lifetime Value',
        value: currencyFormatter.format(customer.lifetimeValue || 0),
      },
      {
        label: 'Orders',
        value: String(customer.ordersCount || 0),
      },
      {
        label: 'Total Visits',
        value: String(customer.totalVisits || 0),
      },
      {
        label: 'Last Order',
        value: customer.lastOrderAt
          ? dateTimeFormatter.format(new Date(customer.lastOrderAt))
          : '—',
      },
      {
        label: 'Last Visit',
        value: customer.lastVisitDate
          ? dateFormatter.format(new Date(customer.lastVisitDate))
          : '—',
      },
      {
        label: 'Status',
        value: customer.status ? customer.status.replace('-', ' ') : '—',
      },
    ]
  }, [customer])

  useEffect(() => {
    setNoteDraft(customer?.notes || '')
  }, [customer])

  const hasPreferences =
    (customer?.dietaryRestrictions && customer.dietaryRestrictions.length > 0) ||
    (customer?.tags && customer.tags.length > 0) ||
    (customer?.notes && customer.notes.trim()) ||
    (customer?.location && customer.location.trim())

  const handleSaveNotes = async () => {
    if (!customer?.id) return
    setUpdating(true)
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ notes: noteDraft } as never)
        .eq('id', customer.id)
      if (updateError) throw updateError
    } catch (updateErr) {
      logger.error('Failed to update notes:', updateErr)
    } finally {
      setUpdating(false)
    }
  }

  const handleSendEmail = () => {
    if (!customer?.email) return
    const subject = encodeURIComponent('Thank you from Star Café')
    const body = encodeURIComponent(
      [
        `Hi ${customer.name || ''},`,
        '',
        'Thank you for visiting Star Café. We appreciate you and would love to host you again soon.',
        '',
        'Warm regards,',
        'Star Café Team',
      ].join('\n')
    )
    window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`, '_blank')
  }

  if (!customer) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-end backdrop-blur-sm"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.4)',
      }}
      onClick={onClose}
    >
      <aside
        data-overlay-scroll
        className="h-full w-full max-w-xl overflow-y-auto border-l border-theme"
        style={{
          backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
          color: 'var(--text-main)',
          boxShadow: isLightTheme
            ? '-4px 0 24px rgba(0, 0, 0, 0.2)'
            : '-4px 0 24px rgba(0, 0, 0, 0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-theme-subtle px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-main)]/40">
              Customer Profile
            </p>
            <h2 className="text-2xl font-semibold">{customer?.name || 'Unknown Guest'}</h2>
            {customer?.email && (
              <p className="mt-1 text-sm text-[var(--text-main)]/50">{customer.email}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {customer?.email && (
              <button
                onClick={handleSendEmail}
                className="rounded-lg border border-theme bg-white/10 px-3 py-1.5 text-xs text-[var(--text-main)]/70 transition hover:border-theme-medium hover:text-[var(--text-main)]"
              >
                Email guest
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full border border-theme bg-theme-elevated p-2 text-[var(--text-main)]/60 transition hover:border-theme-medium hover:text-[var(--text-main)]"
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = ''
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="space-y-8 px-6 py-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-main)]/50">
              Insights
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {insightRows.map(row => (
                <GlowPanel
                  key={row.label}
                  glow="soft"
                  radius="rounded-lg"
                  padding="p-4"
                  background="bg-white/5"
                  className="border-theme"
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-main)]/40">
                    {row.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-main)]">{row.value}</p>
                </GlowPanel>
              ))}
            </div>
          </section>

          {hasPreferences && (
            <GlowPanel
              as="section"
              radius="rounded-lg"
              padding="p-5"
              background="bg-white/5"
              className="border-theme"
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-main)]/50">
                Preferences & Notes
              </h3>
              <div className="mt-3 space-y-3 text-sm text-[var(--text-main)]/70">
                {customer.location && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-main)]/40">
                      Location
                    </p>
                    <p className="mt-0.5">{customer.location}</p>
                  </div>
                )}
                {customer.dietaryRestrictions && customer.dietaryRestrictions.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-main)]/40">
                      Dietary
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {customer.dietaryRestrictions.map(tag => (
                        <span
                          key={tag}
                          className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {customer.tags && customer.tags.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-main)]/40">
                      Tags
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {customer.tags.map(tag => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs text-[var(--accent)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-main)]/40">
                    Internal Notes
                  </p>
                  <textarea
                    value={noteDraft}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setNoteDraft(event.target.value)
                    }
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-theme p-3 text-sm focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(255, 255, 255, 0.3)'
                        : 'rgba(5, 5, 9, 0.3)',
                      color: 'var(--text-main)',
                    }}
                    placeholder="Add service notes, preferences, or follow-up reminders..."
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-main)]/40">
                    <span>{noteDraft.length} characters</span>
                    <button
                      onClick={handleSaveNotes}
                      disabled={updating}
                      className="rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updating ? 'Saving...' : 'Save notes'}
                    </button>
                  </div>
                </div>
              </div>
            </GlowPanel>
          )}

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-main)]/50">
                Recent Orders
              </h3>
              <span className="text-xs text-[var(--text-main)]/40">{orders.length} records</span>
            </div>
            <div className="mt-3 space-y-3">
              {loading ? (
                <div className="rounded-lg border border-theme bg-white/5 p-4 text-sm text-[var(--text-main)]/60">
                  Loading…
                </div>
              ) : error ? (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {error}
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-lg border border-theme bg-white/5 p-4 text-sm text-[var(--text-main)]/60">
                  No orders yet.
                </div>
              ) : (
                orders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between rounded-lg border border-theme bg-white/5 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {dateTimeFormatter.format(new Date(order.created_at))}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-main)]/40">
                        Order ID: {order.id}
                      </p>
                      <p className="mt-2 text-xs text-[var(--text-main)]/50 capitalize">
                        Status: {order.status?.replace('-', ' ')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      {currencyFormatter.format(
                        typeof order.order_total === 'string'
                          ? parseFloat(order.order_total)
                          : Number(order.order_total || 0)
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-main)]/50">
                Reservations
              </h3>
              <span className="text-xs text-[var(--text-main)]/40">
                {reservations.length} records
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {loading ? (
                <div className="rounded-lg border border-theme bg-white/5 p-4 text-sm text-[var(--text-main)]/60">
                  Loading…
                </div>
              ) : reservations.length === 0 ? (
                <div className="rounded-lg border border-theme bg-white/5 p-4 text-sm text-[var(--text-main)]/60">
                  No reservations recorded.
                </div>
              ) : (
                reservations.map(reservation => (
                  <div
                    key={reservation.id}
                    className="rounded-lg border border-theme bg-white/5 p-4 text-sm text-[var(--text-main)]/80"
                  >
                    <p className="font-medium text-[var(--text-main)]">
                      {reservation.reservation_date
                        ? dateFormatter.format(new Date(reservation.reservation_date))
                        : '—'}{' '}
                      at {reservation.reservation_time}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-main)]/50">
                      Party of {reservation.party_size}
                      {reservation.table_number ? ` • Table ${reservation.table_number}` : ''}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[var(--text-main)]/40">
                      Status: {reservation.status?.replace('_', ' ')}
                    </p>
                    {reservation.occasion && (
                      <p className="mt-1 text-xs text-[var(--text-main)]/50">
                        Occasion: {reservation.occasion}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

export default CustomerProfileDrawer
