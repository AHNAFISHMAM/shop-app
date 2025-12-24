# STEP 3: Customize for Your Tech Stack

## 📋 What This Step Does

Customizes EvolveDoc master prompts for your specific tech stack (backend, frontend framework, database, etc.).

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I need to customize EvolveDoc master prompts for my tech stack. Please:

1. Review all files in docs/master-prompts/ folder
2. Identify which prompts need customization for my stack:
   - Backend: [YOUR_BACKEND - e.g., Supabase, Firebase, Express, etc.]
   - Frontend: [YOUR_FRONTEND - e.g., React, Vue, Next.js, etc.]
   - Database: [YOUR_DATABASE - e.g., PostgreSQL, MongoDB, etc.]
   - Auth: [YOUR_AUTH - e.g., Supabase Auth, Auth0, etc.]
   - State Management: [YOUR_STATE - e.g., React Query, Zustand, etc.]

3. For each prompt that needs changes:
   - Update tech stack references
   - Replace examples with my stack (if applicable)
   - Keep generic patterns unchanged
   - Note which prompts are not applicable to my stack

4. Provide a summary of:
   - Which prompts were customized
   - Which prompts can be used as-is
   - Which prompts should be removed (if any)

My tech stack:
- Backend: [YOUR_BACKEND]
- Frontend: [YOUR_FRONTEND]
- Database: [YOUR_DATABASE]
- Auth: [YOUR_AUTH]
- State Management: [YOUR_STATE]
- Other: [ANY_OTHER_RELEVANT_TECH]
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] Stack-specific prompts updated (Supabase, React Query, etc.)
- [ ] Generic prompts remain unchanged (TypeScript, UI/UX, etc.)
- [ ] Examples match your stack
- [ ] Summary provided of what was customized
- [ ] No broken references to old stack

---

## 📝 Notes

**Prompts that are usually stack-agnostic (minimal changes needed):**
- `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md` - Mostly generic
- `MASTER_TYPESCRIPT_MULTI_CONFIG_PROMPT.md` - Multi-config patterns (generic)
- `MASTER_UI_UX_PROMPT.md` - Framework-agnostic
- `MASTER_REFACTORING_PROMPT.md` - Generic patterns
- `MASTER_ERROR_HANDLING_LOGGING_PROMPT.md` - Universal patterns
- `MASTER_FEATURE_STRUCTURE_PROMPT.md` - Organization patterns (generic)

**Build Tool Prompts (customize for your build tool):**
- `MASTER_VITE_CONFIGURATION_PROMPT.md` - Vite-specific (if using Vite)
- `MASTER_ESLINT_FLAT_CONFIG_PROMPT.md` - ESLint 9+ flat config (modern standard)
- `MASTER_VITEST_TESTING_PROMPT.md` - Vitest testing (if using Vitest)

**Prompts that need customization:**
- `MASTER_SUPABASE_*.md` - If not using Supabase, adapt or remove
- `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md` - If not using React Query
- `MASTER_AUTHENTICATION_SECURITY_PROMPT.md` - If different auth system
- Domain-specific prompts (e-commerce, reservations) - Adapt to your domain

### Setting Up .cursorrules with Quality Gates

**After customizing your stack, ensure `.cursorrules` includes:**

1. **Mandatory Quality Checks (Section 13):**
   - TypeScript checks after each page/component
   - Linting checks after each page/component
   - Format checks after each page/component
   - Watch mode recommendations

2. **Development Workflow (Section 6):**
   - Updated flow: `Build → Validate → Fix → Ship → Improve`
   - Mandatory checks after each feature
   - Real-time feedback with watch mode

3. **TypeScript Workflow (Section 11):**
   - Renamed to "MANDATORY DURING DEVELOPMENT"
   - Required checks after each page/component
   - Emphasis on fixing during development, not at commit

**Template:** Reference the updated `.cursorrules` from this project for the complete structure, or use `.cursorrules.template` from `evolvedoc-portable/` if available.

**Critical Sections to Include:**
- Section 3: Speed > Perfection (WITH Quality Gates)
- Section 6: Mandatory Quality Checks workflow
- Section 11: TypeScript Error Fixing (MANDATORY DURING DEVELOPMENT)
- Section 13: Development Checklist (MANDATORY)

**These sections prevent commit failures by catching errors during development.**

---

## ➡️ Next Step

Once stack is customized, proceed to:
**STEP_4_INITIALIZE_SYSTEM.md** - Initialize EvolveDoc system

