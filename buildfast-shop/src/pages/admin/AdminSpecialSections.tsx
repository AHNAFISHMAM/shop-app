import { useState, useEffect, useMemo, useCallback } from 'react';
import { m } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger';
import { pageFade } from '../../components/animations/menuAnimations';
import { logger } from '../../utils/logger';

const SECTION_FLAGS = {
  todays_menu: 'is_todays_menu',
  daily_specials: 'is_daily_special',
  new_dishes: 'is_new_dish',
  discount_combos: 'is_discount_combo',
  limited_time: 'is_limited_time',
  happy_hour: 'is_happy_hour'
};

const formatPrice = (value: number | string): string => {
  try {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return '--';
    return numeric.toFixed(0);
  } catch (e) {
    return '--';
  }
};

// Nice message templates
const messages = {
  todays_menu: [
    "🌟 Fresh picks curated by our chef today!",
    "Today's handpicked favorites, prepared with love!",
    "Discover today's special creations!"
  ],
  daily_specials: [
    "🎉 Limited-time deals you don't want to miss!",
    "Special offers crafted fresh every day!",
    "Today's exclusive specials at amazing prices!"
  ],
  new_dishes: [
    "✨ Brand new items added to our menu!",
    "Fresh arrivals you'll absolutely love!",
    "Exciting new flavors just launched!"
  ],
  discount_combos: [
    "💰 Bundle up and save big!",
    "Amazing combo deals for maximum value!",
    "Mix and match for unbeatable prices!"
  ],
  limited_time: [
    "⏰ Grab them before they're gone!",
    "Exclusive limited-time offerings!",
    "Only available for a short while!"
  ],
  happy_hour: [
    "🎊 It's happy hour – time to celebrate!",
    "Special pricing during happy hours!",
    "Enjoy discounted treats during select times!"
  ]
};

/**
 * Super Simple Special Sections Management
 * Just checkboxes - click to add menu items to sections!
 */
interface SpecialSection {
  id: string;
  section_key: string;
  section_name: string;
  is_available: boolean;
  custom_message?: string;
  display_order?: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number | string;
  is_todays_menu?: boolean;
  is_daily_special?: boolean;
  is_new_dish?: boolean;
  is_discount_combo?: boolean;
  is_limited_time?: boolean;
  is_happy_hour?: boolean;
  [key: string]: unknown;
}

