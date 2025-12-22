# 🚀 Master Prompts Usage Guide

> **Quick reference for using CONCEPTS_COMPARISON.md with Master Prompts in Cursor**

---

## 🎯 Quick Start

### Two-Tier System

1. **CONCEPTS_COMPARISON.md** → Pattern decisions, violation detection, quality checks
2. **MASTER_*_PROMPT.md** → Detailed implementation patterns, real examples

---

## 📋 Common Workflows

### Workflow 1: Implementing a New Feature

```markdown
@CONCEPTS_COMPARISON.md @MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md

Add wishlist feature:

STEP 1 - Decision (CONCEPTS_COMPARISON):
- Check "Data Fetching & APIs": Use React Query, not useEffect
- Check "React State Management": Server cache, not local state
- Use Boundary Ownership Matrix: This is server cache logic

STEP 2 - Implementation (MASTER_DATA_FETCHING):
- Follow query key factory patterns
- Use mutation patterns for add/remove
- Implement optimistic updates

STEP 3 - Validation (CONCEPTS_COMPARISON):
- Run Violation Detection Mode
- Verify no derived state violations
- Check type safety
```

### Workflow 2: Code Review

```markdown
@CONCEPTS_COMPARISON.md @MASTER_AUTHENTICATION_SECURITY_PROMPT.md

Review this authentication code:

1. Run PR Review Simulation (CONCEPTS_COMPARISON)
2. Check detailed patterns (MASTER_AUTHENTICATION)
3. Classify bugs using Bug Classification
4. Use Before → After format for suggestions
```

### Workflow 3: Refactoring

```markdown
@CONCEPTS_COMPARISON.md @MASTER_REFACTORING_PROMPT.md

Refactor cart component:

1. Run Violation Detection Mode
2. Identify boundary violations
3. Follow refactoring patterns
4. Provide Decision Justification
5. Run Scalability Check
```

---

## 🧭 Prompt Selection

**When unsure which prompt to use:**

```markdown
@CONCEPTS_COMPARISON.md

I need to [task description].
Use the Prompt Selection & Routing Assistant to determine:
1. Which master prompt should I use?
2. What X vs Y patterns apply?
```

---

## ✅ Quality Gates Checklist

Before committing, verify:

- [ ] No X-pattern violations (use Y-patterns)
- [ ] Boundary ownership is clear
- [ ] Type safety (no `any`, proper guards)
- [ ] No derived state bugs
- [ ] No useEffect abuse
- [ ] Error handling implemented
- [ ] Scalability check passed

---

## 📚 Available Master Prompts

| Prompt | Use For |
|--------|---------|
| `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md` | Database schema, RLS, migrations |
| `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md` | React Query patterns |
| `MASTER_AUTHENTICATION_SECURITY_PROMPT.md` | Auth & security |
| `MASTER_STRIPE_PAYMENT_PROMPT.md` | Payment processing |
| `MASTER_ECOMMERCE_DOMAIN_PROMPT.md` | Cart, orders, checkout |
| `MASTER_EDGE_FUNCTIONS_PROMPT.md` | Supabase Edge Functions |
| `MASTER_ERROR_HANDLING_LOGGING_PROMPT.md` | Error handling |
| `MASTER_FORM_HANDLING_VALIDATION_PROMPT.md` | Forms & validation |
| `MASTER_CUSTOM_HOOKS_PROMPT.md` | Custom React hooks |
| `MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md` | Real-time patterns |
| `MASTER_RESERVATIONS_SYSTEM_PROMPT.md` | Reservations |
| `MASTER_FEATURE_FLAGS_PROMPT.md` | Feature flags |
| `MASTER_STORE_SETTINGS_PROMPT.md` | Store settings |
| `MASTER_TESTING_PROMPT.md` | Testing strategies |
| `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md` | TypeScript patterns |
| `MASTER_UI_UX_PROMPT.md` | UI/UX development |
| `MASTER_REFACTORING_PROMPT.md` | Refactoring patterns |

---

## 🔗 Related Documents

- **CONCEPTS_COMPARISON.md** - X vs Y patterns, violation detection, quality checks
- **MASTER_PROMPTS_SYNC_CHECKLIST.md** - Consistency tracking
- **.cursorrules** - Cursor integration rules

---

**This guide ensures you use the right prompt at the right time for maximum efficiency and code quality.**

