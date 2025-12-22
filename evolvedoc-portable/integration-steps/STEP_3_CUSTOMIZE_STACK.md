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
- `MASTER_UI_UX_PROMPT.md` - Framework-agnostic
- `MASTER_REFACTORING_PROMPT.md` - Generic patterns
- `MASTER_ERROR_HANDLING_LOGGING_PROMPT.md` - Universal patterns
- `MASTER_TESTING_PROMPT.md` - May need test framework update

**Prompts that need customization:**
- `MASTER_SUPABASE_*.md` - If not using Supabase, adapt or remove
- `MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md` - If not using React Query
- `MASTER_AUTHENTICATION_SECURITY_PROMPT.md` - If different auth system
- Domain-specific prompts (e-commerce, reservations) - Adapt to your domain

---

## ➡️ Next Step

Once stack is customized, proceed to:
**STEP_4_INITIALIZE_SYSTEM.md** - Initialize EvolveDoc system

