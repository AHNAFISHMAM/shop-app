import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { staggerContainer, fadeSlideUp, batchFadeSlideUp } from '../animations/menuAnimations'
import { cn } from '../../utils/cn'
import {
  HomeIcon,
  SearchIcon,
  FolderIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronDownIcon,
  SetMenuIcon,
  CuisineIcon,
  MainDishIcon,
  BreadIcon,
  InternationalIcon,
  LightBitesIcon,
  OtherIcon,
} from '../icons/SidebarIcons'
import { ANIMATION_DELAYS } from './sidebarConstants'
import { logger } from '../../utils/logger'

interface Category {
  id: string
  name: string
}

interface MenuItem {
  id: string
  category_id: string
  name: string
  image_url?: string
  image?: string
  dietary_tags?: string[]
}

interface CategoryGroup {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
  categories: Category[]
}

interface QuickReorderItem {
  id: string | number
  name: string
  image_url?: string
  image?: string
  dietary_tags?: string[]
}

interface CollapsibleSidebarProps {
  categories?: Category[]
  menuItems?: MenuItem[]
  selectedCategory?: Category | null
  onCategorySelect: (category: Category | null) => void
  variant?: 'desktop' | 'mobile'
  enableFilters?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  dietaryTags?: string[]
  activeDietaryTags?: string[]
  onDietaryToggle?: (tag: string) => void
  allergenTags?: string[]
  activeAllergenTags?: string[]
  onAllergenToggle?: (tag: string) => void
  quickReorderItems?: QuickReorderItem[]
  onQuickReorder?: ((itemId: string | number) => void) | null
}

// Utility functions from MenuEnhancementsPanel
const formatLabel = (label: string): string => {
  if (!label) return ''
  const normalized = label.replace(/[-_]/g, ' ').toLowerCase()
  return normalized.replace(/\b\w/g, char => char.toUpperCase())
}

const resolveImage = (item: MenuItem | QuickReorderItem): string =>
  item?.image_url ||
  item?.image ||
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop'

/**
 * Professional Collapsible Sidebar for Menu Categories
 * Based on UX research: Vertical navigation is 80% more scannable
 * Groups 26+ categories into logical parent groups for better UX
 */

// Category grouping configuration (maps flat categories to hierarchical structure)
const CATEGORY_GROUPS: Omit<CategoryGroup, 'categories'>[] = [
  {
    id: 'set-menus',
    name: 'Set Menus',
    icon: SetMenuIcon,
    keywords: ['set menu', 'dine in', 'take away', 'set', 'combo'],
  },
  {
    id: 'bangladeshi',
    name: 'Bangladeshi Cuisine',
    icon: CuisineIcon,
    keywords: ['biryani', 'bangla', 'fish', 'mach', 'goru', 'khasi', 'sonali', 'murgi', 'bengali'],
  },
  {
    id: 'main-dishes',
    name: 'Main Dishes',
    icon: MainDishIcon,
    keywords: ['rice', 'beef', 'mutton', 'chicken', 'prawn', 'fish', 'vegetable', 'sizzling'],
  },
  {
    id: 'breads',
    name: 'Breads & Sides',
    icon: BreadIcon,
    keywords: ['naan', 'nun', 'bon', 'bread', 'roti'],
  },
  {
    id: 'international',
    name: 'International',
    icon: InternationalIcon,
    keywords: ['pizza', 'burger', 'chowmein', 'pasta', 'ramen', 'nachos', 'chop suey'],
  },
  {
    id: 'light-bites',
    name: 'Light Bites',
    icon: LightBitesIcon,
    keywords: ['appetizer', 'snack', 'salad', 'soup', 'kabab', 'starter'],
  },
]

