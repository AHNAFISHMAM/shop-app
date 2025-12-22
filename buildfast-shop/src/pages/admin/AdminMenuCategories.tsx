import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { logger } from '../../utils/logger';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export default function AdminMenuCategories() {
  const containerRef = useViewportAnimationTrigger();
  const containerElementRef = useRef(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    sort_order: 0
  });

  // Body scroll lock for modal
  useBodyScrollLock(showModal);

  // Keyboard handler for modal
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Combined ref callback
  const combinedRef = useCallback((node) => {
    containerRef(node);
    containerElementRef.current = node;
  }, [containerRef]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Force animation activation after categories load
  useEffect(() => {
    if (!loading && categories.length > 0 && containerElementRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const elements = containerElementRef.current?.querySelectorAll('[data-animate="fade-rise"]');
        elements?.forEach((el) => {
          if (el.dataset.animateActive === 'false') {
            // Trigger activation by simulating intersection
            el.dataset.animateActive = 'true';
          }
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, categories.length]);

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
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Handle form input
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !editingCategory ? { slug: generateSlug(value) } : {})
    }));
  }

  // Add new category
  async function handleAddCategory(e: React.FormEvent) {
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
      closeModal();
      fetchCategories();
    } catch (error) {
      logger.error('Error adding category:', error);
      toast.error(error.message || 'Failed to add category');
    }
  }

  // Update category
  async function handleUpdateCategory(e: React.FormEvent) {
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
      closeModal();
      fetchCategories();
    } catch (error) {
      logger.error('Error updating category:', error);
      toast.error(error.message || 'Failed to update category');
    }
  }

  // Open delete confirmation
  function openDeleteConfirm(id: string, name: string) {
    setCategoryToDelete({ id, name });
    setShowDeleteConfirm(true);
  }

  // Delete category
  async function handleDeleteCategory() {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast.success('Category deleted successfully');
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      logger.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  }

  // Open modal for add
  function openAddModal() {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', sort_order: 0 });
    setShowModal(true);
  }

  // Open modal for edit
  function openEditModal(category: MenuCategory) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order
    });
    setShowModal(true);
  }

  // Close modal
  function closeModal() {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', sort_order: 0 });
  }

  // Move category up/down
  async function moveCategory(category: MenuCategory, direction: 'up' | 'down') {
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
    <div ref={combinedRef} className="admin-page w-full bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="app-container space-y-8 py-10">
        <header data-animate="fade-rise" data-animate-active="false" className="glow-surface glow-soft flex flex-col gap-4 rounded-2xl border border-theme bg-[rgba(255,255,255,0.03)] px-6 py-6 shadow-[0_25px_60px_-40px_rgba(5,5,9,0.85)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-main mb-2">Menu Categories</h1>
            <p className="text-text-muted">Manage your Star Café menu categories</p>
          </div>
        </header>

        {/* Add New Button */}
        <button
          onClick={openAddModal}
          className="btn-primary mb-6"
        >
          + Add New Category
        </button>

        {/* Categories List */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <article
              key={category.id}
              className="glow-surface glow-soft flex flex-col gap-4 rounded-2xl border border-theme bg-[rgba(5,5,9,0.92)] p-5 shadow-[0_20px_65px_-40px_rgba(5,5,9,0.85)]"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: `${index * 50}ms` }}
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
                  onClick={() => openEditModal(category)}
                  className="px-4 py-2 bg-gold text-dark-bg rounded-lg hover:bg-gold-dark transition-colors"
                >
                  Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => openDeleteConfirm(category.id, category.name)}
                  className="px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Add/Edit Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showModal && (
            <m.div
              className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm overflow-y-auto z-[99998]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-modal-title"
              onClick={closeModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                minHeight: '100vh',
                paddingTop: '1rem',
                paddingBottom: '1rem'
              }}
            >
              <m.div
                className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-[rgba(197,157,95,0.3)] bg-[var(--bg-main)] shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-[99999]"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C59D5F] via-[#D4AF6A] to-[#C59D5F]"></div>

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 sm:p-8 border-b border-[rgba(197,157,95,0.2)] bg-[var(--bg-main)]">
                  <div>
                    <h2 id="category-modal-title" className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] mb-2">
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--text-muted)]">
                      {editingCategory ? 'Update category details' : 'Create a new menu category'}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C59D5F]"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6 text-[var(--text-main)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form Content */}
                <div className="p-6 sm:p-8">
                  <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-6 relative z-10 pointer-events-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                          Category Name <span className="text-[#C59D5F]">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 min-h-[44px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300"
                          placeholder="e.g., Biryani Items"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                          Slug (URL-friendly)
                        </label>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 min-h-[44px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300"
                          placeholder="Auto-generated from name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 min-h-[100px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300 resize-none"
                        placeholder="Brief description of this category"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        name="sort_order"
                        value={formData.sort_order}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 min-h-[44px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300"
                        placeholder="0"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[rgba(197,157,95,0.2)]">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 min-h-[44px] bg-gradient-to-r from-[#C59D5F] to-[#D4AF6A] text-black font-semibold rounded-lg hover:from-[#D4AF6A] hover:to-[#C59D5F] transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {editingCategory ? 'Update Category' : 'Add Category'}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-3 min-h-[44px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] text-[var(--text-main)] font-semibold rounded-lg hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(197,157,95,0.4)] transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?\n\nThis will also delete all menu items in this category. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
