# 🧠 MASTER PROMPTS ANALYSIS — Star Café App

> **Analysis of existing vs needed master prompts for the app**

---

## 📊 EXISTING MASTER PROMPTS

### In CONCEPTS_COMPARISON.md (Pasteable Format)
1. ✅ CSS Root-Cause Master Prompt (6 variations)
2. ✅ Prompt Selection & Routing Assistant

### In docs/ (Documentation Format)
1. ✅ MASTER_SUPABASE_DATABASE_RLS_PROMPT.md (workflow guide)
2. ✅ MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md (workflow guide)
3. ✅ MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md (workflow guide)
4. ✅ MASTER_UI_UX_PROMPT.md (workflow guide)
5. ✅ Other workflow guides...

**Note:** Docs prompts are workflow guides, not "paste into chat" master prompts.

---

## 🎯 APP STACK ANALYSIS

**Stack:**
- Vite + React (SPA)
- TypeScript + JavaScript (mixed)
- Supabase (Auth, Database, Storage, Realtime)
- React Query v5 (TanStack Query)
- React Router v7
- Stripe (Payments)
- Tailwind CSS v4

**Domain:** Restaurant E-commerce
- Menu management
- Shopping cart (guest + authenticated)
- Orders & checkout
- Payments (Stripe)
- Reservations
- Admin dashboard
- Kitchen display system
- Reviews & ratings
- Real-time updates

---

## ❌ MISSING MASTER PROMPTS (Pasteable Format)

### Critical (Must Have)

1. **Supabase Integration Master Prompt**
   - Auth patterns (session, admin checks)
   - RLS enforcement
   - Real-time subscriptions
   - Storage operations
   - Error handling
   - **Why needed:** Core backend operations, no pasteable prompt exists

2. **React Query Master Prompt**
   - Query patterns
   - Mutation patterns
   - Cache invalidation
   - Real-time sync
   - **Why needed:** Primary data fetching pattern, no pasteable prompt exists

3. **E-commerce Domain Master Prompt**
   - Cart management (guest + auth)
   - Order processing
   - Checkout flow
   - Inventory checks
   - Pricing calculations
   - **Why needed:** Core business logic, domain-specific patterns

4. **Stripe Payment Master Prompt**
   - Payment intent creation
   - Checkout flow
   - Error handling
   - Success/failure handling
   - **Why needed:** Critical payment flow, security-sensitive

### Important (Should Have)

5. **Admin Dashboard Master Prompt**
   - Admin route protection
   - Data tables
   - CRUD operations
   - Real-time admin updates
   - **Why needed:** Admin features are complex, need patterns

6. **Real-time Subscriptions Master Prompt**
   - Supabase channel management
   - Debounced cache invalidation
   - Connection handling
   - **Why needed:** Real-time is core feature, complex patterns

---

## ✅ RECOMMENDATION

**Create 4 Critical Master Prompts:**
1. Supabase Integration Master Prompt
2. React Query Master Prompt
3. E-commerce Domain Master Prompt
4. Stripe Payment Master Prompt

**Format:** Pasteable into Cursor chat (like CSS prompts)
**Location:** Add to CONCEPTS_COMPARISON.md in "MASTER CURSOR PROMPTS HUB" section

---

**Analysis complete. Ready to create only the critical prompts.**

