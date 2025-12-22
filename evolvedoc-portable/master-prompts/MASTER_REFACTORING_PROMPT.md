# 🔧 MASTER REFACTORING PROMPT
## Production-Grade Code Refactoring & File Organization Workflow

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to refactoring large files and organizing codebases following industry best practices for the **Star Café** application. It covers file organization, component extraction, service layer patterns, hook extraction, and maintaining backward compatibility.

**Key Features:**
- Feature-based file organization
- Service layer abstraction patterns
- Custom hook extraction
- Component composition patterns
- Backward compatibility strategies
- Dependency-based refactoring order
- Type safety preservation
- Performance optimization during refactoring

---

## 🎯 USE CASES

- Refactoring large files (>300 lines)
- Extracting reusable components
- Creating service layers
- Organizing feature-based code
- Improving code maintainability
- Reducing complexity
- Enhancing testability
- Preserving backward compatibility

---

## 🏗️ ARCHITECTURE OVERVIEW

### Current File Organization Pattern

```
src/
  ├── pages/              # Page-level components (often large)
  ├── components/         # Shared UI components
  ├── features/           # Feature-based organization
  │   └── [feature]/
  │       ├── components/
  │       ├── hooks/
  │       └── index.js    # Re-exports
  ├── lib/                # Services, utilities, clients
  └── contexts/           # React contexts
```

### Target File Organization Pattern

```
src/
  ├── pages/
  │   └── [FeatureName]/
  │       ├── index.tsx           # Main page (~200-400 lines)
  │       ├── components/         # Feature-specific components
  │       │   ├── ComponentName.tsx
  │       │   └── index.js       # Re-exports
  │       ├── hooks/              # Feature-specific hooks
  │       │   ├── use-feature-name.ts
  │       │   └── index.js       # Re-exports
  │       ├── utils/             # Feature-specific utilities
  │       │   ├── formatting.ts
  │       │   └── validation.ts
  │       ├── types.ts            # Feature-specific types
  │       └── constants.ts        # Feature-specific constants
  ├── features/           # Reusable feature modules
  │   └── [feature]/
  │       ├── components/
  │       ├── hooks/
  │       └── index.js
  ├── lib/                # Services and shared utilities
  │   ├── services/       # Service layer
  │   │   ├── menuService.ts
  │   │   ├── orderService.ts
  │   │   └── index.ts
  │   └── utils/          # Shared utilities
  └── components/         # Shared UI components
```

---

## 🔍 PHASE 1: REFACTORING ANALYSIS

### Step 1.1: File Size Audit

```typescript
// Identify files that need refactoring

const REFACTORING_THRESHOLD = 300; // lines

// Priority levels:
// Critical: >1000 lines
// High: 500-1000 lines
// Medium: 300-500 lines
```

**Real Example from Codebase:**
- `Checkout.jsx` - 2,509 lines ⚠️ CRITICAL
- `AdminMenuItems.jsx` - 2,384 lines ⚠️ CRITICAL
- `OrderHistory.jsx` - 1,609 lines ⚠️ HIGH
- `AdminReservations.jsx` - 1,173 lines ⚠️ HIGH

### Step 1.2: Dependency Analysis

```typescript
// Analyze dependencies before refactoring

interface DependencyGraph {
  file: string;
  dependsOn: string[];
  dependedBy: string[];
  complexity: 'low' | 'medium' | 'high';
}

// Rule: Refactor dependencies BEFORE dependents
```

### Step 1.3: Extractable Patterns Identification

**Common Extractable Patterns:**
1. **Reusable Components** - UI elements used multiple times
2. **Custom Hooks** - Stateful logic that can be reused
3. **Service Functions** - Data fetching and business logic
4. **Utility Functions** - Pure functions for calculations/formatting
5. **Constants** - Magic numbers, strings, configuration
6. **Types** - TypeScript interfaces and types
7. **Sections** - Large page sections that can be separate components

---

## 🧩 PHASE 2: COMPONENT EXTRACTION

### Step 2.1: Component Extraction Pattern

**Before (Large File):**
```typescript
// Checkout.jsx - 2,509 lines

function Checkout() {
  // 500+ lines of state management
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({});
  // ... 20+ more state variables

  // 300+ lines of data fetching
  useEffect(() => {
    // Fetch cart items
  }, []);
  useEffect(() => {
    // Fetch addresses
  }, []);
  // ... 10+ more useEffect hooks

  // 500+ lines of handlers
  const handlePlaceOrder = async () => {
    // 100+ lines of order placement logic
  };
  const handlePayment = async () => {
    // 100+ lines of payment logic
  };
  // ... 20+ more handlers

  // 1000+ lines of JSX
  return (
    <div>
      {/* Header section - 100 lines */}
      {/* Cart items section - 200 lines */}
      {/* Address form section - 300 lines */}
      {/* Payment section - 200 lines */}
      {/* Order summary sidebar - 200 lines */}
    </div>
  );
}
```

**After (Refactored Structure):**
```typescript
// pages/Checkout/index.tsx - ~200 lines

import { CheckoutHeader } from './components/CheckoutHeader';
import { OrderItemsList } from './components/OrderItemsList';
import { ShippingAddressForm } from './components/ShippingAddressForm';
import { PaymentSection } from './components/PaymentSection';
import { OrderSummarySidebar } from './components/OrderSummarySidebar';
import { useCheckoutOrder } from './hooks/useCheckoutOrder';
import { useCheckoutCalculations } from './hooks/useCheckoutCalculations';
import { useCheckoutRealtime } from './hooks/useCheckoutRealtime';

function Checkout() {
  const { cartItems, addresses, refetchCart, refetchAddresses } = useCheckoutData();
  const { placingOrder, handlePlaceOrder, showPayment, clientSecret } = useCheckoutOrder({ /* ... */ });
  const { subtotal, deliveryFee, total } = useCheckoutCalculations({ cartItems });
  
  useCheckoutRealtime({ cartItems, user, refetchCart, refetchAddresses });

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <CheckoutHeader />
      <div 
        className="grid lg:grid-cols-3 gap-6 py-6"
        style={{
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
      >
        <main className="lg:col-span-2 space-y-6">
          <OrderItemsList items={cartItems} />
          <ShippingAddressForm
            savedAddresses={addresses}
            onAddressChange={setShippingAddress}
          />
          <PaymentSection
            showPayment={showPayment}
            clientSecret={clientSecret}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </main>
        <aside className="lg:sticky lg:top-4 lg:h-fit">
          <OrderSummarySidebar
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            onPlaceOrder={handlePlaceOrder}
            placingOrder={placingOrder}
          />
        </aside>
      </div>
    </div>
  );
}
```

