# 🔄 Master Prompts Sync Checklist

> **Purpose:** Ensure embedded prompts in `CONCEPTS_COMPARISON.md` stay aligned with comprehensive master prompt files.

---

## 📋 Sync Status

### ✅ Synced Prompts

| Embedded Prompt | Comprehensive File | Last Sync | Status |
|-----------------|-------------------|-----------|--------|
| 🗄️ Supabase Integration | `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md` | 2025-12-18 | ✅ Referenced |
| 🔄 React Query | `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md` | 2025-12-18 | ✅ Referenced |
| 🛒 E-commerce Domain | `MASTER_ECOMMERCE_DOMAIN_PROMPT.md` | 2025-12-18 | ✅ Created & Referenced |
| 💳 Stripe Payment | `MASTER_STRIPE_PAYMENT_PROMPT.md` | 2025-12-18 | ✅ Created & Referenced |
| 🔐 Authentication & Security | `MASTER_AUTHENTICATION_SECURITY_PROMPT.md` | 2025-12-18 | ✅ Embedded Created |
| ⚠️ Error Handling & Logging | `MASTER_ERROR_HANDLING_LOGGING_PROMPT.md` | 2025-12-18 | ✅ Embedded Created |
| 📝 Form Handling & Validation | `MASTER_FORM_HANDLING_VALIDATION_PROMPT.md` | 2025-12-18 | ✅ Embedded Created |
| 🧪 Testing | `MASTER_TESTING_PROMPT.md` | 2025-12-18 | ✅ Embedded Created |
| 📘 TypeScript Patterns | `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md` | 2025-12-18 | ✅ Embedded Created |
| 🍽️ Reservations System | `MASTER_RESERVATIONS_SYSTEM_PROMPT.md` | 2025-12-18 | ✅ Created & Embedded |
| 🚩 Feature Flags | `MASTER_FEATURE_FLAGS_PROMPT.md` | 2025-12-18 | ✅ Created & Embedded |
| 🏪 Store Settings | `MASTER_STORE_SETTINGS_PROMPT.md` | 2025-12-18 | ✅ Created & Embedded |
| ⚡ Edge Functions | `MASTER_EDGE_FUNCTIONS_PROMPT.md` | 2025-12-18 | ✅ Created & Embedded |
| 🎨 UI/UX | `MASTER_UI_UX_PROMPT.md` | 2025-12-18 | ✅ Created & Embedded |
| 🔧 Refactoring | `MASTER_REFACTORING_PROMPT.md` | 2025-12-18 | ✅ Created & Embedded |

---

## 🔍 Sync Checklist

### 1. Supabase Integration Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~2887  
**Comprehensive File:** `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`

- [x] Reference link added to comprehensive guide
- [x] Verify embedded patterns match comprehensive file patterns ✅ Verified 2025-12-18
- [x] Check for new patterns in comprehensive file that should be in embedded ✅ No critical gaps
- [x] Ensure RLS examples are consistent ✅ Principles align
- [x] Verify auth patterns match `MASTER_AUTHENTICATION_SECURITY_PROMPT.md` ✅ Referenced correctly
- [x] Check real-time patterns match `MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md` ✅ Referenced correctly

**Verification Notes:**
- ✅ Core principles consistent (RLS mandatory, typed client, cleanup)
- ✅ Patterns align — embedded is operational, comprehensive is schema/RLS design
- ✅ See [MASTER_PROMPTS_CONSISTENCY_VERIFICATION.md](./MASTER_PROMPTS_CONSISTENCY_VERIFICATION.md) for details

**Sync Notes:**
- Embedded prompt focuses on: Auth, RLS enforcement, Realtime, Storage, Queries
- Comprehensive file focuses on: Schema design, RLS policies, Migrations, TypeScript
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 2. React Query Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~3085  
**Comprehensive File:** `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md`

- [x] Reference link added to comprehensive guide
- [x] Verify query key factory patterns match ✅ Verified 2025-12-18
- [x] Check mutation patterns are consistent ✅ Patterns align
- [x] Ensure cache invalidation strategies align ✅ Strategies consistent
- [x] Verify error handling patterns match ✅ Don't retry 4xx in both
- [x] Check optimistic update examples are consistent ✅ Same onMutate pattern

**Verification Notes:**
- ✅ Both use TanStack Query v5 API (`gcTime` instead of `cacheTime`)
- ✅ Query key factory pattern emphasized in both
- ✅ Mutation and invalidation patterns consistent
- ✅ See [MASTER_PROMPTS_CONSISTENCY_VERIFICATION.md](./MASTER_PROMPTS_CONSISTENCY_VERIFICATION.md) for details

