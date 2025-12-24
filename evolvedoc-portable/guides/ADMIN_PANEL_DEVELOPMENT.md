# Admin Panel Development Guide

## 📋 Overview

Best practices for building admin panels with permission-based access control, based on patterns from buildfast-shop.

---

## 🔐 Permission System

### Admin Permission Hook

**Real Pattern from buildfast-shop:**

```typescript
// Check admin status and permissions
export function useAdminPermissions(userId: string | undefined) {
  const { data: adminUser, isLoading } = useQuery({
    queryKey: ['admin-permissions', userId],
    queryFn: async () => {
      if (!userId) return null
      
      // Check if user is admin
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

### Route Protection

**Real Example:**

```typescript
// src/pages/Admin.tsx
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

---

## 📊 Data Management

### CRUD Operations Pattern

**Real Pattern from buildfast-shop admin pages:**

```typescript
// AdminCustomers.tsx - Customer management
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
  
  // Update customer
  const updateCustomer = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const { error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer updated successfully')
    },
  })
  
  // Bulk update
  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<Customer> }) => {
      const { error } = await supabase
        .from('customers')
        .update(data)
        .in('id', ids)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`${ids.length} customers updated`)
    },
  })
  
  return (
    <div className="admin-customers">
      <AdminDataTable
        data={customers || []}
        columns={customerColumns}
        onEdit={handleEditCustomer}
        onBulkAction={bulkUpdate.mutate}
        loading={isLoading}
      />
    </div>
  )
}
```

---

## 🔄 Real-time Admin Updates

### Real-time Order Management

**Real Example from buildfast-shop:**

```typescript
// AdminOrders.tsx - Real-time order updates
export default function AdminOrders() {
  const queryClient = useQueryClient()
  
  // Real-time subscription for orders
  useEffect(() => {
    if (!user) return
    
    const channel = supabase
      .channel('admin-orders-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, (payload: unknown) => {
        const typedPayload = payload as {
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }
        
        // Invalidate orders query to refetch
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
        
        // Show notification for new orders
        if (typedPayload.new && 'status' in typedPayload.new) {
          toast.info(`Order ${typedPayload.new.id} updated`)
        }
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])
  
  // ... rest of component
}
```

---

## 🎛️ Settings Management

### Settings Form Pattern

**Real Example from buildfast-shop:**

```typescript
// AdminSettings.tsx
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
        .eq('id', 1) // Single settings record
      
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
      
      <button type="submit" disabled={updateSettings.isPending}>
        Save Settings
      </button>
    </form>
  )
}
```

---

## 🎯 Best Practices

1. **Permission Checks**: Always check permissions before rendering
2. **Type Safety**: Use strict TypeScript types for all admin data
3. **Real-time Sync**: Keep admin data synchronized with real-time
4. **Error Handling**: Provide clear error messages
5. **Bulk Operations**: Support efficient batch processing
6. **Audit Logging**: Log all admin actions for security
7. **Optimistic Updates**: Update UI optimistically when safe
8. **Loading States**: Show loading indicators for async operations

---

## 📚 Related Resources

- EvolveDoc: `master-prompts/MASTER_ADMIN_PANEL_PROMPT.md`
- EvolveDoc: `master-prompts/MASTER_REACT_QUERY_PATTERNS_PROMPT.md`

---

**Last Updated:** 2025-01-27  
**Version:** 1.4.0  
**Based on:** buildfast-shop admin panel implementation