const AdminSpecialSections = () => {
  const containerRef = useViewportAnimationTrigger();
  const [sections, setSections] = useState<SpecialSection[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionBusy, setSectionBusy] = useState<Record<string, boolean>>({});
  const [itemBusy, setItemBusy] = useState<Record<string, boolean>>({});

  // Load data function - memoized to prevent recreation
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('special_sections')
        .select('*')
        .order('display_order');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // Get menu items
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (menuItemsError) throw menuItemsError;
      setMenuItems(menuItemsData || []);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data and setup real-time subscription
  useEffect(() => {
    loadData();

    // Real-time updates
    const channel = supabase
      .channel('special_sections_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'special_sections' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;
    const term = searchTerm.toLowerCase();
    return menuItems.filter((item) => item.name?.toLowerCase().includes(term));
  }, [menuItems, searchTerm]);

  // Activate animations ensuring at least one row is always ahead of viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !filteredMenuItems.length) return;
    
    const checkAndActivate = () => {
      try {
        const container = document.querySelector('.admin-page');
        if (!container) return;
        
        const elements = Array.from(container.querySelectorAll('[data-animate]'));
        if (elements.length === 0) return;
        
        const viewportHeight = window.innerHeight;
        const viewportTop = 0; // getBoundingClientRect is relative to viewport
        const viewportBottom = viewportHeight;
        
        // Find the last visible row
        let lastVisibleIndex = -1;
        elements.forEach((el, index) => {
          try {
            const rect = el.getBoundingClientRect();
            // Element is visible if any part is in viewport
            if (rect.top < viewportBottom && rect.bottom > viewportTop) {
              lastVisibleIndex = index;
            }
          } catch (e) {
            // Skip if element is not in DOM
          }
        });
        
        // Activate current visible rows + at least one row ahead
        elements.forEach((el, index) => {
          try {
            if (!(el instanceof HTMLElement)) return;
            if (el.dataset.animateActive === 'true') return; // Already active
            
            const rect = el.getBoundingClientRect();
            
            // Activate if:
            // 1. Element is in viewport (any part visible)
            // 2. Element is within 500px below viewport
            // 3. Element is the next row after the last visible one (always keep one ahead)
            const inViewport = rect.top < viewportBottom && rect.bottom > viewportTop;
            const nearViewport = rect.top < viewportBottom + 500 && rect.bottom > viewportTop - 100;
            const isNextRow = lastVisibleIndex >= 0 && index === lastVisibleIndex + 1;
            
            if (inViewport || nearViewport || isNextRow) {
              el.dataset.animateActive = 'true';
            }
          } catch (e) {
            // Skip if element is not in DOM
          }
        });
      } catch (error) {
        logger.error('Error in animation check:', error);
      }
    };

    // Check immediately and repeatedly
    const initialCheck = setTimeout(checkAndActivate, 100);
    const intervalCheck = setInterval(checkAndActivate, 150);
    
    // Also check on scroll for items coming into view
    const handleScroll = () => {
      requestAnimationFrame(checkAndActivate);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(initialCheck);
      clearInterval(intervalCheck);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [filteredMenuItems.length]);

  // Turn section ON/OFF
  const toggleSection = async (section: SpecialSection) => {
    const optimisticValue = !section.is_available;
    setSections((prev) =>
      prev.map((item) =>
        item.id === section.id ? { ...item, is_available: optimisticValue } : item
      )
    );
    setSectionBusy((prev) => ({ ...prev, [section.id]: true }));

    try {
      const { error } = await supabase
        .from('special_sections')
        .update({ is_available: optimisticValue } as never)
        .eq('id', section.id);

      if (error) throw error;
      toast.success(optimisticValue ? 'Section turned ON' : 'Section turned OFF');
    } catch (error) {
      logger.error('Error:', error);
      // revert
      setSections((prev) =>
        prev.map((item) =>
          item.id === section.id ? { ...item, is_available: !optimisticValue } : item
        )
      );
      toast.error('Failed to toggle section');
    } finally {
      setSectionBusy((prev) => {
        const updated = { ...prev };
        delete updated[section.id];
        return updated;
      });
    }
  };

  // Generate nice message
  const generateMessage = async (section: SpecialSection) => {
    const sectionKey = section.section_key as keyof typeof messages;
    const msgs = messages[sectionKey] || [];
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];

    setSections((prev) =>
      prev.map((item) =>
        item.id === section.id ? { ...item, custom_message: randomMsg } : item
      )
    );

    try {
      const { error } = await supabase
        .from('special_sections')
        .update({ custom_message: randomMsg } as never)
        .eq('id', section.id);

      if (error) throw error;
      toast.success('New message generated!');
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Failed to generate message');
    }
  };

  // Add/Remove menu item from section
  const toggleMenuItem = async (item: MenuItem, sectionKey: keyof typeof SECTION_FLAGS) => {
    const flag = SECTION_FLAGS[sectionKey];
    const currentValue = item[flag];
    const busyKey = `${item.id}-${flag}`;

    setItemBusy((prev) => ({ ...prev, [busyKey]: true }));
    setMenuItems((prev) =>
      prev.map((menuItem) =>
        menuItem.id === item.id ? { ...menuItem, [flag]: !currentValue } : menuItem
      )
    );

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ [flag]: !currentValue } as never)
        .eq('id', item.id);

      if (error) throw error;

      const sectionName = sections.find(s => s.section_key === sectionKey)?.section_name;
      toast.success(currentValue ? `Removed from ${sectionName}` : `Added to ${sectionName}`);
    } catch (error) {
      logger.error('Error:', error);
      // revert
      setMenuItems((prev) =>
        prev.map((menuItem) =>
          menuItem.id === item.id ? { ...menuItem, [flag]: currentValue } : menuItem
        )
      );
      toast.error('Failed to update menu item');
    } finally {
      setItemBusy((prev) => {
        const updated = { ...prev };
        delete updated[busyKey];
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <m.main
        className="flex h-full min-h-[400px] items-center justify-center"
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
        <div data-animate="fade-scale" data-animate-active="false" className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C59D5F] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[var(--text-main)]/60">Loading...</p>
        </div>
      </m.main>
    );
  }

  return (
    <m.main
      ref={containerRef}
      className="admin-page w-full bg-[var(--bg-main)] py-10 text-[var(--text-main)]"
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
      <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="rounded-3xl border border-theme bg-[rgba(6,8,12,0.95)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.4)]">
        <h1 className="text-3xl font-bold text-[var(--text-main)]">Special Sections - Super Simple!</h1>
        <p className="mt-2 text-[var(--text-main)]/60">
          ✅ Turn sections ON/OFF &nbsp;|&nbsp; ✨ Generate messages &nbsp;|&nbsp; ☑️ Check boxes to add dishes
        </p>
      </div>

      {/* Section Controls */}
      <div data-animate="fade-rise" data-animate-active="false" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="rounded-2xl border border-theme bg-[rgba(6,8,12,0.95)] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.35)]"
            data-animate="fade-rise"
            data-animate-active="false"
            style={{ transitionDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--text-main)]">{section.section_name}</h3>
              {/* ON/OFF Switch */}
              <button
                onClick={() => toggleSection(section)}
                disabled={sectionBusy[section.id]}
                className={`px-4 py-1 rounded-full text-xs font-bold transition ${
                  section.is_available
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/10 text-[var(--text-main)]/50 border border-theme-strong'
                } ${sectionBusy[section.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {sectionBusy[section.id] ? 'Saving...' : section.is_available ? 'ON' : 'OFF'}
              </button>
            </div>

            <p className="text-sm text-[var(--text-main)]/60 italic mb-3">&ldquo;{section.custom_message}&rdquo;</p>

            <button
              onClick={() => generateMessage(section)}
              className="w-full rounded-lg border border-[#C59D5F]/40 bg-[#C59D5F]/15 py-2 text-sm font-semibold text-[#C59D5F] transition hover:bg-[#C59D5F]/25 hover:text-[#FDF7ED]"
            >
              ✨ Generate New Message
            </button>
          </div>
        ))}
      </div>

      {/* Simple Table with Checkboxes */}
      <div className="rounded-3xl border border-theme bg-[rgba(6,8,12,0.95)] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden overflow-x-hidden overflow-y-hidden">
        <div className="p-6 border-b border-theme bg-[rgba(8,10,14,0.92)]">
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Add Menu Items to Sections</h2>
          <p className="text-sm text-[var(--text-main)]/60 mt-1">Just click the checkbox to add/remove items instantly!</p>
        </div>

        <div className="px-6 py-4 border-b border-theme">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-wide text-[var(--text-main)]/60 block mb-1">
                Quick Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search menu items by name"
                className="w-full rounded-lg border border-theme bg-[rgba(15,17,21,0.75)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-main)]/40 focus:border-[#C59D5F] focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/40"
              />
            </div>
            <div className="text-sm text-[var(--text-main)]/60">
              Showing <span className="text-[var(--text-main)]">{filteredMenuItems.length}</span> of{' '}
              <span className="text-[var(--text-main)]">{menuItems.length}</span> menu items
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full min-w-full">
            <thead className="bg-[rgba(255,255,255,0.03)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#C59D5F] uppercase tracking-[0.2em]">Menu Item</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#C59D5F] uppercase tracking-[0.2em]">Price</th>
                {sections.map((section) => (
                  <th key={section.id} className="px-4 py-4 text-center text-xs font-semibold text-[#C59D5F] uppercase tracking-[0.2em]">
                    {section.section_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/12 bg-[rgba(8,10,14,0.92)]">
              {filteredMenuItems.map((item, index) => (
                <tr
                  key={item.id}
                  data-animate="fade-rise"
                  data-animate-active="false"
                  className="transition hover:bg-[rgba(197,157,95,0.03)]"
                  style={{ transitionDelay: `${index * 20}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--text-main)]">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-[#C59D5F] font-medium">
                    ৳{formatPrice(item.price)}
                  </td>
                  {sections.map((section) => {
                    const sectionKey = section.section_key as keyof typeof SECTION_FLAGS;
                    const flag = SECTION_FLAGS[sectionKey];
                    const isChecked = Boolean(item[flag as keyof MenuItem]);
                    const busyKey = `${item.id}-${flag}`;
                    const disabled = !!itemBusy[busyKey] || !section.is_available;

                    return (
                      <td key={section.id} className="px-4 py-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMenuItem(item, sectionKey)}
                            disabled={disabled}
                            className="sr-only peer"
                            aria-label={`${isChecked ? 'Remove from' : 'Add to'} ${section.section_name}`}
                          />
                          <div
                            className={`relative inline-flex h-6 w-6 items-center justify-center rounded border-2 transition ${
                              isChecked
                                ? 'border-[#C59D5F] bg-[#C59D5F]/20 text-[#C59D5F]'
                                : 'border-theme-strong text-transparent'
                            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'peer-hover:border-[#C59D5F]'}`}
                          >
                            {itemBusy[busyKey] ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C59D5F] border-t-transparent" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {menuItems.length === 0 && (
          <div className="p-12 text-center text-[var(--text-main)]/60">
            No menu items found. Add some menu items first!
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="rounded-xl border border-theme bg-[rgba(8,10,14,0.92)] p-4 mt-8">
        <p className="text-sm text-[var(--text-main)]/60">
          💡 <strong className="font-semibold text-[var(--text-main)]">Tip:</strong> Changes are instant and real-time! Check the Order page to see your sections update automatically.
        </p>
      </div>
      </div>
    </m.main>
  );
};

export default AdminSpecialSections;
