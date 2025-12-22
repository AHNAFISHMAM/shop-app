import { useCallback, useEffect, useMemo, useState, ChangeEvent } from 'react'
import { fetchAdminFavoriteReviews } from '../../lib/reviewsApi'
import { supabase } from '../../lib/supabase'
import { logger } from '../../utils/logger'
import CustomDropdown from '../../components/ui/CustomDropdown'

interface Comment {
  id: string;
  review_text?: string;
  created_at?: string;
  user_id?: string;
  menu_items?: {
    name?: string;
    image_url?: string;
  };
  products?: {
    name?: string;
  };
  favorite_target_label?: string;
  favorite_is_general?: boolean;
  menu_item_id?: string;
  product_id?: string;
  customer?: {
    full_name?: string;
    email?: string;
  };
  review_images?: string[];
}

interface Stats {
  total: number;
  timeframeCount: number;
  uniqueUsers: number;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function AdminFavoriteComments(): JSX.Element {
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, timeframeCount: 0, uniqueUsers: 0 })
  const [timeframe, setTimeframe] = useState('current')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [verifying, setVerifying] = useState(true)

  const checkAdminStatus = useCallback(async (): Promise<void> => {
    setVerifying(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Log in to access admin tools.')
        setIsAdmin(false)
        return
      }

      const { data, error: customerError } = await supabase
        .from('customers')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (customerError || !data?.is_admin) {
        setError('Access denied. Administrator role required.')
        setIsAdmin(false)
        return
      }

      setIsAdmin(true)
      setError('')
    } catch (err) {
      logger.error(err)
      setError('Unable to verify admin permissions.')
      setIsAdmin(false)
    } finally {
      setVerifying(false)
    }
  }, [])

  const loadComments = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError('')
    const result = await fetchAdminFavoriteReviews({ timeframe })
    if (result.success) {
      setComments(result.data as Comment[])
      setStats(result.stats as Stats)
    } else {
      setError(result.error?.message || 'Failed to load favorite comments.')
      setComments([])
      setStats({ total: 0, timeframeCount: 0, uniqueUsers: 0 })
    }
    setLoading(false)
  }, [timeframe])

  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  useEffect(() => {
    if (isAdmin) {
      loadComments()
    }
  }, [isAdmin, loadComments])

  useEffect(() => {
    if (!isAdmin) return
    const channel = supabase
      .channel('admin-favorite-reviews')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_reviews',
          filter: 'source=eq.favorite'
        },
        () => loadComments()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, loadComments])

  const filteredComments = useMemo((): Comment[] => {
    if (!search.trim()) return comments
    const query = search.toLowerCase()
    return comments.filter(comment => {
      const text = comment.review_text?.toLowerCase() || ''
      const dish = comment.menu_items?.name?.toLowerCase()
        || comment.products?.name?.toLowerCase()
        || comment.favorite_target_label?.toLowerCase()
        || ''
      const email = comment.customer?.email?.toLowerCase() || ''
      return text.includes(query) || dish.includes(query) || email.includes(query)
    })
  }, [comments, search])

  if (verifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        Checking admin permissions…
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-[var(--text-main)] shadow-[0_25px_60px_-45px_rgba(248,113,113,0.6)]">
        <h2 className="text-2xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-sm text-red-200">{error}</p>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-8 text-[var(--text-main)]">
      <header className="glow-surface glow-soft flex flex-col gap-4 rounded-2xl border border-theme bg-[rgba(255,255,255,0.03)] px-6 py-6 shadow-[0_35px_65px_-55px_rgba(197,157,95,0.65)] md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Community Signal</p>
          <h1 className="text-3xl font-semibold">Favorite Comments</h1>
          <p className="text-sm text-muted">Monitor monthly feedback on starred dishes, review imagery, and keep engagement professional.</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <CustomDropdown
            options={[
              { value: 'current', label: 'Current month' },
              { value: 'last-90', label: 'Last 90 days' },
              { value: 'all', label: 'All time' }
            ]}
            value={timeframe}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setTimeframe(event.target.value)}
            placeholder="Current month"
            maxVisibleItems={5}
          />
          <button
            onClick={loadComments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-theme bg-[rgba(255,255,255,0.02)] px-4 py-2 text-sm font-medium text-muted transition hover:border-theme-medium hover:text-[var(--text-main)] disabled:opacity-50"
          >
            {loading && (
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"></span>
            )}
            Refresh
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Comments</p>
          <p className="mt-2 text-3xl font-semibold">{stats.timeframeCount}</p>
          <p className="text-xs text-muted mt-1">Entries in selected window</p>
        </article>
        <article className="rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">All-time</p>
          <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
          <p className="text-xs text-muted mt-1">Historical submissions captured</p>
        </article>
        <article className="rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Unique Commenters</p>
          <p className="mt-2 text-3xl font-semibold">{stats.uniqueUsers}</p>
          <p className="text-xs text-muted mt-1">Distinct customers represented</p>
        </article>
      </section>

      <section className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(5,5,9,0.92)] p-6 shadow-[0_30px_70px_-55px_rgba(5,5,9,0.8)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
            placeholder="Search comments, dishes, or customer email"
            className="input-themed w-full rounded-xl border px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--accent)]/70 md:w-96"
          />
          <span className="text-xs text-muted">
            Showing {filteredComments.length} of {comments.length}
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-theme">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted">Loading favorite comments…</div>
          ) : filteredComments.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">No favorite comments match this view.</div>
          ) : (
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[rgba(255,255,255,0.03)] text-left text-xs uppercase tracking-[0.18em] text-[var(--text-main)]/40">
                <tr>
                  <th className="px-6 py-3">Dish</th>
                  <th className="px-6 py-3">Comment</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Images</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredComments.map((comment) => {
                  const product = comment.menu_items
                  const image = comment.menu_items?.image_url
                  const title = comment.favorite_target_label || product?.name || 'General Feedback'
                  const typeLabel = comment.favorite_is_general
                    ? 'General'
                    : comment.menu_item_id
                      ? 'Menu Item'
                      : comment.product_id
                        ? 'Product'
                        : 'General'
                  return (
                    <tr key={comment.id} className="text-sm">
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-3">
                          {image && (
                            <img
                              src={image}
                              alt={title}
                              className="h-12 w-12 rounded-lg border border-theme object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-[var(--text-main)]">{title}</p>
                            <p className="text-xs text-muted">{typeLabel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="text-[var(--text-main)]">{comment.review_text}</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="text-sm text-[var(--text-main)]">
                          {comment.customer?.full_name || comment.customer?.email || comment.user_id?.slice(0, 8)}
                        </div>
                        {comment.customer?.email && (
                          <div className="text-xs text-muted">{comment.customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        {comment.review_images?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {comment.review_images.map(url => (
                              <button
                                key={url}
                                type="button"
                                className="h-14 w-14 overflow-hidden rounded-lg border border-theme"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <img src={url} alt="Attachment" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-xs text-muted whitespace-nowrap">
                        {formatDate(comment.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminFavoriteComments

