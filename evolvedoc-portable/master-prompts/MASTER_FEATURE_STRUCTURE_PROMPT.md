# 📁 Master Feature Structure Prompt

> **Comprehensive guide for feature-based folder organization and domain-driven architecture**

---

## 📋 Table of Contents

1. [Feature-Based Structure Overview](#feature-based-structure-overview)
2. [Folder Organization](#folder-organization)
3. [When to Use Features vs Components](#when-to-use-features-vs-components)
4. [Shared vs Feature-Specific Code](#shared-vs-feature-specific-code)
5. [Common Patterns](#common-patterns)
6. [Migration Strategy](#migration-strategy)
7. [Best Practices](#best-practices)

---

## 1. Feature-Based Structure Overview

### What is Feature-Based Structure?

Organizing code by **business domain/feature** rather than by **technical layer** (components, utils, hooks).

### Benefits

- **Better Cohesion:** Related code lives together
- **Easier Navigation:** Find all code for a feature in one place
- **Clearer Boundaries:** Features are self-contained
- **Scalability:** Easy to add new features without affecting others
- **Team Collaboration:** Teams can work on features independently

---

## 2. Folder Organization

### Recommended Structure

```
src/
├── features/              # Feature-based modules
│   ├── menu/             # Menu feature
│   │   ├── components/   # Menu-specific components
│   │   ├── hooks/        # Menu-specific hooks
│   │   ├── lib/          # Menu-specific utilities
│   │   ├── types.ts      # Menu types
│   │   └── index.ts      # Public API
│   ├── cart/             # Cart feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── orders/           # Orders feature
│   ├── reservations/     # Reservations feature
│   ├── reviews/          # Reviews feature
│   └── addresses/        # Addresses feature
├── components/           # Shared UI components
│   ├── ui/              # Base UI components (buttons, inputs)
│   ├── layout/          # Layout components
│   └── admin/           # Admin-specific shared components
├── pages/               # Page components (route handlers)
├── lib/                 # Shared libraries (Supabase, API clients)
├── hooks/               # Shared hooks (useAuth, useTheme)
├── contexts/           # React contexts
├── utils/              # Shared utilities
└── types/              # Shared types
```

### Feature Folder Structure

Each feature should be self-contained:

```
features/menu/
├── components/          # Menu-specific components
│   ├── MenuItemCard.tsx
│   ├── MenuCategory.tsx
│   └── MenuFilter.tsx
├── hooks/              # Menu-specific hooks
│   ├── useMenuItems.ts
│   ├── useMenuFilter.ts
│   └── useMenuCategories.ts
├── lib/                # Menu-specific utilities
│   ├── menuUtils.ts
│   └── menuValidators.ts
├── types.ts            # Menu types
└── index.ts            # Public API (exports)
```

---

## 3. When to Use Features vs Components

### Use `/features` When:

✅ **Feature-specific logic:**
- Business logic tied to a domain (menu, cart, orders)
- Data fetching for a specific feature
- Feature-specific state management
- Feature-specific utilities

✅ **Self-contained modules:**
- Can be developed independently
- Has clear boundaries
- May be reused in different contexts

### Use `/components` When:

✅ **Shared UI components:**
- Reusable across multiple features
- Generic UI elements (buttons, inputs, modals)
- Layout components
- Admin dashboard components

✅ **No business logic:**
- Pure presentation components
- Generic utilities
- Shared hooks (useAuth, useTheme)

---

## 4. Shared vs Feature-Specific Code

### Feature-Specific (in `/features`)

```typescript
// features/cart/lib/cartCalculations.ts
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
}
```

### Shared (in `/lib` or `/utils`)

```typescript
// lib/formatCurrency.ts
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
```

### Decision Matrix

| Code Type | Location | Reason |
|-----------|----------|--------|
| Cart total calculation | `/features/cart/lib` | Cart-specific logic |
| Currency formatting | `/lib` or `/utils` | Used by multiple features |
| Menu item filtering | `/features/menu/lib` | Menu-specific logic |
| Date formatting | `/lib` or `/utils` | Generic utility |
| Order status badge | `/features/orders/components` | Order-specific UI |
| Button component | `/components/ui` | Shared UI element |

---

## 5. Common Patterns

### Feature Public API

**`features/menu/index.ts`:**
```typescript
// Export only what other features/pages need
export { MenuItemCard } from './components/MenuItemCard'
export { useMenuItems } from './hooks/useMenuItems'
export type { MenuItem, MenuCategory } from './types'
```

**Usage:**
```typescript
// In a page or another feature
import { MenuItemCard, useMenuItems, type MenuItem } from '@/features/menu'
```

### Feature Types

**`features/menu/types.ts`:**
```typescript
export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  // ... menu-specific fields
}

export interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}
```

### Feature Hooks

**`features/menu/hooks/useMenuItems.ts`:**
```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MenuItem } from '../types'

export function useMenuItems(categoryId?: string) {
  return useQuery({
    queryKey: ['menu-items', categoryId],
    queryFn: async () => {
      let query = supabase.from('menu_items').select('*')
      
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data as MenuItem[]
    },
  })
}
```

### Feature Components

**`features/menu/components/MenuItemCard.tsx`:**
```typescript
import type { MenuItem } from '../types'
import { formatCurrency } from '@/lib/formatCurrency'

interface MenuItemCardProps {
  item: MenuItem
  onSelect?: (item: MenuItem) => void
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  return (
    <div onClick={() => onSelect?.(item)}>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <span>{formatCurrency(item.price)}</span>
    </div>
  )
}
```

---

## 6. Migration Strategy

### Step 1: Identify Features

List all features in your app:
- Menu
- Cart
- Orders
- Reservations
- Reviews
- Addresses
- etc.

### Step 2: Create Feature Folders

```bash
mkdir -p src/features/menu/{components,hooks,lib}
mkdir -p src/features/cart/{components,hooks,lib}
# ... etc
```

### Step 3: Move Feature-Specific Code

**Before:**
```
src/
├── components/
│   ├── MenuItemCard.tsx
│   └── CartItem.tsx
├── hooks/
│   ├── useMenuItems.ts
│   └── useCart.ts
└── lib/
    └── cartUtils.ts
```

**After:**
```
src/
├── features/
│   ├── menu/
│   │   ├── components/MenuItemCard.tsx
│   │   └── hooks/useMenuItems.ts
│   └── cart/
│       ├── components/CartItem.tsx
│       ├── hooks/useCart.ts
│       └── lib/cartUtils.ts
```

### Step 4: Update Imports

**Find and replace:**
```typescript
// Old
import { MenuItemCard } from '@/components/MenuItemCard'
import { useMenuItems } from '@/hooks/useMenuItems'

// New
import { MenuItemCard, useMenuItems } from '@/features/menu'
```

### Step 5: Create Feature Index Files

Each feature should export its public API:
```typescript
// features/menu/index.ts
export { MenuItemCard } from './components/MenuItemCard'
export { useMenuItems } from './hooks/useMenuItems'
export type { MenuItem } from './types'
```

---

## 7. Best Practices

✅ **Do:**
- Keep features self-contained
- Export only public API from feature index
- Use feature types for type safety
- Group related code together
- Keep shared code in `/lib` or `/utils`

❌ **Don't:**
- Mix feature-specific and shared code
- Create circular dependencies between features
- Export internal implementation details
- Duplicate shared utilities in features
- Create too many small features (group related ones)

---

## 8. Integration with Other Patterns

### React Query

```typescript
// features/menu/hooks/useMenuItems.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useMenuItems() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
      
      if (error) throw error
      return data
    },
  })
}
```

### TypeScript

```typescript
// features/menu/types.ts
export interface MenuItem {
  id: string
  name: string
  price: number
}

// features/menu/index.ts
export type { MenuItem } from './types'
```

### Testing

```typescript
// features/menu/__tests__/useMenuItems.test.ts
import { renderHook } from '@testing-library/react'
import { useMenuItems } from '../hooks/useMenuItems'

describe('useMenuItems', () => {
  it('fetches menu items', async () => {
    const { result } = renderHook(() => useMenuItems())
    // ... test
  })
})
```

---

**Reference:** Use this prompt when organizing code by features or migrating to feature-based structure.