### Step 2.2: Component Extraction Example (Real)

```typescript
// pages/Checkout/components/CheckoutHeader.tsx

import { m } from 'framer-motion';
import { pageFade } from '../../../components/animations/menuAnimations';

interface CheckoutHeaderProps {
  itemCount: number;
  onBack?: () => void;
}

export function CheckoutHeader({ itemCount, onBack }: CheckoutHeaderProps) {
  return (
    <m.header
      variants={pageFade}
      initial="hidden"
      animate="visible"
      className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]"
    >
      <div 
        className="py-4 sm:py-6"
        style={{
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] sm:text-3xl">
              Checkout
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="min-h-[44px] rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm hover:bg-[var(--bg-hover)]"
            >
              Back to Menu
            </button>
          )}
        </div>
      </div>
    </m.header>
  );
}
```

```typescript
// pages/Checkout/components/OrderItemsList.tsx

import { memo } from 'react';
import { m } from 'framer-motion';
import { fadeSlideUp } from '../../../components/animations/menuAnimations';
import CartItemCard from '../../../components/order/CartItemCard';

interface OrderItemsListProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  getImageUrl: (item: CartItem) => string;
}

export const OrderItemsList = memo(({
  items,
  onUpdateQuantity,
  onRemoveItem,
  getImageUrl,
}: OrderItemsListProps) => {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-8 text-center">
        <p className="text-[var(--text-secondary)]">Your cart is empty</p>
      </div>
    );
  }

  return (
    <m.section
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6"
    >
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-main)]">
        Order Items
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            getImageUrl={getImageUrl}
          />
        ))}
      </div>
    </m.section>
  );
});

OrderItemsList.displayName = 'OrderItemsList';
```

### Step 2.3: Component Index Pattern

```typescript
// pages/Checkout/components/index.js

/**
 * Checkout Components Index
 * 
 * Central export point for all checkout-related components.
 * Maintains backward compatibility by re-exporting all components.
 */

export { CheckoutHeader } from './CheckoutHeader';
export { OrderItemsList } from './OrderItemsList';
export { ShippingAddressForm } from './ShippingAddressForm';
export { PaymentSection } from './PaymentSection';
export { OrderSummarySidebar } from './OrderSummarySidebar';
export { GuestChoiceSection } from './GuestChoiceSection';
export { GuestEmailSection } from './GuestEmailSection';
export { OrderError } from './OrderError';
```

---

## 🎣 PHASE 3: HOOK EXTRACTION

### Step 3.1: Custom Hook Extraction Pattern

**Before (Logic in Component):**
```typescript
// Checkout.jsx - Logic mixed with UI

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cart_items')
          .select('*, menu_items(*), dishes(*)')
          .eq('user_id', user?.id);
        
        if (error) throw error;
        setCartItems(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCart();
    }
  }, [user]);

  // ... 200+ more lines of similar logic
}
```

**After (Extracted Hook):**
```typescript
// pages/Checkout/hooks/useCheckoutData.ts

import { useQuery } from '@tanstack/react-query';
import { useCartItems } from '../../../features/cart/hooks';
import { useAddresses } from '../../../features/addresses/hooks';

export function useCheckoutData({ user }: { user: User | null }) {
  const {
    cartItems: rawCartItems,
    loading: loadingCart,
    refetch: refetchCart,
  } = useCartItems({ user, enabled: true });

  const {
    addresses: savedAddresses,
    loading: loadingAddresses,
    refetch: refetchAddresses,
  } = useAddresses({ user, enabled: !!user });

  // Normalize cart items
  const cartItems = useMemo(() => {
    return (rawCartItems || []).map(item => {
      // Product resolution logic
      const resolvedProduct = item.menu_items || item.dishes || item.products;
      return {
        ...item,
        resolvedProduct,
      };
    });
  }, [rawCartItems]);

  return {
    cartItems,
    addresses: savedAddresses || [],
    loading: loadingCart || loadingAddresses,
    refetchCart,
    refetchAddresses,
  };
}
```

### Step 3.2: Complex Hook Extraction (Real Example)

```typescript
// pages/Checkout/hooks/useCheckoutOrder.ts

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createOrderWithItems } from '../../../lib/orderService';
import { createPaymentIntent } from '../../../lib/paymentService';
import { logger } from '../../../utils/logger';
import toast from 'react-hot-toast';

interface UseCheckoutOrderOptions {
  user: User | null;
  guestEmail: string;
  cartItems: CartItem[];
  shippingAddress: Address;
  fulfillmentMode: string;
  scheduledSlot: string;
  orderNote: string;
  enableMarketingOptins: boolean;
  emailUpdatesOptIn: boolean;
}

export function useCheckoutOrder({
  user,
  guestEmail,
  cartItems,
  shippingAddress,
  fulfillmentMode,
  scheduledSlot,
  orderNote,
  enableMarketingOptins,
  emailUpdatesOptIn,
}: UseCheckoutOrderOptions) {
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [guestCheckoutData, setGuestCheckoutData] = useState(null);

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      // Create order
      const order = await createOrderWithItems({
        userId: user?.id || null,
        guestEmail: user ? null : guestEmail,
        items: cartItems,
        shippingAddress,
        fulfillmentMode,
        scheduledSlot,
        orderNote,
        enableMarketingOptins,
        emailUpdatesOptIn,
      });

      return order;
    },
    onSuccess: async (order) => {
      setCreatedOrderId(order.id);

      // Create payment intent
      try {
        const { clientSecret: secret } = await createPaymentIntent({
          amount: order.order_total,
          orderId: order.id,
          customerEmail: user?.email || guestEmail,
        });

        setClientSecret(secret);
        setShowPayment(true);
      } catch (error) {
        logger.error('Payment intent creation failed:', error);
        toast.error('Failed to initialize payment');
      }
    },
    onError: (error) => {
      logger.error('Order placement failed:', error);
      toast.error('Failed to place order. Please try again.');
    },
  });

  const handlePlaceOrder = useCallback(() => {
    placeOrderMutation.mutate();
  }, [placeOrderMutation]);

  const handlePaymentSuccess = useCallback(() => {
    setShowPayment(false);
    setShowSuccessModal(true);
    
    if (!user) {
      setShowConversionModal(true);
      setGuestCheckoutData({ orderId: createdOrderId });
    }
  }, [user, createdOrderId]);

  return {
    placingOrder: placeOrderMutation.isPending,
    orderSuccess: placeOrderMutation.isSuccess,
    orderError: placeOrderMutation.error,
    showPayment,
    clientSecret,
    createdOrderId,
    showSuccessModal,
    showConversionModal,
    guestCheckoutData,
    handlePlaceOrder,
    handlePaymentSuccess,
    setShowSuccessModal,
    setShowConversionModal,
  };
}
```

