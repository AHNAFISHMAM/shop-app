import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import GlowPanel from '../ui/GlowPanel'
import { logger } from '../../utils/logger'

/**
 * Waitlist Manager Component
 * Manage walk-in customers waiting for tables
 */
function WaitlistManager() {
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

  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEntry, setNewEntry] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    special_requests: '',
    is_priority: false
  })

  useEffect(() => {
    fetchWaitlist()

    // Set up real-time subscription
    const channel = supabase
      .channel('waitlist-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist'
        },
        () => {
          fetchWaitlist()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchWaitlist = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .in('status', ['waiting', 'notified'])
        .order('is_priority', { ascending: false })
        .order('added_at', { ascending: true })

      if (error) throw error
      setWaitlist(data || [])
    } catch (err) {
      logger.error('Error fetching waitlist:', err)
      // Silently fail if table doesn't exist yet
    } finally {
      setLoading(false)
    }
  }

  const addToWaitlist = async () => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{
          ...newEntry,
          estimated_wait_time: 30, // Default 30 mins
          status: 'waiting'
        }])

      if (error) throw error

      toast.success('Added to waitlist')
      setShowAddModal(false)
      setNewEntry({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        party_size: 2,
        special_requests: '',
        is_priority: false
      })
      fetchWaitlist()
    } catch (err) {
      logger.error('Error adding to waitlist:', err)
      toast.error('Failed to add to waitlist')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const updates = { status }
      if (status === 'notified') {
        updates.notified_at = new Date().toISOString()
      } else if (status === 'seated') {
        updates.seated_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('waitlist')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast.success(`Marked as ${status}`)
      fetchWaitlist()
    } catch (err) {
      logger.error('Error updating status:', err)
      toast.error('Failed to update status')
    }
  }

  const removeFromWaitlist = async (id) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Removed from waitlist')
      fetchWaitlist()
    } catch (err) {
      logger.error('Error removing from waitlist:', err)
      toast.error('Failed to remove from waitlist')
    }
  }

  const getWaitTime = (addedAt) => {
    const minutes = Math.floor((new Date() - new Date(addedAt)) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''}`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  return (
    <GlowPanel glow="soft" padding="p-6" background="bg-[rgba(255,255,255,0.02)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[var(--text-main)]">Waitlist</h3>
          <p className="text-sm text-muted">
            {waitlist.length} {waitlist.length === 1 ? 'party' : 'parties'} waiting
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black transition-all hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add to Waitlist
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-[var(--accent)]"></div>
        </div>
      ) : waitlist.length === 0 ? (
        <div className="py-12 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-muted">No one is waiting</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlist.map((entry, index) => (
            <GlowPanel
              glow="soft"
              key={entry.id}
              radius="rounded-lg"
              padding="p-4"
              background="bg-[rgba(255,255,255,0.03)]"
              className="flex items-center gap-4 transition-all hover:border-theme-medium"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20">
                <span className="font-bold text-[var(--accent)]">#{index + 1}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[var(--text-main)]">{entry.customer_name}</p>
                  {entry.is_priority && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                      Priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">
                  {entry.party_size} {entry.party_size === 1 ? 'guest' : 'guests'} • {entry.customer_phone}
                  {entry.special_requests && ` • ${entry.special_requests}`}
                </p>
                <p className="text-xs text-muted">Waiting: {getWaitTime(entry.added_at)}</p>
              </div>

              <div className="flex gap-2">
                {entry.status === 'waiting' && (
                  <button
                    onClick={() => updateStatus(entry.id, 'notified')}
                    className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/20"
                  >
                    Notify
                  </button>
                )}
                <button
                  onClick={() => updateStatus(entry.id, 'seated')}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  Seat
                </button>
                <button
                  onClick={() => removeFromWaitlist(entry.id)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Remove
                </button>
              </div>
            </GlowPanel>
          ))}
        </div>
      )}

      {/* Add to Waitlist Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl border border-theme p-6"
            style={{
              backgroundColor: isLightTheme 
                ? 'rgba(255, 255, 255, 0.95)' 
                : 'rgba(5, 5, 9, 0.95)',
              boxShadow: isLightTheme 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-xl font-semibold">Add to Waitlist</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted">Name *</label>
                <input
                  type="text"
                  value={newEntry.customer_name}
                  onChange={(e) => setNewEntry({ ...newEntry, customer_name: e.target.value })}
                  className="input-themed w-full rounded-lg border px-4 py-2"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">Phone *</label>
                <input
                  type="tel"
                  value={newEntry.customer_phone}
                  onChange={(e) => setNewEntry({ ...newEntry, customer_phone: e.target.value })}
                  className="input-themed w-full rounded-lg border px-4 py-2"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">Email (optional)</label>
                <input
                  type="email"
                  value={newEntry.customer_email}
                  onChange={(e) => setNewEntry({ ...newEntry, customer_email: e.target.value })}
                  className="input-themed w-full rounded-lg border px-4 py-2"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">Party Size *</label>
                <input
                  type="number"
                  min="1"
                  value={newEntry.party_size}
                  onChange={(e) => setNewEntry({ ...newEntry, party_size: parseInt(e.target.value) })}
                  className="input-themed w-full rounded-lg border px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">Special Requests</label>
                <textarea
                  value={newEntry.special_requests}
                  onChange={(e) => setNewEntry({ ...newEntry, special_requests: e.target.value })}
                  rows={2}
                  className="input-themed w-full resize-none rounded-lg border px-4 py-2"
                  placeholder="Any special requests..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="priority"
                  checked={newEntry.is_priority}
                  onChange={(e) => setNewEntry({ ...newEntry, is_priority: e.target.checked })}
                  className="h-4 w-4 rounded border-theme"
                />
                <label htmlFor="priority" className="text-sm text-muted">Mark as priority</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] py-2 font-medium transition hover:bg-[rgba(255,255,255,0.1)]"
              >
                Cancel
              </button>
              <button
                onClick={addToWaitlist}
                disabled={!newEntry.customer_name || !newEntry.customer_phone}
                className="flex-1 rounded-lg bg-[var(--accent)] py-2 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </GlowPanel>
  )
}

export default WaitlistManager
