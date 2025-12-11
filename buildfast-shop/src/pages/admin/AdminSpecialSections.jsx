import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
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

/**
 * Super Simple Special Sections Management
 * Just checkboxes - click to add menu items to sections!
 */
const AdminSpecialSections = () => {
  const containerRef = useViewportAnimationTrigger();
  const [sections, setSections] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionBusy, setSectionBusy] = useState({});
  const [itemBusy, setItemBusy] = useState({});
  const formatPrice = (value) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return '--';
    return numeric.toFixed(0);
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

  // Turn section ON/OFF
  const toggleSection = async (section) => {
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
        .update({ is_available: optimisticValue })
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
  const generateMessage = async (section) => {
    const msgs = messages[section.section_key] || [];
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];

    setSections((prev) =>
      prev.map((item) =>
        item.id === section.id ? { ...item, custom_message: randomMsg } : item
      )
    );

    try {
      const { error } = await supabase
        .from('special_sections')
        .update({ custom_message: randomMsg })
        .eq('id', section.id);

      if (error) throw error;
      toast.success('New message generated!');
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Failed to generate message');
    }
  };

  // Add/Remove menu item from section
  const toggleMenuItem = async (item, sectionKey) => {
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
        .update({ [flag]: !currentValue })
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

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;
    const term = searchTerm.toLowerCase();
    return menuItems.filter((item) => item.name?.toLowerCase().includes(term));
  }, [menuItems, searchTerm]);

  if (loading) {
    return (
      <motion.main
        className="flex h-full min-h-[400px] items-center justify-center"
        variants={pageFade}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div data-animate="fade-scale" data-animate-active="false" className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C59D5F] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading...</p>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      ref={containerRef}
      className="admin-page w-full bg-[var(--bg-main)] px-6 py-10 text-[var(--text-main)]"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="space-y-8 pb-20">
      {/* Header */}
      <div data-animate="fade-rise" data-animate-active="false" className="rounded-3xl border border-theme bg-[rgba(6,8,12,0.95)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.4)]">
        <h1 className="text-3xl font-bold text-text-main">Special Sections - Super Simple!</h1>
        <p className="mt-2 text-text-muted">
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
              <h3 className="font-bold text-text-main">{section.section_name}</h3>
              {/* ON/OFF Switch */}
              <button
                onClick={() => toggleSection(section)}
                disabled={sectionBusy[section.id]}
                className={`px-4 py-1 rounded-full text-xs font-bold transition ${
                  section.is_available
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/10 text-text-muted border border-theme-strong'
                } ${sectionBusy[section.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {sectionBusy[section.id] ? 'Saving...' : section.is_available ? 'ON' : 'OFF'}
              </button>
            </div>

            <p className="text-sm text-text-muted italic mb-3">&ldquo;{section.custom_message}&rdquo;</p>

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
      <div data-animate="fade-scale" data-animate-active="false" className="rounded-3xl border border-theme bg-[rgba(6,8,12,0.95)] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="p-6 border-b border-theme bg-[rgba(8,10,14,0.92)]">
          <h2 className="text-2xl font-bold text-text-main">Add Menu Items to Sections</h2>
          <p className="text-sm text-text-muted mt-1">Just click the checkbox to add/remove items instantly!</p>
        </div>

        <div className="px-6 py-4 border-b border-theme">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-wide text-text-muted block mb-1">
                Quick Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search menu items by name"
                className="w-full rounded-lg border border-theme bg-[rgba(15,17,21,0.75)] px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-[#C59D5F] focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/40"
              />
            </div>
            <div className="text-sm text-text-muted">
              Showing <span className="text-text-main">{filteredMenuItems.length}</span> of{' '}
              <span className="text-text-main">{menuItems.length}</span> menu items
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
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
                  className="transition hover:bg-[rgba(197,157,95,0.03)]"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-main">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-[#C59D5F] font-medium">
                    ৳{formatPrice(item.price)}
                  </td>
                  {sections.map((section) => {
                    const flag = SECTION_FLAGS[section.section_key];
                    const isChecked = item[flag];
                    const busyKey = `${item.id}-${flag}`;
                    const disabled = !!itemBusy[busyKey] || !section.is_available;

                    return (
                      <td key={section.id} className="px-4 py-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMenuItem(item, section.section_key)}
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
          <div className="p-12 text-center text-text-muted">
            No menu items found. Add some menu items first!
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="rounded-xl border border-theme bg-[rgba(8,10,14,0.92)] p-4">
        <p className="text-sm text-text-muted">
          💡 <strong className="font-semibold text-text-main">Tip:</strong> Changes are instant and real-time! Check the Order page to see your sections update automatically.
        </p>
      </div>
      </div>
    </motion.main>
  );
};

export default AdminSpecialSections;