### Step 3.3: Hook Index Pattern

```typescript
// pages/Checkout/hooks/index.js

/**
 * Checkout Hooks Index
 * 
 * Central export point for all checkout-related hooks.
 */

export { useCheckoutData } from './useCheckoutData';
export { useCheckoutOrder } from './useCheckoutOrder';
export { useCheckoutCalculations } from './useCheckoutCalculations';
export { useCheckoutRealtime } from './useCheckoutRealtime';
```

---

## 🔧 PHASE 4: SERVICE LAYER EXTRACTION

### Step 4.1: Service Layer Pattern

**Before (Direct Supabase Calls):**
```typescript
// Checkout.jsx - Direct database calls

function Checkout() {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchCart = async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, menu_items(*), dishes(*)')
        .eq('user_id', user?.id);

      if (error) {
        toast.error('Failed to load cart');
        return;
      }

      setCartItems(data || []);
    };

    fetchCart();
  }, [user]);

  const handlePlaceOrder = async () => {
    // 100+ lines of order creation logic
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ /* ... */ })
      .select()
      .single();

    if (orderError) {
      toast.error('Failed to create order');
      return;
    }

    // Insert order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      toast.error('Failed to create order items');
      return;
    }

    // ... more logic
  };
}
```

**After (Service Layer):**
```typescript
// lib/services/orderService.ts

import { supabase } from '../supabase';
import { logger } from '../utils/logger';

export interface CreateOrderData {
  userId: string | null;
  guestEmail: string | null;
  items: CartItem[];
  shippingAddress: Address;
  fulfillmentMode: string;
  scheduledSlot: string;
  orderNote?: string;
  enableMarketingOptins?: boolean;
  emailUpdatesOptIn?: boolean;
}

export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Create order with items using RPC function
 * 
 * Uses database transaction to ensure atomicity.
 * Handles both authenticated and guest orders.
 */
export async function createOrderWithItems(
  data: CreateOrderData
): Promise<Order> {
  try {
    const { data: order, error } = await supabase.rpc('create_order_with_items', {
      p_user_id: data.userId,
      p_guest_email: data.guestEmail,
      p_items: data.items.map(item => ({
        product_id: item.product_id || item.menu_item_id,
        quantity: item.quantity,
        price: parsePrice(item.price),
      })),
      p_shipping_address: data.shippingAddress,
      p_fulfillment_mode: data.fulfillmentMode,
      p_scheduled_slot: data.scheduledSlot,
      p_order_note: data.orderNote || null,
      p_enable_marketing_optins: data.enableMarketingOptins || false,
      p_email_updates_opt_in: data.emailUpdatesOptIn || false,
    });

    if (error) {
      logger.error('Order creation error:', error);
      throw new Error(error.message || 'Failed to create order');
    }

    if (!order) {
      throw new Error('Order creation returned no data');
    }

    return order;
  } catch (err) {
    logger.error('Unexpected error in createOrderWithItems:', err);
    throw err instanceof Error ? err : new Error('An unexpected error occurred');
  }
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<ServiceResponse<Order>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*), dishes(*), products(*))')
      .eq('id', orderId)
      .single();

    if (error) {
      logger.error('Error fetching order:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load order',
      };
    }

    return {
      success: true,
      data,
      error: null,
    };
  } catch (err) {
    logger.error('Unexpected error in getOrder:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    };
  }
}
```

```typescript
// Checkout.jsx - Using service layer

import { createOrderWithItems } from '../lib/services/orderService';

function Checkout() {
  const { cartItems } = useCheckoutData({ user });

  const handlePlaceOrder = async () => {
    try {
      const order = await createOrderWithItems({
        userId: user?.id || null,
        guestEmail: user ? null : guestEmail,
        items: cartItems,
        shippingAddress,
        fulfillmentMode,
        scheduledSlot,
        orderNote,
        enableMarketingOptins,
        emailUpdatesOptIn,
      });

      // Handle success
      setCreatedOrderId(order.id);
      // ... payment setup
    } catch (error) {
      toast.error(error.message || 'Failed to place order');
    }
  };
}
```

### Step 4.2: Service Index Pattern

```typescript
// lib/services/index.ts

/**
 * Services Index
 * 
 * Central export point for all service layer functions.
 */

export * from './menuService';
export * from './orderService';
export * from './cartService';
export * from './addressService';
export * from './paymentService';
```

---

## 🛠️ PHASE 5: UTILITY EXTRACTION

### Step 5.1: Utility Function Extraction

**Before (Inline Logic):**
```typescript
// Checkout.jsx - Inline formatting

function Checkout() {
  const formatPrice = (price: number) => {
    const currency = settings?.currency || 'BDT';
    const symbol = currency === 'USD' ? '$' : '৳';
    return `${symbol}${price.toFixed(2)}`;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return sum + (price * item.quantity);
    }, 0);
  };

  const calculateDeliveryFee = () => {
    const subtotal = calculateSubtotal();
    const threshold = settings?.free_shipping_threshold || 0;
    const fee = settings?.shipping_cost || 0;
    
    if (threshold > 0 && subtotal >= threshold) {
      return 0;
    }
    return fee;
  };

  // ... used throughout component
}
```

**After (Extracted Utilities):**
```typescript
// pages/Checkout/utils/formatting.ts

import { getCurrencySymbol } from '../../../lib/priceUtils';

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'BDT',
  decimals: number = 2
): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(decimals)}`;
}

/**
 * Format order number
 */
export function formatOrderNumber(orderId: string): string {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}
```

```typescript
// pages/Checkout/utils/calculations.ts

import { parsePrice } from '../../../lib/priceUtils';

/**
 * Calculate cart subtotal
 */
export function calculateSubtotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => {
    const product = item.menu_items || item.dishes || item.products;
    if (!product) return sum;

    const price = parsePrice(product.price);
    return sum + (price * item.quantity);
  }, 0);
}

/**
 * Calculate delivery fee
 */
export function calculateDeliveryFee(
  subtotal: number,
  settings: StoreSettings
): number {
  const threshold = settings?.free_shipping_threshold || 0;
  const fee = settings?.shipping_cost || 0;

  if (threshold > 0 && subtotal >= threshold) {
    return 0;
  }

  return fee;
}

