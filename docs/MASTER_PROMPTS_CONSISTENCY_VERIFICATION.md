# ✅ Master Prompts Consistency Verification

> **Purpose:** Document consistency checks between embedded prompts and comprehensive files.

**Last Verified:** 2025-12-18

---

## 📋 Verification Summary

### ✅ Verified Consistent Pairs

| Embedded Prompt | Comprehensive File | Status | Notes |
|-----------------|-------------------|--------|-------|
| 🗄️ Supabase Integration | `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md` | ✅ Consistent | Patterns align, embedded is quick reference |
| 🔄 React Query | `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md` | ✅ Consistent | Patterns align, both use v5 API |

---

## 🔍 Detailed Verification

### 1. Supabase Integration Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~2887  
**Comprehensive File:** `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`

#### Pattern Consistency Check

| Pattern | Embedded | Comprehensive | Status |
|---------|----------|---------------|--------|
| RLS Mandatory | ✅ Mentioned | ✅ Detailed SQL examples | ✅ Consistent |
| Typed Client | ✅ `SupabaseClient<Database>` | ✅ Same pattern | ✅ Consistent |
| Auth Error Handling | ✅ Auto-cleanup pattern | ✅ Detailed error handling | ✅ Consistent |
| Realtime Cleanup | ✅ useEffect cleanup | ✅ Same pattern | ✅ Consistent |
| Storage Validation | ✅ File validation | ✅ Same pattern | ✅ Consistent |

#### Key Findings

✅ **Consistent Principles:**
- Both emphasize RLS is mandatory
- Both use typed Supabase client
- Both handle auth errors with cleanup
- Both cleanup subscriptions properly
- Both validate file uploads

✅ **Complementary Design:**
- Embedded: Quick reference for common operations
- Comprehensive: Detailed SQL RLS policy patterns, migrations, schema design
- They serve different purposes and complement each other

#### Recommendations

- ✅ No changes needed — patterns are consistent
- ✅ References correctly link to comprehensive file
- ✅ Embedded prompt covers operational patterns
- ✅ Comprehensive file covers schema/RLS design patterns

---

### 2. React Query Prompt

**Embedded Location:** `CONCEPTS_COMPARISON.md` line ~3085  
**Comprehensive File:** `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md`

#### Pattern Consistency Check

| Pattern | Embedded | Comprehensive | Status |
|---------|----------|---------------|--------|
| Query Key Factory | ✅ Hierarchical factory | ✅ Factory pattern shown | ✅ Consistent |
| useQuery Pattern | ✅ Basic + conditional | ✅ Detailed examples | ✅ Consistent |
| useMutation Pattern | ✅ With invalidation | ✅ Detailed examples | ✅ Consistent |
| Optimistic Updates | ✅ onMutate pattern | ✅ Same pattern | ✅ Consistent |
| Error Handling | ✅ Don't retry 4xx | ✅ Same pattern | ✅ Consistent |
| TanStack Query v5 | ✅ gcTime (v5 API) | ✅ v5 API used | ✅ Consistent |

#### Key Findings

✅ **Consistent Principles:**
- Both use query key factories
- Both use TanStack Query v5 API (`gcTime` instead of `cacheTime`)
- Both emphasize cache invalidation
- Both handle errors properly (don't retry 4xx)
- Both show optimistic update patterns

⚠️ **Minor Differences (Acceptable):**
- Comprehensive file shows some examples with direct array keys (e.g., `['resources', user?.id]`)
- Embedded version consistently uses factory pattern
- **Note:** Comprehensive file shows both patterns (factory preferred, direct arrays for simple cases)
- This is acceptable — comprehensive file demonstrates flexibility

#### Recommendations

- ✅ No changes needed — patterns are consistent
- ✅ Both use v5 API correctly
- ✅ Factory pattern is emphasized in both
- ✅ References correctly link to comprehensive file

---

## 🎯 Consistency Principles

### What Makes Prompts Consistent

1. **Core Principles Match**
   - Same security rules
   - Same best practices
   - Same anti-patterns

2. **Code Patterns Align**
   - Same function signatures
   - Same error handling
   - Same type usage

3. **Version Compatibility**
   - Same library versions
   - Same API usage
   - Same patterns

4. **Complementary Scope**
   - Embedded: Quick reference, common operations
   - Comprehensive: Detailed workflows, edge cases, advanced patterns

### When Prompts Are Considered Inconsistent

❌ **Inconsistent If:**
- Different security rules
- Conflicting best practices
- Different API versions
- Contradictory code examples
- Missing critical patterns in embedded

✅ **Consistent If:**
- Same principles, different detail levels
- Same patterns, more examples in comprehensive
- Same versions, more edge cases in comprehensive

---

## 📝 Verification Process

### Step 1: Compare Core Principles
- [x] Security rules match
- [x] Best practices align
- [x] Anti-patterns consistent

### Step 2: Compare Code Patterns
- [x] Function signatures match
- [x] Error handling consistent
- [x] Type usage consistent

### Step 3: Compare Versions
- [x] Library versions match
- [x] API usage consistent
- [x] Patterns up-to-date

### Step 4: Verify References
- [x] Links are correct
- [x] Cross-references work
- [x] File paths accurate

---

## 🔄 Next Verification

**Scheduled:** 2026-03-18 (Quarterly)

**Focus Areas:**
- Check for new patterns in comprehensive files
- Verify embedded prompts still match
- Update if patterns have evolved
- Add missing commonly-used patterns to embedded

---

## 📚 Related Documents

- [MASTER_PROMPTS_SYNC_CHECKLIST.md](./MASTER_PROMPTS_SYNC_CHECKLIST.md) — Sync tracking
- [CONCEPTS_COMPARISON.md](./CONCEPTS_COMPARISON.md) — Embedded prompts
- [MASTER_PROMPTS_SUMMARY.md](./MASTER_PROMPTS_SUMMARY.md) — Overview

---

**All verified prompts are consistent and ready for production use.**

