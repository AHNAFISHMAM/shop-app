# 🎨 MASTER UI/UX DEVELOPMENT PROMPT
## Production-Grade Component & Page Development Workflow

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to building, refactoring, or replacing UI/UX components and pages with **production-level quality** (Apple/Google standards) for the **Star Café** application. It covers component architecture, animations, accessibility, responsive design, theme management, and performance optimization based on actual codebase patterns.

**Key Features:**
- Component design patterns (ProductCard, CartItemCard, Navbar, Footer)
- Framer Motion animation patterns
- CSS variable-based theming system
- Accessibility (WCAG 2.2 AA compliance)
- Responsive design (mobile-first)
- Performance optimization (memoization, lazy loading)
- Design system integration (Tailwind + CSS variables)

---

## 🎯 USE CASES

- Building new UI components
- Refactoring existing components
- Creating page layouts
- Implementing animations
- Adding accessibility features
- Optimizing component performance
- Implementing theme-aware components
- Creating responsive layouts

---

## 🏗️ ARCHITECTURE OVERVIEW

### Component Structure Pattern

```
src/
  ├── components/
  │   ├── ui/              # Base UI components (Button, Input, etc.)
  │   ├── menu/            # Menu-specific components
  │   ├── order/           # Order/cart components
  │   └── animations/      # Animation variants
  ├── features/
  │   └── [feature]/
  │       └── components/   # Feature-specific components
  └── pages/               # Page-level components
```

### Design System Layers

1. **CSS Variables** - Theme tokens (`--accent`, `--bg-main`, `--text-main`)
2. **Tailwind Utilities** - Layout, spacing, typography
3. **Component Variants** - CVA (Class Variance Authority) for component states
4. **Animation Variants** - Framer Motion variants for consistent motion
5. **Accessibility** - ARIA, keyboard navigation, 44px touch targets

---

## 🎨 PHASE 1: COMPONENT ARCHITECTURE

### Step 1.1: Base Component Template

```typescript
// src/components/ui/ComponentName.tsx

import { memo, useMemo, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * ComponentName Component
 *
 * Description of what this component does.
 *
 * Features:
 * - Feature 1
 * - Feature 2
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized values and callbacks)
 * - Theme-aware styling
 * - Respects prefers-reduced-motion
 */
interface ComponentNameProps {
  /** Required prop description */
  requiredProp: string;
  /** Optional prop description */
  optionalProp?: boolean;
  /** Callback function */
  onAction?: () => void;
}

const ComponentName = memo(({
  requiredProp,
  optionalProp = false,
  onAction,
}: ComponentNameProps) => {
  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Memoized values
  const computedValue = useMemo(() => {
    // Expensive computation
    return someExpensiveOperation(requiredProp);
  }, [requiredProp]);

  return (
    <m.div
      className={cn(
        'base-classes',
        optionalProp && 'conditional-classes',
        'theme-aware-classes'
      )}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label="Component description"
    >
      {/* Component content */}
    </m.div>
  );
});

ComponentName.displayName = 'ComponentName';

export default ComponentName;
```

### Step 1.2: Product Card Pattern (Real Example)

```typescript
// src/components/menu/ProductCard.tsx

import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils';

interface Product {
  id: string;
  name: string;
  price: number | string;
  currency?: string;
  images?: string[];
  image_url?: string;
  is_available?: boolean;
  // Note: stock_quantity removed - use is_available boolean instead
  dietary_tags?: string[];
  allergens?: string[];
  chef_special?: boolean;
  is_featured?: boolean;
  [key: string]: unknown;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  getImageUrl: (product: Product) => string;
  enableCustomization?: boolean;
  compact?: boolean;
}

const ProductCard = memo(({
  product,
  onAddToCart,
  getImageUrl,
  enableCustomization = false,
  compact = false,
}: ProductCardProps) => {
  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Memoized values
  const imageUrl = useMemo(() => getImageUrl(product), [product, getImageUrl]);
  const formattedPrice = useMemo(() => {
    const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const currency = product.currency || 'BDT';
    return `${getCurrencySymbol(currency)}${formatPrice(priceNum, 2)}`;
  }, [product.price, product.currency]);

  const isAvailable = useMemo(() => {
    return product.is_available ?? false;
  }, [product.is_available]);

  // Callbacks
  const handleAddToCart = useCallback(() => {
    onAddToCart(product);
  }, [product, onAddToCart]);

  return (
    <m.article
      className={cn(
        'group relative flex flex-col rounded-lg border bg-[var(--bg-elevated)]',
        'overflow-hidden shadow-sm shadow-black/5',
        'transition-all duration-200',
        'hover:shadow-md hover:shadow-black/10',
        'focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:ring-offset-2',
        compact && 'compact-variant-classes'
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={prefersReducedMotion ? {} : { y: -4 }}
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-[var(--bg-main)]">
        <m.img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Badges */}
        <AnimatePresence>
          {product.chef_special && (
            <m.div
              className="absolute top-2 left-2 rounded-full bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-black"
              initial={prefersReducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              Chef's Special
            </m.div>
          )}

          {!isAvailable && (
            <m.div
              className="absolute top-2 right-2 rounded-full bg-[var(--destructive)] px-2 py-1 text-xs font-semibold text-white"
              initial={prefersReducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              Unavailable
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 text-lg font-semibold text-[var(--text-main)] line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--accent)]">
            {formattedPrice}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-lg bg-[var(--accent)] px-4 py-2',
              'font-medium text-black transition-colors',
              'hover:bg-[var(--accent)]/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-95'
            )}
            aria-label={`Add ${product.name} to cart`}
          >
            Add
          </button>
        </div>
      </div>
    </m.article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
```

