import { useState, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useMenuCategories } from '@/features/menu/hooks'
import {
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
  useReorderMenuCategories,
} from '@/features/menu/hooks'
import type { Database } from '@/lib/database.types'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

type Category = Database['public']['Tables']['menu_categories']['Row']

interface CategoryFormData {
  name: string
  slug: string
  description: string
  sort_order: number
  is_active: boolean
}

function AdminMenuCategories() {
  const { categories, loading, error } = useMenuCategories()
  const createMutation = useCreateMenuCategory()
  const updateMutation = useUpdateMenuCategory()
  const deleteMutation = useDeleteMenuCategory()
  const reorderMutation = useReorderMenuCategories()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    sort_order:
      categories.length > 0
        ? Math.max(...categories.map((c: Category) => c.sort_order || 0)) + 1
        : 0,
    is_active: true,
  })

  // Generate slug from name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }, [])

  const handleNameChange = useCallback(
    (name: string) => {
      setFormData(prev => ({
        ...prev,
        name,
        slug: prev.slug || generateSlug(name),
      }))
    },
    [generateSlug]
  )

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      sort_order:
        categories.length > 0
          ? Math.max(...categories.map((c: Category) => c.sort_order || 0)) + 1
          : 0,
      is_active: true,
    })
    setEditingCategory(null)
  }, [categories])

  const handleCreate = useCallback(async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required')
      return
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      })
      toast.success('Category created successfully')
      setShowAddModal(false)
      resetForm()
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Failed to create category')
    }
  }, [formData, createMutation, resetForm])

  const handleUpdate = useCallback(async () => {
    if (!editingCategory) return
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        data: {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        },
      })
      toast.success('Category updated successfully')
      setEditingCategory(null)
      resetForm()
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Failed to update category')
    }
  }, [editingCategory, formData, updateMutation, resetForm])

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return

    try {
      await deleteMutation.mutateAsync(deleteConfirm.id)
      toast.success('Category deleted successfully')
      setDeleteConfirm(null)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Failed to delete category')
    }
  }, [deleteConfirm, deleteMutation])

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active ?? true,
    })
    setShowAddModal(true)
  }, [])

  const handleMoveCategory = useCallback(
    (categoryId: string, direction: 'up' | 'down') => {
      const sortedCategories = [...categories].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      )
      const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId)

      if (currentIndex === -1) return

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (newIndex < 0 || newIndex >= sortedCategories.length) return

      const reordered = [...sortedCategories]
      const [removed] = reordered.splice(currentIndex, 1)
      reordered.splice(newIndex, 0, removed)

      const updates = reordered.map((cat, idx) => ({
        id: cat.id,
        sort_order: idx,
      }))

      reorderMutation.mutate(updates, {
        onSuccess: () => {
          toast.success('Category moved successfully')
        },
        onError: (err: Error) => {
          toast.error(err.message || 'Failed to move category')
        },
      })
    },
    [categories, reorderMutation]
  )

  const filteredCategories = categories.filter(
    (cat: Category) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const sortedCategories = [...filteredCategories].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  )

  if (error) {
    return (
      <div className="p-6 bg-[var(--bg-main)] text-[var(--text-main)]">
        <div className="rounded-lg bg-[rgba(239,68,68,0.1)] border border-red-500/30 p-4">
          <p className="text-red-400">Error loading categories: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Menu Categories</h1>
          <p className="text-sm text-muted mt-1">Manage menu categories and their order</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-black rounded-lg hover:opacity-90 transition-colors min-h-[44px] font-medium shadow-[0_4px_12px_rgba(197,157,95,0.3)]"
          aria-label="Add new category"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-theme rounded-lg bg-[var(--bg-main)] text-[var(--text-main)] placeholder:text-muted focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition min-h-[44px]"
          aria-label="Search categories"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[var(--accent)]/30 border-t-[var(--accent)]"></div>
        </div>
      )}

      {/* Categories List */}
      {!loading && (
        <>
          {sortedCategories.length === 0 ? (
            <div className="text-center py-12 bg-[rgba(255,255,255,0.02)] rounded-lg border border-theme">
              <p className="text-muted">
                {searchTerm
                  ? 'No categories found matching your search'
                  : 'No categories yet. Create your first category!'}
              </p>
            </div>
          ) : (
            <div className="bg-[rgba(255,255,255,0.02)] rounded-lg border border-theme overflow-hidden glow-surface">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[rgba(255,255,255,0.03)] border-b border-theme">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider w-12">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    <AnimatePresence>
                      {sortedCategories.map((category, index) => (
                        <m.tr
                          key={category.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => handleMoveCategory(category.id, 'up')}
                                  disabled={index === 0}
                                  className="text-muted hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed min-h-[22px] min-w-[22px] flex items-center justify-center transition-colors"
                                  aria-label={`Move ${category.name} up`}
                                  type="button"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 15l7-7 7 7"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleMoveCategory(category.id, 'down')}
                                  disabled={index === sortedCategories.length - 1}
                                  className="text-muted hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed min-h-[22px] min-w-[22px] flex items-center justify-center transition-colors"
                                  aria-label={`Move ${category.name} down`}
                                  type="button"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              </div>
                              <span className="text-sm text-muted ml-1">
                                {category.sort_order ?? index}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-[var(--text-main)]">
                              {category.name}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-muted font-mono">{category.slug}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-muted max-w-xs truncate">
                              {category.description || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                category.is_active
                                  ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                                  : 'bg-[rgba(255,255,255,0.05)] text-muted border border-theme'
                              }`}
                            >
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(category)}
                                className="text-[var(--accent)] hover:text-[var(--accent)]/80 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                                aria-label={`Edit ${category.name}`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(category)}
                                className="text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                                aria-label={`Delete ${category.name}`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </m.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-muted">
            Showing {sortedCategories.length} of {categories.length} categories
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddModal(false)
              resetForm()
            }}
          >
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-main)] rounded-lg border border-theme shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto glow-surface"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-[var(--text-main)]">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[var(--text-main)] mb-1"
                    >
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 border border-theme rounded-lg bg-[var(--bg-main)] text-[var(--text-main)] placeholder:text-muted focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition min-h-[44px]"
                      placeholder="e.g., Appetizers"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="slug"
                      className="block text-sm font-medium text-[var(--text-main)] mb-1"
                    >
                      Slug <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border border-theme rounded-lg bg-[var(--bg-main)] text-[var(--text-main)] placeholder:text-muted focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 font-mono text-sm transition min-h-[44px]"
                      placeholder="e.g., appetizers"
                      required
                    />
                    <p className="mt-1 text-xs text-muted">
                      URL-friendly identifier (auto-generated from name)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-[var(--text-main)] mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-theme rounded-lg bg-[var(--bg-main)] text-[var(--text-main)] placeholder:text-muted focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition resize-none"
                      placeholder="Optional description for this category"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="sort_order"
                        className="block text-sm font-medium text-[var(--text-main)] mb-1"
                      >
                        Sort Order
                      </label>
                      <input
                        id="sort_order"
                        type="number"
                        value={formData.sort_order}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            sort_order: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-theme rounded-lg bg-[var(--bg-main)] text-[var(--text-main)] focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition min-h-[44px]"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
                        Status
                      </label>
                      <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={e =>
                              setFormData(prev => ({ ...prev, is_active: e.target.checked }))
                            }
                            className="w-4 h-4 text-[var(--accent)] border-theme rounded focus:ring-[var(--accent)]/30 bg-[var(--bg-main)]"
                          />
                          <span className="text-sm text-[var(--text-main)]">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-theme rounded-lg text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.05)] transition-colors min-h-[44px] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingCategory ? handleUpdate : handleCreate}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-[var(--accent)] text-black rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium shadow-[0_4px_12px_rgba(197,157,95,0.3)]"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editingCategory
                        ? 'Update'
                        : 'Create'}
                  </button>
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmationModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  )
}

export default AdminMenuCategories
