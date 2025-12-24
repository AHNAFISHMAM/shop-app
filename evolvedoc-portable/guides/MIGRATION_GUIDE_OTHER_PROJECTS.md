# 🚀 Migration Guide: Using Master Prompts in Other Projects

> **Step-by-step guide to adapt the master prompts system for any new project**

---

## 📋 Overview

This system has two types of files:

1. **Generic/Reusable** - Can be used as-is or with minimal changes
2. **Project-Specific** - Need customization for your tech stack/app domain

---

## ✅ What's Reusable (Copy As-Is)

### 1. `docs/CONCEPTS_COMPARISON.md`
**Status:** ✅ **100% Reusable**

- Generic React/TypeScript/JavaScript patterns
- X vs Y comparison tables
- AI Enforcement Rules
- Violation Detection Mode
- Boundary Ownership Matrix
- Quality gates and checklists

**Action:** Copy directly, no changes needed.

---

### 2. Generic Master Prompts (Framework-Agnostic)

These are mostly reusable but may need minor tech stack updates:

#### ✅ `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md`
- **Reusable:** 95%
- **Customize:** Replace codebase examples with your own
- **Action:** Copy, then replace example file paths

#### ✅ `MASTER_ERROR_HANDLING_LOGGING_PROMPT.md`
- **Reusable:** 90%
- **Customize:** Update error handler utility paths
- **Action:** Copy, update file paths in examples

#### ✅ `MASTER_TESTING_PROMPT.md`
- **Reusable:** 85%
- **Customize:** Update test setup paths, mocking strategies
- **Action:** Copy, adapt to your testing framework

#### ✅ `MASTER_REFACTORING_PROMPT.md`
- **Reusable:** 90%
- **Customize:** Update folder structure examples
- **Action:** Copy, update to your project structure

#### ✅ `MASTER_UI_UX_PROMPT.md`
- **Reusable:** 80%
- **Customize:** Update design system references
- **Action:** Copy, adapt to your design tokens/theme

---

## 🔧 What Needs Customization

### 1. Stack-Specific Prompts

These need significant customization for your tech stack:

#### `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`
**If using Supabase:** ✅ Reusable (just update app name)
**If using other DB:** ❌ Need to create new prompt

**Customization:**
- Update app name references
- Replace codebase examples with your own
- Keep the RLS patterns if using Supabase

#### `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md`
**If using React Query:** ✅ Reusable
**If using SWR/Apollo/etc:** 🔄 Adapt patterns

**Customization:**
- Update query client config paths
- Replace query key factory examples
- Update to your data fetching library if different

#### `MASTER_AUTHENTICATION_SECURITY_PROMPT.md`
**If using Supabase Auth:** ✅ Mostly reusable
**If using other auth:** 🔄 Adapt patterns