/**
 * Calculate tax
 */
export function calculateTax(
  subtotal: number,
  taxRate: number = 0
): number {
  return subtotal * (taxRate / 100);
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  subtotal: number,
  deliveryFee: number,
  tax: number
): number {
  return subtotal + deliveryFee + tax;
}
```

### Step 5.2: Utility Hook Pattern

```typescript
// pages/Checkout/hooks/useCheckoutCalculations.ts

import { useMemo } from 'react';
import { useStoreSettings } from '../../../contexts/StoreSettingsContext';
import {
  calculateSubtotal,
  calculateDeliveryFee,
  calculateTax,
  calculateOrderTotal,
} from '../utils/calculations';

export function useCheckoutCalculations({ cartItems }: { cartItems: CartItem[] }) {
  const { settings } = useStoreSettings();

  const subtotal = useMemo(() => {
    return calculateSubtotal(cartItems);
  }, [cartItems]);

  const deliveryFee = useMemo(() => {
    return calculateDeliveryFee(subtotal, settings || {});
  }, [subtotal, settings]);

  const tax = useMemo(() => {
    const taxRate = settings?.tax_rate || 0;
    return calculateTax(subtotal, taxRate);
  }, [subtotal, settings]);

  const total = useMemo(() => {
    return calculateOrderTotal(subtotal, deliveryFee, tax);
  }, [subtotal, deliveryFee, tax]);

  return {
    subtotal,
    deliveryFee,
    tax,
    total,
  };
}
```

---

## 🔄 PHASE 5: PHASED REFACTORING APPROACH

### Step 5.1: Phased Analysis Pattern

**When to Use:** Large pages/components with multiple concerns (TypeScript, performance, accessibility, UI/UX).

**Approach:** Break down refactoring into phases for accuracy and manageability.

**Phased Analysis Template:**

```typescript
/**
 * PHASE 1: TypeScript & Code Quality
 * - Remove @ts-ignore comments
 * - Add proper type definitions
 * - Fix type errors
 * - Improve type safety
 */

/**
 * PHASE 2: Performance & Optimization
 * - Add memo() wrapper to components
 * - Extract components for better memoization
 * - Add useMemo() for expensive computations
 * - Add useCallback() for stable function references
 * - Optimize re-renders
 */

/**
 * PHASE 3: Accessibility
 * - Add ARIA labels and roles
 * - Ensure keyboard navigation
 * - Add focus management
 * - Test with screen readers
 */

/**
 * PHASE 4: UI/UX Improvements
 * - Fix responsive design issues
 * - Improve visual consistency
 * - Add loading states
 * - Add error states
 * - Improve animations
 */
```

**Real Example: MenuPage.tsx Refactoring**

**Phase 1 - TypeScript:**
- Removed 12 `@ts-ignore` comments
- Added type definitions to `modules.d.ts`
- Fixed all type errors

**Phase 2 - Performance:**
- Wrapped component with `memo()`
- Extracted `MenuPageSkeleton`, `EmptyMenuState`, `ChefsPicksSection`
- Added `useMemo()` for processed menu data
- Added `useCallback()` for event handlers

**Phase 3 - Accessibility:**
- Added `useFocusTrap` for mobile sidebar
- Added `aria-live` for filter results
- Improved keyboard navigation

**Phase 4 - UI/UX:**
- Fixed skeleton background color bug
- Improved responsive design
- Added proper error states

**Benefits:**
- ✅ More accurate analysis
- ✅ Easier to track progress
- ✅ Can stop/resume at any phase
- ✅ Clear priorities
- ✅ Less overwhelming

### Step 5.2: Phased Refactoring Checklist

- [ ] **Phase 1**: TypeScript & Code Quality
  - [ ] Audit `@ts-ignore` comments
  - [ ] Add type definitions
  - [ ] Remove `@ts-ignore` comments
  - [ ] Fix type errors
- [ ] **Phase 2**: Performance & Optimization
  - [ ] Add `memo()` wrappers
  - [ ] Extract components
  - [ ] Add `useMemo()` for expensive computations
  - [ ] Add `useCallback()` for handlers
- [ ] **Phase 3**: Accessibility
  - [ ] Add ARIA attributes
  - [ ] Improve keyboard navigation
  - [ ] Add focus management
  - [ ] Test with screen readers
- [ ] **Phase 4**: UI/UX Improvements
  - [ ] Fix responsive design
  - [ ] Improve visual consistency
  - [ ] Add loading/error states
  - [ ] Improve animations

---

## 📦 PHASE 6: CONSTANTS EXTRACTION

### Step 6.1: Constants File Pattern

```typescript
// pages/Checkout/constants.ts

/**
 * Checkout Constants
 * 
 * Centralized constants for checkout page.
 */

export const CURRENCY_SYMBOL = {
  USD: '$',
  BDT: '৳',
  EUR: '€',
} as const;

export const CURRENCY_CODE = 'BDT';

export const SHIPPING_THRESHOLD = 500; // Free shipping threshold
export const SHIPPING_FEE = 50; // Default shipping fee

export const DEFAULT_TAX_RATE = 0; // Default tax rate percentage

export const SCHEDULED_SLOTS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
] as const;

export const FULFILLMENT_MODES = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Pickup' },
] as const;
```

---

## 📝 PHASE 7: TYPES EXTRACTION

### Step 7.1: Types File Pattern

```typescript
// pages/Checkout/types.ts

/**
 * Checkout Types
 * 
 * TypeScript types and interfaces for checkout page.
 */

