import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import ImageUploadModal from '../../components/admin/ImageUploadModal'
import BulkImageAssignment from '../../components/admin/BulkImageAssignment'
import { generatePlaceholderImage } from '../../lib/imageUtils'
import toast from 'react-hot-toast'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { logger } from '../../utils/logger'

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'];
const SPICE_LEVELS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Mild 🌶️' },
  { value: 2, label: 'Medium 🌶️🌶️' },
  { value: 3, label: 'Hot 🌶️🌶️🌶️' }
];

export default function AdminMenuItems() {
  const containerRef = useViewportAnimationTrigger()
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [currentItemForImage, setCurrentItemForImage] = useState(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    dietary_tags: [],
    spice_level: 0,
    prep_time: '',
    is_available: true,
    is_featured: false,
    is_todays_menu: false,
    is_daily_special: false,
    is_new_dish: false,
    is_discount_combo: false
  });

  // Fetch data
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }

  async function fetchMenuItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      logger.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle form input
  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  // Handle dietary tags
  function toggleDietaryTag(tag) {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }));
  }

  // Add menu item
  async function handleAddItem(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category_id || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          image_url: formData.image_url || null,
          dietary_tags: formData.dietary_tags,
          spice_level: parseInt(formData.spice_level),
          prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
          is_available: formData.is_available,
          is_featured: formData.is_featured,
          is_todays_menu: formData.is_todays_menu,
          is_daily_special: formData.is_daily_special,
          is_new_dish: formData.is_new_dish,
          is_discount_combo: formData.is_discount_combo
        }]);

      if (error) throw error;

      toast.success('Menu item added successfully');
      resetForm();
      fetchMenuItems();
    } catch (error) {
      logger.error('Error adding item:', error);
      toast.error(error.message || 'Failed to add item');
    }
  }

  // Update menu item
  async function handleUpdateItem(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category_id || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          image_url: formData.image_url || null,
          dietary_tags: formData.dietary_tags,
          spice_level: parseInt(formData.spice_level),
          prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
          is_available: formData.is_available,
          is_featured: formData.is_featured,
          is_todays_menu: formData.is_todays_menu,
          is_daily_special: formData.is_daily_special,
          is_new_dish: formData.is_new_dish,
          is_discount_combo: formData.is_discount_combo,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Menu item updated successfully');
      resetForm();
      fetchMenuItems();
    } catch (error) {
      logger.error('Error updating item:', error);
      toast.error(error.message || 'Failed to update item');
    }
  }

  // Delete menu item
  async function handleDeleteItem(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Menu item deleted');
      fetchMenuItems();
    } catch (error) {
      logger.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  }

  // Toggle availability
  async function toggleAvailability(item) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`${item.name} is now ${!item.is_available ? 'available' : 'unavailable'}`);
      fetchMenuItems();
    } catch (error) {
      logger.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  }

  // Edit item
  function startEdit(item) {
    setEditingItem(item);
    setFormData({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      dietary_tags: item.dietary_tags || [],
      spice_level: item.spice_level || 0,
      prep_time: item.prep_time || '',
      is_available: item.is_available,
      is_featured: item.is_featured,
      is_todays_menu: item.is_todays_menu,
      is_daily_special: item.is_daily_special,
      is_new_dish: item.is_new_dish,
      is_discount_combo: item.is_discount_combo
    });
    setShowAddForm(false);
  }

  // Reset form
  function resetForm() {
    setEditingItem(null);
    setShowAddForm(false);
    setFormData({
      category_id: '',
      name: '',
      description: '',
      price: '',
      image_url: '',
      dietary_tags: [],
      spice_level: 0,
      prep_time: '',
      is_available: true,
      is_featured: false,
      is_todays_menu: false,
      is_daily_special: false,
      is_new_dish: false,
      is_discount_combo: false
    });
  }

  // Open image modal for item
  function openImageModal(item) {
    setCurrentItemForImage(item);
    setShowImageModal(true);
  }

  // Handle image uploaded
  async function handleImageUploaded(url) {
    if (!currentItemForImage) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ image_url: url })
        .eq('id', currentItemForImage.id);

      if (error) throw error;

      toast.success('Image updated successfully');
      fetchMenuItems();
    } catch (error) {
      logger.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  }

  // Handle bulk image assignment
  async function handleBulkAssign(assignments) {
    try {
      logger.log(`Starting bulk assignment for ${assignments.length} items...`);

      let successCount = 0;
      let failCount = 0;

      for (const assignment of assignments) {
        const { error } = await supabase
          .from('menu_items')
          .update({ image_url: assignment.imageUrl })
          .eq('id', assignment.menuItemId)
          .select();

        if (error) {
          logger.error(`Failed to update item ${assignment.menuItemId}:`, error);
          failCount++;
        } else {
          logger.log(`Updated item ${assignment.menuItemId}`);
          successCount++;
        }
      }

      logger.log(`Bulk assignment complete: ${successCount} success, ${failCount} failed`);

      if (successCount > 0) {
        toast.success(`${successCount} images assigned successfully${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        await fetchMenuItems(); // Refresh the list

        // FORCE IMAGE RELOAD - Update refresh key to bypass browser cache
        setImageRefreshKey(Date.now());
        logger.log('Force refreshing all images to show new uploads');
      } else {
        toast.error('All image assignments failed. Check console for RLS policy errors.');
      }
    } catch (error) {
      logger.error('Error in bulk assignment:', error);
      toast.error('Failed to assign images');
    }
  }

  async function handleBulkDeleteImages({ scope = 'selected', itemIds = [] } = {}) {
    try {
      const getIdsByScope = () => {
        if (scope === 'selected') return itemIds;
        if (scope === 'filtered') return filteredItems.map(item => item.id);
        return menuItems.map(item => item.id);
      };

      const targetIds = Array.from(new Set(getIdsByScope().filter(Boolean)));

      if (targetIds.length === 0) {
        toast.error('No menu items selected for image deletion');
        return;
      }

      logger.log(`Clearing images for ${targetIds.length} menu items (scope: ${scope})`);

      const chunkSize = 100;
      let clearedCount = 0;

      for (let i = 0; i < targetIds.length; i += chunkSize) {
        const chunk = targetIds.slice(i, i + chunkSize);
        const { error, data } = await supabase
          .from('menu_items')
          .update({ image_url: null })
          .in('id', chunk)
          .select('id');

        if (error) {
          logger.error('Failed to clear images for chunk:', chunk, error);
          throw error;
        }

        clearedCount += data?.length || 0;
      }

      toast.success(`Cleared images for ${clearedCount} menu item${clearedCount === 1 ? '' : 's'}`);
      await fetchMenuItems();
      setImageRefreshKey(Date.now());
    } catch (error) {
      logger.error('Error clearing images:', error);
      toast.error(error.message || 'Failed to clear images');
    }
  }

  // Get image display with proper validation
  function getImageDisplay(item) {
    if (item.image_url && item.image_url.trim() !== '') {
      // Add cache-busting timestamp to FORCE browser reload
      const url = item.image_url.trim();
      const separator = url.includes('?') ? '&' : '?';
      const cacheBustedUrl = `${url}${separator}refresh=${imageRefreshKey}`;
      logger.log(`Displaying image for ${item.name}:`, cacheBustedUrl);
      return cacheBustedUrl;
    }
    logger.log(`Using placeholder for ${item.name}`);
    return generatePlaceholderImage(item.name);
  }

  if (loading) {
    return (
      <div className="h-full min-h-[400px] bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <div
          className="text-center"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-text-muted">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        {/* Header Section */}
        <header className="mb-10" data-animate="fade-rise" data-animate-active="false">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text-main mb-2">Menu Items</h1>
          <p className="text-sm sm:text-base text-text-muted">Manage your Star Café menu items with powerful image controls</p>
        </header>

        {/* Minimalist Modern Toolbar - Option 1 + 4 Combined */}
        <div
          className="mb-8"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          {/* Top Row: Actions + Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 md:gap-6 mb-4">

            {/* Left: Quick Action Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-3 min-h-[44px] text-sm sm:text-base font-medium text-[#111] bg-[#C59D5F] hover:bg-[#D4AF6A] rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Item
              </button>

              <button
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-3 min-h-[44px] text-sm sm:text-base font-medium text-text-main hover:text-gold border border-gray-700 hover:border-gold rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Images
              </button>

            </div>

            {/* Right: Filters */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-3 pr-8 py-3 min-h-[44px] text-sm sm:text-base bg-transparent border border-gray-700 hover:border-gold focus:border-gold focus:outline-none rounded-md text-text-main transition-colors cursor-pointer appearance-none"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-3 py-3 min-h-[44px] text-sm sm:text-base bg-transparent border border-gray-700 hover:border-gold focus:border-gold focus:outline-none rounded-md text-text-main placeholder-text-muted transition-colors w-48"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Row: Clean Separator + Count */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-1 text-sm sm:text-base">
              <span className="text-gold font-medium">{filteredItems.length}</span>
              <span className="text-text-muted">items</span>
              {selectedCategory !== 'all' && (
                <span className="ml-2 text-[10px] sm:text-xs text-gold">• filtered</span>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingItem) && (
          <div
            className="card-soft p-4 sm:p-6 md:p-10 mb-6"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <h2 className="text-lg sm:text-xl font-bold text-text-main mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4">
                {/* Category */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 min-h-[44px] bg-dark-bg-secondary border border-gray-700 rounded-lg text-sm sm:text-base text-text-main focus:outline-none focus:border-gold hover:border-gold transition-colors cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                    required
                  >
                    <option value="" className="bg-dark-bg text-text-muted py-2">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-dark-bg text-text-main py-2">{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 min-h-[44px] bg-dark-bg-secondary border border-gray-700 rounded-lg text-sm sm:text-base text-text-main focus:outline-none focus:border-gold"
                    placeholder="e.g., Chicken Tikka Masala"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                    Price (BDT) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 min-h-[44px] bg-dark-bg-secondary border border-gray-700 rounded-lg text-sm sm:text-base text-text-main focus:outline-none focus:border-gold"
                    placeholder="250"
                    step="0.01"
                    required
                  />
                </div>

                {/* Prep Time */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="prep_time"
                    value={formData.prep_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 min-h-[44px] bg-dark-bg-secondary border border-gray-700 rounded-lg text-sm sm:text-base text-text-main focus:outline-none focus:border-gold"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 min-h-[44px] bg-dark-bg-secondary border border-gray-700 rounded-lg text-sm sm:text-base text-text-main focus:outline-none focus:border-gold"
                  placeholder="Brief description of the dish"
                  rows="2"
                />
              </div>

              {/* Image URL */}
              <div className="mb-4">
                <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 min-h-[44px] bg-dark-bg-secondary border border-gray-700 rounded-lg text-sm sm:text-base text-text-main focus:outline-none focus:border-gold"
                  placeholder="/images/menu/dish-name.webp"
                />
              </div>

              {/* Spice Level */}
              <div className="mb-4">
                <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                  Spice Level
                </label>
                <select
                  name="spice_level"
                  value={formData.spice_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 min-h-[44px] bg-dark-bg-secondary border border-gray-700 rounded-lg text-sm sm:text-base text-text-main focus:outline-none focus:border-gold hover:border-gold transition-colors cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  {SPICE_LEVELS.map(level => (
                    <option key={level.value} value={level.value} className="bg-dark-bg text-text-main py-2">{level.label}</option>
                  ))}
                </select>
              </div>

              {/* Dietary Tags */}
              <div className="mb-4">
                <label className="block text-sm sm:text-base font-medium text-text-main mb-2">
                  Dietary Tags
                </label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {DIETARY_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietaryTag(tag)}
                      className={`px-3 py-3 min-h-[44px] rounded-full text-sm sm:text-base transition-colors ${
                        formData.dietary_tags.includes(tag)
                          ? 'bg-green-600 text-black'
                          : 'bg-dark-bg-secondary text-text-muted border border-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {[
                  { name: 'is_available', label: 'Available' },
                  { name: 'is_featured', label: "Chef's Pick" },
                  { name: 'is_todays_menu', label: "Today's Menu" },
                  { name: 'is_daily_special', label: 'Daily Special' },
                  { name: 'is_new_dish', label: 'New Dish' },
                  { name: 'is_discount_combo', label: 'Discount Combo' }
                ].map(toggle => (
                  <label key={toggle.name} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name={toggle.name}
                      checked={formData[toggle.name]}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-gold focus:ring-gold"
                    />
                    <span className="text-sm sm:text-base text-text-main">{toggle.label}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 sm:gap-4">
                <button type="submit" className="btn-primary min-h-[44px] py-3 text-sm sm:text-base">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button type="button" onClick={resetForm} className="btn-outline min-h-[44px] py-3 text-sm sm:text-base">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="card-soft overflow-hidden hover:shadow-xl transition-transform"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              {/* Image Section */}
              <div className="relative group bg-[var(--bg-main)] overflow-hidden">
                <img
                  key={`${item.id}-${imageRefreshKey}`}
                  src={getImageDisplay(item)}
                  alt={item.name}
                  className="w-full h-48 object-cover bg-[var(--bg-main)] transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="eager"
                  onLoad={(e) => {
                    logger.log(`Image loaded successfully for ${item.name}`);
                    e.target.style.opacity = '1';
                  }}
                  onError={(e) => {
                    logger.error(`FAILED to load image for ${item.name}:`);
                    logger.error(`   URL: ${e.target.src}`);
                    logger.error(`   Falling back to placeholder`);
                    e.target.src = generatePlaceholderImage(item.name);
                  }}
                  style={{ opacity: 1, transition: 'opacity 0.3s' }}
                />
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between transition-all duration-300 bg-gradient-to-b from-black/0 via-black/0 to-black/40 opacity-0 group-hover:opacity-100">
                  <div className="flex justify-end p-3">
                    <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[var(--bg-main)]/50 text-[var(--text-main)] text-[11px] tracking-wide px-3 py-1 shadow-lg">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 7h2l1-2h8l1 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                      Image tools
                    </span>
                  </div>
                  <div className="pointer-events-auto flex justify-end p-4">
                    <button
                      onClick={() => openImageModal(item)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/95 text-dark-bg px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gold/70 transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      Manage Image
                    </button>
                  </div>
                </div>
                {!item.is_available && (
                  <div className="absolute top-2 right-2 bg-red-600 text-black px-3 py-1 rounded-full text-xs font-semibold">
                    Unavailable
                  </div>
                )}
                {item.is_featured && (
                  <div className="absolute top-2 left-2 bg-gold text-dark-bg px-3 py-1 rounded-full text-xs font-semibold">
                    ⭐ Chef&apos;s Pick
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <div className="mb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-text-main mb-1">{item.name}</h3>
                  <p className="text-[10px] sm:text-xs text-text-muted">
                    {item.menu_categories?.name || 'Uncategorized'}
                  </p>
                </div>

                {item.description && (
                  <p className="text-sm sm:text-base text-text-muted mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg sm:text-xl font-bold text-gold">
                    ৳{typeof item.price === 'number' ? item.price.toFixed(0) : parseFloat(item.price || 0).toFixed(0)}
                  </span>
                  {item.prep_time && (
                    <span className="text-[10px] sm:text-xs text-text-muted">⏱️ {item.prep_time} min</span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.spice_level > 0 && (
                    <span className="text-[10px] sm:text-xs bg-red-900 bg-opacity-30 text-red-400 px-2 py-1 rounded">
                      {'🌶️'.repeat(item.spice_level)}
                    </span>
                  )}
                  {item.dietary_tags?.map(tag => (
                    <span key={tag} className="text-[10px] sm:text-xs bg-green-900 bg-opacity-30 text-green-400 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`flex-1 px-3 py-3 min-h-[44px] rounded-lg text-sm sm:text-base font-semibold transition-colors ${
                      item.is_available
                        ? 'bg-green-600 text-black hover:bg-green-700'
                        : 'bg-gray-600 text-[var(--text-main)] hover:bg-gray-700'
                    }`}
                  >
                    {item.is_available ? '✓ Available' : '✕ Unavailable'}
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    className="px-4 py-3 min-h-[44px] bg-gold text-dark-bg rounded-lg hover:bg-gold-dark transition-colors text-sm sm:text-base"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="px-4 py-3 min-h-[44px] bg-red-600 text-black rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div
            className="card-soft p-12 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-text-muted text-lg sm:text-xl mb-2">No menu items found</p>
            <p className="text-text-muted text-sm sm:text-base">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first menu item to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setCurrentItemForImage(null);
        }}
        onImageUploaded={handleImageUploaded}
        dishName={currentItemForImage?.name || ''}
      />

      <BulkImageAssignment
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        menuItems={menuItems}
        filteredItems={filteredItems}
        onBulkAssign={handleBulkAssign}
        onBulkDelete={handleBulkDeleteImages}
      />
    </motion.main>
  );
}