**Sync Notes:**
- Embedded prompt: Quick pasteable patterns for common operations
- Comprehensive file: Detailed workflows, edge cases, advanced patterns
- Both use TanStack Query v5 — ensure version consistency

---

### 3. E-commerce Domain Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~3282  
**Comprehensive File:** `MASTER_ECOMMERCE_DOMAIN_PROMPT.md`

- [x] Comprehensive file created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure cart patterns are consistent
- [ ] Verify order processing patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for cart, orders, checkout
- Comprehensive file: Detailed workflows, inventory management, discount codes
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 4. Stripe Payment Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~3537  
**Comprehensive File:** `MASTER_STRIPE_PAYMENT_PROMPT.md`

- [x] Comprehensive file created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure payment intent patterns are consistent
- [ ] Verify webhook handling patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for Payment Intents, Checkout, Error Handling
- Comprehensive file: Detailed workflows, webhooks, idempotency, security
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 5. Authentication & Security Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~3770  
**Comprehensive File:** `MASTER_AUTHENTICATION_SECURITY_PROMPT.md`

- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure auth flow patterns are consistent
- [ ] Verify security patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for login, signup, session management
- Comprehensive file: Detailed workflows, password security, protected routes
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 6. Error Handling & Logging Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~3950  
**Comprehensive File:** `MASTER_ERROR_HANDLING_LOGGING_PROMPT.md`

- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure error transformation patterns are consistent
- [ ] Verify logging patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for error boundaries, API errors, logging
- Comprehensive file: Detailed workflows, error recovery, structured logging
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 7. Form Handling & Validation Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~4100  
**Comprehensive File:** `MASTER_FORM_HANDLING_VALIDATION_PROMPT.md`

- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure validation patterns are consistent
- [ ] Verify accessibility patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for forms, validation, React Query integration
- Comprehensive file: Detailed workflows, multi-step forms, accessibility
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 8. Testing Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~4250  
**Comprehensive File:** `MASTER_TESTING_PROMPT.md`

- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure test patterns are consistent
- [ ] Verify mocking strategies match

**Sync Notes:**
- Embedded prompt: Quick reference for unit tests, component tests, mocking
- Comprehensive file: Detailed workflows, test organization, coverage
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 9. TypeScript Patterns Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~4400  
**Comprehensive File:** `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md`

- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure type patterns are consistent
- [ ] Verify type guard patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for types, type guards, utility types
- Comprehensive file: Detailed workflows, type generation, advanced patterns
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 10. Reservations System Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~4517  
**Comprehensive File:** `MASTER_RESERVATIONS_SYSTEM_PROMPT.md`

- [x] Comprehensive file created
- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure RPC function patterns are consistent
- [ ] Verify reservation settings patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for reservation CRUD, settings, real-time
- Comprehensive file: Detailed workflows, RPC functions, admin management
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 11. Feature Flags Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~4650  
**Comprehensive File:** `MASTER_FEATURE_FLAGS_PROMPT.md`

- [x] Comprehensive file created
- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure conditional rendering patterns are consistent
- [ ] Verify admin management patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for feature toggles, conditional rendering
- Comprehensive file: Detailed workflows, A/B testing, gradual rollout
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 12. Store Settings Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~4780  
**Comprehensive File:** `MASTER_STORE_SETTINGS_PROMPT.md`

- [x] Comprehensive file created
- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure calculation patterns are consistent
- [ ] Verify theme management patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for settings, calculations, currency formatting
- Comprehensive file: Detailed workflows, singleton pattern, theme adjustments
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 13. Edge Functions Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~4900  
**Comprehensive File:** `MASTER_EDGE_FUNCTIONS_PROMPT.md`

- [x] Comprehensive file created
- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure payment processing patterns are consistent
- [ ] Verify webhook handling patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for Edge Functions, payments, webhooks
- Comprehensive file: Detailed workflows, Deno patterns, authentication, error handling
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 14. UI/UX Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~5100  
**Comprehensive File:** `MASTER_UI_UX_PROMPT.md`

- [x] Comprehensive file created (1000+ lines)
- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure animation patterns are consistent
- [ ] Verify accessibility patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for component development, animations, accessibility
- Comprehensive file: Detailed workflows, component architecture, animation patterns, theme system, accessibility implementation
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

