import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { supabase } from '../lib/supabase'
import { resolveReferralInfo } from '../lib/loyaltyUtils'
import { logger } from '../utils/logger'

const ProfileDropdown = () => {
  const { user, signOut, loading, isAdmin } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()
  
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

  const [open, setOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [profile, setProfile] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, width: 0 })
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuItemRefs = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const buttonId = useMemo(() => user?.id ? `profile-menu-button-${user.id}` : 'profile-menu-button', [user?.id])
  const menuId = useMemo(() => user?.id ? `profile-menu-${user.id}` : 'profile-menu', [user?.id])
  
  // Feature flags
  const enableLoyalty = settingsLoading ? false : (settings?.enable_loyalty_program ?? true)

  // Handle animation state for smooth enter/exit
  useEffect(() => {
    if (open) {
      // Start with hidden state, then animate in
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, 10)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
    }
  }, [open])

  // Calculate dropdown position
  useEffect(() => {
    if (!open || !buttonRef.current) return

    const updatePosition = () => {
      if (!buttonRef.current) return

      const rect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const dropdownWidth = 256 // w-64 = 16rem = 256px
      const dropdownHeight = 300 // approximate max height
      const gap = 12 // mt-3 = 12px
      
      let right = viewportWidth - rect.right
      let top = rect.bottom + gap
      
      // Adjust if dropdown would overflow right
      if (right < 16) {
        right = Math.max(16, viewportWidth - rect.right - (rect.right - rect.left) / 2)
      }
      
      // Adjust if dropdown would overflow bottom
      if (top + dropdownHeight > viewportHeight - 16) {
        top = rect.top - dropdownHeight - gap
        // If still doesn't fit, position below but allow scrolling
        if (top < 16) {
          top = rect.bottom + gap
        }
      }
      
      setDropdownPosition({
        top,
        right: Math.max(12, right),
        width: Math.min(dropdownWidth, viewportWidth - 32)
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  // Handle click outside and escape key
  useEffect(() => {
    if (!open) return

    const handleClick = (event) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(event.target)
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target)
      
      if (isOutsideButton && isOutsideMenu) {
        setOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClick, true)
    document.addEventListener('keydown', handleEscape, true)

    return () => {
      document.removeEventListener('mousedown', handleClick, true)
      document.removeEventListener('keydown', handleEscape, true)
    }
  }, [open])

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown on user change or navigation
  useEffect(() => {
    setOpen(false)
  }, [user?.id, location.pathname])
  useEffect(() => {
    if (!open) {
      menuItemRefs.current = []
      return
    }

    const focusTimer = setTimeout(() => {
      const items = menuItemRefs.current.filter(Boolean)
      items[0]?.focus()
    }, 0)

    return () => clearTimeout(focusTimer)
  }, [open])

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      return
    }

    let isMounted = true

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          logger.error('Error fetching profile:', error)
        }

        if (isMounted) {
          setProfile(data || null)
        }
      } catch (error) {
        logger.error('Error in fetchProfile:', error)
        if (isMounted) {
          setProfile(null)
        }
      }
    }

    fetchProfile()

    const channel = supabase
      .channel(`profile-dropdown-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          setProfile(payload.new || payload.old || null)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const displayName = useMemo(() => {
    if (!user) return ''
    const profileName = profile?.full_name?.trim()
    if (profileName) return profileName

    const metadataName = user.user_metadata?.full_name?.trim()
    if (metadataName) return metadataName

    if (user.email) {
      const [emailName] = user.email.split('@')
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }

    return 'Guest'
  }, [user, profile])

  const initials = useMemo(() => {
    if (!user) return 'GU'

    const profileName = profile?.full_name?.trim()
    if (profileName) {
      const parts = profileName.split(/\s+/).filter(Boolean)
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
    }

    const metadataName = user.user_metadata?.full_name?.trim()
    if (metadataName) {
      const parts = metadataName.split(/\s+/).filter(Boolean)
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase()
      }
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
    }

    if (user.email) {
      const [emailName] = user.email.split('@')
      return emailName.slice(0, 2).toUpperCase()
    }

    return 'GU'
  }, [user, profile])

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      setOpen(false)
      navigate('/')
    }
  }

  const handleMenuKeyDown = useCallback((event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

    const items = menuItemRefs.current.filter(Boolean)
    if (!items.length) return

    event.preventDefault()
    const currentIndex = items.indexOf(document.activeElement)

    if (event.key === 'ArrowDown') {
      const next = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length
      items[next]?.focus()
    } else if (event.key === 'ArrowUp') {
      const prev = currentIndex <= 0 ? items.length - 1 : currentIndex - 1
      items[prev]?.focus()
    } else if (event.key === 'Home') {
      items[0]?.focus()
    } else if (event.key === 'End') {
      items[items.length - 1]?.focus()
    }
  }, [])

  const assignMenuItemRef = useCallback((index) => (element) => {
    menuItemRefs.current[index] = element
  }, [])

  const referral = useMemo(() => {
    if (!enableLoyalty || !user) return null
    return resolveReferralInfo(user)
  }, [user, enableLoyalty])

  const handleReferralShare = useCallback(async () => {
    if (!user || !enableLoyalty) {
      toast.error('Sign in to share your referral link.')
      return
    }

    const { shareUrl, code } = resolveReferralInfo(user)

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Star Café Invite',
          text: 'Use my Star Café invite link to unlock bonus treats on your first visit.',
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard?.writeText(shareUrl)
      toast.success('Referral link copied!')
    } catch (error) {
      logger.error('Failed to share referral link:', error)
      try {
        await navigator.clipboard?.writeText(`${shareUrl} (Code: ${code})`)
        toast.success('Copied invite link.')
      } catch (clipboardError) {
        logger.error('Clipboard write failed:', clipboardError)
        toast.error('Unable to copy invite link right now.')
      }
    }
  }, [user, enableLoyalty])

  const menuItems = useMemo(() => {
    if (!user) return []

    const items = [
      { key: 'home', label: 'Home', to: '/' },
      { key: 'orders', label: 'Order History', to: '/order-history' },
      { key: 'addresses', label: 'Saved Addresses', to: '/addresses' },
    ]
    
    if (enableLoyalty && referral) {
      items.push({ key: 'referral', label: 'Share Referral', onClick: handleReferralShare, badge: referral.code })
    }

    // Check both context isAdmin AND persisted sessionStorage status as fallback
    // This ensures button shows even if context hasn't updated yet
    const getPersistedAdminStatus = () => {
      if (typeof window === 'undefined' || !user?.id) return false
      try {
        const stored = sessionStorage.getItem(`admin_status_${user.id}`)
        return stored === 'true'
      } catch {
        return false
      }
    }
    
    const persistedAdminStatus = getPersistedAdminStatus()
    const shouldShowAdmin = isAdmin || persistedAdminStatus

    // Only log admin check in development and only once per session
    if (user?.id && import.meta.env.DEV && !sessionStorage.getItem('admin_check_logged')) {
      logger.log('ProfileDropdown Admin Check:', {
        userId: user.id,
        isAdminFromContext: isAdmin,
        persistedAdminStatus,
        shouldShowAdmin,
        sessionStorageKey: `admin_status_${user.id}`
      })
      sessionStorage.setItem('admin_check_logged', 'true')
    }

    if (shouldShowAdmin) {
      items.push({ key: 'admin', label: 'Admin Dashboard', to: '/admin' })
    }

    return items
  }, [user, isAdmin, enableLoyalty, referral, handleReferralShare])

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center w-10 h-10 rounded-full border border-theme"
        style={{
          backgroundColor: isLightTheme
            ? 'rgba(0, 0, 0, 0.04)'
            : 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <svg className="w-4 h-4 text-[var(--text-main)]/50 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8" />
        </svg>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link to="/login" className="text-sm uppercase tracking-wide text-muted hover:text-[var(--text-main)] transition-colors">
          Log In
        </Link>
        <Link to="/signup" className="text-sm uppercase tracking-wide text-black bg-accent px-4 py-2 rounded-full hover:bg-white transition-colors">
          Sign Up
        </Link>
      </div>
    )
  }

  const renderDropdown = () => {
    if (!open || !mounted) return null

    const dropdownContent = (
      <>
        {/* Backdrop for mobile - subtle */}
        <div
          className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-[2px] md:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
          style={{
            opacity: isAnimating ? 1 : 0
          }}
        />
        
        {/* Dropdown Menu - See-through glass effect */}
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className={`fixed z-[101] rounded-2xl border py-2 text-[var(--text-main)] backdrop-blur-xl transition-all duration-200 ease-out ${
            isAnimating 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 -translate-y-2'
          }`}
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            // See-through background that adapts to theme - professional glassmorphism
            backgroundColor: isLightTheme
              ? 'rgba(255, 255, 255, 0.7)' // Light theme: white with transparency
              : 'rgba(5, 5, 9, 0.7)', // Dark theme: dark with transparency
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            // Subtle border that adapts
            borderColor: isLightTheme
              ? 'rgba(0, 0, 0, 0.08)'
              : 'rgba(255, 255, 255, 0.1)',
            // Soft shadow for depth
            boxShadow: isLightTheme
              ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
              : '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
          onKeyDown={handleMenuKeyDown}
        >
          {/* User Info Header */}
          <div 
            className="px-4 pt-3 pb-3 border-b"
            style={{
              borderColor: isLightTheme
                ? 'rgba(0, 0, 0, 0.06)'
                : 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <p className="text-sm font-semibold text-[var(--text-main)] truncate leading-tight">
              {displayName}
            </p>
            {user.email && (
              <p className="text-xs text-[var(--text-main)]/60 truncate mt-0.5 leading-tight">
                {user.email}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              const commonProps = {
                role: 'menuitem',
                tabIndex: 0,
                ref: assignMenuItemRef(index),
                className:
                  'mx-2 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                style: {
                  color: 'var(--text-main)'
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.backgroundColor = isLightTheme 
                    ? 'rgba(0, 0, 0, 0.05)' 
                    : 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              };

              if (item.onClick) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    {...commonProps}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      item.onClick();
                    }}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span 
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: isLightTheme ? '#000' : '#FDE68A',
                          backgroundColor: isLightTheme 
                            ? 'rgba(197, 157, 95, 0.15)' 
                            : 'rgba(253, 230, 138, 0.15)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  to={item.to}
                  {...commonProps}
                  onClick={() => setOpen(false)}
                >
                  <span className="font-medium">{item.label}</span>
                  <svg 
                    className="w-4 h-4 text-[var(--text-main)]/30 transition-transform duration-150 group-hover:translate-x-0.5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}

            {/* Divider */}
            <div 
              className="mx-2 my-2 h-px"
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.06)'
                  : 'rgba(255, 255, 255, 0.08)'
              }}
            />

            {/* Sign Out Button */}
            <button
              type="button"
              role="menuitem"
              tabIndex={0}
              ref={assignMenuItemRef(menuItems.length)}
              onClick={handleLogout}
              className="mx-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
              style={{
                color: isLightTheme ? '#dc2626' : '#f87171'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(220, 38, 38, 0.08)'
                  : 'rgba(248, 113, 113, 0.12)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span>Sign Out</span>
              <svg 
                className="w-4 h-4 transition-transform duration-150" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </>
    )

    return createPortal(dropdownContent, document.body)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full text-[var(--text-main)] font-semibold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] transition-all duration-200"
        style={{
          backgroundColor: open 
            ? (isLightTheme ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)')
            : (isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'),
          transform: open ? 'scale(0.95)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.backgroundColor = isLightTheme
              ? 'rgba(0, 0, 0, 0.12)'
              : 'rgba(255, 255, 255, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.backgroundColor = isLightTheme
              ? 'rgba(0, 0, 0, 0.08)'
              : 'rgba(255, 255, 255, 0.1)';
          }
        }}
      >
        {profile?.avatar_url ? (
          <span className={`absolute inset-0 overflow-hidden rounded-full ring-2 transition-all duration-200 ${
            open ? 'ring-accent/50' : 'ring-transparent'
          }`}>
            <img
              src={profile.avatar_url}
              alt={displayName || 'User avatar'}
              className="h-full w-full object-cover"
            />
          </span>
        ) : (
          <span className="text-sm leading-none">{initials}</span>
        )}
        <span className="sr-only">Account menu</span>
      </button>

      {renderDropdown()}
    </div>
  )
}

export default ProfileDropdown
