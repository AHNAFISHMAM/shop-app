import { useCallback, useEffect, useMemo, useState } from 'react'
import { m } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import CustomerProfileDrawer from '../../components/admin/CustomerProfileDrawer'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { logger } from '../../utils/logger'
import CustomDropdown from '../../components/ui/CustomDropdown'
import ConfirmationModal from '../../components/ui/ConfirmationModal'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'vip', label: 'VIP' },
  { value: 'active', label: 'Active' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'blacklisted', label: 'Blacklisted' }
]

const segmentFilters = [
  { value: 'all', label: 'All Customers' },
  { value: 'vip', label: 'VIP' },
  { value: 'highLtv', label: 'High LTV' },
  { value: 'repeat', label: 'Repeat Guests' },
  { value: 'new', label: 'Joined This Month' },
  { value: 'dormant', label: 'Dormant 90d+' }
]

const sortOptions = [
  { value: 'recent', label: 'Most Recent Activity' },
  { value: 'ltv', label: 'Lifetime Value' },
  { value: 'orders', label: 'Orders Count' },
  { value: 'name', label: 'Name (A-Z)' }
]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
})

const daysBetween = (from, to = new Date()) => {
  if (!from) return null
  const start = new Date(from)
  if (Number.isNaN(start.getTime())) return null
  return Math.floor((to.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

const resolveStatus = (customer) => {
  if (customer.isBlacklisted) return 'blacklisted'
  if (customer.isVip) return 'vip'

  const lastActivity = customer.lastOrderAt || customer.lastVisitDate || customer.joinedAt
  const daysSinceActivity = daysBetween(lastActivity)

  if (daysSinceActivity == null) return 'prospect'
  if (daysSinceActivity <= 14) return 'active'
  if (daysSinceActivity <= 45) return 'engaged'
  if (daysSinceActivity <= 120) return 'at-risk'
  return customer.ordersCount > 0 || customer.totalVisits > 0 ? 'inactive' : 'prospect'
}

const AdminCustomers = () => {
  const containerRef = useViewportAnimationTrigger()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [segment, setSegment] = useState('all')
  const [sort, setSort] = useState('recent')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [updatingCustomerId, setUpdatingCustomerId] = useState(null)
  const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false)
  const [customerToBlacklist, setCustomerToBlacklist] = useState(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        { data: customerRows, error: customersError },
        { data: orderRows, error: ordersError }
      ] = await Promise.all([
        supabase
          .from('customers')
          .select(
            [
              'id',
              'email',
              'full_name',
              'created_at',
              'is_vip',
              'is_blacklisted',
              'blacklist_reason',
              'tags',
              'notes',
              'preferences',
              'last_visit_date',
              'total_spent',
              'total_visits',
              'dietary_restrictions'
            ].join(',')
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('id, user_id, customer_email, order_total, status, created_at')
          .order('created_at', { ascending: false })
          .limit(2000)
      ])

      if (customersError) throw customersError
      if (ordersError) throw ordersError

      const ordersByUserId = new Map()
      const ordersByEmail = new Map()

      ;(orderRows || []).forEach(order => {
        const amount = typeof order.order_total === 'string'
          ? parseFloat(order.order_total)
          : Number(order.order_total || 0)

        const keyByUser = order.user_id || null
        const keyByEmail = order.customer_email ? order.customer_email.trim().toLowerCase() : null

        const updateBucket = (bucket, key) => {
          if (!key) return
          const current = bucket.get(key) || {
            ordersCount: 0,
            lifetimeValue: 0,
            lastOrderAt: null
          }

          const latestOrderDate = current.lastOrderAt
          const thisOrderDate = order.created_at ? new Date(order.created_at) : null
          const isMoreRecent = thisOrderDate && (!latestOrderDate || thisOrderDate > latestOrderDate)

          bucket.set(key, {
            ordersCount: current.ordersCount + 1,
            lifetimeValue: current.lifetimeValue + (Number.isFinite(amount) ? amount : 0),
            lastOrderAt: isMoreRecent ? thisOrderDate : latestOrderDate
          })
        }

        updateBucket(ordersByUserId, keyByUser)
        updateBucket(ordersByEmail, keyByEmail)
      })

      const enriched = (customerRows || []).map(row => {
        const aggregatedById = ordersByUserId.get(row.id)
        const aggregatedByEmail = row.email
          ? ordersByEmail.get(row.email.trim().toLowerCase())
          : null

        const aggregation = aggregatedById || aggregatedByEmail || {
          ordersCount: 0,
          lifetimeValue: 0,
          lastOrderAt: null
        }

        const lifetimeValue = row.total_spent ?? aggregation.lifetimeValue
        const lastOrderAt = aggregation.lastOrderAt
          ? aggregation.lastOrderAt
          : row.last_visit_date
            ? new Date(row.last_visit_date)
            : null

        const preferences = row.preferences && typeof row.preferences === 'object'
          ? row.preferences
          : {}

        const location =
          preferences.city ||
          preferences.location ||
          (row.notes ? row.notes.split('\n').find(line => line.toLowerCase().startsWith('city:'))?.split(':')[1]?.trim() : '')

        const normalized = {
          id: row.id,
          name: row.full_name || row.email || 'Unknown Guest',
          email: row.email,
          joinedAt: row.created_at ? new Date(row.created_at) : null,
          isVip: row.is_vip === true,
          isBlacklisted: row.is_blacklisted === true,
          blacklistReason: row.blacklist_reason || '',
          tags: Array.isArray(row.tags) ? row.tags : [],
          notes: row.notes || '',
          totalVisits: row.total_visits ?? 0,
          dietaryRestrictions: Array.isArray(row.dietary_restrictions) ? row.dietary_restrictions : [],
          location: location || null,
          lifetimeValue,
          ordersCount: aggregation.ordersCount,
          lastOrderAt,
          lastVisitDate: row.last_visit_date ? new Date(row.last_visit_date) : null
        }

        return {
          ...normalized,
          status: resolveStatus({
            ...normalized
          })
        }
      })

      setCustomers(enriched)
    } catch (err) {
      logger.error('Failed to load customers:', err)
      setError(err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()

    const channel = supabase
      .channel('admin-customers-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCustomers()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCustomers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCustomers])

  const metrics = useMemo(() => {
    if (customers.length === 0) {
      return [
        { label: 'Total Customers', value: 0, trend: '—', tone: 'neutral' },
        { label: 'VIP Customers', value: 0, trend: '—', tone: 'neutral' },
        { label: 'Average Orders', value: '0', trend: '—', tone: 'neutral' },
        { label: 'Avg. Lifetime Value', value: '$0', trend: '—', tone: 'neutral' }
      ]
    }

    const total = customers.length
    const vip = customers.filter(c => c.isVip).length
    const orderTotals = customers.reduce(
      (acc, customer) => {
        acc.orders += customer.ordersCount
        acc.lifetime += customer.lifetimeValue || 0
        return acc
      },
      { orders: 0, lifetime: 0 }
    )

    const avgOrders = orderTotals.orders / total
    const avgLifetime = orderTotals.lifetime / total

    return [
      { label: 'Total Customers', value: total, trend: `${vip} VIP`, tone: 'neutral' },
      { label: 'VIP Customers', value: vip, trend: `${Math.round((vip / total) * 100)}%`, tone: 'positive' },
      { label: 'Average Orders', value: avgOrders.toFixed(1), trend: 'per customer', tone: 'neutral' },
      { label: 'Avg. Lifetime Value', value: currencyFormatter.format(avgLifetime || 0), trend: 'per customer', tone: 'neutral' }
    ]
  }, [customers])

  const segmentAnalytics = useMemo(() => {
    if (customers.length === 0) {
      return [
        { label: 'VIP Advocates', count: 0, percent: 0, tone: 'positive', color: 'bg-[#C59D5F]' },
        { label: 'Active Guests', count: 0, percent: 0, tone: 'positive', color: 'bg-emerald-400' },
        { label: 'At-Risk', count: 0, percent: 0, tone: 'warning', color: 'bg-amber-400' },
        { label: 'Dormant', count: 0, percent: 0, tone: 'neutral', color: 'bg-white/50' },
        { label: 'Blacklisted', count: 0, percent: 0, tone: 'negative', color: 'bg-rose-400' }
      ]
    }

    const total = customers.length
    const definitions = [
      { label: 'VIP Advocates', keys: ['vip'], color: 'bg-[#C59D5F]', tone: 'positive' },
      { label: 'Active Guests', keys: ['active', 'engaged'], color: 'bg-emerald-400', tone: 'positive' },
      { label: 'At-Risk', keys: ['at-risk'], color: 'bg-amber-400', tone: 'warning' },
      { label: 'Dormant', keys: ['inactive', 'prospect'], color: 'bg-white/50', tone: 'neutral' },
      { label: 'Blacklisted', keys: ['blacklisted'], color: 'bg-rose-400', tone: 'negative' }
    ]

    return definitions.map(def => {
      const count = customers.filter(customer => def.keys.includes(customer.status)).length
      const percent = total === 0 ? 0 : Math.round((count / total) * 100)
      return {
        label: def.label,
        count,
        percent,
        tone: def.tone,
        color: def.color
      }
    })
  }, [customers])

  const filteredCustomers = useMemo(() => {
    let data = [...customers]

    if (search) {
      const query = search.toLowerCase()
      data = data.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.tags && customer.tags.some(tag => tag.toLowerCase().includes(query)))
      )
    }

    if (status !== 'all') {
      data = data.filter(customer => customer.status === status)
    }

    if (segment !== 'all') {
      const now = new Date()
      data = data.filter(customer => {
        switch (segment) {
          case 'vip':
            return customer.isVip
          case 'highLtv':
            return (customer.lifetimeValue || 0) >= 500
          case 'repeat':
            return customer.ordersCount >= 3 || customer.totalVisits >= 3
          case 'new':
            if (!customer.joinedAt) return false
            return customer.joinedAt.getMonth() === now.getMonth() &&
              customer.joinedAt.getFullYear() === now.getFullYear()
          case 'dormant':
            return daysBetween(customer.lastOrderAt || customer.lastVisitDate) >= 90
          default:
            return true
        }
      })
    }

    data.sort((a, b) => {
      if (sort === 'recent') {
        const dateA = a.lastOrderAt || a.lastVisitDate || a.joinedAt
        const dateB = b.lastOrderAt || b.lastVisitDate || b.joinedAt
        return (dateB ? dateB.getTime() : 0) - (dateA ? dateA.getTime() : 0)
      }
      if (sort === 'ltv') {
        return (b.lifetimeValue || 0) - (a.lifetimeValue || 0)
      }
      if (sort === 'orders') {
        return (b.ordersCount || 0) - (a.ordersCount || 0)
      }
      return a.name.localeCompare(b.name)
    })

    return data
  }, [customers, search, status, segment, sort])

  // Close all open dropdowns by clicking backdrop
  const closeAllDropdowns = () => {
    const backdrops = document.querySelectorAll('[data-dropdown-backdrop]');
    backdrops.forEach(backdrop => {
      if (backdrop instanceof HTMLElement) {
        backdrop.click();
      }
    });
  }

  const handleInviteCustomer = () => {
    const email = window.prompt('Enter the customer email to invite:')
    if (!email) return

    const subject = encodeURIComponent('Your Star Café experience awaits')
    const body = encodeURIComponent(
      [
        'Hi there,',
        '',
        'We would love to welcome you back to Star Café. Reserve a table or explore our menu anytime.',
        '',
        'Warm regards,',
        'Star Café Team'
      ].join('\n')
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank')
  }

  const handleEmailCustomer = (customer) => {
    if (!customer?.email) {
      alert('This customer does not have an email on file.')
      return
    }

    const subject = encodeURIComponent(`Star Café – ${customer.name || 'Valued Guest'}`)
    const body = encodeURIComponent(
      [
        `Hi ${customer.name || 'there'},`,
        '',
        'Thanks for being part of the Star Café family. Let us know if we can reserve your next visit.',
        '',
        'Warm regards,',
        'Star Café Team'
      ].join('\n')
    )
    window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`, '_blank')
  }

  const handleToggleBlacklist = async (customer) => {
    if (!customer?.id) {
      toast.error('Unable to update this record. Missing customer identifier.')
      return
    }

    const makeBlacklisted = !customer.isBlacklisted
    if (makeBlacklisted) {
      setCustomerToBlacklist(customer)
      setShowBlacklistConfirm(true)
      return
    }

    // Unblacklist immediately without confirmation
    await executeBlacklistToggle(customer, false)
  }

  const executeBlacklistToggle = async (customer, makeBlacklisted) => {
    setUpdatingCustomerId(customer.id)

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          is_blacklisted: makeBlacklisted,
          blacklist_reason: makeBlacklisted ? 'Flagged manually by admin' : null
        })
        .eq('id', customer.id)

      if (error) throw error

      await fetchCustomers()
      toast.success(makeBlacklisted ? 'Customer blacklisted' : 'Customer removed from blacklist')
    } catch (err) {
      logger.error('Failed to update customer status:', err)
      toast.error('Unable to update customer status. Please try again.')
    } finally {
      setUpdatingCustomerId(null)
    }
  }

  return (
    <m.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)] py-8 sm:py-12 md:py-16"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10">
        {/* Header */}
        <header className="mb-8 sm:mb-10 md:mb-12 flex flex-col gap-4 sm:gap-5 md:gap-6 md:flex-row md:items-end md:justify-between" data-animate="fade-rise" data-animate-active="false">
          <div className="space-y-3 sm:space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C59D5F]/30 bg-[#C59D5F]/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#C59D5F]">
              Customer Intelligence
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Guest Relationships</h1>
              <p className="mt-2 sm:mt-3 max-w-xl text-sm sm:text-base text-[var(--text-main)]/60">
                Track guest loyalty, identify retention risks, and recognise VIP advocates.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <button
              type="button"
              onClick={fetchCustomers}
              className="btn-outline px-5 py-2 text-sm"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleInviteCustomer}
              className="btn-primary px-5 py-2 text-sm font-semibold"
            >
              Invite Customer
            </button>
          </div>
        </header>

        <section data-animate="fade-rise" data-animate-active="false" className="mb-8 sm:mb-10 md:mb-12 grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <article
              key={metric.label}
              className="card-soft admin-card-hover bg-[rgba(255,255,255,0.04)] p-5 sm:p-6 md:p-7 shadow-[0_15px_50px_rgba(0,0,0,0.35)] backdrop-blur"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[var(--text-main)]/50">{metric.label}</p>
              <div className="mt-4 sm:mt-5 flex items-baseline justify-between">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </p>
                <span
                  className={`text-xs sm:text-sm ${
                    metric.tone === 'positive'
                      ? 'text-emerald-400'
                      : metric.tone === 'negative'
                        ? 'text-rose-400'
                        : 'text-[var(--text-main)]/60'
                  }`}
                >
                  {metric.trend}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section data-animate="fade-scale" data-animate-active="false" className="mb-8 sm:mb-10 md:mb-12 glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-[rgba(9,9,14,0.92)] p-5 sm:p-6 md:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.5)] backdrop-blur">
          <header className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-baseline md:justify-between mb-4 sm:mb-5 md:mb-6">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[var(--text-main)]/50">Segment Health</p>
              <h2 className="mt-2 sm:mt-3 text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">Customer Cohorts</h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-main)]/40">Distribution across loyalty and risk segments</p>
          </header>
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {segmentAnalytics.map(segment => (
              <div key={segment.label}>
                <div className="flex items-center justify-between text-sm sm:text-base mb-2 sm:mb-3">
                  <span className="font-medium text-[var(--text-main)]">{segment.label}</span>
                  <span
                    className={`text-xs sm:text-sm ${
                      segment.tone === 'positive'
                        ? 'text-emerald-300'
                        : segment.tone === 'negative'
                          ? 'text-rose-300'
                          : segment.tone === 'warning'
                            ? 'text-amber-300'
                            : 'text-[var(--text-main)]/60'
                    }`}
                  >
                    {segment.percent}%
                  </span>
                </div>
                <div className="h-2.5 sm:h-3 rounded-full bg-white/10">
                  <div
                    className={`h-2.5 sm:h-3 rounded-full transition-all duration-500 ${segment.color}`}
                    style={{ width: `${segment.percent}%` }}
                  />
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-[var(--text-main)]/40">{segment.count} customers</p>
              </div>
            ))}
          </div>
        </section>

        <section data-animate="fade-scale" data-animate-active="false" className="space-y-6 sm:space-y-8 md:space-y-10 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(9,9,14,0.92)] p-5 sm:p-6 md:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.6)] backdrop-blur relative" style={{ zIndex: 1 }}>
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="glow-surface glow-soft flex flex-1 items-center gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] px-4 sm:px-5 py-3 sm:py-3.5">
              <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search by name, email, or tags"
                className="w-full bg-transparent text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none min-h-[44px]"
              />
            </div>
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:w-auto w-full">
              <div className="w-full sm:w-52 flex-shrink-0">
                <CustomDropdown
                  options={statusOptions.map(option => ({ value: option.value, label: option.label }))}
                  value={status}
                  onChange={(event) => {
                    logger.log('Status dropdown onChange:', event.target.value);
                    setStatus(event.target.value);
                  }}
                  placeholder="All Status"
                  maxVisibleItems={5}
                  name="status"
                />
              </div>
              <div className="w-full sm:w-52 flex-shrink-0">
                <CustomDropdown
                  options={sortOptions.map(option => ({ value: option.value, label: `Sort: ${option.label}` }))}
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  placeholder="Sort"
                  maxVisibleItems={5}
                  name="sort"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-between gap-4 sm:gap-5 border-b border-theme pb-5 sm:pb-6 md:pb-8 relative" style={{ zIndex: 100001 }}>
            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-[var(--text-main)]/60">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Close any open dropdowns first
                  closeAllDropdowns();
                  // Small delay to ensure dropdowns close
                  setTimeout(() => {
                    setStatus('all')
                    setSegment('all')
                    setSort('recent')
                    setSearch('')
                  }, 50);
                }}
                className="rounded-full border border-theme-strong px-3 sm:px-4 py-2 sm:py-2.5 transition hover:border-theme-medium hover:text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.05)] min-h-[36px] sm:min-h-[44px] cursor-pointer relative"
                style={{ zIndex: 100002 }}
              >
                Clear filters
              </button>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    const csvRows = [
                      ['Name', 'Email', 'Status', 'Orders', 'Lifetime Value', 'Last Order', 'Joined'].join(',')
                    ]
                    filteredCustomers.forEach(customer => {
                      csvRows.push([
                        `"${customer.name || ''}"`,
                        `"${customer.email || ''}"`,
                        `"${customer.status}"`,
                        customer.ordersCount ?? 0,
                        customer.lifetimeValue ?? 0,
                        customer.lastOrderAt ? customer.lastOrderAt.toISOString() : '',
                        customer.joinedAt ? customer.joinedAt.toISOString() : ''
                      ].join(','))
                    })
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', `customers_export_${Date.now()}.csv`)
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    toast.success(`Exported ${filteredCustomers.length} customers to CSV`)
                  } catch (err) {
                    logger.error('Failed to export CSV:', err)
                    toast.error('Unable to export CSV. Please try again.')
                  }
                }}
                className="rounded-lg border border-theme-strong bg-theme-elevated px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[var(--text-main)]/70 transition hover:border-theme-medium hover:text-[var(--text-main)] min-h-[44px]"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={async () => {
                  const summary = segmentAnalytics
                    .map(segment => `${segment.label}: ${segment.count} (${segment.percent}%)`)
                    .join('\n')
                  if (navigator?.clipboard?.writeText) {
                    try {
                      await navigator.clipboard.writeText(summary)
                      toast.success('Segment summary copied to clipboard')
                    } catch (err) {
                      logger.error('Clipboard copy failed:', err)
                      toast.error('Clipboard copy failed. Try manually selecting the text.')
                    }
                  } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea')
                    textArea.value = summary
                    textArea.style.position = 'fixed'
                    textArea.style.opacity = '0'
                    document.body.appendChild(textArea)
                    textArea.select()
                    try {
                      document.execCommand('copy')
                      toast.success('Segment summary copied to clipboard')
                    } catch (err) {
                      logger.error('Clipboard copy failed:', err)
                      toast.error('Clipboard copy failed. Please copy manually.')
                    }
                    document.body.removeChild(textArea)
                  }
                }}
                className="rounded-lg border border-theme-strong bg-theme-elevated px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[var(--text-main)]/60 transition hover:border-theme-medium hover:text-[var(--text-main)] min-h-[44px]"
              >
                Copy segment summary
              </button>
            </div>
          </div>

          <div data-animate="fade-rise" data-animate-active="false" className="glow-surface glow-soft mt-6 sm:mt-8 md:mt-10 overflow-hidden rounded-xl sm:rounded-2xl border border-theme">
            {loading ? (
              <div className="flex items-center justify-center py-16 sm:py-20 md:py-24 text-sm sm:text-base text-[var(--text-main)]/60">
                Loading customers…
              </div>
            ) : error ? (
              <div data-animate="fade-scale" data-animate-active="false" className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-rose-500/35 bg-rose-500/10 px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 shadow-[0_25px_60px_-40px_rgba(5,5,9,0.8)]">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm sm:text-base text-rose-300">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCustomers}
                  className="rounded-lg bg-[#C59D5F] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-black min-h-[44px]"
                >
                  Retry
                </button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-16 sm:py-20 md:py-24 text-center text-sm sm:text-base text-[var(--text-main)]/60">
                No customers match this view. Adjust filters or refresh.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-white/10 bg-[rgba(5,5,9,0.92)]">
                <thead className="bg-[rgba(255,255,255,0.03)] backdrop-blur">
                  <tr className="text-left text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[var(--text-main)]/40">
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Activity</th>
                    <th className="px-3 py-2">Orders</th>
                    <th className="px-3 py-2">Lifetime Value</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="text-xs sm:text-sm transition hover:bg-[rgba(197,157,95,0.08)]"
                      data-animate="fade-rise"
                      data-animate-active="false"
                      style={{ transitionDelay: `${index * 70}ms` }}
                    >
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          <p className="font-medium text-xs sm:text-sm text-[var(--text-main)] truncate max-w-[200px]">{customer.name}</p>
                          <p className="text-[10px] sm:text-xs text-[var(--text-main)]/50 truncate max-w-[200px]">{customer.email}</p>
                          {customer.joinedAt && (
                            <p className="text-[10px] text-[var(--text-main)]/30">
                              {dateFormatter.format(customer.joinedAt)}
                            </p>
                          )}
                          {customer.tags && customer.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {customer.tags.slice(0, 2).map(tag => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-[rgba(197,157,95,0.15)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#C59D5F]"
                                >
                                  {tag}
                                </span>
                              ))}
                              {customer.tags.length > 2 && (
                                <span className="text-[9px] text-[var(--text-main)]/40">
                                  +{customer.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-main)]/80">
                        <div className="space-y-0.5">
                          <p className="text-xs">
                            {customer.lastOrderAt
                              ? dateFormatter.format(customer.lastOrderAt)
                              : '—'}
                          </p>
                          <p className="text-[10px] text-[var(--text-main)]/40 truncate max-w-[150px]">
                            {customer.location || 'No location'}
                          </p>
                          {customer.dietaryRestrictions && customer.dietaryRestrictions.length > 0 && (
                            <p className="text-[10px] text-amber-300 truncate max-w-[150px]">
                              {customer.dietaryRestrictions.join(', ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-main)]/80">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium">{customer.ordersCount}</p>
                          <p className="text-[10px] text-[var(--text-main)]/40">
                            Visits: {customer.totalVisits || 0}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--text-main)]/80 font-medium">
                        {currencyFormatter.format(customer.lifetimeValue || 0)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            customer.status === 'vip'
                              ? 'bg-[#C59D5F]/20 text-[#C59D5F]'
                              : customer.status === 'active' || customer.status === 'engaged'
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : customer.status === 'at-risk'
                                  ? 'bg-amber-500/10 text-amber-300'
                                  : customer.status === 'blacklisted'
                                    ? 'bg-rose-600/20 text-rose-200'
                                    : 'bg-white/10 text-[var(--text-main)]/60'
                          }`}
                        >
                          {customer.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            className="rounded border border-theme-strong bg-theme-elevated px-2 py-1 text-[10px] text-[var(--text-main)]/70 transition hover:border-[#C59D5F]/40 hover:text-[var(--text-main)]"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEmailCustomer(customer)}
                            className="rounded border border-theme bg-[rgba(255,255,255,0.07)] px-2 py-1 text-[10px] text-[var(--text-main)]/80 transition hover:border-theme-medium hover:bg-[rgba(255,255,255,0.12)]"
                          >
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBlacklist(customer)}
                            disabled={updatingCustomerId === customer.id}
                            className={`rounded border px-2 py-1 text-[10px] transition ${
                              customer.isBlacklisted
                                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                            } ${updatingCustomerId === customer.id ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            {updatingCustomerId === customer.id
                              ? '…'
                              : customer.isBlacklisted
                                ? 'Unflag'
                                : 'Flag'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div data-animate="fade-rise" data-animate-active="false" className="mt-6 sm:mt-8 md:mt-10 flex flex-col gap-4 sm:gap-5 rounded-xl sm:rounded-2xl border border-dashed border-theme-strong bg-[rgba(255,255,255,0.04)] p-5 sm:p-6 md:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm sm:text-base md:text-lg font-medium text-[var(--text-main)] mb-2 sm:mb-3">Need richer insights?</p>
              <p className="text-xs sm:text-sm text-[var(--text-main)]/50">
                Connect Supabase analytics or enable React-admin dashboards for deeper cohort tracking.
              </p>
            </div>
            <button className="btn-primary w-full px-6 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold shadow-[0_15px_40px_rgba(197,157,95,0.35)] min-h-[44px] md:w-auto">
              Explore CRM Integrations
            </button>
          </div>
        </section>
      </div>

      {selectedCustomer && (
        <CustomerProfileDrawer
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Blacklist Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBlacklistConfirm}
        onClose={() => {
          setShowBlacklistConfirm(false);
          setCustomerToBlacklist(null);
        }}
        onConfirm={() => {
          if (customerToBlacklist) {
            executeBlacklistToggle(customerToBlacklist, true);
            setShowBlacklistConfirm(false);
            setCustomerToBlacklist(null);
          }
        }}
        title="Blacklist Customer"
        message={`Are you sure you want to flag "${customerToBlacklist?.fullName || customerToBlacklist?.email}" for review and restrict activity?\n\nThis will prevent them from making orders or reservations.`}
        confirmText="Blacklist"
        cancelText="Cancel"
        variant="warning"
      />
    </m.main>
  )
}

export default AdminCustomers