export interface CheckoutFormData {
  guestEmail: string;
  shippingAddress: {
    fullName: string;
    streetAddress: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
  fulfillmentMode: 'delivery' | 'pickup';
  scheduledSlot: string;
  orderNote: string;
  enableMarketingOptins: boolean;
  emailUpdatesOptIn: boolean;
}

export interface CheckoutState {
  step: 'review' | 'payment' | 'success';
  placingOrder: boolean;
  orderError: string | null;
  createdOrderId: string | null;
  clientSecret: string | null;
}

export interface OrderSummary {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  loyaltyPoints?: number;
  loyaltyDiscount?: number;
}
```

---

## 🔄 PHASE 8: BACKWARD COMPATIBILITY

### Step 8.1: Re-export Pattern

```typescript
// pages/Checkout.jsx (Legacy file - maintains backward compatibility)

/**
 * @deprecated Use pages/Checkout/index.tsx instead
 * This file is kept for backward compatibility.
 * All imports should be updated to use the new structure.
 */

export { default } from './Checkout/index';
```

### Step 8.2: Gradual Migration Strategy

**Phase 1: Extract without breaking**
- Create new structure alongside old file
- Old file re-exports from new structure
- No breaking changes

**Phase 2: Update imports gradually**
- Update one file at a time
- Test after each update
- Keep old file until all imports updated

**Phase 3: Remove old file**
- Once all imports updated
- Remove legacy file
- Update documentation

---

## ✅ PHASE 9: REFACTORING CHECKLIST

### Pre-Refactoring Checklist

- [ ] **File size analysis** - Identify files >300 lines
- [ ] **Dependency mapping** - Map all dependencies
- [ ] **Extraction plan** - Plan what to extract
- [ ] **Backward compatibility** - Plan re-export strategy
- [ ] **Test coverage** - Ensure tests exist or create them

### During Refactoring Checklist

- [ ] **Extract components** - One component per file
- [ ] **Extract hooks** - One hook per file
- [ ] **Extract services** - Service layer functions
- [ ] **Extract utilities** - Pure functions
- [ ] **Extract constants** - Magic numbers/strings
- [ ] **Extract types** - TypeScript types
- [ ] **Create index files** - Re-export patterns
- [ ] **Update imports** - Use new structure
- [ ] **Maintain compatibility** - Re-export from old location

### Post-Refactoring Checklist

- [ ] **Test all functionality** - Ensure nothing broke
- [ ] **Update documentation** - Document new structure
- [ ] **Code review** - Review refactored code
- [ ] **Performance check** - Ensure no performance regressions
- [ ] **Remove old code** - Once all imports updated

---

## 🚨 COMMON ANTI-PATTERNS

### ❌ Never:

- **Extract without planning** - Always plan before extracting
- **Break backward compatibility** - Always maintain re-exports
- **Extract too early** - Don't extract until pattern is clear
- **Over-extract** - Don't create files for single-use code
- **Ignore dependencies** - Always refactor dependencies first
- **Skip tests** - Always test after refactoring
- **Mix concerns** - Keep UI, logic, and data separate
- **Create deep nesting** - Keep folder structure shallow (max 3-4 levels)
- **Duplicate code** - Extract shared code to common location
- **Forget types** - Always extract and maintain TypeScript types

### ✅ Always:

- Plan extraction before starting
- Maintain backward compatibility with re-exports
- Extract reusable patterns only
- Follow dependency order (dependencies before dependents)
- Create index files for clean imports
- Test after each extraction
- Document new structure
- Use feature-based organization
- Keep files focused (single responsibility)
- Preserve type safety

---

## 📚 REFERENCE

- **Refactoring Plan:** `docs/REFACTORING_PLAN.md`
- **Checkout Refactoring:** `src/pages/Checkout/` (example structure)
- **Service Layer:** `src/lib/services/` (menuService.ts, orderService.ts)
- **Feature Hooks:** `src/features/[feature]/hooks/`
- **Component Indexes:** `src/features/[feature]/components/index.js`

---

## 🔗 RELATED MASTER PROMPTS

- **🎨 [MASTER_UI_UX_PROMPT.md](./MASTER_UI_UX_PROMPT.md)** - Component development patterns
- **🎣 [MASTER_CUSTOM_HOOKS_PROMPT.md](./MASTER_CUSTOM_HOOKS_PROMPT.md)** - Hook extraction patterns
- **🔄 [MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md](./MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md)** - Data fetching patterns
- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** - Database service layer patterns

---

## 🔄 ADVANCED REFACTORING PATTERNS

### Pattern 10.1: Service Layer Extraction

```typescript
// BEFORE: Direct Supabase calls in component
// pages/Checkout.tsx (1000+ lines)

function Checkout() {
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const handlePlaceOrder = async () => {
    try {
      const { data, error } = await supabase.rpc('create_order_with_items', {
        user_id: user?.id || null,
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: shippingAddress,
        items: cartItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price_at_purchase: item.price,
        })),
      });
      
      if (error) throw error;
      setOrderId(data.order_id);
    } catch (err) {
      console.error('Order creation failed:', err);
    }
  };
  
  // ... 900+ more lines
}

// AFTER: Service layer abstraction
// lib/orderService.ts

export interface OrderData {
  userId: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  items: OrderItemInput[];
  discountCodeId?: string | null;
  discountAmount?: number;
}

export interface OrderResponse {
  success: boolean;
  orderId: string | null;
  error: string | null;
}

export async function createOrderWithItems(
  orderData: OrderData
): Promise<OrderResponse> {
  try {
    // Validate required fields
    if (!orderData.customerEmail || orderData.customerEmail.trim() === '') {
      return {
        success: false,
        orderId: null,
        error: 'Customer email is required',
      };
    }

    if (!orderData.customerName || orderData.customerName.trim() === '') {
      return {
        success: false,
        orderId: null,
        error: 'Customer name is required',
      };
    }

    if (!orderData.shippingAddress) {
      return {
        success: false,
        orderId: null,
        error: 'Shipping address is required',
      };
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return {
        success: false,
        orderId: null,
        error: 'Order must contain at least one item',
      };
    }

    // Sanitize items
    const sanitizedItems = orderData.items.map(item => ({
      product_id: item.product_id || null,
      menu_item_id: item.menu_item_id || null,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      variant_id: item.variant_id || null,
      combination_id: item.combination_id || null,
      variant_metadata: item.variant_metadata || null,
    }));

    // Call RPC function
    const { data, error: rpcError } = await supabase.rpc('create_order_with_items', {
      user_id: orderData.userId || null,
      customer_email: orderData.customerEmail.trim(),
      customer_name: orderData.customerName.trim(),
      shipping_address: orderData.shippingAddress,
      items: sanitizedItems,
      discount_code_id: orderData.discountCodeId || null,
      discount_amount: orderData.discountAmount || 0,
    });

    if (rpcError) {
      logger.error('RPC error creating order:', rpcError);
      return {
        success: false,
        orderId: null,
        error: getUserFriendlyError(rpcError),
      };
    }

    if (data && data.order_id) {
      return {
        success: true,
        orderId: data.order_id,
        error: null,
      };
    }

    return {
      success: false,
      orderId: null,
      error: 'Order creation failed: No order ID returned',
    };
  } catch (err) {
    logError(err, 'createOrderWithItems');
    return {
      success: false,
      orderId: null,
      error: getUserFriendlyError(err),
    };
  }
}

// pages/Checkout/hooks/useCheckoutOrder.ts