**Customization:**
- Update auth provider implementation
- Replace Supabase-specific patterns
- Keep security principles (they're universal)

#### `MASTER_FORM_HANDLING_VALIDATION_PROMPT.md`
**If using React Hook Form:** ✅ Reusable
**If using other form libs:** 🔄 Adapt patterns

**Customization:**
- Update form library references
- Replace validation utility examples
- Keep accessibility patterns (universal)

---

### 2. Domain-Specific Prompts

These are highly project-specific and need significant adaptation:

#### `MASTER_ECOMMERCE_DOMAIN_PROMPT.md`
**If building e-commerce:** ✅ Patterns reusable, examples need update
**If different domain:** 🔄 Create domain-specific prompt

**Customization:**
- Replace cart/order/checkout examples
- Adapt to your business domain
- Keep atomic operation patterns

#### `MASTER_STRIPE_PAYMENT_PROMPT.md`
**If using Stripe:** ✅ Mostly reusable
**If using other payment:** 🔄 Create new prompt

**Customization:**
- Update payment provider patterns
- Replace Stripe-specific code
- Keep security principles

#### `MASTER_RESERVATIONS_SYSTEM_PROMPT.md`
**If building reservations:** ✅ Patterns reusable
**If different feature:** 🔄 Create feature-specific prompt

**Customization:**
- Replace reservation examples
- Adapt to your booking system
- Keep RPC function patterns

#### `MASTER_FEATURE_FLAGS_PROMPT.md`
**Reusable:** ✅ 90%
**Customization:**
- Update feature flag implementation
- Replace settings context examples
- Keep conditional rendering patterns

#### `MASTER_STORE_SETTINGS_PROMPT.md`
**Reusable:** ✅ 85%
**Customization:**
- Update settings structure
- Replace calculation utilities
- Keep singleton pattern

#### `MASTER_EDGE_FUNCTIONS_PROMPT.md`
**If using Supabase Edge Functions:** ✅ Reusable
**If using other serverless:** 🔄 Adapt patterns

**Customization:**
- Update runtime (Deno vs Node.js)
- Replace Edge Function examples
- Keep security patterns

---

## 🛠️ Step-by-Step Migration Process

### Step 1: Copy Generic Files

```bash
# Create docs folder in new project
mkdir docs

# Copy 100% reusable files
cp CONCEPTS_COMPARISON.md /new-project/docs/
cp MASTER_TYPESCRIPT_PATTERNS_PROMPT.md /new-project/docs/
cp MASTER_ERROR_HANDLING_LOGGING_PROMPT.md /new-project/docs/
cp MASTER_TESTING_PROMPT.md /new-project/docs/
cp MASTER_REFACTORING_PROMPT.md /new-project/docs/
cp MASTER_UI_UX_PROMPT.md /new-project/docs/
```

### Step 2: Copy Stack-Specific Prompts (If Applicable)

```bash
# If using same stack
cp MASTER_SUPABASE_DATABASE_RLS_PROMPT.md /new-project/docs/
cp MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md /new-project/docs/
cp MASTER_AUTHENTICATION_SECURITY_PROMPT.md /new-project/docs/
cp MASTER_FORM_HANDLING_VALIDATION_PROMPT.md /new-project/docs/
cp MASTER_CUSTOM_HOOKS_PROMPT.md /new-project/docs/
cp MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md /new-project/docs/
```

### Step 3: Customize App-Specific References

**Find and replace in all files:**

```bash
# Replace app name
"Star Café" → "Your App Name"
"StarCafe" → "YourAppName"
"buildfast-shop" → "your-project-name"

# Replace file paths
"buildfast-shop/src/" → "your-project/src/"
"buildfast-shop/supabase/" → "your-project/supabase/"
```

**Tools:**
- VS Code: Find & Replace in Files (Ctrl+Shift+H)
- Command line: `sed` or `findstr` (Windows)

### Step 4: Update Code Examples

**For each master prompt:**

1. **Find codebase examples** (search for `From `buildfast-shop`)
2. **Replace with your own examples:**
   - If you have similar code, use it
   - If not, keep the pattern but update paths
   - Remove examples that don't apply

**Example:**
```markdown
# Before
**From `buildfast-shop/src/lib/cartUtils.ts`:**

# After
**From `your-project/src/lib/cartUtils.ts`:**
# OR if you don't have this file yet:
**Example implementation pattern:**
```

### Step 5: Create Domain-Specific Prompts

**If your domain is different:**

1. **Use existing prompts as templates**
2. **Replace domain logic** (e.g., reservations → your feature)
3. **Keep the patterns** (RLS, React Query, error handling)
4. **Update examples** to your domain

**Template approach:**
```markdown
# Start with generic pattern prompt
# Replace domain-specific sections
# Keep technical patterns (RLS, queries, etc.)
# Update business logic examples
```

### Step 6: Update .cursorrules

**Copy and customize:**

```bash
cp buildfast-shop/.cursorrules /new-project/.cursorrules
```

**Then update:**
- App context (line 18)
- Tech stack (Section 4)
- File structure (Section 4)
- Master prompts list (Section 11)

**CRITICAL: Ensure these sections are present:**
- ✅ Section 3: Speed > Perfection (WITH Quality Gates)
- ✅ Section 6: Mandatory Quality Checks (after each page/component)
- ✅ Section 11: TypeScript Workflow (MANDATORY DURING DEVELOPMENT)
- ✅ Section 13: Development Checklist (mandatory steps)

**These sections prevent commit failures by catching errors during development.**

**Example customization:**
```markdown
# Before
**App Context:** Star Café — Restaurant e-commerce platform

# After
**App Context:** Your App — [Your domain description]
```

```markdown
# Before
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)

# After (if different)
- **Backend:** [Your backend] (PostgreSQL + Auth + Storage + Realtime)
```

**Quality Gates Setup:**
- Verify pre-commit hooks are configured (Husky + lint-staged)
- Ensure `typecheck:fast`, `lint:fix`, and `format` scripts exist in `package.json`
- Set up watch mode for real-time feedback during development

### Step 7: Create Usage Guide

**Copy and customize:**

```bash
cp docs/MASTER_PROMPTS_USAGE_GUIDE.md /new-project/docs/
```

**Update:**
- Available master prompts list
- Project-specific examples
- File paths

---

## 🎯 Customization Checklist

### For Each Master Prompt File:

- [ ] Replace app name references
- [ ] Update file paths in examples
- [ ] Replace codebase examples with your own (if available)
- [ ] Update tech stack references
- [ ] Remove domain-specific examples that don't apply
- [ ] Keep generic patterns and principles
- [ ] Update "Related Comprehensive Guides" links

### For CONCEPTS_COMPARISON.md:

- [ ] ✅ No changes needed (100% generic)

### For .cursorrules:

- [ ] Update app context
- [ ] Update tech stack
- [ ] Update file structure
- [ ] Update master prompts list
- [ ] Remove prompts that don't apply
- [ ] Add prompts for your specific stack/domain
- [ ] **VERIFY Section 13 (Development Checklist) is present**
- [ ] **VERIFY Section 6 (Mandatory Quality Checks) is present**
- [ ] **VERIFY Section 11 (TypeScript Workflow) includes mandatory checks**
- [ ] **Verify pre-commit hooks are configured**

---

## 📦 Minimal Setup (Quick Start)

**If you want to start quickly:**

1. **Copy these 3 files:**
   - `CONCEPTS_COMPARISON.md` (100% reusable)
   - `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md` (mostly reusable)
   - `MASTER_ERROR_HANDLING_LOGGING_PROMPT.md` (mostly reusable)

2. **Create minimal .cursorrules:**
   ```markdown
   # Basic Cursor Rules
   
   ## Master Prompts Integration
   
   Before implementing features:
   1. Check @CONCEPTS_COMPARISON.md for patterns
   2. Use relevant @MASTER_*_PROMPT.md for implementation
   3. Run Violation Detection Mode before finishing
   
   Available prompts:
   - @CONCEPTS_COMPARISON.md - Pattern decisions
   - @MASTER_TYPESCRIPT_PATTERNS_PROMPT.md - TypeScript
   - @MASTER_ERROR_HANDLING_LOGGING_PROMPT.md - Error handling
   ```

3. **Add more prompts as needed** (copy and customize)

---

## 🔄 Stack-Specific Adaptations

### If Using Different Backend (Not Supabase)

**Create new prompts based on patterns:**

1. **Copy `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`**
2. **Replace Supabase patterns** with your DB patterns:
   - RLS → Your access control system
   - Supabase client → Your DB client
   - Keep security principles

**Example for Prisma:**
```markdown
# Replace Supabase RLS with Prisma middleware
# Replace Supabase client with Prisma client
# Keep security patterns (validation, authorization)
```

### If Using Different State Management

**Adapt `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md`:**

- **React Query → SWR:** Adapt cache patterns
- **React Query → Apollo:** Adapt query patterns
- **Keep:** Error handling, loading states, cache invalidation concepts

### If Using Different Auth System

**Adapt `MASTER_AUTHENTICATION_SECURITY_PROMPT.md`:**

- **Supabase Auth → Auth0:** Replace auth provider patterns
- **Supabase Auth → Firebase Auth:** Adapt session management
- **Keep:** Security principles, protected routes, token handling

---

## 📝 Template for New Domain Prompts

**When creating a new domain-specific prompt:**

```markdown
# 🎯 MASTER [DOMAIN] PROMPT
## Production-Grade [Domain] Implementation Workflow

---

## 📋 OVERVIEW

This master prompt provides a comprehensive approach to implementing [domain] features for the **[Your App]** application.

**Applicable to:**
- [Feature 1]
- [Feature 2]
- [Feature 3]

---

## 🎯 CORE PRINCIPLES

### 1. [Principle 1]
- Pattern from CONCEPTS_COMPARISON.md
- Your domain-specific rule

### 2. [Principle 2]
- Security/performance pattern
- Domain-specific requirement

---

## 🔍 PHASE 1: [First Phase]

### Step 1.1: [Implementation Pattern]

**From `your-project/src/path/to/example.ts`:**

```typescript
// Your codebase example
```

**Key Points:**
- Pattern explanation
- Why this approach
- What to avoid

---

## 📖 RELATED COMPREHENSIVE GUIDES

- **[MASTER_RELATED_PROMPT.md](./MASTER_RELATED_PROMPT.md)** — Related patterns
- **[CONCEPTS_COMPARISON.md](./CONCEPTS_COMPARISON.md)** — X vs Y patterns

---

**This prompt ensures all [domain] operations follow production-ready patterns.**
```

---

## 🚀 Quick Migration Script

**Create a migration script (optional):**

```bash
#!/bin/bash
# migrate-prompts.sh

NEW_PROJECT="your-project-name"
NEW_APP_NAME="Your App Name"

# Copy files
cp docs/CONCEPTS_COMPARISON.md ../$NEW_PROJECT/docs/
cp docs/MASTER_*.md ../$NEW_PROJECT/docs/

# Replace app names
find ../$NEW_PROJECT/docs -name "*.md" -exec sed -i "s/Star Café/$NEW_APP_NAME/g" {} \;
find ../$NEW_PROJECT/docs -name "*.md" -exec sed -i "s/buildfast-shop/$NEW_PROJECT/g" {} \;

echo "✅ Migration complete! Now customize code examples."
```

---

## ✅ Final Checklist

- [ ] Copied generic/reusable prompts
- [ ] Copied stack-specific prompts (if applicable)
- [ ] Replaced all app name references
- [ ] Updated file paths in examples
- [ ] Replaced codebase examples with your own
- [ ] Removed domain-specific examples that don't apply
- [ ] Updated .cursorrules with your tech stack
- [ ] Created domain-specific prompts (if needed)
- [ ] Updated CONCEPTS_COMPARISON links (if changed)
- [ ] Tested prompt references in Cursor

---

## 💡 Pro Tips

1. **Start minimal:** Copy only what you need
2. **Customize incrementally:** Add prompts as you need them
3. **Keep patterns, replace examples:** The patterns are universal
4. **Use CONCEPTS_COMPARISON as foundation:** It's 100% reusable
5. **Create domain prompts as templates:** Reuse structure, change domain

---

**This system is designed to be portable. The patterns are universal, only examples are project-specific.**