---

## 🎬 PHASE 2: ANIMATION PATTERNS

### Step 2.1: Animation Variants (Real Example)

```typescript
// src/components/animations/menuAnimations.ts

import { Variants } from 'framer-motion';

// Optimized easing functions
const easeOut: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const easeIn: [number, number, number, number] = [0.42, 0, 1, 1];
const easeInOut: [number, number, number, number] = [0.42, 0, 0.58, 1];

type BatchCustom =
  | number
  | {
      batchIndex?: number;
      itemIndex?: number;
      baseDelay?: number;
      batchDelay?: number;
      itemDelay?: number;
      exitDelay?: number;
    };

const resolveDelay = (custom: BatchCustom, defaults?: {
  baseDelay?: number;
  batchDelay?: number;
  itemDelay?: number;
}) => {
  if (typeof custom === 'number') {
    return { delay: custom };
  }

  const {
    batchIndex = 0,
    itemIndex = 0,
    baseDelay = defaults?.baseDelay ?? 0,
    batchDelay = defaults?.batchDelay ?? 0.3,
    itemDelay = defaults?.itemDelay ?? 0.06,
  } = custom ?? {};

  return {
    delay: baseDelay + batchIndex * batchDelay + itemIndex * itemDelay,
    exitDelay: custom?.exitDelay ?? 0,
  };
};

// Page transitions
export const pageFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: easeInOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: easeIn },
  },
};

// Stagger animations for lists
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: BatchCustom = 0) => {
    const { delay } = resolveDelay(custom);
    return {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: easeInOut, delay },
    };
  },
  exit: (custom: BatchCustom = 0) => ({
    opacity: 0,
    y: 24,
    transition: {
      duration: 0.3,
      ease: easeIn,
      delay: typeof custom === 'number' ? 0 : custom?.exitDelay ?? 0,
    },
  }),
};

// Grid reveal animation
export const gridReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: easeInOut,
      staggerChildren: 0.12,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: easeIn },
  },
};

// Menu stagger animation
export const menuStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.08,
      when: 'afterChildren',
    },
  },
};
```

### Step 2.2: Using Animations in Components

```typescript
// Using animations in a product grid

import { m } from 'framer-motion';
import { gridReveal, fadeSlideUp } from '../components/animations/menuAnimations';

function ProductGrid({ products }: { products: Product[] }) {
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return (
    <m.div
      variants={prefersReducedMotion ? {} : gridReveal}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {products.map((product, index) => (
        <m.div
          key={product.id}
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          custom={index}
        >
          <ProductCard product={product} onAddToCart={handleAddToCart} />
        </m.div>
      ))}
    </m.div>
  );
}
```

---

## 🎨 PHASE 3: THEME SYSTEM

### Step 3.1: CSS Variables Pattern

```css
/* src/index.css - Theme Variables */

:root {
  /* Accent Colors */
  --accent: #C59D5F;
  --accent-rgb: 197, 157, 95;
  --accent-hover: #B88D4F;

  /* Background Colors */
  --bg-main: #0F0F0F;
  --bg-elevated: #1A1A1A;
  --bg-hover: rgba(255, 255, 255, 0.05);

  /* Text Colors */
  --text-main: #F9FAFB;
  --text-main-rgb: 249, 250, 251;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
  --text-muted: rgba(249, 250, 251, 0.6);

  /* Border Colors */
  --border-default: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.2);

  /* Status Colors */
  --destructive: #EF4444;
  --destructive-hover: #DC2626;
  --status-success-border: #10B981;
  --status-warning-border: #F59E0B;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.theme-light {
  --bg-main: #FFFFFF;
  --bg-elevated: #F9FAFB;
  --bg-hover: rgba(0, 0, 0, 0.05);
  --text-main: #111827;
  --text-main-rgb: 17, 24, 39;
  --text-secondary: #4B5563;
  --text-tertiary: #6B7280;
  --border-default: rgba(0, 0, 0, 0.1);
  --border-hover: rgba(0, 0, 0, 0.2);
}
```

### Step 3.2: Theme-Aware Component Pattern

```typescript
// Theme detection and usage

const Component = () => {
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        'bg-[var(--bg-elevated)]',
        'text-[var(--text-main)]',
        'border border-[var(--border-default)]',
        isLightTheme && 'light-theme-specific-classes'
      )}
    >
      {/* Content */}
    </div>
  );
};
```

---

## ♿ PHASE 4: ACCESSIBILITY

### Step 4.1: Accessibility Checklist

**✅ Required for all interactive components:**

1. **Touch Targets** - Minimum 44x44px
2. **Keyboard Navigation** - Full keyboard support
3. **ARIA Labels** - Proper ARIA attributes
4. **Focus Management** - Visible focus indicators
5. **Screen Reader Support** - Semantic HTML and ARIA
6. **Color Contrast** - WCAG 2.2 AA (4.5:1 for text)
7. **Reduced Motion** - Respect `prefers-reduced-motion`

### Step 4.2: Accessible Button Pattern

```typescript
// Button component with full accessibility

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'whitespace-nowrap rounded-lg font-medium',
          'transition-colors outline-offset-2',
          'focus-visible:outline focus-visible:outline-2',
          'focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[var(--bg-main)]',
          'disabled:pointer-events-none disabled:opacity-50',
          // Size - Always 44px minimum
          size === 'sm' && 'min-h-[44px] h-11 px-3 text-xs',
          size === 'default' && 'min-h-[44px] h-11 px-4 py-2.5 text-sm',
          size === 'lg' && 'min-h-[44px] h-12 px-8 text-base',
          // Variants
          variant === 'default' && 'bg-[var(--accent)] text-black hover:bg-[var(--accent)]/90',
          variant === 'outline' && 'border border-[var(--border-default)] bg-[var(--bg-main)]',
          className
        )}
        disabled={loading || props.disabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="sr-only">Loading</span>
            <Spinner className="mr-2" />
          </>
        ) : null}
        {children}
      </button>
    );
  }
);
```