const CollapsibleSidebar = ({
  categories = [],
  menuItems = [],
  selectedCategory,
  onCategorySelect,
  variant = 'desktop',
  enableFilters = false,
  searchQuery = '',
  onSearchChange = () => {},
  dietaryTags = [],
  activeDietaryTags = [],
  onDietaryToggle = () => {},
  allergenTags = [],
  activeAllergenTags = [],
  onAllergenToggle = () => {},
  quickReorderItems = [],
  onQuickReorder = null,
}: CollapsibleSidebarProps): JSX.Element => {
  const isDesktop = variant === 'desktop'
  const asideClasses = isDesktop
    ? 'hidden lg:block w-full lg:w-80 flex-shrink-0 z-20 sticky top-16 self-start'
    : 'w-full h-full'
  const containerClasses = `rounded-xl sm:rounded-2xl border border-theme backdrop-blur-sm flex flex-col ${
    isDesktop ? 'max-h-[calc(100vh-4rem)]' : 'h-full'
  }`
  const navWrapperClasses = isDesktop
    ? 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar px-4 sm:px-6 py-4'
    : 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar px-4 sm:px-6 py-4'
  const groupWrapperClasses = 'space-y-2'

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

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

  // Memoized container styles using CSS variables
  const containerStyle = useMemo(
    () => ({
      backgroundColor: 'var(--bg-elevated)',
      boxShadow: 'var(--modal-shadow)',
      borderColor: 'var(--border-default)',
    }),
    []
  )

  // View state: 'categories' or 'filters'
  const [currentView, setCurrentView] = useState<'categories' | 'filters'>('categories')

  // Filters panel collapsed state
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)

  // Track which groups are expanded (all collapsed by default)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    CATEGORY_GROUPS.reduce((acc, group) => ({ ...acc, [group.id]: false }), {})
  )

  // Filters panel computed values
  const hasDietaryFilters = dietaryTags.length > 0
  const hasAllergenFilters = allergenTags.length > 0
  const hasQuickReorder = quickReorderItems.length > 0
  const quickReorderCards = useMemo(() => quickReorderItems.slice(0, 3), [quickReorderItems])

  // Group categories by parent
  const groupedCategories = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {}

    // Initialize all groups
    CATEGORY_GROUPS.forEach(group => {
      groups[group.id] = {
        ...group,
        categories: [],
      }
    })

    // Assign each category to appropriate group based on keywords
    categories.forEach(category => {
      const categoryNameLower = category.name.toLowerCase()

      // Find matching group
      let assigned = false
      for (const group of CATEGORY_GROUPS) {
        if (category && group.keywords.some(keyword => categoryNameLower.includes(keyword))) {
          const targetGroup = groups[group.id]
          if (targetGroup) {
            targetGroup.categories.push(category)
          }
          assigned = true
          break
        }
      }

      // If no match, add to "Other" group
      if (!assigned) {
        if (!groups['other']) {
          groups['other'] = {
            id: 'other',
            name: 'Other',
            icon: OtherIcon,
            keywords: [],
            categories: [],
          }
        }
        const otherGroup = groups['other']
        if (otherGroup) {
          otherGroup.categories.push(category)
        }
      }
    })

    return groups
  }, [categories])

  // Calculate item counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    menuItems.forEach(item => {
      const catId = item.category_id
      counts[catId] = (counts[catId] || 0) + 1
    })
    return counts
  }, [menuItems])

  // Toggle group expand/collapse
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const allGroupIds = useMemo(() => Object.keys(groupedCategories), [groupedCategories])

  // Check if all groups are expanded or collapsed
  const allExpanded = useMemo(() => {
    if (allGroupIds.length === 0) return false
    return allGroupIds.every(id => expandedGroups[id] === true)
  }, [allGroupIds, expandedGroups])

  const allCollapsed = useMemo(() => {
    if (allGroupIds.length === 0) return false
    return allGroupIds.every(id => expandedGroups[id] === false)
  }, [allGroupIds, expandedGroups])

  const syncNewGroups = useCallback(() => {
    setExpandedGroups(prev => {
      const updated = { ...prev }
      let changed = false
      allGroupIds.forEach(id => {
        if (typeof updated[id] === 'undefined') {
          updated[id] = true
          changed = true
        }
      })
      return changed ? updated : prev
    })
  }, [allGroupIds])

  useEffect(() => {
    syncNewGroups()
  }, [syncNewGroups])

  const setAllGroupsExpanded = useCallback(
    (isExpanded: boolean) => {
      setExpandedGroups(allGroupIds.reduce((acc, id) => ({ ...acc, [id]: isExpanded }), {}))
    },
    [allGroupIds]
  )

  const collapseAll = () => setAllGroupsExpanded(false)
  const expandAll = () => setAllGroupsExpanded(true)

  // Debug logging for sidebar scroll behavior
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isDesktop) return

    // Run automatic diagnostics in development
    if (process.env.NODE_ENV === 'development') {
      import('../../utils/stickySidebarDiagnostics')
        .then(({ runStickySidebarDiagnostics }) => {
          setTimeout(() => {
            logger.log('[Sidebar] 🔍 Running automatic diagnostics...')
            runStickySidebarDiagnostics()
          }, 500)
        })
        .catch(() => {
          // Diagnostic utility not available, skip silently
        })
    }

    // Wait for sidebar to mount
    const checkSidebar = () => {
      const asideElement = sidebarRef.current
      if (!asideElement) {
        logger.log('[Sidebar Debug] Sidebar element not found, retrying...')
        setTimeout(checkSidebar, 100)
        return
      }

      const logSidebarInfo = () => {
        const rect = asideElement.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(asideElement)
        const container = asideElement.querySelector('.rounded-xl') as HTMLElement
        const containerRect = container?.getBoundingClientRect()
        const containerStyle = container ? window.getComputedStyle(container) : null

        logger.log('[Sidebar Debug] ===== Sidebar Info =====')
        logger.log('Aside element:', {
          position: computedStyle.position,
          top: computedStyle.top,
          left: computedStyle.left,
          width: computedStyle.width,
          height: computedStyle.height,
          maxHeight: computedStyle.maxHeight,
          overflow: computedStyle.overflow,
          overflowY: computedStyle.overflowY,
          overflowX: computedStyle.overflowX,
          overscrollBehavior: computedStyle.overscrollBehavior,
          overscrollBehaviorY: computedStyle.overscrollBehaviorY,
          rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
          windowScrollY: window.scrollY,
          documentHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
          isSticky: computedStyle.position === 'sticky' || computedStyle.position === 'fixed',
          willScrollWithPage:
            computedStyle.position === 'relative' || computedStyle.position === 'static',
        })

        if (container && containerStyle) {
          logger.log('Container element:', {
            position: containerStyle.position,
            height: containerStyle.height,
            maxHeight: containerStyle.maxHeight,
            overflow: containerStyle.overflow,
            overflowY: containerStyle.overflowY,
            rect: {
              top: containerRect.top,
              bottom: containerRect.bottom,
              height: containerRect.height,
            },
          })
        }

        const scrollableContent = asideElement.querySelector('.overflow-y-auto') as HTMLElement
        if (scrollableContent) {
          const scrollRect = scrollableContent.getBoundingClientRect()
          const scrollStyle = window.getComputedStyle(scrollableContent)
          logger.log('Scrollable content:', {
            scrollHeight: scrollableContent.scrollHeight,
            clientHeight: scrollableContent.clientHeight,
            scrollTop: scrollableContent.scrollTop,
            overflow: scrollStyle.overflow,
            overscrollBehavior: scrollStyle.overscrollBehavior,
            rect: { top: scrollRect.top, bottom: scrollRect.bottom, height: scrollRect.height },
          })
        }
        logger.log('[Sidebar Debug] =======================')
      }

      // Log on mount
      setTimeout(logSidebarInfo, 100)

      // Track previous scroll position to detect movement
      let previousScrollY = window.scrollY
      let previousSidebarTop = asideElement.getBoundingClientRect().top

      // Log on window scroll
      const handleWindowScroll = () => {
        const rect = asideElement.getBoundingClientRect()
        const style = window.getComputedStyle(asideElement)
        const currentScrollY = window.scrollY
        const currentSidebarTop = rect.top
        const scrollDelta = currentScrollY - previousScrollY
        const sidebarMoved = Math.abs(currentSidebarTop - previousSidebarTop) > 0.1

        logger.log('[Sidebar Debug] Window scroll:', {
          scrollY: currentScrollY,
          scrollDelta: scrollDelta,
          sidebarTop: currentSidebarTop,
          sidebarTopDelta: currentSidebarTop - previousSidebarTop,
          sidebarBottom: rect.bottom,
          sidebarHeight: rect.height,
          isVisible: rect.top < window.innerHeight && rect.bottom > 0,
          position: style.position,
          top: style.top,
          sidebarMovedWithPage: sidebarMoved && scrollDelta !== 0,
          isSticky: style.position === 'sticky' || style.position === 'fixed',
        })

        previousScrollY = currentScrollY
        previousSidebarTop = currentSidebarTop
      }

      // Log on resize
      const handleResize = () => {
        logger.log('[Sidebar Debug] Window resize')
        logSidebarInfo()
      }

      window.addEventListener('scroll', handleWindowScroll, { passive: true })
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleWindowScroll)
        window.removeEventListener('resize', handleResize)
      }
    }

    checkSidebar()
  }, [isDesktop])

  return (
    <aside
      ref={sidebarRef}
      className={asideClasses}
      style={{
        position: 'sticky',
        top: '4rem',
        height: 'auto',
        maxHeight: 'calc(100vh - 4rem)',
        alignSelf: 'flex-start',
        transform: 'none',
        willChange: 'auto',
      }}
    >
      <div
        className={containerClasses}
        style={{
          ...containerStyle,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Sidebar Header */}
        <m.div
          className="px-4 sm:px-6 py-4 border-b border-theme space-y-4"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          custom={0.05}
        >
          {/* Row 1: Title and View Toggle */}
          <div className="flex items-center justify-between gap-2">
            <m.h2
              key={currentView}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg sm:text-xl font-semibold text-[var(--text-main)] tracking-wide"
            >
              {currentView === 'categories' ? 'Categories' : 'Flavor Controls'}
            </m.h2>
            {enableFilters && (
              <m.button
                onClick={() =>
                  setCurrentView(currentView === 'categories' ? 'filters' : 'categories')
                }
                type="button"
                className="px-3 py-1.5 rounded-xl border border-theme bg-theme-elevated text-xs sm:text-xs text-[var(--text-main)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
                title={currentView === 'categories' ? 'Switch to Filters' : 'Switch to Categories'}
                aria-label={
                  currentView === 'categories'
                    ? 'Switch to Filters view'
                    : 'Switch to Categories view'
                }
              >
                {currentView === 'categories' ? (
                  <SearchIcon className="w-4 h-4" />
                ) : (
                  <FolderIcon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {currentView === 'categories' ? 'Filters' : 'Categories'}
                </span>
              </m.button>
            )}
          </div>

          {/* Row 2: Action Buttons (only in categories view) */}
          {currentView === 'categories' && (
            <div className="flex items-center gap-2">
              <m.button
                onClick={expandAll}
                type="button"
                aria-label="Expand all categories"
                disabled={allExpanded}
                className={cn(
                  'flex-1 text-xs sm:text-xs uppercase tracking-wider px-3 sm:px-4 py-2 min-h-[44px] rounded-xl border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60',
                  allExpanded
                    ? 'text-muted opacity-50 border-theme-subtle cursor-not-allowed bg-theme-elevated'
                    : 'bg-theme-elevated text-[var(--text-main)] border-theme hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
                )}
                title="Expand all"
              >
                Expand
              </m.button>
              <m.button
                onClick={collapseAll}
                type="button"
                aria-label="Collapse all categories"
                disabled={allCollapsed}
                className={cn(
                  'flex-1 text-xs sm:text-xs uppercase tracking-wider px-3 sm:px-4 py-2 min-h-[44px] rounded-xl border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60',
                  allCollapsed
                    ? 'text-muted opacity-50 border-theme-subtle cursor-not-allowed bg-theme-elevated'
                    : 'bg-theme-elevated text-[var(--text-main)] border-theme hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
                )}
                title="Collapse all"
              >
                Collapse
              </m.button>
            </div>
          )}

          {/* Row 2: Hide/Show button (only in filters view) */}
          {currentView === 'filters' && (
            <m.button
              type="button"
              onClick={() => setFiltersCollapsed(prev => !prev)}
              className="w-full rounded-xl border border-theme px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-xs text-muted hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors bg-theme-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
              aria-label={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
              title={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
            >
              <div className="flex items-center gap-2">
                {filtersCollapsed ? (
                  <EyeIcon className="w-4 h-4" />
                ) : (
                  <EyeOffIcon className="w-4 h-4" />
                )}
                <span>{filtersCollapsed ? 'Show Filters' : 'Hide Filters'}</span>
              </div>
            </m.button>
          )}
        </m.div>

        {/* Scrollable Content Area - Switches between Categories and Filters */}
        <div
          className={navWrapperClasses}
          style={{
            overscrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
          onWheel={e => {
            // Only stop propagation when actively scrolling within the sidebar content
            // Allow page scroll when at boundaries
            const target = e.currentTarget
            const { scrollTop, scrollHeight, clientHeight } = target
            const isScrollable = scrollHeight > clientHeight

            if (isScrollable) {
              const isAtTop = scrollTop <= 0
              const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

              // Only stop if scrolling within bounds (not at edges)
              // At edges, allow scroll to propagate to page
              if (!isAtTop && !isAtBottom) {
                e.stopPropagation()
              }
            }
            // If not scrollable, don't stop - let page scroll
          }}
          onTouchMove={e => {
            // Only prevent touch scroll when actively scrolling within sidebar bounds
            // Allow page scroll when at boundaries
            const target = e.currentTarget
            const { scrollTop, scrollHeight, clientHeight } = target
            const isScrollable = scrollHeight > clientHeight

            if (isScrollable) {
              const isAtTop = scrollTop <= 0
              const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

              // Only stop if scrolling within bounds (not at edges)
              if (!isAtTop && !isAtBottom) {
                e.stopPropagation()
              }
            }
            // If not scrollable, don't stop - let page scroll
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {currentView === 'categories' ? (
              <m.nav
                key="categories-view"
                className="space-y-2"
                variants={staggerContainer}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* All Items (Always visible at top) */}
                <m.div variants={fadeSlideUp} custom={0.1}>
                  <m.button
                    onClick={() => onCategorySelect(null)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 sm:px-6 py-4 min-h-[44px] rounded-xl sm:rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2',
                      !selectedCategory
                        ? 'bg-[var(--accent)] text-black font-semibold shadow-lg shadow-[var(--accent)]/20'
                        : 'text-[var(--text-main)] bg-theme-elevated hover:bg-[var(--bg-hover)]'
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    <span className="flex items-center gap-4">
                      <HomeIcon className="w-5 h-5" />
                      <span className="text-sm sm:text-base">All Items</span>
                    </span>
                    <span className="text-xs sm:text-xs font-semibold opacity-80">
                      {menuItems.length}
                    </span>
                  </m.button>
                </m.div>

                {/* Category Groups */}
                {Object.values(groupedCategories).map((group, groupIndex) => {
                  if (group.categories.length === 0) return null

                  const isExpanded = expandedGroups[group.id]
                  const IconComponent = group.icon

                  return (
                    <m.div
                      key={group.id}
                      className={groupWrapperClasses}
                      variants={fadeSlideUp}
                      custom={
                        ANIMATION_DELAYS.GROUP_BASE + groupIndex * ANIMATION_DELAYS.GROUP_INCREMENT
                      }
                    >
                      {/* Group Header */}
                      <m.button
                        onClick={() => toggleGroup(group.id)}
                        type="button"
                        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 min-h-[44px] rounded-xl sm:rounded-2xl text-base font-semibold text-[var(--text-main)] transition-colors group hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                      >
                        <span className="flex items-center gap-4 font-medium">
                          <IconComponent className="w-5 h-5 text-[var(--text-main)]" />
                          <span className="text-base">{group.name}</span>
                        </span>
                        <ChevronDownIcon
                          className="w-4 h-4 text-muted transition-transform duration-300"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      </m.button>

                      {/* Group Categories (Collapsible) */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <m.div
                            className="ml-8 space-y-2"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                          >
                            {group.categories.map((category, categoryIndex) => {
                              const itemCount = categoryCounts[category.id] || 0
                              const isSelected = selectedCategory?.id === category.id

                              return (
                                <m.button
                                  key={category.id}
                                  onClick={() => onCategorySelect(category)}
                                  className={cn(
                                    'w-full flex items-center justify-between px-4 sm:px-6 py-4 min-h-[44px] rounded-xl sm:rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2',
                                    isSelected
                                      ? 'bg-[var(--accent)]/20 text-[var(--accent)] font-semibold border-2 border-[var(--accent)]/50 shadow-sm'
                                      : 'text-muted hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                                  )}
                                  variants={fadeSlideUp}
                                  custom={categoryIndex * ANIMATION_DELAYS.CATEGORY_INCREMENT}
                                  whileHover={{ scale: 1.02, x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                  layout
                                >
                                  <span className="text-left">{category.name}</span>
                                  <m.span
                                    className="text-xs sm:text-xs font-medium opacity-70"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {itemCount}
                                  </m.span>
                                </m.button>
                              )
                            })}
                          </m.div>
                        )}
                      </AnimatePresence>
                    </m.div>
                  )
                })}
              </m.nav>
            ) : (
              <m.div
                key="filters-view"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {!filtersCollapsed ? (
                    <m.div
                      key="filters-visible"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-4"
                    >
                      {/* Quick Search */}
                      <m.div className="space-y-4" variants={fadeSlideUp}>
                        <m.label
                          htmlFor="refine-search"
                          className="text-sm sm:text-base font-medium text-[var(--text-main)]/80"
                          variants={fadeSlideUp}
                        >
                          Quick Search
                        </m.label>
                        <m.div className="relative" variants={fadeSlideUp}>
                          <input
                            id="refine-search"
                            type="search"
                            value={searchQuery}
                            onChange={event => onSearchChange(event.target.value)}
                            placeholder="Search dishes"
                            className="w-full rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-4 min-h-[44px] text-sm sm:text-base text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                          />
                          <svg
                            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </m.div>
                      </m.div>

                      {/* Dietary Focus */}
                      {hasDietaryFilters && (
                        <m.section className="space-y-4" variants={fadeSlideUp}>
                          <m.div
                            className="flex items-center justify-between"
                            variants={fadeSlideUp}
                          >
                            <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                              Dietary Focus
                            </h4>
                            {activeDietaryTags.length > 0 && (
                              <m.button
                                type="button"
                                onClick={() => {
                                  activeDietaryTags.forEach(normalizedTag => {
                                    const originalTag = dietaryTags.find(
                                      t => t.toLowerCase() === normalizedTag.toLowerCase()
                                    )
                                    if (originalTag) {
                                      onDietaryToggle(originalTag)
                                    } else {
                                      onDietaryToggle(normalizedTag)
                                    }
                                  })
                                }}
                                className="text-xs sm:text-xs text-muted underline-offset-4 hover:text-[var(--accent)]"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Clear
                              </m.button>
                            )}
                          </m.div>
                          <m.div className="flex flex-wrap gap-4" variants={staggerContainer}>
                            {dietaryTags.map((tag, index) => {
                              const normalized = tag.toLowerCase()
                              const isActive = activeDietaryTags.includes(normalized)

                              return (
                                <m.button
                                  key={tag}
                                  type="button"
                                  onClick={() => onDietaryToggle(tag)}
                                  className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-xs sm:text-xs font-medium transition-all ${
                                    isActive
                                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 shadow-inner'
                                      : 'bg-theme-elevated text-muted border border-theme hover:border-emerald-300/40 hover:text-[var(--text-main)]'
                                  }`}
                                  variants={fadeSlideUp}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  custom={index * 0.05}
                                >
                                  {formatLabel(tag)}
                                </m.button>
                              )
                            })}
                          </m.div>
                        </m.section>
                      )}

                      {/* Avoid Allergens */}
                      {hasAllergenFilters && (
                        <m.section className="space-y-4" variants={fadeSlideUp}>
                          <m.div
                            className="flex items-center justify-between"
                            variants={fadeSlideUp}
                          >
                            <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                              Avoid Allergens
                            </h4>
                            {activeAllergenTags.length > 0 && (
                              <m.button
                                type="button"
                                onClick={() => {
                                  activeAllergenTags.forEach(normalizedTag => {
                                    const originalTag = allergenTags.find(
                                      t => t.toLowerCase() === normalizedTag.toLowerCase()
                                    )
                                    if (originalTag) {
                                      onAllergenToggle(originalTag)
                                    } else {
                                      onAllergenToggle(normalizedTag)
                                    }
                                  })
                                }}
                                className="text-xs sm:text-xs text-muted underline-offset-4 hover:text-[var(--accent)]"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Clear
                              </m.button>
                            )}
                          </m.div>
                          <m.div className="flex flex-wrap gap-4" variants={staggerContainer}>
                            {allergenTags.map((tag, index) => {
                              const normalized = tag.toLowerCase()
                              const isActive = activeAllergenTags.includes(normalized)

                              return (
                                <m.button
                                  key={tag}
                                  type="button"
                                  onClick={() => onAllergenToggle(tag)}
                                  className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-xs sm:text-xs font-medium transition-all ${
                                    isActive
                                      ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-inner'
                                      : 'bg-theme-elevated text-muted border border-theme hover:border-amber-300/40 hover:text-[var(--text-main)]'
                                  }`}
                                  variants={fadeSlideUp}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  custom={index * 0.05}
                                >
                                  {formatLabel(tag)}
                                </m.button>
                              )
                            })}
                          </m.div>
                        </m.section>
                      )}

                      {/* Quick Reorder */}
                      <m.section className="space-y-4" variants={fadeSlideUp}>
                        <m.div className="flex items-center justify-between" variants={fadeSlideUp}>
                          <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                            Quick Reorder
                          </h4>
                          <span className="text-xs sm:text-xs text-muted">
                            {hasQuickReorder ? 'Last enjoyed' : 'No history yet'}
                          </span>
                        </m.div>

                        {hasQuickReorder ? (
                          <m.div className="space-y-4" variants={staggerContainer}>
                            {quickReorderCards.map((item, index) => (
                              <m.div
                                key={item.id}
                                className="flex gap-4 rounded-xl sm:rounded-2xl border border-theme px-4 sm:px-6 py-4"
                                style={{
                                  backgroundColor: isLightTheme
                                    ? 'rgba(0, 0, 0, 0.04)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                  boxShadow: isLightTheme
                                    ? '0 1px 2px 0 rgba(0, 0, 0, 0.1)'
                                    : '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
                                  borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
                                }}
                                variants={batchFadeSlideUp}
                                whileHover={{ scale: 1.02, y: -2 }}
                                custom={index * 0.08}
                              >
                                <div className="h-14 w-14 overflow-hidden rounded-xl sm:rounded-2xl border border-theme">
                                  <img
                                    src={resolveImage(item)}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm sm:text-base font-semibold text-[var(--text-main)] line-clamp-1">
                                    {item.name}
                                  </p>
                                  <p className="text-xs sm:text-xs text-muted/80 line-clamp-1">
                                    {(item.dietary_tags || [])
                                      .slice(0, 2)
                                      .map(tag => formatLabel(tag))
                                      .join(' • ')}
                                  </p>
                                  <m.button
                                    type="button"
                                    onClick={() => {
                                      if (onQuickReorder) {
                                        onQuickReorder(item.id)
                                      }
                                    }}
                                    className="mt-2 inline-flex items-center gap-1.5 px-2 py-1.5 rounded border border-[var(--accent)]/20 bg-[var(--accent)]/5 text-xs sm:text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    Order again
                                    <svg
                                      className="h-4 w-4 flex-shrink-0"
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
                                      <path d="M14 2.5v4h-4" />
                                    </svg>
                                  </m.button>
                                </div>
                              </m.div>
                            ))}
                          </m.div>
                        ) : (
                          <m.div
                            className="rounded-xl sm:rounded-2xl border border-dashed border-theme px-4 sm:px-6 py-4 text-center"
                            style={{
                              backgroundColor: isLightTheme
                                ? 'rgba(0, 0, 0, 0.04)'
                                : 'rgba(255, 255, 255, 0.05)',
                              borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
                            }}
                            variants={fadeSlideUp}
                          >
                            <p className="text-xs sm:text-xs text-muted">
                              Your picks will land here after the next order.
                            </p>
                          </m.div>
                        )}
                      </m.section>
                    </m.div>
                  ) : null}
                </AnimatePresence>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  )
}

export default CollapsibleSidebar
