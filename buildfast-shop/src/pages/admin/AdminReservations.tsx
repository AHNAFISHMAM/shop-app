import { useState, useEffect, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Calendar } from '../../components/ui/calendar-rac'
import { getLocalTimeZone, today } from '@internationalized/date'
import { supabase } from '../../lib/supabase'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { getAllReservations, updateReservationStatus as updateReservationStatusService } from '../../lib/reservationService'
import toast from 'react-hot-toast'
import CustomerHistory from '../../components/admin/CustomerHistory'
import WaitlistManager from '../../components/admin/WaitlistManager'
import AdminReservationSettings from './AdminReservationSettings'
import { logger } from '../../utils/logger'
import CustomDropdown from '../../components/ui/CustomDropdown'

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  status: string;
  party_size: number;
  table_number?: string;
  occasion?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  admin_notes?: string;
  special_requests?: string | null;
  [key: string]: unknown;
}

/**
 * Admin Reservations Management
 * View, confirm, decline, and manage all table reservations
 */

function AdminReservations() {
  const containerRef = useViewportAnimationTrigger()
  
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

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [modalTab, setModalTab] = useState<'details' | 'history'>('details')
  const [showSettings, setShowSettings] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    const now = today(getLocalTimeZone())
    return now
  })

  useEffect(() => {
    fetchReservations()

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-reservations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_reservations'
        },
        (payload) => {
          logger.log('Reservation updated:', payload)
          fetchReservations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)

      // Use service layer for consistent data fetching
      const result = await getAllReservations({})

      if (result.success) {
        setReservations((result.data || []) as Reservation[])
      } else {
        logger.error('Error fetching reservations:', result.error)
        toast.error('Failed to load reservations')
      }
    } catch (err) {
      logger.error('Error fetching reservations:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (reservationId: string, newStatus: string, notes = '', table = '') => {
    try {
      // Use service layer for status updates
      const result = await updateReservationStatusService(reservationId, newStatus, notes)

      if (!result.success) {
        toast.error(result.error || 'Failed to update reservation')
        return
      }

      // Update table number separately if provided (not in service layer)
      if (table) {
        const { error } = await supabase
          .from('table_reservations')
          .update({ table_number: table } as never)
          .eq('id', reservationId)

        if (error) {
          logger.error('Error updating table number:', error)
          toast.error('Failed to update table number')
        }
      }

      toast.success(`Reservation ${newStatus} successfully!`)
      fetchReservations()
      setSelectedReservation(null)
      setAdminNotes('')
      setTableNumber('')
    } catch (err) {
      logger.error('Error updating reservation:', err)
      toast.error('Failed to update reservation')
    }
  }

  const confirmDelete = (reservationId: string) => {
    setReservationToDelete(reservationId as any)
    setShowDeleteConfirm(true)
  }

  const deleteReservation = async () => {
    if (!reservationToDelete) return

    try {
      const { error } = await supabase
        .from('table_reservations')
        .delete()
        .eq('id', reservationToDelete)

      if (error) throw error

      toast.success('Reservation deleted successfully')
      fetchReservations()
      setShowDeleteConfirm(false)
      setReservationToDelete(null)
      setSelectedReservation(null)
    } catch (err) {
      logger.error('Error deleting reservation:', err)
      toast.error('Failed to delete reservation')
    }
  }

  // Check for conflicting reservations (same date, overlapping time)
  const getConflicts = (reservation: Reservation) => {
    if (!reservation) return []

    return reservations.filter(r => {
      if (r.id === reservation.id) return false
      if (r.reservation_date !== reservation.reservation_date) return false
      if (r.status === 'cancelled' || r.status === 'declined' || r.status === 'no_show') return false

      // Simple time conflict check (can be enhanced with actual time parsing)
      return r.reservation_time === reservation.reservation_time
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      confirmed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      declined: 'bg-red-500/20 text-red-300 border border-red-500/30',
      cancelled: 'bg-gray-500/20 text-[var(--text-muted)] border border-gray-500/30',
      completed: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      no_show: 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
    }

    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✓',
      declined: '✕',
      cancelled: '⊘',
      completed: '✓',
      no_show: '⚠'
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[status] || 'bg-gray-500/20 text-[var(--text-muted)] border border-gray-500/30'}`}>
        <span>{icons[status] || '•'}</span>
        {status.replace('_', ' ')}
      </span>
    )
  }

  // Filter reservations
  const filteredReservations = reservations.filter(reservation => {
    // Status filter
    if (statusFilter !== 'all' && reservation.status !== statusFilter) {
      return false
    }

    // Date filter
    if (selectedDate && reservation.reservation_date !== selectedDate) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fields = [
        reservation.customer_name,
        reservation.customer_email,
        reservation.customer_phone,
        reservation.table_number
      ]
      return fields.some((field) => {
        if (field === null || field === undefined) return false
        return String(field).toLowerCase().includes(query)
      })
    }

    return true
  })

  // Group reservations by date - memoized for performance
  const groupedReservations = useMemo(() => {
    return filteredReservations.reduce((groups: Record<string, Reservation[]>, reservation) => {
      const date = reservation.reservation_date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(reservation)
      return groups
    }, {})
  }, [filteredReservations])


  // Debug viewMode changes - only log when viewMode changes to avoid spam
  useEffect(() => {
    if (!!(import.meta.env?.DEV ?? false)) {
      logger.log('ViewMode changed to:', viewMode)
      logger.log('Filtered reservations count:', filteredReservations.length)
      logger.log('Grouped reservations keys:', Object.keys(groupedReservations))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]) // Only depend on viewMode to avoid excessive logging

  return (
    <m.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)]"
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
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        <header className="mb-12 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-end md:justify-between" data-animate="fade-rise" data-animate-active="false">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Reservations Management</h1>
            <p className="mt-2 text-sm sm:text-base text-muted">
              Monitor bookings, confirm tables, and keep the dining room running smoothly.
            </p>
          </div>

          {/* View Mode Toggle + Settings */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 rounded-xl sm:rounded-2xl min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--accent)] text-black'
                  : 'border border-theme bg-[rgba(255,255,255,0.05)] text-muted hover:bg-[rgba(255,255,255,0.1)]'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCalendarModal(true)
              }}
              className="flex items-center gap-2 rounded-xl sm:rounded-2xl min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all border border-theme bg-[rgba(255,255,255,0.05)] text-muted hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-main)]"
              aria-label="Open calendar view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>

            {/* Divider */}
            <div className="w-px bg-white/10"></div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 rounded-xl sm:rounded-2xl min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all border border-theme bg-[rgba(255,255,255,0.05)] text-muted hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-main)] hover:border-[var(--accent)]/30"
              title="Reservation Settings"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </header>

        {/* Filters */}
        <div
          className="glow-surface glow-soft mb-6 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 sm:p-6 md:p-10"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm sm:text-base font-medium text-muted">Status</label>
              <CustomDropdown
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'declined', label: 'Declined' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'no_show', label: 'No Show' }
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(String(e.target.value))}
                placeholder="All Statuses"
                maxVisibleItems={5}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm sm:text-base font-medium text-muted">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-themed w-full min-h-[44px] rounded-xl sm:rounded-2xl border px-4 sm:px-6 py-3 focus:border-transparent focus:ring-2 focus:ring-[var(--accent)]/70 text-sm sm:text-base"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm sm:text-base font-medium text-muted">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, phone, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-themed w-full min-h-[44px] rounded-xl sm:rounded-2xl border px-4 sm:px-6 py-3 focus:border-transparent focus:ring-2 focus:ring-[var(--accent)]/70 placeholder:text-muted text-sm sm:text-base"
              />
            </div>
          </div>

          {(statusFilter !== 'all' || selectedDate || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setSelectedDate('')
                setSearchQuery('')
              }}
              className="mt-4 text-sm sm:text-base font-medium text-[var(--accent)] transition hover:opacity-80"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Enhanced Stats Dashboard */}
        <div
          className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          data-animate="fade-rise"
          data-animate-active="false"
        >
          {/* Total Reservations */}
          <div className="group glow-surface glow-soft rounded-2xl border border-theme bg-gradient-to-br from-[rgba(255,255,255,0.04)] to-[rgba(255,255,255,0.02)] p-5 transition-all hover:border-theme-medium hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total</p>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[var(--text-main)]">{reservations.length}</p>
            <p className="mt-1 text-xs text-muted">All time reservations</p>
          </div>

          {/* Pending */}
          <div className="group glow-surface glow-soft rounded-2xl border border-theme bg-gradient-to-br from-[rgba(255,255,255,0.04)] to-[rgba(255,255,255,0.02)] p-5 transition-all hover:border-amber-500/30 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Pending</p>
              <div className="rounded-lg bg-amber-500/20 p-2">
                <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-300">
              {reservations.filter(r => r.status === 'pending').length}
            </p>
            <p className="mt-1 text-xs text-muted">Awaiting confirmation</p>
          </div>

          {/* Confirmed */}
          <div className="group glow-surface glow-soft rounded-2xl border border-theme bg-gradient-to-br from-[rgba(255,255,255,0.04)] to-[rgba(255,255,255,0.02)] p-5 transition-all hover:border-emerald-500/30 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Confirmed</p>
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-300">
              {reservations.filter(r => r.status === 'confirmed').length}
            </p>
            <p className="mt-1 text-xs text-muted">Ready to serve</p>
          </div>

          {/* Today */}
          <div className="group glow-surface glow-soft rounded-2xl border border-theme bg-gradient-to-br from-[rgba(197,157,95,0.1)] to-[rgba(255,255,255,0.02)] p-5 transition-all hover:border-[var(--accent)]/30 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Today</p>
              <div className="rounded-lg bg-[var(--accent)]/20 p-2">
                <svg className="h-4 w-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[var(--accent)]">
              {reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).length}
            </p>
            <p className="mt-1 text-xs text-muted">Reservations today</p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div
          className="mb-6 flex flex-wrap gap-3 sm:gap-4 md:gap-6"
          data-animate="fade-rise"
          data-animate-active="false"
        >
          <button
            onClick={() => setStatusFilter('pending')}
            className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-amber-500/30 bg-amber-500/10 min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-amber-300 transition-all hover:bg-amber-500/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Pending ({reservations.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('all')
              setSelectedDate(new Date().toISOString().split('T')[0] || '')
            }}
            className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-[var(--accent)] transition-all hover:bg-[var(--accent)]/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Today&apos;s Reservations ({reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).length})
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-500/10 min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-emerald-300 transition-all hover:bg-emerald-500/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Confirmed ({reservations.filter(r => r.status === 'confirmed').length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('all')
              setSelectedDate('')
              setSearchQuery('')
            }}
            className="ml-auto flex items-center gap-2 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.05)] min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base font-medium text-muted transition-all hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-main)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        </div>

        {/* Waitlist Section */}
        <div
          className="mb-6"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <WaitlistManager />
        </div>

        {/* Additional Metrics Row */}
        <div
          className="mb-6 grid gap-4 md:grid-cols-3"
          data-animate="fade-rise"
          data-animate-active="false"
        >
          {/* Completed */}
          <div className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2.5">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-main)]">
                  {reservations.filter(r => r.status === 'completed').length}
                </p>
                <p className="text-xs text-muted">Completed</p>
              </div>
            </div>
          </div>

          {/* No Shows */}
          <div className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/20 p-2.5">
                <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-main)]">
                  {reservations.filter(r => r.status === 'no_show').length}
                </p>
                <p className="text-xs text-muted">No Shows</p>
              </div>
            </div>
          </div>

          {/* Total Guests */}
          <div className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2.5">
                <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-main)]">
                  {reservations.reduce((sum, r) => sum + (r.party_size || 0), 0)}
                </p>
                <p className="text-xs text-muted">Total Guests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div
            className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-12 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-[var(--accent)]"></div>
              <p className="text-muted">Loading reservations...</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div
            className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-12 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <svg className="mx-auto mb-4 h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium text-muted">No reservations found</p>
            <p className="mt-2 text-sm text-muted">Try adjusting your filters or search criteria</p>
          </div>
        ) : viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.keys(groupedReservations).length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <svg className="h-16 w-16 text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-muted">No reservations in calendar view</p>
                <p className="mt-2 text-sm text-muted">Reservations will appear here when available</p>
              </div>
            ) : (
              Object.keys(groupedReservations).sort().map((date, dateIndex) => (
                <div
                  key={date}
                  className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-5 transition-all hover:border-theme-medium hover:shadow-lg"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${dateIndex * 90}ms` }}
                >
                  <div className="mb-4 flex items-center justify-between border-b border-theme pb-3">
                    <div>
                      <h3 className="font-semibold text-[var(--text-main)]">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </h3>
                      <p className="text-xs text-muted">{(groupedReservations[date]?.length || 0)} reservations</p>
                    </div>
                    <div className="rounded-lg bg-[var(--accent)]/20 px-3 py-1.5">
                      <span className="text-sm font-bold text-[var(--accent)]">{groupedReservations[date]?.length || 0}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(groupedReservations[date] || []).slice(0, 5).map((reservation: Reservation, index: number) => (
                      <div
                        key={reservation.id}
                        onClick={() => {
                          setSelectedReservation(reservation)
                          setAdminNotes(reservation.admin_notes || '')
                          setTableNumber(reservation.table_number || '')
                        }}
                        className="cursor-pointer rounded-lg border border-theme bg-[rgba(255,255,255,0.02)] p-3 transition-all hover:border-theme-medium hover:bg-[rgba(255,255,255,0.05)]"
                        data-animate="fade-rise"
                        data-animate-active="false"
                        style={{ transitionDelay: `${index * 70}ms` }}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--text-main)]">{reservation.customer_name}</p>
                            <p className="text-xs text-muted">{reservation.reservation_time}</p>
                          </div>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {reservation.party_size}
                          </span>
                          {reservation.table_number && (
                            <span className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              {reservation.table_number}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(groupedReservations[date]?.length || 0) > 5 && (
                      <button className="w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.02)] py-2 text-xs font-medium text-muted transition-all hover:bg-[rgba(255,255,255,0.05)]">
                        +{(groupedReservations[date]?.length || 0) - 5} more
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {Object.keys(groupedReservations).sort().map((date, index) => (
              <div
                key={date}
                className="glow-surface glow-soft overflow-hidden rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)]"
                data-animate="fade-scale"
                data-animate-active="false"
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <div className="border-b border-theme bg-[rgba(255,255,255,0.04)] px-6 py-3">
                  <h3 className="font-semibold">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-theme bg-[rgba(255,255,255,0.03)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">Party Size</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">Table</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {(groupedReservations[date] || []).map((reservation: Reservation) => (
                        <tr key={reservation.id} className="transition hover:bg-[rgba(255,255,255,0.04)]">
                          <td className="px-6 py-4 font-medium">
                            {reservation.reservation_time}
                          </td>
                          <td className="px-6 py-4">
                            {reservation.customer_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            <div>{reservation.customer_email}</div>
                            <div>{reservation.customer_phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
                          </td>
                          <td className="px-6 py-4">
                            {reservation.table_number || '-'}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(reservation.status)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setAdminNotes(reservation.admin_notes || '')
                                setTableNumber(reservation.table_number || '')
                              }}
                              className="font-medium text-[var(--accent)] transition hover:opacity-80"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReservation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--modal-backdrop)'
          }}
          onClick={() => setSelectedReservation(null)}
        >
          <div
            data-overlay-scroll
            className="glow-surface glow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-theme bg-[var(--bg-main)]"
            style={{
              boxShadow: 'var(--modal-shadow)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <h2 className="text-2xl font-semibold">Manage Reservation</h2>
                <button
                  onClick={() => {
                    setSelectedReservation(null)
                    setAdminNotes('')
                    setTableNumber('')
                    setModalTab('details')
                  }}
                  className="text-muted transition hover:text-[var(--text-main)]"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex gap-2 border-b border-theme">
                <button
                  onClick={() => setModalTab('details')}
                  className={`pb-3 px-4 text-sm font-medium transition-all ${
                    modalTab === 'details'
                      ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                      : 'text-muted hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Details
                  </div>
                </button>
                <button
                  onClick={() => setModalTab('history')}
                  className={`pb-3 px-4 text-sm font-medium transition-all ${
                    modalTab === 'history'
                      ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                      : 'text-muted hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Customer History
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              {modalTab === 'history' ? (
                <CustomerHistory customerEmail={selectedReservation.customer_email || ''} />
              ) : (
                <div>
                  {/* Conflict Warning */}
                  {getConflicts(selectedReservation).length > 0 && (
                    <div className="mb-6 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold text-orange-300">Time Conflict Detected</p>
                          <p className="mt-1 text-sm text-orange-200/80">
                            {getConflicts(selectedReservation).length} other reservation(s) at the same time:
                          </p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {getConflicts(selectedReservation).map(conflict => (
                              <li key={conflict.id} className="text-orange-200/70">
                                • {conflict.customer_name} - {conflict.party_size} guests {conflict.table_number && `(Table ${conflict.table_number})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted">Customer</p>
                        <p className="font-medium text-[var(--text-main)]">{selectedReservation.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted">Status</p>
                        {getStatusBadge(selectedReservation.status)}
                      </div>
                      <div>
                        <p className="text-sm text-muted">Date &amp; Time</p>
                        <p className="font-medium text-[var(--text-main)]">
                          {new Date(selectedReservation.reservation_date + 'T00:00:00').toLocaleDateString()} at {selectedReservation.reservation_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted">Party Size</p>
                        <p className="font-medium text-[var(--text-main)]">{selectedReservation.party_size} guests</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted">Email</p>
                        <p className="font-medium text-[var(--text-main)]">{selectedReservation.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted">Phone</p>
                        <p className="font-medium text-[var(--text-main)]">{selectedReservation.customer_phone}</p>
                      </div>
                    </div>

                    {selectedReservation.special_requests && (
                      <div>
                        <p className="text-sm font-medium text-muted">Special Requests</p>
                        <p className="mt-1 rounded-lg bg-[rgba(255,255,255,0.05)] p-3 text-sm text-[var(--text-main)]">{String(selectedReservation.special_requests || '')}</p>
                      </div>
                    )}

                    {selectedReservation.admin_notes && selectedReservation.admin_notes !== adminNotes && (
                      <div>
                        <p className="text-sm font-medium text-muted">Previous Admin Notes</p>
                        <p className="mt-1 rounded-lg bg-[rgba(255,255,255,0.05)] p-3 text-sm text-muted">{selectedReservation.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm sm:text-base font-medium text-muted">Assign Table Number</label>
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="input-themed w-full min-h-[44px] rounded-xl sm:rounded-2xl border px-4 sm:px-6 py-3 focus:border-transparent focus:ring-2 focus:ring-[var(--accent)] placeholder:text-muted text-sm sm:text-base"
                        placeholder="e.g., T12, Window 5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm sm:text-base font-medium text-muted">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="input-themed w-full min-h-[44px] resize-none rounded-xl sm:rounded-2xl border px-4 sm:px-6 py-3 focus:border-transparent focus:ring-2 focus:ring-[var(--accent)] placeholder:text-muted text-sm sm:text-base"
                        placeholder="Internal notes or message to customer..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {selectedReservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReservationStatus(selectedReservation.id, 'confirmed', adminNotes, tableNumber)}
                          className="rounded-xl sm:rounded-2xl bg-emerald-600 min-h-[44px] py-3 font-medium text-black transition hover:bg-emerald-500 text-sm sm:text-base"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateReservationStatus(selectedReservation.id, 'declined', adminNotes)}
                          className="rounded-xl sm:rounded-2xl bg-red-600 min-h-[44px] py-3 font-medium text-black transition hover:bg-red-500 text-sm sm:text-base"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {selectedReservation.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateReservationStatus(selectedReservation.id, 'completed', adminNotes, tableNumber)}
                          className="rounded-xl sm:rounded-2xl bg-[var(--accent)] min-h-[44px] py-3 font-medium text-black transition hover:opacity-90 text-sm sm:text-base"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => updateReservationStatus(selectedReservation.id, 'no_show', adminNotes)}
                          className="rounded-xl sm:rounded-2xl bg-orange-600 min-h-[44px] py-3 font-medium text-black transition hover:bg-orange-500 text-sm sm:text-base"
                        >
                          No Show
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => confirmDelete(selectedReservation.id)}
                      className="sm:col-span-2 rounded-xl sm:rounded-2xl border border-red-500/30 bg-red-500/10 min-h-[44px] py-3 font-medium text-red-300 transition hover:bg-red-500/20 hover:border-red-500/50 text-sm sm:text-base"
                    >
                      Delete Reservation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--modal-backdrop)'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[var(--bg-main)] p-6"
            style={{
              boxShadow: isLightTheme 
                ? '0 40px 90px -65px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                : '0 40px 90px -65px rgba(239, 68, 68, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-main)]">Delete Reservation</h3>
                <p className="text-sm text-muted">This action cannot be undone</p>
              </div>
            </div>

            <p className="mb-6 text-sm text-muted">
              Are you sure you want to permanently delete this reservation? All associated data will be removed from the system.
            </p>

            <div className="flex gap-3 sm:gap-4 md:gap-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setReservationToDelete(null)
                }}
                className="flex-1 rounded-xl sm:rounded-2xl border border-theme bg-[rgba(255,255,255,0.05)] min-h-[44px] py-3 font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,255,255,0.1)] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={deleteReservation}
                className="flex-1 rounded-xl sm:rounded-2xl bg-red-600 min-h-[44px] py-3 font-medium text-black transition hover:bg-red-500 text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" 
          data-overlay-scroll
          style={{
            backgroundColor: 'var(--modal-backdrop)'
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="app-container my-8 rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-main)]"
            style={{
              boxShadow: isLightTheme 
                ? '0 40px 90px -65px rgba(197, 157, 95, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                : '0 40px 90px -65px rgba(197, 157, 95, 0.5)'
            }}
            data-animate="fade-scale"
            data-animate-active="false"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-theme bg-[rgba(5,5,9,0.95)] p-6 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">⚙️ Reservation Settings</h2>
                <p className="text-sm text-muted mt-1">Configure how customers can make reservations</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-2 text-muted transition hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-main)]"
                title="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div data-overlay-scroll className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto hide-scrollbar">
              <AdminReservationSettings />
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <div
          className="fixed inset-0 z-[99998] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-modal-title"
          onClick={() => setShowCalendarModal(false)}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }}
        >
          <m.div
            className="relative w-full h-full max-w-[95vw] max-h-[95vh] rounded-2xl border border-theme bg-[var(--bg-main)] shadow-2xl z-[99999] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-theme bg-[rgba(5,5,9,0.95)] p-4 backdrop-blur-sm flex-shrink-0">
              <div>
                <h2 id="calendar-modal-title" className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendar View
                </h2>
                <p className="text-xs text-muted mt-0.5">Select a date to view reservation details</p>
              </div>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="rounded-lg p-2 text-muted transition hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-main)]"
                title="Close"
                aria-label="Close calendar modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Split View: Calendar Left, Details Right */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Left Side - Calendar */}
              <div className="flex-1 lg:flex-[0_0_50%] p-4 sm:p-6 overflow-y-auto hide-scrollbar border-r-0 lg:border-r border-theme flex items-center justify-center">
                <Calendar
                  {...({ value: selectedCalendarDate, onChange: setSelectedCalendarDate } as any)}
                />
              </div>

              {/* Right Side - Reservation Details */}
              <div className="flex-1 lg:flex-[0_0_50%] p-4 sm:p-6 overflow-y-auto hide-scrollbar">
                {(() => {
                  // Convert CalendarDate to YYYY-MM-DD string
                  const selectedDateStr = `${selectedCalendarDate.year}-${String(selectedCalendarDate.month).padStart(2, '0')}-${String(selectedCalendarDate.day).padStart(2, '0')}`
                  const dayReservations = groupedReservations[selectedDateStr] || []
                  
                  // Convert CalendarDate to Date for formatting
                  const selectedDate = new Date(selectedCalendarDate.year, selectedCalendarDate.month - 1, selectedCalendarDate.day)
                  
                  return (
                    <div className="h-full flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <p className="text-sm text-muted">
                          {dayReservations.length === 0 
                            ? 'No reservations for this date'
                            : `${dayReservations.length} reservation${dayReservations.length > 1 ? 's' : ''}`
                          }
                        </p>
                      </div>

                      {dayReservations.length > 0 ? (
                        <div className="space-y-3 flex-1">
                          {dayReservations.map((reservation: Reservation) => (
                            <div
                              key={reservation.id}
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setAdminNotes(reservation.admin_notes || '')
                                setTableNumber(reservation.table_number || '')
                                setShowCalendarModal(false)
                              }}
                              className="cursor-pointer rounded-xl border border-theme bg-[rgba(255,255,255,0.02)] p-4 transition-all hover:border-theme-medium hover:bg-[rgba(255,255,255,0.05)] hover:shadow-lg"
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1">
                                  <p className="text-base font-semibold text-[var(--text-main)] mb-1">
                                    {reservation.customer_name}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                                    <span className="flex items-center gap-1.5">
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {reservation.reservation_time}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      Party of {reservation.party_size}
                                    </span>
                                    {reservation.table_number && (
                                      <span className="flex items-center gap-1.5">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Table {reservation.table_number}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {getStatusBadge(reservation.status)}
                              </div>
                              {reservation.special_requests && (
                                <div className="mt-3 pt-3 border-t border-theme">
                                  <p className="text-xs text-muted mb-1">Special Requests:</p>
                                  <p className="text-sm text-[var(--text-main)]">{String(reservation.special_requests || '')}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="h-16 w-16 mx-auto mb-4 text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-muted text-sm">No reservations scheduled for this date</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </m.div>
        </div>
        )}
      </AnimatePresence>
    </m.main>
  )
}

export default AdminReservations
