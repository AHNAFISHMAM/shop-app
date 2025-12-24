import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useRef, ReactNode } from 'react'

interface AdminFullPageLayoutProps {
  children: ReactNode
  backPath?: string
  title?: string
}

/**
 * AdminFullPageLayout Component
 *
 * Minimal layout for full-page admin views without sidebar or navbar.
 * Provides a back button to return to the admin dashboard.
 * Best practice: Use for content-heavy pages that need maximum screen space.
 */
function AdminFullPageLayout({
  children,
  backPath = '/admin',
  title = 'Admin',
}: AdminFullPageLayoutProps): JSX.Element {
  const navigate = useNavigate()
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)

  // Prevent scroll events from bubbling to window
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // Prevent scroll bubbling from scrollable children
      const target = e.target as HTMLElement
      const scrollableParent = target.closest(
        '[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]'
      )
      if (scrollableParent) {
        // Check if element is actually scrollable (not just overflow-hidden)
        const style = window.getComputedStyle(scrollableParent)
        const isScrollable =
          scrollableParent.scrollHeight > scrollableParent.clientHeight &&
          (style.overflow === 'auto' ||
            style.overflow === 'scroll' ||
            style.overflowY === 'auto' ||
            style.overflowY === 'scroll')
        if (isScrollable) {
          e.stopPropagation()
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const scrollableParent = target.closest(
        '[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]'
      )
      if (scrollableParent) {
        // Check if element is actually scrollable (not just overflow-hidden)
        const style = window.getComputedStyle(scrollableParent)
        const isScrollable =
          scrollableParent.scrollHeight > scrollableParent.clientHeight &&
          (style.overflow === 'auto' ||
            style.overflow === 'scroll' ||
            style.overflowY === 'auto' ||
            style.overflowY === 'scroll')
        if (isScrollable) {
          e.stopPropagation()
        }
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--bg-main)]"
      onWheel={e => {
        const target = e.target as HTMLElement
        const scrollableParent = target.closest(
          '[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]'
        )
        if (scrollableParent) {
          // Check if element is actually scrollable (not just overflow-hidden)
          const style = window.getComputedStyle(scrollableParent)
          const isScrollable =
            scrollableParent.scrollHeight > scrollableParent.clientHeight &&
            (style.overflow === 'auto' ||
              style.overflow === 'scroll' ||
              style.overflowY === 'auto' ||
              style.overflowY === 'scroll')
          if (isScrollable) {
            e.stopPropagation()
          }
        }
      }}
      onTouchMove={e => {
        const target = e.target as HTMLElement
        const scrollableParent = target.closest(
          '[data-overlay-scroll], .custom-scrollbar, [data-scroll-overlay]'
        )
        if (scrollableParent) {
          // Check if element is actually scrollable (not just overflow-hidden)
          const style = window.getComputedStyle(scrollableParent)
          const isScrollable =
            scrollableParent.scrollHeight > scrollableParent.clientHeight &&
            (style.overflow === 'auto' ||
              style.overflow === 'scroll' ||
              style.overflowY === 'auto' ||
              style.overflowY === 'scroll')
          if (isScrollable) {
            e.stopPropagation()
          }
        }
      }}
    >
      {/* Minimal Header with Back Button */}
      <header className="sticky top-0 z-40 border-b border-theme bg-[var(--bg-main)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => navigate(backPath)}
              className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] min-h-[44px]"
              aria-label="Back to dashboard"
            >
              <svg
                className="h-5 w-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>

            {/* Title */}
            <h1 className="text-lg font-semibold text-[var(--text-main)] sm:text-xl">{title}</h1>

            {/* User Info (Optional) */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-xs text-muted">Logged in as</div>
                  <div className="text-sm font-medium text-[var(--text-main)]">{user.email}</div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-semibold text-[var(--accent)]">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}

export default AdminFullPageLayout