export function useCheckoutOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<OrderResponse, Error, OrderData>({
    mutationFn: createOrderWithItems,
    onSuccess: (data) => {
      if (data.success && data.orderId) {
        // Invalidate cart queries
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(user?.id || null) });
        // Invalidate orders queries
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(user?.id || null) });
      }
    },
  });
}

// pages/Checkout/index.tsx (now much cleaner)

function Checkout() {
  const createOrderMutation = useCheckoutOrder();
  
  const handlePlaceOrder = async () => {
    const orderData: OrderData = {
      userId: user?.id || null,
      customerEmail: customerEmail,
      customerName: customerName,
      shippingAddress: shippingAddress,
      items: cartItems.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      })),
    };
    
    const result = await createOrderMutation.mutateAsync(orderData);
    if (result.success && result.orderId) {
      setOrderId(result.orderId);
    }
  };
  
  // ... rest of component (much shorter now)
}
```

### Pattern 10.2: Custom Hook Extraction

```typescript
// BEFORE: Complex logic in component
// pages/Checkout.tsx

function Checkout() {
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  
  useEffect(() => {
    // Calculate subtotal
    const calculatedSubtotal = cartItems.reduce((sum, item) => {
      const price = typeof item.price === 'number' 
        ? item.price 
        : parseFloat(String(item.price || '0'));
      return sum + (price * item.quantity);
    }, 0);
    setSubtotal(calculatedSubtotal);
    
    // Calculate shipping
    const calculatedShipping = calculatedSubtotal > 500 ? 0 : 50;
    setShipping(calculatedShipping);
    
    // Calculate tax
    const taxRate = settings?.tax_rate || 0;
    const calculatedTax = calculatedSubtotal * (taxRate / 100);
    setTax(calculatedTax);
    
    // Calculate grand total
    const calculatedTotal = calculatedSubtotal + calculatedShipping + calculatedTax - discountAmount;
    setGrandTotal(Math.max(0, calculatedTotal));
  }, [cartItems, settings, discountAmount]);
  
  // ... rest of component
}

// AFTER: Custom hook extraction
// pages/Checkout/hooks/useCheckoutCalculations.ts

export interface UseCheckoutCalculationsOptions {
  cartItems: CartItem[];
  discountAmount: number;
}

export interface UseCheckoutCalculationsReturn {
  totalItemsCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  taxRatePercent: number;
  grandTotal: number;
  loyalty: ReturnType<typeof resolveLoyaltyState>;
}

export function useCheckoutCalculations({
  cartItems,
  discountAmount,
}: UseCheckoutCalculationsOptions): UseCheckoutCalculationsReturn {
  const totalItemsCount = useMemo(
    () => calculateTotalItemsCount(cartItems),
    [cartItems]
  );

  const subtotal = useMemo(
    () => calculateSubtotal(cartItems),
    [cartItems]
  );

  const shipping = useMemo(
    () => calculateShipping(subtotal),
    [subtotal]
  );

  const tax = useMemo(
    () => calculateTax(subtotal),
    [subtotal]
  );

  const taxRatePercent = getTaxRatePercent();

  const grandTotal = useMemo(
    () => calculateGrandTotal(subtotal, shipping, tax, discountAmount),
    [subtotal, shipping, tax, discountAmount]
  );

  const loyalty = useMemo(
    () => resolveLoyaltyState(grandTotal),
    [grandTotal]
  );

  return {
    totalItemsCount,
    subtotal,
    shipping,
    tax,
    taxRatePercent,
    grandTotal,
    loyalty,
  };
}

// pages/Checkout/utils/calculations.ts

export function calculateTotalItemsCount(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

export function calculateSubtotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => {
    const product = item.resolvedProduct || item.product || {
      price: item.price || item.price_at_purchase || 0
    };
    const price = typeof product.price === 'number' 
      ? product.price 
      : parsePrice(product.price || item.price || item.price_at_purchase || '0');
    return sum + (price * item.quantity);
  }, 0);
}

export function calculateShipping(subtotal: number): number {
  return subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function calculateTax(subtotal: number): number {
  return subtotal * DEFAULT_TAX_RATE;
}

export function calculateGrandTotal(
  subtotal: number,
  shipping: number,
  tax: number,
  discountAmount: number
): number {
  const total = subtotal + shipping + tax;
  return Math.max(0, total - discountAmount);
}

export function getTaxRatePercent(): number {
  return DEFAULT_TAX_RATE * 100;
}

// pages/Checkout/index.tsx (now much cleaner)

function Checkout() {
  const {
    totalItemsCount,
    subtotal,
    shipping,
    tax,
    taxRatePercent,
    grandTotal,
    loyalty,
  } = useCheckoutCalculations({
    cartItems,
    discountAmount,
  });
  
  // ... rest of component
}
```

### Pattern 10.3: Real-time Subscription Hook Extraction

```typescript
// BEFORE: Real-time logic mixed in component
// pages/Checkout.tsx

function Checkout() {
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;
    if (showPayment || showSuccessModal || placingOrder) return;

    const menuItemIds = [...new Set(cartItems
      .filter(item => item.menu_item_id)
      .map(item => item.menu_item_id)
      .filter(Boolean)
    )];

    const channels: Array<ReturnType<typeof supabase.channel>> = [];

    // Subscribe to menu_items updates
    if (menuItemIds.length > 0) {
      const menuItemsChannel = supabase
        .channel('checkout-menu-items-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'menu_items'
          },
          async (payload) => {
            const itemId = String(payload.new?.id || payload.old?.id);
            if (!menuItemIds.includes(itemId)) return;
            
            const oldPrice = payload.old?.price;
            const newPrice = payload.new?.price;
            
            if (oldPrice !== newPrice) {
              toast('Price updated for an item in your cart', {
                icon: '💰',
                duration: 4000
              });
            }
            
            if (payload.new?.is_available === false) {
              toast.error('An item in your cart is no longer available', {
                icon: '⚠️',
                duration: 5000
              });
            }
            
            if (refetchCart) {
              setTimeout(() => {
                refetchCart();
              }, 500);
            }
          }
        )
        .subscribe();
      
      channels.push(menuItemsChannel);
    }

    return () => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          logger.warn('Error removing real-time channel:', err);
        }
      });
    };
  }, [cartItems, showPayment, showSuccessModal, placingOrder, refetchCart]);
  
  // ... rest of component
}

// AFTER: Custom hook extraction
// pages/Checkout/hooks/useCheckoutRealtime.ts