### 15. Refactoring Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~5300  
**Comprehensive File:** `MASTER_REFACTORING_PROMPT.md`

- [x] Comprehensive file created (1000+ lines)
- [x] Embedded version created
- [x] Reference link added to comprehensive guide
- [ ] Verify embedded patterns match comprehensive file patterns
- [ ] Check for new patterns in comprehensive file that should be in embedded
- [ ] Ensure file organization patterns are consistent
- [ ] Verify service layer patterns match

**Sync Notes:**
- Embedded prompt: Quick reference for refactoring, component/hook extraction, service layer
- Comprehensive file: Detailed workflows, file organization, extraction strategies, backward compatibility
- They complement each other — embedded is quick reference, comprehensive is detailed guide

---

## 🔄 Sync Process

### When to Sync

1. **After updating comprehensive files:**
   - Review if embedded prompt needs updates
   - Add new patterns if they're commonly used
   - Update references if file structure changes

2. **After updating embedded prompts:**
   - Verify patterns don't conflict with comprehensive files
   - Ensure examples are consistent
   - Update comprehensive files if embedded patterns are better

3. **Quarterly review:**
   - Check for drift between embedded and comprehensive
   - Update references if needed
   - Add missing patterns to embedded if frequently used

### How to Sync

1. **Compare patterns:**
   - Read both embedded and comprehensive versions
   - Identify differences in examples or patterns
   - Note any conflicts or inconsistencies

2. **Update embedded prompt:**
   - Add missing commonly-used patterns
   - Update examples to match comprehensive file
   - Ensure code examples are production-ready

3. **Update comprehensive file:**
   - Add any new patterns from embedded
   - Expand on embedded examples with more detail
   - Add edge cases and advanced patterns

4. **Update references:**
   - Ensure links are correct
   - Add cross-references where helpful
   - Update sync checklist

5. **Test consistency:**
   - Verify code examples work
   - Check that patterns align with actual codebase
   - Ensure no conflicting advice

---

## 📝 Missing Comprehensive Guides

The following areas have embedded prompts but no comprehensive files:

1. **CSS Master Prompt** — Consider creating `MASTER_CSS_DIAGNOSIS_PROMPT.md` if patterns expand

**Note:** 
- E-commerce Domain and Stripe Payment comprehensive files have been created.
- Reservations System, Feature Flags, Store Settings, Edge Functions, UI/UX, and Refactoring comprehensive files have been created.

## 🗑️ Removed Prompts

The following master prompts have been removed as they are not actively used in the codebase:

1. **MASTER_DEPLOYMENT_CI_CD_PROMPT.md** — No CI/CD setup found
2. **MASTER_PERFORMANCE_OPTIMIZATION_PROMPT.md** — Covered in other prompts

---

## 🎯 Sync Priorities

### High Priority
- [x] Verify Supabase RLS patterns match between embedded and comprehensive ✅ Verified 2025-12-18
- [x] Ensure React Query patterns are consistent (query keys, mutations) ✅ Verified 2025-12-18
- [x] Check auth patterns align across prompts ✅ Referenced correctly
- [ ] Verify E-commerce patterns match between embedded and comprehensive
- [ ] Verify Stripe Payment patterns match between embedded and comprehensive
- [ ] Verify new embedded prompts (Auth, Error, Form, Testing, TypeScript) match comprehensive files

### Medium Priority
- [ ] Add cross-references between related prompts
- [ ] Review CSS Master Prompt for potential comprehensive file
- [ ] Consider embedded versions for remaining comprehensive files (Custom Hooks, Performance, etc.)

### Low Priority
- [ ] Quarterly review of all prompts
- [ ] Update examples with latest best practices
- [ ] Add missing edge cases to comprehensive files

---

## 📅 Last Updated

- **Initial Sync:** 2025-12-18
- **Last Review:** 2025-12-18
- **Latest Update:** 2025-12-18 (Added Reservations, Feature Flags, Store Settings, Edge Functions, UI/UX, Refactoring; Removed Deployment, Performance)
- **Next Review:** 2026-03-18 (Quarterly)

---

## 🔗 Related Documents

- [CONCEPTS_COMPARISON.md](./CONCEPTS_COMPARISON.md) — Embedded prompts
- [MASTER_PROMPTS_SUMMARY.md](./MASTER_PROMPTS_SUMMARY.md) — Overview of all prompts
- [MASTER_PROMPTS_ANALYSIS.md](./MASTER_PROMPTS_ANALYSIS.md) — Analysis of prompt structure