### Step 4.3: Accessible Form Input Pattern

```typescript
// Input component with full accessibility

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = React.useId();
    const finalId = id || inputId;
    const hasError = Boolean(error);

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={finalId}
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-[var(--destructive)]">*</span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={finalId}
          className={cn(
            'w-full min-h-[44px] rounded-lg border bg-[var(--bg-elevated)]',
            'px-4 py-2.5 text-sm text-[var(--text-primary)]',
            'placeholder:text-[var(--text-tertiary)]',
            'transition-colors outline-offset-2',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'focus:ring-offset-[var(--bg-main)]',
            hasError
              ? 'border-[var(--destructive)] focus:ring-[var(--destructive)]/50'
              : 'border-[var(--border-default)] focus:border-[var(--accent)] focus:ring-[var(--accent)]/50',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            (error || helperText) ? `${finalId}-helper` : undefined
          }
          {...props}
        />

        {(error || helperText) && (
          <p
            id={`${finalId}-helper`}
            role={hasError ? 'alert' : undefined}
            className={cn(
              'text-xs',
              hasError
                ? 'text-[var(--destructive)]'
                : 'text-[var(--text-secondary)]'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
```

---

## 📱 PHASE 5: RESPONSIVE DESIGN

### Step 5.1: Mobile-First Breakpoints

```typescript
// Responsive component pattern

const ResponsiveComponent = () => {
  return (
    <div className={cn(
      // Mobile first (default)
      'flex flex-col gap-4 p-4',
      // Tablet (sm:)
      'sm:flex-row sm:gap-6 sm:p-6',
      // Desktop (lg:)
      'lg:grid lg:grid-cols-3 lg:gap-8 lg:p-8'
    )}>
      {/* Content */}
    </div>
  );
};
```

### Step 5.2: Responsive Grid Pattern

```typescript
// Product grid with responsive columns

const ProductGrid = ({ products }: { products: Product[] }) => {
  return (
    <div className={cn(
      'grid gap-4',
      'grid-cols-1',           // Mobile: 1 column
      'sm:grid-cols-2',        // Tablet: 2 columns
      'lg:grid-cols-3',        // Desktop: 3 columns
      'xl:grid-cols-4'         // Large: 4 columns
    )}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

### Step 5.3: Page Spacing Pattern

```typescript
// Consistent side spacing using inline clamp padding
// This approach avoids breaking sticky positioning (unlike app-container class)

const PageContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div 
      className={cn('w-full', className)}
      style={{
        // Add padding to match Navbar spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
    >
      {children}
    </div>
  );
};

// For main elements (m.main or <main>):
const MainPage = () => {
  return (
    <m.main
      className="min-h-screen bg-[var(--bg-main)]"
      style={{
        pointerEvents: 'auto',
        // Consistent spacing matching Navbar
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
    >
      {/* Page content */}
    </m.main>
  );
};
```

**Why inline styles instead of `app-container` class?**
- The `app-container` CSS class can create overflow constraints that break `position: sticky`
- Inline styles with `overflow: visible` ensure sticky sidebars work correctly
- All pages and Navbar use the same `clamp(1rem, 3vw, 3.5rem)` pattern for consistency
- This matches the spacing system used across all 28 pages in the codebase

---

## ⚡ PHASE 6: PERFORMANCE OPTIMIZATION

### Step 6.1: Memoization Patterns

```typescript
// Memoize expensive computations

const Component = ({ data }: { data: Data[] }) => {
  // Memoize filtered/sorted data
  const filteredData = useMemo(() => {
    return data.filter(item => item.isActive).sort((a, b) => a.order - b.order);
  }, [data]);

  // Memoize formatted values
  const formattedPrice = useMemo(() => {
    return formatPrice(price, currency);
  }, [price, currency]);

  // Memoize callbacks
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  return (
    // JSX using memoized values
  );
};
```

### Step 6.2: Component Memoization

```typescript
// Memoize components to prevent unnecessary re-renders

const ProductCard = memo(({ product, onAddToCart }: ProductCardProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.is_available === nextProps.product.is_available
  );
});
```

### Step 6.3: Lazy Loading Images

```typescript
// Lazy load images with placeholder

const LazyImage = ({ src, alt, className }: ImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-[var(--bg-main)] animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};
```

---

## 🧩 PHASE 7: COMPONENT COMPOSITION

### Step 7.1: Compound Component Pattern

```typescript
// Card component with compound pattern

const Card = ({ children, className }: CardProps) => {
  return (
    <div className={cn('rounded-lg border bg-[var(--bg-elevated)]', className)}>
      {children}
    </div>
  );
};

Card.Header = ({ children, className }: CardHeaderProps) => {
  return (
    <div className={cn('border-b border-[var(--border-default)] p-4', className)}>
      {children}
    </div>
  );
};

Card.Body = ({ children, className }: CardBodyProps) => {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  );
};