interface UseCheckoutRealtimeOptions {
  cartItems: CartItem[];
  user: { id: string } | null;
  showPayment: boolean;
  showSuccessModal: boolean;
  placingOrder: boolean;
  refetchCart?: () => void;
  refetchAddresses?: () => void;
  onProductUpdate?: (payload: unknown) => void;
}

export function useCheckoutRealtime({
  cartItems,
  user,
  showPayment,
  showSuccessModal,
  placingOrder,
  refetchCart,
  refetchAddresses,
  onProductUpdate,
}: UseCheckoutRealtimeOptions) {
  const channelsRef = useRef<Array<ReturnType<typeof supabase.channel>>>([]);

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;
    if (showPayment || showSuccessModal || placingOrder) return;

    const menuItemIds = [...new Set(cartItems
      .filter(item => item.menu_item_id || item.resolvedProductType === 'menu_item')
      .map(item => item.menu_item_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )];

    const dishIds = [...new Set(cartItems
      .filter(item => item.product_id || item.resolvedProductType === 'dish')
      .map(item => item.product_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )];

    const channels: Array<ReturnType<typeof supabase.channel>> = [];

    // Subscribe to menu_items updates
    if (menuItemIds.length > 0) {
      try {
        const menuItemsSet = new Set(menuItemIds.map(id => String(id)));
        const menuItemsChannel = supabase
          .channel('checkout-menu-items-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'menu_items'
            },
            async (payload) => {
              const itemId = String(payload.new?.id || payload.old?.id);
              if (!menuItemsSet.has(itemId)) return;
              
              logger.log('Menu item updated in checkout:', payload);
              
              const oldPrice = payload.old?.price;
              const newPrice = payload.new?.price;
              
              if (oldPrice !== newPrice) {
                toast('Price updated for an item in your cart', {
                  icon: '💰',
                  duration: 4000
                });
              }
              
              if (payload.new?.is_available === false) {
                toast.error('An item in your cart is no longer available', {
                  icon: '⚠️',
                  duration: 5000
                });
              }
              
              if (refetchCart) {
                setTimeout(() => {
                  refetchCart();
                }, 500);
              }

              if (onProductUpdate) {
                onProductUpdate(payload);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.log('Real-time subscription active for menu_items in checkout');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              logger.warn(`Real-time subscription ${status} for menu_items`);
              // Note: For production, consider using useRealtimeChannel hook
              // which includes automatic reconnection with exponential backoff
            }
          });
        
        channels.push(menuItemsChannel);
      } catch (err) {
        logger.warn('Failed to subscribe to menu_items updates:', err);
      }
    }

    // Similar logic for dishes and products...

    channelsRef.current = channels;

    return () => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          logger.warn('Error removing real-time channel:', err);
        }
      });
    };
  }, [cartItems, showPayment, showSuccessModal, placingOrder, refetchCart, onProductUpdate]);

  // Similar useEffect for addresses subscription...
}

// pages/Checkout/index.tsx (now much cleaner)

function Checkout() {
  useCheckoutRealtime({
    cartItems,
    user,
    showPayment,
    showSuccessModal,
    placingOrder,
    refetchCart,
    refetchAddresses,
    onProductUpdate: (payload) => {
      // Handle product update
    },
  });
  
  // ... rest of component
}
```

### Pattern 10.4: Component Extraction from Large Files

```typescript
// BEFORE: All checkout UI in one file
// pages/Checkout.tsx (2000+ lines)

function Checkout() {
  // ... 500 lines of state management
  
  return (
    <div className="min-h-screen">
      {/* Shipping Address Form - 200 lines */}
      <div className="glow-surface">
        <h2>Shipping Address</h2>
        <form>
          {/* 150 lines of form fields */}
        </form>
      </div>
      
      {/* Payment Section - 150 lines */}
      <div className="glow-surface">
        <h2>Payment Information</h2>
        <Elements stripe={stripePromise}>
          {/* 100 lines of payment form */}
        </Elements>
      </div>
      
      {/* Order Summary Sidebar - 200 lines */}
      <div className="sticky top-4">
        <h2>Total</h2>
        {/* 150 lines of totals, loyalty, discount code */}
      </div>
    </div>
  );
}

// AFTER: Component extraction
// pages/Checkout/components/ShippingAddressForm.tsx

