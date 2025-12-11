# Core Commerce Suite Validation

## Context
Audit and reinforce the full commerce suite (Authentication System, Admin Panel, Product Management, Product Listing, Shopping Cart, Search & Filters, Checkout Flow, Stripe Payments, Email Notifications, Order History) across the existing Vite + Supabase shop so every layer is wired correctly and feels production-ready.

## Phase 1 – Data & Supabase
- Confirm authentication + admin metadata: ensure `supabase/migrations/002_setup_admin_user.sql` provisions the `customers` table with `is_admin` and row-level security, and double-check downstream policies referenced in `src/contexts/AuthContext.jsx`.
- Validate catalog data sources: rerun `supabase/migrations/001_create_products_table.sql`, `005_check_products_table.sql`, `007_create_menu_categories.sql`, and `008_create_menu_items.sql` (plus `dishes`/`categories` support files) as needed so product/admin UI has consistent tables, enums, and indexes.
- Ensure cart + wishlist persistence: verify `supabase/migrations/009_create_cart_items_table.sql` and any companion migrations for guest session columns, keeping uniqueness on `(user_id, product_id)` intact.
- Review order pipeline tables: inspect `supabase/migrations/011_create_orders_tables.sql`, `012_create_order_status_history.sql`, and shipping/contact helpers so `orders`, `order_items`, and any `order_status_history` tables align with the checkout + admin dashboard expectations.
- Re-run RPC + helper scripts: validate `supabase/migrations/033_create_rpc_functions.sql` for `create_order_with_items` and `get_public_menu`, and confirm triggers in `supabase/migrations/035_refresh_updated_at_triggers.sql` (or equivalent) to keep timestamps accurate.
- Stripe + email infra: make sure edge functions (`supabase/functions/create-payment-intent`, `stripe-webhook`, `send-order-confirmation`) have their required environment variables and that any SQL supporting payment metadata (e.g., `order.payment_intent_id`) exists.
- Document required seed data/config for quick QA (admin user insert, sample products) in `docs/supabase-migration-guide.md` if gaps are found.

## Phase 2 – Service & State Layer
- Supabase client & auth utils: verify `src/lib/supabase.js`, `src/lib/authUtils.js`, and `src/contexts/AuthContext.jsx` share the same assumptions about `customers.is_admin` and session storage; adjust fetch timeouts/cache paths if mismatched.
- Admin access routing: inspect `src/components/AdminRoute.jsx`, `src/components/AdminLayout.jsx`, and `src/pages/Admin.jsx` to ensure they guard on `useAuth().isAdmin` and gracefully handle loading states.
- Product services: align `src/lib/menuService.js`, `src/lib/orderService.js`, `src/lib/cartUtils.js`, and `src/hooks/useCartManagement.js` so they always expect Supabase payload shapes (`menu_items`, `dishes`, `products`) without camelCase/snake_case drift.
- Shopping cart state: confirm `useCartManagement` delegates to `lib/guestSessionUtils.js` for guests and Supabase for authenticated users, and that `src/lib/cartEvents.js` keeps header/cart badge synchronized.
- Search & filters: check `src/hooks/useMenuFiltering.js`, `src/components/menu/MenuSearchBar.jsx`, `src/components/order/FilterDrawer.jsx`, and `src/components/order/ProductFilters.jsx` so search terms, category IDs, and subcategory IDs map cleanly to backend field names.
- Checkout orchestration: walk `src/pages/Checkout.jsx`, `src/components/StripeCheckoutForm.jsx`, `src/lib/orderService.js`, and `src/lib/stripe.js` to confirm the flow: cart summary → order RPC → `create-payment-intent` function → `stripe-webhook`.
- Email notifications: ensure post-payment handshake triggers `send-order-confirmation` (via webhook) and that frontend fallback calls (if any) in `src/pages/Checkout.jsx` match the Edge URL contract.
- Order history retrieval: cross-check `src/pages/OrderHistory.jsx`, `src/components/order/OrderTimeline.jsx`, and service helpers (`getUserOrders`, `getGuestOrders`) for consistent filtering, pagination, and guest session usage.

## Phase 3 – UI Verification & Polish
- Authentication screens: review `src/pages/Login.jsx`, `Signup.jsx`, and shared shell `src/components/auth-shell/auth-shell.jsx` for error surfacing, password rules, and consistent Tailwind/Shadcn styling.
- Admin panel polish: inspect each admin subpage under `src/pages/admin/` plus shared widgets in `src/components/admin/` (e.g., `CustomerHistory.jsx`, `WaitlistManager.jsx`) for responsive layout and consistent call-to-action buttons/modals.
- Product discovery: validate storefront views (`src/pages/HomePage.jsx`, `MenuPage.jsx`, `Products.jsx`, `ProductDetail.jsx`) and cards (`src/components/menu/ProductCard.jsx`, `src/components/menu/ChefsPicks.jsx`) for professional spacing, hover states, and fallback imagery.
- Cart & checkout UX: test `src/components/order/CartSidebar.jsx`, `CartBottomSheet.jsx`, and `FloatingCartButton.jsx` for quick access, totals accuracy, and disabled states during async operations.
- Search/filter UX: confirm `MenuSearchBar`, `FilterDrawer`, and `SectionCarousel` transitions stay smooth on mobile/desktop, with clear resets and loading placeholders.
- Checkout flow microcopy: audit form sections (`AddressForm.jsx`, `AddressModal.jsx`, `PaymentSuccessModal.jsx`) for validation messages and button states aligned with the business flow.
- Email + order history feedback: ensure success/failure toasts in checkout flows inform users about emails and link to `OrderHistory` (with empty state handled in `src/pages/OrderHistory.jsx`).
- Accessibility pass: spot-check key buttons, form inputs, and modals for aria labels and keyboard focus traps (especially modals like `SignupPromptModal.jsx` and `AddressModal.jsx`).

## Phase 4 – QA & Tooling
- Smoke tests: script happy-path scenarios (signup → add to cart → checkout with Stripe test card → receive email → review order history) and document the steps in `docs/features/0013_core_commerce_suite_PLAN.md` once verified.
- Regression guards: run `npm run test` / `vitest` to ensure existing suites (e.g., `src/lib/quoteBackgroundHelper.test.js`) still pass; add targeted tests if critical paths lack coverage.
- Lint & formatting: finish with `npm run lint` (if configured) and ensure Tailwind classes remain consistent.
- Deployment check: confirm `.env.example` (if present) references Stripe, Supabase, and Loops keys needed for this feature set.

