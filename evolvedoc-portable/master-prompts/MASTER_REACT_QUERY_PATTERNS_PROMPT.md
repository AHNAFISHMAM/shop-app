# 🔄 Master React Query Patterns Prompt

> **Advanced patterns and best practices for TanStack Query (React Query) in production applications**

---

## 📋 Table of Contents

1. [Query Patterns](#query-patterns)
2. [Mutation Patterns](#mutation-patterns)
3. [Cache Management](#cache-management)
4. [Optimistic Updates](#optimistic-updates)
5. [Error Handling](#error-handling)
6. [Loading States](#loading-states)
7. [Pagination](#pagination)
8. [Infinite Queries](#infinite-queries)
9. [Real-time Integration](#real-time-integration)
10. [Testing Patterns](#testing-patterns)

---

## 1. Query Patterns

### Basic Query Hook

```typescript
// hooks/use-products.ts
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '@/lib/api/products'

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}
```

### Query with Dependencies

```typescript
// Query enabled based on conditions
export function useUserOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => fetchUserOrders(userId!),
    enabled: !!userId, // Only run if userId exists
    staleTime: 2 * 60 * 1000,
  })
}
```

### Parallel Queries

```typescript
// Fetch multiple queries in parallel
export function useDashboardData(userId: string) {
  const orders = useQuery({
    queryKey: ['orders', userId],
    queryFn: () => fetchOrders(userId),
  })
  
  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  })
  
  const stats = useQuery({
    queryKey: ['stats', userId],
    queryFn: () => fetchStats(userId),
  })
  
  return {
    orders: orders.data,
    customers: customers.data,
    stats: stats.data,
    isLoading: orders.isLoading || customers.isLoading || stats.isLoading,
    error: orders.error || customers.error || stats.error,
  }
}
```

### Dependent Queries

```typescript
// Query depends on another query's result
export function useOrderDetails(orderId: string | undefined) {
  const order = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
  })
  
  const items = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => fetchOrderItems(orderId!),
    enabled: !!orderId && !!order.data, // Only fetch if order exists
  })
  
  return {
    order: order.data,
    items: items.data,
    isLoading: order.isLoading || items.isLoading,
  }
}
```

---

## 2. Mutation Patterns

### Basic Mutation

```typescript
// hooks/use-create-order.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (newOrder) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      
      // Or update cache directly
      queryClient.setQueryData(['order', newOrder.id], newOrder)
    },
    onError: (error) => {
      console.error('Failed to create order:', error)
    },
  })
}
```

### Mutation with Optimistic Update

```typescript
export function useUpdateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateOrder,
    onMutate: async (updatedOrder) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] })
      
      // Snapshot previous value
      const previousOrders = queryClient.getQueryData(['orders'])
      
      // Optimistically update
      queryClient.setQueryData(['orders'], (old: Order[]) => {
        return old.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      })
      
      return { previousOrders }
    },
    onError: (error, updatedOrder, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
```

### Mutation with Dependent Invalidation

```typescript
export function useDeleteOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: (_, deletedOrderId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['order', deletedOrderId] })
      
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['order-items', deletedOrderId] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
```

---

## 3. Cache Management

### Manual Cache Updates

```typescript
// Update cache after mutation
const updateOrder = useMutation({
  mutationFn: updateOrderStatus,
  onSuccess: (updatedOrder) => {
    // Update single item in list
    queryClient.setQueryData(['orders'], (old: Order[] | undefined) => {
      if (!old) return [updatedOrder]
      return old.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    })
    
    // Update single item query
    queryClient.setQueryData(['order', updatedOrder.id], updatedOrder)
  },
})
```

### Cache Invalidation Strategies

```typescript
// Invalidate all queries with a prefix
queryClient.invalidateQueries({ queryKey: ['orders'] })

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['order', orderId] })

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => {
    return query.queryKey[0] === 'orders' && 
           query.queryKey[1] === userId
  },
})
```

### Prefetching

```typescript
// Prefetch data before it's needed
const prefetchOrder = async (orderId: string) => {
  await queryClient.prefetchQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    staleTime: 5 * 60 * 1000,
  })
}

// Use in component
<Link 
  to={`/orders/${orderId}`}
  onMouseEnter={() => prefetchOrder(orderId)}
>
  View Order
</Link>
```

---

## 4. Optimistic Updates

### Optimistic Update Pattern

```typescript
export function useAddToCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: addToCart,
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      
      const previousCart = queryClient.getQueryData(['cart'])
      
      queryClient.setQueryData(['cart'], (old: CartItem[] = []) => {
        const existing = old.find(item => item.productId === newItem.productId)
        if (existing) {
          return old.map(item =>
            item.productId === newItem.productId
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          )
        }
        return [...old, newItem]
      })
      
      return { previousCart }
    },
    onError: (error, newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
      toast.error('Failed to add item to cart')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
```

---

## 5. Error Handling

### Global Error Handler

```typescript
// QueryClient setup with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 3
      },
      onError: (error) => {
        // Global error handler
        console.error('Query error:', error)
      },
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        toast.error(error.message || 'An error occurred')
      },
    },
  },
})
```

### Per-Query Error Handling

```typescript
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      if (error.message.includes('network')) {
        toast.error('Network error. Please check your connection.')
      } else {
        toast.error('Failed to load products')
      }
    },
  })
}
```

---

## 6. Loading States

### Loading State Patterns

```typescript
// Component with loading states
export function ProductsList() {
  const { data, isLoading, isFetching, isError, error } = useProducts()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (isError) {
    return <ErrorMessage error={error} />
  }
  
  return (
    <div>
      {isFetching && <LoadingIndicator />}
      <ProductsGrid products={data} />
    </div>
  )
}
```

### Skeleton Loading

```typescript
export function ProductsList() {
  const { data, isLoading } = useProducts()
  
  if (isLoading) {
    return <ProductsSkeleton count={12} />
  }
  
  return <ProductsGrid products={data} />
}
```

---

## 7. Pagination

### Paginated Query

```typescript
export function usePaginatedProducts(page: number, pageSize: number = 10) {
  return useQuery({
    queryKey: ['products', 'paginated', page, pageSize],
    queryFn: () => fetchProducts({ page, pageSize }),
    keepPreviousData: true, // Keep previous data while fetching new page
  })
}

// Usage
function ProductsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePaginatedProducts(page)
  
  return (
    <div>
      <ProductsGrid products={data?.items} />
      <Pagination
        current={page}
        total={data?.total}
        onChange={setPage}
      />
    </div>
  )
}
```

---

## 8. Infinite Queries

### Infinite Scroll Pattern

```typescript
export function useInfiniteProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => 
      fetchProducts({ ...filters, offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) {
        return pages.length * 20
      }
      return undefined
    },
  })
}

// Usage
function InfiniteProductsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts()
  
  const products = data?.pages.flatMap(page => page.items) ?? []
  
  return (
    <div>
      <ProductsGrid products={products} />
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

---

## 9. Real-time Integration

### React Query + Real-time

```typescript
// Combine React Query with Supabase real-time
export function useProductsWithRealtime() {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })
  
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
      }, (payload) => {
        // Invalidate on change
        queryClient.invalidateQueries({ queryKey: ['products'] })
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
  
  return query
}
```

### Optimistic Real-time Updates

```typescript
export function useCartWithRealtime() {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })
  
  useEffect(() => {
    const channel = supabase
      .channel('cart-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cart_items',
      }, (payload) => {
        // Optimistically add to cache
        queryClient.setQueryData(['cart'], (old: CartItem[] = []) => {
          return [...old, payload.new as CartItem]
        })
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'cart_items',
      }, (payload) => {
        // Optimistically remove from cache
        queryClient.setQueryData(['cart'], (old: CartItem[] = []) => {
          return old.filter(item => item.id !== payload.old.id)
        })
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
  
  return query
}
```

---

## 10. Testing Patterns

### Mock Query Client

```typescript
// test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

export function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}
```

### Testing Queries

```typescript
// useProducts.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { useProducts } from './use-products'

describe('useProducts', () => {
  it('fetches products successfully', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
    
    const { result } = renderHook(() => useProducts(), { wrapper })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(10)
  })
})
```

### Testing Mutations

```typescript
// useCreateOrder.test.ts
describe('useCreateOrder', () => {
  it('creates order and invalidates cache', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
    
    const { result } = renderHook(() => useCreateOrder(), { wrapper })
    
    await act(async () => {
      await result.current.mutateAsync(newOrderData)
    })
    
    expect(queryClient.getQueryState(['orders'])?.isInvalidated).toBe(true)
  })
})
```

---

## 🎯 Best Practices

1. **Query Keys**: Use consistent, hierarchical query keys
2. **Stale Time**: Set appropriate stale times based on data freshness needs
3. **Error Handling**: Provide user-friendly error messages
4. **Loading States**: Show appropriate loading indicators
5. **Optimistic Updates**: Use for better UX, but always have rollback
6. **Cache Invalidation**: Invalidate related queries after mutations
7. **Prefetching**: Prefetch data for better perceived performance
8. **Real-time**: Combine with real-time subscriptions for live updates

---

**Version:** 1.4.0  
**Last Updated:** 2025-01-27  
**Based on:** buildfast-shop React Query implementation

