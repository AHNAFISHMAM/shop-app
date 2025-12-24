# 🎛️ Master Admin Panel Prompt

> **Comprehensive guide for building production-ready admin dashboards with permission-based access control**

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Route Protection](#route-protection)
3. [Permission System](#permission-system)
4. [Admin Components](#admin-components)
5. [Data Management](#data-management)
6. [Feature Flags](#feature-flags)
7. [Settings Management](#settings-management)
8. [Customer Management](#customer-management)
9. [Order Management](#order-management)
10. [Menu Management](#menu-management)
11. [Real-time Updates](#real-time-updates)
12. [Testing Patterns](#testing-patterns)

---

## 1. Architecture Overview

### Admin Structure

```
src/pages/admin/
├── Admin.tsx                    # Main admin layout/router
├── AdminSettings.tsx            # Store settings
├── AdminCustomers.tsx           # Customer management
├── AdminOrders.tsx              # Order management
├── AdminMenuItems.tsx           # Menu item management
├── AdminMenuCategories.tsx      # Category management
├── AdminDiscountCodes.tsx       # Discount code management
├── AdminReservations.tsx        # Reservation management
├── AdminGallery.tsx             # Gallery management
├── AdminFeatureFlags.tsx        # Feature flag management
├── AdminManageAdmins.tsx        # Admin user management
└── AdminAppearance.tsx          # Theme/appearance settings
```

### Core Principles

1. **Permission-Based Access**: Check permissions before rendering
2. **Type Safety**: Full TypeScript coverage
3. **Real-time Updates**: Live data synchronization
4. **Bulk Operations**: Efficient batch processing
5. **Error Recovery**: Graceful error handling
6. **Audit Trail**: Log all admin actions

---

## 2. Route Protection

### Admin Route Guard

```typescript
// Admin.tsx - Main admin router
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminPermissions } from '@/hooks/useAdminPermissions'

export default function Admin() {
  const { user, loading } = useAuth()
  const { isAdmin, hasPermission, loading: permissionsLoading } = 
    useAdminPermissions(user?.id)
  
  if (loading || permissionsLoading) {
    return <AdminLoadingScreen />
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <AdminLayout>
      <Routes>
        <Route 
          path="settings" 
          element={
            hasPermission('manage_settings') ? (
              <AdminSettings />
            ) : (
              <AdminUnauthorized />
            )
          } 
        />
        <Route 
          path="customers" 
          element={
            hasPermission('view_customers') ? (
              <AdminCustomers />
            ) : (
              <AdminUnauthorized />
            )
          } 
        />
        {/* ... other routes */}
      </Routes>
    </AdminLayout>
  )
}
```

### Permission Hook

```typescript
// hooks/useAdminPermissions.ts
export function useAdminPermissions(userId: string | undefined) {
  const { data: adminUser, isLoading } = useQuery({
    queryKey: ['admin-permissions', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('permissions, role')
        .eq('user_id', userId)
        .single()
      
      if (error || !data) return null
      return data
    },
    enabled: !!userId,
  })
  
  const isAdmin = !!adminUser
  const permissions = adminUser?.permissions || []
  const role = adminUser?.role || null
  
  const hasPermission = useCallback((permission: string) => {
    if (role === 'super_admin') return true
    return permissions.includes(permission)
  }, [permissions, role])
  
  return {
    isAdmin,
    hasPermission,
    permissions,
    role,
    loading: isLoading,
  }
}
```

---

## 3. Permission System

### Permission Types

```typescript
// types/admin.ts
export type AdminPermission =
  | 'view_dashboard'
  | 'view_orders'
  | 'manage_orders'
  | 'view_customers'
  | 'manage_customers'
  | 'view_menu'
  | 'manage_menu'
  | 'manage_settings'
  | 'manage_admins'
  | 'view_analytics'
  | 'manage_reservations'
  | 'manage_discounts'

export type AdminRole = 
  | 'super_admin'    // All permissions
  | 'admin'          // Most permissions
  | 'manager'        // Limited permissions
  | 'viewer'         // Read-only

export interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  permissions: AdminPermission[]
  created_at: string
  updated_at: string
}
```

### Permission-Based Rendering

```typescript
// Conditional rendering based on permissions
{hasPermission('manage_customers') && (
  <button onClick={handleAddCustomer}>
    Add Customer
  </button>
)}

{hasPermission('view_orders') && (
  <AdminOrdersTable />
)}

{role === 'super_admin' && (
  <AdminManageAdmins />
)}
```

---

## 4. Admin Components

### Data Table Pattern

```typescript
// components/admin/AdminDataTable.tsx
interface AdminDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onBulkAction?: (items: T[]) => void
  loading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
}

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onBulkAction,
  loading,
  pagination,
}: AdminDataTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  return (
    <div className="admin-data-table">
      {selectedItems.length > 0 && onBulkAction && (
        <BulkActionBar
          selectedCount={selectedItems.length}
          onAction={handleBulkAction}
        />
      )}
      
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedItems.length === data.length}
                onChange={handleSelectAll}
              />
            </th>
            {columns.map(col => (
              <th key={col.id}>{col.header}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                />
              </td>
              {columns.map(col => (
                <td key={col.id}>
                  {col.cell ? col.cell(item) : item[col.accessor]}
                </td>
              ))}
              <td>
                <ActionButtons
                  onEdit={onEdit ? () => onEdit(item) : undefined}
                  onDelete={onDelete ? () => onDelete(item) : undefined}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && (
        <Pagination
          current={pagination.page}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}
```

### Form Modal Pattern

```typescript
// components/admin/AdminFormModal.tsx
interface AdminFormModalProps<T> {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: T) => Promise<void>
  initialData?: Partial<T>
  title: string
  fields: FormField[]
  validation?: (data: T) => ValidationResult
}

export function AdminFormModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  fields,
  validation,
}: AdminFormModalProps<T>) {
  const [formData, setFormData] = useState<T>(initialData as T || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validation) {
      const result = validation(formData)
      if (!result.valid) {
        setErrors(result.errors)
        return
      }
    }
    
    setSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      setErrors({ submit: error.message })
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>{title}</h2>
        
        {fields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={(value) => 
              setFormData(prev => ({ ...prev, [field.name]: value }))
            }
            error={errors[field.name]}
          />
        ))}
        
        {errors.submit && (
          <ErrorMessage>{errors.submit}</ErrorMessage>
        )}
        
        <div className="form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

---

## 5. Data Management

### CRUD Operations Hook

```typescript
// hooks/useAdminCRUD.ts
export function useAdminCRUD<T extends { id: string }>(
  tableName: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: Error) => void
  }
) {
  const queryClient = useQueryClient()
  
  const create = useMutation({
    mutationFn: async (data: Omit<T, 'id'>) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
  
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
  
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
  
  const bulkUpdate = useMutation({
    mutationFn: async ({ 
      ids, 
      data 
    }: { 
      ids: string[]
      data: Partial<T> 
    }) => {
      const { error } = await supabase
        .from(tableName)
        .update(data)
        .in('id', ids)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
  
  return {
    create,
    update,
    remove,
    bulkUpdate,
  }
}
```

---

## 6. Feature Flags

### Feature Flag Management

```typescript
// pages/admin/AdminFeatureFlags.tsx
export default function AdminFeatureFlags() {
  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags,
  })
  
  const updateFlag = useMutation({
    mutationFn: async ({ 
      flag, 
      enabled 
    }: { 
      flag: string
      enabled: boolean 
    }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('flag', flag)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })
  
  return (
    <div className="admin-feature-flags">
      <h1>Feature Flags</h1>
      
      {flags?.map(flag => (
        <FeatureFlagToggle
          key={flag.flag}
          flag={flag.flag}
          label={flag.label}
          description={flag.description}
          enabled={flag.enabled}
          onChange={(enabled) => 
            updateFlag.mutate({ flag: flag.flag, enabled })
          }
        />
      ))}
    </div>
  )
}
```

---

## 7. Settings Management

### Settings Form Pattern

```typescript
// pages/admin/AdminSettings.tsx
export default function AdminSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: fetchStoreSettings,
  })
  
  const [formData, setFormData] = useState<StoreSettings | null>(null)
  
  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])
  
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<StoreSettings>) => {
      const { error } = await supabase
        .from('store_settings')
        .update(data)
        .eq('id', 1) // Assuming single settings record
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] })
      toast.success('Settings updated successfully')
    },
  })
  
  if (isLoading || !formData) {
    return <LoadingSpinner />
  }
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      updateSettings.mutate(formData)
    }}>
      <SettingsSection
        title="Store Information"
        fields={[
          { name: 'store_name', label: 'Store Name', type: 'text' },
          { name: 'store_description', label: 'Description', type: 'textarea' },
        ]}
        data={formData}
        onChange={setFormData}
      />
      
      <SettingsSection
        title="Shipping"
        fields={[
          { name: 'shipping_cost', label: 'Shipping Cost', type: 'number' },
          { name: 'free_shipping_threshold', label: 'Free Shipping Threshold', type: 'number' },
        ]}
        data={formData}
        onChange={setFormData}
      />
      
      <button type="submit" disabled={updateSettings.isPending}>
        Save Settings
      </button>
    </form>
  )
}
```

---

## 8. Customer Management

### Customer List with Filters

```typescript
// pages/admin/AdminCustomers.tsx
export default function AdminCustomers() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  })
  
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', filters],
    queryFn: () => fetchCustomers(filters),
  })
  
  const { remove, bulkUpdate } = useAdminCRUD('customers')
  
  return (
    <div className="admin-customers">
      <div className="filters">
        <input
          type="text"
          placeholder="Search customers..."
          value={filters.search}
          onChange={(e) => 
            setFilters(prev => ({ ...prev, search: e.target.value }))
          }
        />
        
        <select
          value={filters.status}
          onChange={(e) => 
            setFilters(prev => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>
      
      <AdminDataTable
        data={customers || []}
        columns={customerColumns}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onBulkAction={handleBulkAction}
        loading={isLoading}
      />
    </div>
  )
}
```

---

## 9. Order Management

### Order Status Management

```typescript
// pages/admin/AdminOrders.tsx
export default function AdminOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchAllOrders,
  })
  
  const updateOrderStatus = useMutation({
    mutationFn: async ({ 
      orderId, 
      status 
    }: { 
      orderId: string
      status: OrderStatus 
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
  
  return (
    <div className="admin-orders">
      <AdminDataTable
        data={orders || []}
        columns={orderColumns}
        onStatusChange={(order, newStatus) => 
          updateOrderStatus.mutate({ 
            orderId: order.id, 
            status: newStatus 
          })
        }
      />
    </div>
  )
}
```

---

## 10. Real-time Updates

### Real-time Admin Updates

```typescript
// Subscribe to real-time updates in admin pages
useEffect(() => {
  if (!user) return
  
  const channel = supabase
    .channel('admin-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
    }, (payload: unknown) => {
      const typedPayload = payload as {
        new?: Record<string, unknown>
        old?: Record<string, unknown>
      }
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'customers',
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    })
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [user, queryClient])
```

---

## 11. Testing Patterns

### Admin Component Tests

```typescript
// AdminSettings.test.tsx
describe('AdminSettings', () => {
  it('updates settings successfully', async () => {
    render(<AdminSettings />)
    
    const storeNameInput = screen.getByLabelText('Store Name')
    await userEvent.type(storeNameInput, 'New Store Name')
    
    const saveButton = screen.getByText('Save Settings')
    await userEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Settings updated successfully')).toBeInTheDocument()
    })
  })
  
  it('requires permission to access', () => {
    mockUseAdminPermissions.mockReturnValue({
      isAdmin: true,
      hasPermission: (perm: string) => perm !== 'manage_settings',
    })
    
    render(<Admin />)
    expect(screen.getByText('Unauthorized')).toBeInTheDocument()
  })
})
```

---

## 🎯 Best Practices

1. **Permission Checks**: Always check permissions before rendering
2. **Type Safety**: Use strict TypeScript types
3. **Error Handling**: Provide clear error messages
4. **Loading States**: Show loading indicators for async operations
5. **Optimistic Updates**: Update UI optimistically when possible
6. **Audit Logging**: Log all admin actions
7. **Bulk Operations**: Support efficient batch processing
8. **Real-time Sync**: Keep data synchronized in real-time

---

**Version:** 1.4.0  
**Last Updated:** 2025-01-27  
**Based on:** buildfast-shop admin panel implementation