Card.Footer = ({ children, className }: CardFooterProps) => {
  return (
    <div className={cn('border-t border-[var(--border-default)] p-4', className)}>
      {children}
    </div>
  );
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

### Step 7.2: Render Props Pattern

```typescript
// Component with render props

interface DataFetcherProps<T> {
  url: string;
  children: (data: { data: T | null; loading: boolean; error: Error | null }) => React.ReactNode;
}

const DataFetcher = <T,>({ url, children }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{children({ data, loading, error })}</>;
};

// Usage
<DataFetcher url="/api/products">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    return <ProductList products={data} />;
  }}
</DataFetcher>
```

---

## 🎯 PHASE 8: PAGE LAYOUT PATTERNS

### Step 8.1: Page Layout Template

```typescript
// Standard page layout

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

const PageLayout = ({ title, description, children, headerActions }: PageLayoutProps) => {
  const spacingStyle = {
    paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
    paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
    overflow: 'visible' as const,
    overflowX: 'visible' as const,
    overflowY: 'visible' as const
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {/* Header */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
        <div 
          className="py-4 sm:py-6"
          style={spacingStyle}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-main)] sm:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="py-6 sm:py-8"
        style={spacingStyle}
      >
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
```

### Step 8.2: Two-Column Layout Pattern

```typescript
// Two-column layout for checkout, admin, etc.

const TwoColumnLayout = ({
  sidebar,
  main,
  sidebarPosition = 'right',
}: TwoColumnLayoutProps) => {
  return (
    <div className={cn(
      'grid gap-6',
      'grid-cols-1',                    // Mobile: single column
      'lg:grid-cols-3',                // Desktop: 3 columns (1 sidebar + 2 main)
      sidebarPosition === 'left' && 'lg:grid-cols-[1fr_2fr]'
    )}>
      {/* 
        NOTE: For sticky to work, ensure root containers (#root, html, body) 
        have overflow-y: visible. See Pattern 9.3 for full requirements.
      */}
      <aside className={cn(
        'lg:sticky lg:top-4 lg:h-fit',
        sidebarPosition === 'right' && 'lg:order-2'
      )}>
        {sidebar}
      </aside>
      <main className={cn(
        sidebarPosition === 'left' && 'lg:order-2'
      )}>
        {main}
      </main>
    </div>
  );
};
```

---

## 🚨 COMMON ANTI-PATTERNS

### ❌ Never:

- **Inline styles** - Use CSS variables and Tailwind classes
- **Hardcoded colors** - Use CSS variables (`var(--accent)`)
- **Missing accessibility** - Always include ARIA, keyboard support, 44px touch targets
- **Ignoring reduced motion** - Always check `prefers-reduced-motion`
- **Unoptimized images** - Always use `loading="lazy"` and proper sizing
- **Non-memoized expensive computations** - Use `useMemo` for expensive operations
- **Missing error states** - Always handle loading, error, and empty states
- **Inconsistent spacing** - Use Tailwind spacing scale (4px increments)
- **Breaking responsive design** - Always test mobile, tablet, desktop
- **Forgetting theme support** - Always use CSS variables for colors

### ✅ Always:

- Use CSS variables for theming
- Include accessibility features (ARIA, keyboard, touch targets)
- Respect `prefers-reduced-motion`
- Memoize expensive computations
- Use proper TypeScript types
- Follow mobile-first responsive design
- Use semantic HTML
- Include loading and error states
- Optimize images (lazy loading, proper sizing)
- Test on multiple screen sizes

---

## 📚 REFERENCE

- **Component Examples:** `src/components/menu/ProductCard.tsx`, `src/components/order/CartItemCard.tsx`
- **Animation Variants:** `src/components/animations/menuAnimations.ts`
- **UI Components:** `src/components/ui/button.tsx`, `src/components/ui/input.tsx`
- **Theme System:** `src/index.css`, `src/contexts/ThemeContext.tsx`
- **Layout Components:** `src/components/Navbar.tsx`, `src/components/Footer.tsx`

---

## 🔗 RELATED MASTER PROMPTS

- **🎣 [MASTER_CUSTOM_HOOKS_PROMPT.md](./MASTER_CUSTOM_HOOKS_PROMPT.md)** - Custom hooks for component logic
- **🔄 [MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md](./MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md)** - Data fetching patterns
- **🔐 [MASTER_AUTHENTICATION_SECURITY_PROMPT.md](./MASTER_AUTHENTICATION_SECURITY_PROMPT.md)** - Protected routes and auth UI
- **📝 [MASTER_FORM_HANDLING_VALIDATION_PROMPT.md](./MASTER_FORM_HANDLING_VALIDATION_PROMPT.md)** - Form components and validation

---

## 🎯 ADVANCED COMPONENT PATTERNS

### Pattern 9.1: Bottom Sheet Component (Mobile-First)

```typescript
// components/order/CartBottomSheet.tsx
// Mobile-optimized bottom sheet with swipe gestures

const CartBottomSheet = ({
  isOpen,
  onClose,
  cartItems,
  cartSummary,
  onUpdateQuantity,
  onRemoveItem,
  getImageUrl,
  isUpdating = false,
  error = null,
}: CartBottomSheetProps) => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useStoreSettings();
  
  // Theme detection with MutationObserver
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  // Reduced motion support
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Memoized handlers
  const handleCheckout = useCallback(() => {
    onClose();
    navigate('/checkout');
  }, [navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Bottom Sheet */}
          <m.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-main)] rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-sheet-title"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-[var(--border-default)] rounded-full" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="px-4 pb-4 border-b border-[var(--border-default)]">
              <h2 id="cart-sheet-title" className="text-xl font-bold text-[var(--text-main)]">
                Your Cart ({cartItems.length})
              </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {cartItems.length === 0 ? (
                <EmptyCartState onBrowseMenu={handleCheckout} />
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <SwipeableCartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemoveItem={onRemoveItem}
                      getImageUrl={getImageUrl}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Totals */}
            <div className="border-t border-[var(--border-default)] p-4 space-y-3">
              <CartTotals
                subtotal={cartSummary.subtotal}
                deliveryFee={cartSummary.deliveryFee}
                total={cartSummary.total}
              />
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || isUpdating}
                className="w-full min-h-[44px] bg-[var(--accent)] text-black font-semibold rounded-xl py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label="Proceed to checkout"
              >
                {isUpdating ? 'Updating...' : `Checkout - ${formatCurrency(cartSummary.total)}`}
              </button>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

### Pattern 9.2: Sticky Navigation Tabs

```typescript
// components/menu/CategoryTabs.tsx
// Sticky category navigation with active state

const CategoryTabs = ({
  categories,
  filteredSubcategories = [],
  selectedMainCategory = null,
  selectedSubcategory = null,
  onMainCategoryClick,
  onSubcategoryClick,
}: CategoryTabsProps) => {
  // Theme-aware background colors
  const stickyBg = useMemo(() => {
    return isLightTheme
      ? 'rgba(var(--text-main-rgb), 0.98)'
      : 'rgba(var(--bg-dark-rgb), 0.95)';
  }, [isLightTheme]);

  const hoverBg = useMemo(() => {
    return isLightTheme
      ? 'rgba(var(--bg-dark-rgb), 0.08)'
      : 'rgba(var(--text-main-rgb), 0.1)';
  }, [isLightTheme]);

  return (
    <m.nav
      className="sticky top-16 z-20 backdrop-blur-md border-b py-3 sm:py-4"
      style={{ backgroundColor: stickyBg }}
      variants={prefersReducedMotion ? undefined : fadeSlideDown}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      role="navigation"
      aria-label="Category navigation"
    >
      <div 
        style={{
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
      >
        <m.div
          className="flex items-center gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
          variants={prefersReducedMotion ? undefined : staggerContainer}
        >
          {/* All Dishes Button */}
          <m.button
            onClick={() => onMainCategoryClick(null)}
            className={cn(
              'px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl',
              'text-sm sm:text-base font-medium whitespace-nowrap',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              !selectedMainCategory
                ? 'bg-[var(--accent)] text-black'
                : 'bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
            )}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            aria-pressed={!selectedMainCategory}
          >
            All Dishes
          </m.button>

          {/* Main Categories */}
          {categories.map((category) => (
            <m.button
              key={category.id}
              onClick={() => onMainCategoryClick(category)}
              className={cn(
                'px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl',
                'text-sm sm:text-base font-medium whitespace-nowrap',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                selectedMainCategory?.id === category.id
                  ? 'bg-[var(--accent)] text-black'
                  : 'bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              )}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              aria-pressed={selectedMainCategory?.id === category.id}
            >
              {category.name}
            </m.button>
          ))}
        </m.div>

        {/* Subcategories */}
        {selectedMainCategory && filteredSubcategories.length > 0 && (
          <m.div
            className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide"
            variants={prefersReducedMotion ? undefined : fadeSlideUp}
            initial={prefersReducedMotion ? undefined : 'hidden'}
            animate={prefersReducedMotion ? undefined : 'visible'}
          >
            {filteredSubcategories.map((subcategory) => (
              <m.button
                key={subcategory.id}
                onClick={() => onSubcategoryClick(subcategory)}
                className={cn(
                  'px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium whitespace-nowrap',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                  selectedSubcategory?.id === subcategory.id
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                )}
                aria-pressed={selectedSubcategory?.id === subcategory.id}
              >
                {subcategory.name}
              </m.button>
            ))}
          </m.div>
        )}
      </div>
    </m.nav>
  );
};
```

### Pattern 9.3: Sticky Sidebar (Menu Page Pattern)

```typescript
// components/menu/CollapsibleSidebar.tsx
// Sticky sidebar that remains visible while scrolling page content

/**
 * CRITICAL REQUIREMENTS for position:sticky to work:
 * 
 * 1. Root Container Overflow:
 *    - #root, html, and body MUST have overflow-y: visible !important
 *    - overflow-x: hidden is OK (prevents horizontal scroll)
 *    - If root containers have overflow: hidden/auto, sticky fails
 * 
 * 2. Parent Container Requirements:
 *    - All ancestors must have overflow: visible (no scrolling boxes)
 *    - No transform, will-change, or isolation: isolate on parents
 *    - Parent must have sufficient height (min-height: 100vh recommended)
 * 
 * 3. Sidebar Element:
 *    - position: sticky (not fixed)
 *    - top: 4rem (offset from viewport top, matches navbar height)
 *    - transform: none (transforms create containing blocks)
 *    - willChange: auto (prevents stacking context creation)
 *    - alignSelf: flex-start (in flex containers)
 */

const CollapsibleSidebar = ({ ... }: CollapsibleSidebarProps) => {
  return (
    <aside 
      className="sticky top-16 self-start z-20"
      style={{
        position: 'sticky', // Sticky relative to viewport (not parent container)
        top: '4rem', // Offset from viewport top (matches navbar height)
        height: 'auto',
        maxHeight: 'calc(100vh - 4rem)', // Constrain to viewport minus navbar
        alignSelf: 'flex-start', // Align to start in flex container
        transform: 'none', // No transforms - transforms create containing blocks
        willChange: 'auto' // No will-change - creates stacking context
      }}
    >
      {/* Sidebar content */}
    </aside>
  );
};
```

**Root Cause Analysis Pattern:**
When `position: sticky` fails, check in this order:
1. **Root containers** (`#root`, `html`, `body`) - most common cause
   - Run: `getComputedStyle(document.getElementById('root')).overflowY`
   - Fix: Add `overflow-y: visible !important` to all root containers
2. **Parent containers** - walk up DOM tree checking each ancestor
   - Check: `overflow`, `overflow-y`, `transform`, `will-change`, `isolation`
   - Fix: Remove or override problematic properties
3. **Sidebar element itself** - verify inline styles match requirements
   - Check: `position: sticky`, `top` value, `transform: none`, `willChange: auto`

**Diagnostic Script:**
```typescript
// utils/stickySidebarDiagnostics.ts
// Comprehensive diagnostic to identify why sticky fails
// Checks all ancestors, computed styles, and actual sticky behavior
```

**Example Fix Applied:**
```css
/* index.css - CRITICAL for sticky positioning */
#root {
  overflow-x: hidden !important; /* Prevent horizontal scroll */
  overflow-y: visible !important; /* REQUIRED: Allow sticky to work */
  overflow: visible !important;
}

html {
  overflow-x: hidden !important;
  overflow-y: visible !important; /* REQUIRED: Allow sticky to work */
  overflow: visible !important;
}

body {
  overflow-x: hidden !important;
  overflow-y: visible !important; /* REQUIRED: Allow sticky to work */
  overflow: visible !important;
}
```

### Pattern 9.4: Glass Morphism Search Bar

```typescript
// components/menu/MenuSearchBar.tsx
// Glass morphism search with clear button animation

const MenuSearchBar = ({ searchQuery, onSearchChange }: MenuSearchBarProps) => {
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const handleClear = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <m.section
      className="py-3 sm:py-4"
      style={{
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
      variants={prefersReducedMotion ? undefined : searchBarSequence}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      aria-labelledby="menu-search-heading"
    >
      {/* Hero Section */}
      <m.div className="text-center mb-8" variants={prefersReducedMotion ? undefined : staggerContainer}>
        <m.p className="text-sm uppercase tracking-widest text-[var(--accent)] mb-2" variants={prefersReducedMotion ? undefined : fadeSlideUp}>
          Discover Our Menu
        </m.p>
        <m.h1 id="menu-search-heading" className="text-lg sm:text-xl md:text-5xl font-bold text-[var(--text-main)] mb-4" variants={prefersReducedMotion ? undefined : fadeSlideUp}>
          Taste That Shines
        </m.h1>
      </m.div>

      {/* Search Bar */}
      <m.div className="max-w-2xl mx-auto" variants={prefersReducedMotion ? undefined : staggerContainer}>
        <m.div className="relative group" variants={prefersReducedMotion ? undefined : fadeSlideUp}>
          {/* Search Icon */}
          <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none" aria-hidden="true">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input Field */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            placeholder="Search dishes, cuisines, or ingredients..."
            className="w-full pl-12 pr-4 sm:pl-14 sm:pr-14 py-3 min-h-[44px] bg-[var(--bg-elevated)] backdrop-blur-md border border-[var(--border-default)] rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-200"
            aria-label="Search menu"
            aria-describedby={searchQuery ? 'search-results-count' : undefined}
          />

          {/* Clear Button */}
          <AnimatePresence>
            {searchQuery && (
              <m.button
                onClick={handleClear}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Clear search"
                initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 90 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </m.button>
            )}
          </AnimatePresence>
        </m.div>

        {/* Search Results Count */}
        {searchQuery && (
          <m.p id="search-results-count" className="text-sm text-[var(--text-muted)] mt-2 text-center" variants={prefersReducedMotion ? undefined : fadeSlideUp} role="status" aria-live="polite">
            Searching for &quot;{searchQuery}&quot;
          </m.p>
        )}
      </m.div>
    </m.section>
  );
};
```

### Pattern 9.4: Swipeable Cart Item

```typescript
// components/order/SwipeableCartItem.tsx
// Swipe gestures for mobile cart items

const SwipeableCartItem = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  getImageUrl,
  isUpdating = false,
  swipeThreshold = 100,
}: SwipeableCartItemProps) => {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Transform values for action button opacity
  const removeOpacity = useTransform(x, [-swipeThreshold, 0], [1, 0]);
  const saveOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const offset = info.offset.x;

      if (Math.abs(offset) > swipeThreshold) {
        if (offset < 0 && onRemoveItem) {
          onRemoveItem(item.id);
        } else if (offset > 0 && onSaveForLater) {
          onSaveForLater(item.id);
          x.set(0);
        } else {
          x.set(0);
        }
      } else {
        x.set(0);
      }
    },
    [item.id, onRemoveItem, onSaveForLater, swipeThreshold, x]
  );

  return (
    <div className="cart-item-swipeable" role="listitem">
      {/* Swipe Actions Background */}
      <div className="cart-item-swipe-actions" role="group" aria-label="Swipe actions">
        {onSaveForLater && (
          <m.button
            type="button"
            className="cart-swipe-action-btn cart-swipe-action-save min-h-[44px] min-w-[44px]"
            onClick={() => onSaveForLater(item.id)}
            aria-label={`Save ${item.menu_items?.name || 'item'} for later`}
            style={{ opacity: saveOpacity }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <svg className="cart-swipe-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </m.button>
        )}
        {onRemoveItem && (
          <m.button
            type="button"
            className="cart-swipe-action-btn cart-swipe-action-remove min-h-[44px] min-w-[44px]"
            onClick={() => onRemoveItem(item.id)}
            aria-label={`Remove ${item.menu_items?.name || 'item'}`}
            style={{ opacity: removeOpacity }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <svg className="cart-swipe-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </m.button>
        )}
      </div>

      {/* Cart Item Card */}
      <m.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="cart-item-card"
      >
        <CartItemCard
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          getImageUrl={getImageUrl}
          isUpdating={isUpdating}
        />
      </m.div>
    </div>
  );
};
```

### Pattern 9.5: Empty State Components

```typescript
// components/order/EmptyCartState.tsx
// Enhanced empty state with quick actions

const EmptyCartState = ({ onBrowseMenu, onViewFavorites, hasFavorites = false }: EmptyCartStateProps) => {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <m.div
      className="cart-empty-state"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
      role="status"
      aria-live="polite"
      aria-label="Empty cart"
    >
      <m.div
        initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={prefersReducedMotion ? false : { scale: 1, opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1, type: 'spring', stiffness: 200 }}
        className="cart-empty-icon-container"
        aria-hidden="true"
      >
        <svg className="cart-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </m.div>

      <m.h3
        className="cart-empty-title"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={prefersReducedMotion ? false : { opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 }}
      >
        Your cart is empty
      </m.h3>

      <m.p
        className="cart-empty-text"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={prefersReducedMotion ? false : { opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3 }}
      >
        Looks like you haven&apos;t added anything to your cart yet. Start shopping to fill it up!
      </m.p>

      <m.div
        className="cart-empty-actions"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4 }}
      >
        {onBrowseMenu && (
          <button
            onClick={onBrowseMenu}
            className="cart-btn-browse min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="Browse menu"
          >
            Browse Menu
          </button>
        )}
        {hasFavorites && onViewFavorites && (
          <button
            onClick={onViewFavorites}
            className="cart-btn-secondary min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="View favorites"
          >
            View Favorites
          </button>
        )}
      </m.div>
    </m.div>
  );
};
```

### Pattern 9.6: Loyalty Card Component

```typescript
// components/order/LoyaltyCard.tsx
// Animated loyalty progress with rewards

const LoyaltyCard = ({ loyalty, onApplyReward }: LoyaltyCardProps) => {
  const [showRewards, setShowRewards] = useState<boolean>(false);
  const availableRewards = loyalty?.redeemableRewards || [];
  const progressPercent = loyalty?.progressPercent ?? 0;

  return (
    <m.div
      className="cart-loyalty-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label="Loyalty program information"
    >
      <div className="cart-loyalty-header">
        <span>Loyalty</span>
        <span>{loyalty?.tier || 'Member'}</span>
      </div>

      {/* Progress Bar */}
      <div className="cart-loyalty-progress-container">
        <m.div
          className="cart-loyalty-progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(progressPercent, 4))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loyalty progress"
        />
      </div>

      {/* Points Info */}
      <div className="cart-loyalty-points">
        <span>{loyalty?.currentPoints ?? 0} pts</span>
        <span>
          {Math.max(0, loyalty?.pointsToNextTier ?? 0)} pts to {loyalty?.nextTierLabel || 'next tier'}
        </span>
      </div>

      {/* Projected Points */}
      <div className="cart-loyalty-projected">
        +{loyalty?.pointsEarnedThisOrder ?? 0} pts projected this order
      </div>

      {/* Rewards Toggle */}
      <button
        type="button"
        onClick={() => setShowRewards((prev) => !prev)}
        aria-expanded={showRewards}
        aria-controls="rewards-list"
        className="cart-loyalty-toggle-btn min-h-[44px]"
        aria-label={showRewards ? 'Hide rewards' : 'Show available rewards'}
      >
        {showRewards ? 'Hide Rewards' : 'Apply Rewards'}
      </button>

      {/* Rewards List */}
      <AnimatePresence>
        {showRewards && (
          <m.div
            id="rewards-list"
            role="region"
            aria-label="Available rewards"
            className="cart-loyalty-rewards"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {availableRewards.length > 0 ? (
              <ul className="cart-loyalty-rewards-list" role="list">
                {availableRewards.map((reward) => (
                  <m.li
                    key={reward.id}
                    className="cart-loyalty-reward-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="cart-loyalty-reward-label">{reward.label}</span>
                    <div className="cart-loyalty-reward-actions">
                      <span className="cart-loyalty-reward-cost">{reward.cost} pts</span>
                      {onApplyReward && (
                        <button
                          onClick={() => onApplyReward(reward.id)}
                          className="cart-loyalty-reward-apply min-h-[44px]"
                          aria-label={`Apply ${reward.label} reward`}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </m.li>
                ))}
              </ul>
            ) : (
              <p className="cart-loyalty-message">
                Earn {Math.max(0, loyalty?.pointsToNextTier ?? 0)} more pts to unlock your next perk.
              </p>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
};
```

---

## 🎨 ADVANCED ANIMATION PATTERNS

### Pattern 10.1: Stagger Container Animation

```typescript
// components/animations/menuAnimations.ts

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// Usage in component
<m.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  {items.map((item) => (
    <m.div key={item.id} variants={fadeSlideUp}>
      {item.content}
    </m.div>
  ))}
</m.div>
```

### Pattern 10.2: Batch Fade Slide Up

```typescript
export const batchFadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: BatchCustom = 0) => {
    const { delay, stagger } = resolveDelay(custom);
    return {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easeInOut,
        delay: delay + (stagger || 0),
      },
    };
  },
  exit: (custom: BatchCustom = 0) => ({
    opacity: 0,
    y: 24,
    transition: {
      duration: 0.3,
      ease: easeIn,
      delay: typeof custom === 'number' ? 0 : custom?.exitDelay ?? 0,
    },
  }),
};
```

### Pattern 10.3: Page Fade Animation

```typescript
export const pageFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: easeIn,
    },
  },
};

// Usage in page component
<m.div
  variants={pageFade}
  initial="hidden"
  animate="visible"
  exit="exit"
  className="min-h-screen"
>
  {children}
</m.div>
```

---

## ⚡ PHASE 6: COMPONENT OPTIMIZATION PATTERNS

### Step 6.1: Standard Component Optimization Checklist

**Every component should have:**

1. **Memo Wrapper:**
   ```typescript
   const ComponentName = memo(({ props }: Props) => {
     // Component logic
   });
   
   ComponentName.displayName = 'ComponentName';
   export default ComponentName;
   ```

2. **Theme Detection:**
   ```typescript
   // Option 1: Use useTheme hook (preferred)
   const { theme, prefersReducedMotion } = useTheme();
   
   // Option 2: Manual theme detection (if hook not available)
   const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
     if (typeof document === 'undefined') return false;
     return document.documentElement.classList.contains('theme-light');
   });
   ```

3. **Memoized Values:**
   ```typescript
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(data);
   }, [data]);
   ```

4. **Memoized Callbacks:**
   ```typescript
   const handleAction = useCallback((id: string) => {
     // Handler logic
   }, [dependencies]);
   ```

5. **Reduced Motion Support:**
   ```typescript
   const prefersReducedMotion = useMemo(() => {
     return typeof window !== 'undefined' && 
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   }, []);
   
   // Use in animations
   initial={prefersReducedMotion ? false : { opacity: 0 }}
   ```

**Component Extraction Pattern:**

```typescript
// Before: Large component with everything
function Page() {
  // 500+ lines
}

// After: Extracted components
function Page() {
  return (
    <>
      <PageSkeleton />
      <PageHeader />
      <PageContent />
      <PageFooter />
    </>
  );
}

const PageSkeleton = memo(() => { /* ... */ });
const PageHeader = memo(() => { /* ... */ });
const PageContent = memo(() => { /* ... */ });
const PageFooter = memo(() => { /* ... */ });
```

**Real Example from Codebase:**

```typescript
// ProductDetail.tsx - Extracted components
const ProductDetailSkeleton = memo(() => { /* ... */ });
const ProductImageGallery = memo(() => { /* ... */ });
const VariantSelector = memo(() => { /* ... */ });

// MenuPage.tsx - Extracted components
const MenuPageSkeleton = memo(() => { /* ... */ });
const EmptyMenuState = memo(() => { /* ... */ });
const ChefsPicksSection = memo(() => { /* ... */ });
```

**Benefits:**
- ✅ Better performance (fewer re-renders)
- ✅ Better code organization
- ✅ Easier to test
- ✅ Easier to maintain
- ✅ Reusable components

### Step 6.2: Component Optimization Checklist

- [ ] Component wrapped with `memo()`
- [ ] `displayName` set for debugging
- [ ] Theme detection integrated (`useTheme()` hook)
- [ ] Reduced motion preference respected
- [ ] Expensive computations memoized (`useMemo()`)
- [ ] Event handlers memoized (`useCallback()`)
- [ ] Large components extracted into smaller ones
- [ ] Loading states extracted (skeleton components)
- [ ] Empty states extracted
- [ ] Error states handled properly

---

## 🔧 ADVANCED UTILITY PATTERNS

### Pattern 11.1: Custom Dropdown Component

```typescript
// components/ui/CustomDropdown.tsx
// Fully accessible dropdown with keyboard navigation

const CustomDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  id,
  name,
  required = false,
  maxVisibleItems = 5
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const maxHeight = (44 * maxVisibleItems) + 16; // 44px per item + padding

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      const dropdownMenu = document.querySelector('[data-dropdown-menu]');
      if (dropdownMenu && dropdownMenu.contains(target)) return;
      setIsOpen(false);
      setFocusedIndex(-1);
    }
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev < options.length - 1 ? prev + 1 : 0;
            optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
            return next;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : options.length - 1;
            optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
            return next;
          });
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            event.preventDefault();
            const option = options[focusedIndex];
            if (onChange) {
              onChange({ target: { value: option.value, name } });
            }
            setIsOpen(false);
            setFocusedIndex(-1);
            buttonRef.current?.focus();
          }
          break;
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, options, onChange, name]);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${id}-menu` : undefined}
        className={cn(
          'w-full min-h-[44px] px-4 py-2.5 text-left',
          'bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg',
          'text-[var(--text-main)] placeholder:text-[var(--text-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-between'
        )}
      >
        <span className={cn(!selectedOption && 'text-[var(--text-muted)]')}>
          {displayText}
        </span>
        <svg
          className={cn(
            'w-5 h-5 text-[var(--text-muted)] transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          data-dropdown-menu
          id={`${id}-menu`}
          role="listbox"
          className={cn(
            'absolute z-50 w-full mt-1',
            'bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-lg',
            'overflow-hidden'
          )}
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <div className="overflow-y-auto max-h-full">
            {options.map((option, index) => (
              <button
                key={option.value}
                ref={(el) => { optionRefs.current[index] = el; }}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  if (onChange) {
                    onChange({ target: { value: option.value, name } });
                  }
                  setIsOpen(false);
                  setFocusedIndex(-1);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={cn(
                  'w-full min-h-[44px] px-4 py-2.5 text-left',
                  'text-sm text-[var(--text-main)]',
                  'hover:bg-[var(--bg-hover)]',
                  'focus:outline-none focus:bg-[var(--bg-hover)]',
                  value === option.value && 'bg-[var(--accent)]/10 text-[var(--accent)]',
                  focusedIndex === index && 'bg-[var(--bg-hover)]'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
```

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This prompt ensures all UI/UX development follows production-ready patterns with proper accessibility, performance, and design system integration.**

