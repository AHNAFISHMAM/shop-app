import { Link } from 'react-router-dom'
import GlowPanel from '../ui/GlowPanel'

/**
 * Quick Actions Component
 * Displays prominent action buttons for common admin tasks
 *
 * Features:
 * - Gradient hover effects
 * - Icon animations
 * - Dark Luxe styling
 * - Direct navigation to key pages
 */
function QuickActions() {
  const actions = [
    {
      label: 'Add Dish',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      link: '/admin/menu-items',
      description: 'Create new menu item',
      color: '#C59D5F'
    },
    {
      label: 'View Orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      link: '/admin/orders',
      description: 'Manage customer orders',
      color: '#4ade80'
    },
    {
      label: 'Reservations',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: '/admin/reservations',
      description: 'Check table bookings',
      color: '#60a5fa'
    },
    {
      label: 'Appearance',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      link: '/admin/appearance',
      description: 'Customize theme & backgrounds',
      color: '#f472b6'
    },
    {
      label: 'Settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: '/admin/settings',
      description: 'Configure store',
      color: '#a78bfa'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {actions.map((action, index) => (
        <GlowPanel
          glow="soft"
          key={action.label}
          as={Link}
          to={action.link}
          radius="rounded-xl"
          padding="p-5"
          className="group relative overflow-hidden backdrop-blur-xl transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] focus-visible:ring-[rgba(197,157,95,0.6)]"
          data-animate="fade-rise"
          data-animate-active="false"
          style={{ animationDelay: `${400 + index * 100}ms` }}
        >
          {/* Gradient overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${action.color}15, transparent)`
            }}
          />

          {/* Border glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-xl pointer-events-none transition-opacity duration-300"
            style={{
              borderColor: `${action.color}30`,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          />

          <div className="relative flex flex-col items-center text-center space-y-3">
            {/* Icon */}
            <div
              className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
              style={{
                backgroundColor: `${action.color}20`,
                color: action.color
              }}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                {action.icon}
              </div>
            </div>

            {/* Label */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>
                {action.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-body-muted-light)' }}>
                {action.description}
              </p>
            </div>

            {/* Arrow indicator */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <svg className="w-4 h-4" style={{ color: action.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </GlowPanel>
      ))}
    </div>
  )
}

export default QuickActions