export function ShippingAddressForm({
  address,
  onAddressChange,
  showOrderNote,
  orderNote,
  onOrderNoteToggle,
  onOrderNoteChange,
  enableMarketingOptins,
  emailUpdatesOptIn,
  smsUpdatesOptIn,
  onEmailOptInChange,
  onSmsOptInChange,
  placingOrder,
  orderSuccess,
  showPayment,
  user,
  savedAddressesCount,
  useManualAddress,
  onBackToSavedAddresses,
  onSubmit,
  isAddressValid,
  isLightTheme,
}: ShippingAddressFormProps) {
  return (
    <div
      className="glow-surface glow-strong border border-theme rounded-xl p-6"
      style={{
        backgroundColor: isLightTheme
          ? 'rgba(0, 0, 0, 0.04)'
          : 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-xl font-bold text-[var(--text-main)]">Shipping Address</h2>
        </div>
        {user && savedAddressesCount === 0 && (
          <Link
            to="/addresses"
            className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Save Address for Later
          </Link>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-main)] mb-1">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={address.fullName}
            onChange={onAddressChange}
            placeholder="John Doe"
            required
            disabled={placingOrder || orderSuccess}
            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          />
        </div>

        {/* ... more form fields ... */}
      </form>
    </div>
  );
}

// pages/Checkout/components/PaymentSection.tsx

export function PaymentSection({
  showPayment,
  clientSecret,
  orderId,
  amount,
  onSuccess,
  onError,
  orderSuccess,
  isLightTheme,
}: PaymentSectionProps) {
  if (!showPayment || !clientSecret) return null;

  return (
    <>
      <div
        className="glow-surface glow-strong border border-theme rounded-xl p-6 mt-6"
        style={{
          backgroundColor: isLightTheme
            ? 'rgba(0, 0, 0, 0.04)'
            : 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="text-xl font-bold text-[var(--text-main)]">Payment Information</h2>
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeCheckoutForm
            orderId={orderId}
            amount={amount}
            currencySymbol={CURRENCY_SYMBOL}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      </div>

      {/* Security Info */}
      {!orderSuccess && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">Secure Payment</h3>
              <p className="text-muted">
                Your payment information is processed securely through Stripe. We never store your credit card details.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// pages/Checkout/components/OrderSummarySidebar.tsx

export function OrderSummarySidebar({
  totalItemsCount,
  subtotal,
  shipping,
  tax,
  taxRatePercent,
  grandTotal,
  discountCodeInput,
  appliedDiscountCode,
  discountAmount,
  discountError,
  validatingDiscount,
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  enableLoyaltyProgram,
  loyalty,
  placingOrder,
  orderSuccess,
  showPayment,
  fulfillmentMode,
  isLightTheme,
  onPlaceOrder,
}: OrderSummarySidebarProps) {
  const [showRewardsPanel, setShowRewardsPanel] = useState(false);

  return (
    <div
      className="glow-surface glow-strong border border-theme rounded-xl p-6 sticky top-4"
      style={{
        backgroundColor: isLightTheme
          ? 'var(--bg-elevated)'
          : 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Total</h2>

      {/* Loyalty Program */}
      {enableLoyaltyProgram && loyalty && (
        <div className="mb-4 rounded-xl border border-[#C59D5F]/30 bg-[#C59D5F]/10 p-4 text-xs text-amber-100/80">
          {/* ... loyalty UI ... */}
        </div>
      )}

      {/* Totals Breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm text-[var(--text-muted)]">
          <span>Subtotal ({totalItemsCount} items)</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-400">
            <span>Discount</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-[var(--text-muted)]">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--text-muted)]">
          <span>Tax ({taxRatePercent}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-[var(--text-main)] pt-2 border-t border-[var(--border-default)]">
          <span>Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={onPlaceOrder}
        disabled={placingOrder || orderSuccess || !showPayment}
        className="w-full min-h-[44px] bg-[var(--accent)] text-black font-semibold rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      >
        {placingOrder ? 'Placing Order...' : orderSuccess ? 'Order Placed!' : `Place Order - ${formatCurrency(grandTotal)}`}
      </button>
    </div>
  );
}

// pages/Checkout/index.tsx (now much cleaner - ~300 lines)

function Checkout() {
  // ... state management (100 lines)
  
  return (
    <div className="min-h-screen">
      <CheckoutHeader />
      
      <div 
        className="py-6"
        style={{
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ShippingAddressForm
              address={shippingAddress}
              onAddressChange={handleAddressChange}
              // ... other props
            />
            
            <PaymentSection
              showPayment={showPayment}
              clientSecret={clientSecret}
              orderId={createdOrderId}
              amount={grandTotal}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              orderSuccess={orderSuccess}
              isLightTheme={isLightTheme}
            />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummarySidebar
              totalItemsCount={totalItemsCount}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              taxRatePercent={taxRatePercent}
              grandTotal={grandTotal}
              // ... other props
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Pattern 10.5: Constants and Types Extraction

```typescript
// BEFORE: Magic numbers and strings scattered
// pages/Checkout.tsx

function Checkout() {
  const SHIPPING_THRESHOLD = 500;
  const SHIPPING_FEE = 50;
  const DEFAULT_TAX_RATE = 0.08;
  const CURRENCY_SYMBOL = '৳';
  const CURRENCY_CODE = 'BDT';
  
  const SCHEDULED_SLOTS = [
    { value: 'asap', label: 'ASAP (30-40 min)' },
    { value: '18:00', label: '6:00 – 6:15 PM' },
    { value: '18:20', label: '6:20 – 6:35 PM' },
    // ... more slots
  ];
  
  // ... component logic
}

// AFTER: Constants file
// pages/Checkout/constants.ts

export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_CODE = 'BDT';

export const SHIPPING_THRESHOLD = 500; // Free shipping threshold
export const SHIPPING_FEE = 50; // Default shipping fee

export const DEFAULT_TAX_RATE = 0.08; // Default tax rate percentage

export const SCHEDULED_SLOTS = [
  { value: 'asap', label: 'ASAP (30-40 min)' },
  { value: '18:00', label: '6:00 – 6:15 PM' },
  { value: '18:20', label: '6:20 – 6:35 PM' },
  { value: '18:40', label: '6:40 – 6:55 PM' },
  { value: '19:00', label: '7:00 – 7:15 PM' },
] as const;

export const FULFILLMENT_MODES = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Pickup' },
] as const;

// pages/Checkout/types.ts

export interface ShippingAddress {
  fullName: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export type FulfillmentMode = 'delivery' | 'pickup';
export type ScheduledSlot = 'asap' | string;

export interface CheckoutState {
  guestEmail: string;
  showConversionModal: boolean;
  guestCheckoutData: unknown | null;
  continueAsGuest: boolean;
  fulfillmentMode: FulfillmentMode;
  scheduledSlot: ScheduledSlot;
  selectedSavedAddress: unknown | null;
  useManualAddress: boolean;
  shippingAddress: ShippingAddress;
  placingOrder: boolean;
  orderSuccess: boolean;
  orderError: string;
  showPayment: boolean;
  clientSecret: string;
  createdOrderId: string | null;
  showSuccessModal: boolean;
  showOrderNote: boolean;
  orderNote: string;
  showRewardsPanel: boolean;
  trackingStatus: unknown | null;
  emailUpdatesOptIn: boolean;
  smsUpdatesOptIn: boolean;
  discountCodeInput: string;
  appliedDiscountCode: unknown | null;
  discountAmount: number;
  discountError: string;
  validatingDiscount: boolean;
}

// pages/Checkout/index.tsx (now uses constants and types)

import { CURRENCY_SYMBOL, SHIPPING_THRESHOLD, SHIPPING_FEE } from './constants';
import type { ShippingAddress, FulfillmentMode, CheckoutState } from './types';

function Checkout() {
  // ... component logic using imported constants and types
}
```

---

## 📊 REFACTORING METRICS

### Before Refactoring Metrics

- **File Size:** 2000+ lines
- **Cyclomatic Complexity:** High (15+)
- **Number of Responsibilities:** 8+
- **Test Coverage:** Low (difficult to test)
- **Reusability:** Low (tightly coupled)
- **Maintainability:** Low (hard to understand)

### After Refactoring Metrics

- **Main File Size:** ~300 lines
- **Component Files:** 5-10 files (~100-200 lines each)
- **Hook Files:** 3-5 files (~50-100 lines each)
- **Service Files:** 1-2 files (~200-300 lines each)
- **Utility Files:** 2-3 files (~50-100 lines each)
- **Cyclomatic Complexity:** Low (3-5 per file)
- **Number of Responsibilities:** 1 per file
- **Test Coverage:** High (easy to test individual pieces)
- **Reusability:** High (loosely coupled, reusable)
- **Maintainability:** High (easy to understand and modify)

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This prompt ensures all refactoring follows production-ready patterns with proper organization, backward compatibility, and maintainability.**

