import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger';
import { logger } from '../../utils/logger';

export default function AdminMenuCategories() {
  const containerRef = useViewportAnimationTrigger();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0
  });

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate slug from name
  function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Handle form input
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !editingCategory ? { slug: generateSlug(value) } : {})
    }));
  }

  // Add new category
  async function handleAddCategory(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_categories')
        .insert([{
          name: formData.name.trim(),
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description.trim() || null,
          sort_order: formData.sort_order !== '' && formData.sort_order != null
            ? parseInt(formData.sort_order)
            : categories.length + 1
        }]);

      if (error) throw error;

      toast.success('Category added successfully');
      setShowAddForm(false);
      setFormData({ name: '', slug: '', description: '', sort_order: 0 });
      fetchCategories();
    } catch (error) {
      logger.error('Error adding category:', error);
      toast.error(error.message || 'Failed to add category');
    }
  }

  // Update category
  async function handleUpdateCategory(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({
          name: formData.name.trim(),
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description.trim() || null,
          sort_order: formData.sort_order
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast.success('Category updated successfully');
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', sort_order: 0 });
      fetchCategories();
    } catch (error) {
      logger.error('Error updating category:', error);
      toast.error(error.message || 'Failed to update category');
    }
  }

  // Delete category
  async function handleDeleteCategory(id, name) {
    if (!confirm(`Delete category "${name}"? This will also delete all menu items in this category.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      logger.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  }

  // Edit category
  function startEdit(category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order
    });
    setShowAddForm(false);
  }

  // Cancel edit/add
  function cancelForm() {
    setEditingCategory(null);
    setShowAddForm(false);
    setFormData({ name: '', slug: '', description: '', sort_order: 0 });
  }

  // Move category up/down
  async function moveCategory(category, direction) {
    const currentIndex = categories.findIndex(c => c.id === category.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapCategory = categories[swapIndex];

    try {
      // Swap sort_order
      await supabase
        .from('menu_categories')
        .update({ sort_order: swapCategory.sort_order })
        .eq('id', category.id);

      await supabase
        .from('menu_categories')
        .update({ sort_order: category.sort_order })
        .eq('id', swapCategory.id);

      fetchCategories();
    } catch (error) {
      logger.error('Error moving category:', error);
      toast.error('Failed to reorder categories');
    }
  }

  if (loading) {
    return (
      <div className="h-full min-h-[400px] bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-text-muted">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} data-animate="fade-scale" data-animate-active="false" className="admin-page w-full bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="app-container space-y-8 py-10">
        <header data-animate="fade-rise" data-animate-active="false" className="glow-surface glow-strong flex flex-col gap-4 rounded-2xl border border-theme bg-[rgba(255,255,255,0.03)] px-6 py-6 shadow-[0_25px_60px_-40px_rgba(5,5,9,0.85)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-main mb-2">Menu Categories</h1>
            <p className="text-text-muted">Manage your Star Café menu categories</p>
          </div>
        </header>

        {/* Add New Button */}
        {!showAddForm && !editingCategory && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary mb-6"
          >
            + Add New Category
          </button>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingCategory) && (
          <div data-animate="fade-scale" data-animate-active="false" className="glow-surface glow-strong w-full max-w-xl rounded-3xl border border-theme bg-[rgba(5,5,9,0.97)] shadow-[0_35px_80px_-45px_rgba(5,5,9,0.9)]">
            <header className="flex items-center justify-between border-b border-theme px-6 py-4">
              <h2 className="text-lg font-semibold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            </header>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-bg-secondary border border-gray-700 rounded-lg text-text-main focus:outline-none focus:border-gold"
                    placeholder="e.g., Biryani Items"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Slug (URL-friendly)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-bg-secondary border border-gray-700 rounded-lg text-text-main focus:outline-none focus:border-gold"
                    placeholder="Auto-generated from name"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-main mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-bg-secondary border border-gray-700 rounded-lg text-text-main focus:outline-none focus:border-gold"
                  placeholder="Brief description of this category"
                  rows="2"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-main mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-bg-secondary border border-gray-700 rounded-lg text-text-main focus:outline-none focus:border-gold"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <section data-animate="fade-scale" data-animate-active="false" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <article
              key={category.id}
              className="glow-surface glow-strong flex flex-col gap-4 rounded-2xl border border-theme bg-[rgba(5,5,9,0.92)] p-5 shadow-[0_20px_65px_-40px_rgba(5,5,9,0.85)]"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-text-main">
                    {category.name}
                  </h3>
                  <span className="text-xs text-text-muted bg-dark-bg-secondary px-2 py-1 rounded">
                    /{category.slug}
                  </span>
                </div>
                {category.description && (
                  <p className="text-sm text-text-muted mb-2">{category.description}</p>
                )}
                <p className="text-xs text-text-muted">Sort order: {category.sort_order}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Move Up */}
                <button
                  onClick={() => moveCategory(category, 'up')}
                  disabled={index === 0}
                  className="p-2 text-text-muted hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  ↑
                </button>

                {/* Move Down */}
                <button
                  onClick={() => moveCategory(category, 'down')}
                  disabled={index === categories.length - 1}
                  className="p-2 text-text-muted hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  ↓
                </button>

                {/* Edit */}
                <button
                  onClick={() => startEdit(category)}
                  className="px-4 py-2 bg-gold text-dark-bg rounded-lg hover:bg-gold-dark transition-colors"
                >
                  Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
