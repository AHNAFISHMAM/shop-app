# Parallel TypeScript Error Fixing - Multi-Agent Master Prompt

**Copy this entire prompt and paste it into Cursor Multi-Agents mode (up to 8 agents)**

---

## MANDATORY WORKFLOW (All Agents Must Follow)

### Step 1: Identify Your Agent ID
Each agent should read their `.agent-{id}.json` file to know their assigned task:
```bash
# Agent 1 reads: .agent-1.json
# Agent 2 reads: .agent-2.json
# ... and so on
cat .agent-{YOUR_ID}.json
```

### Step 2: Setup Verification
```bash
npm run verify:setup
```

### Step 3: Error Analysis (Run First)
```bash
npm run typecheck:group    # Get error breakdown
npm run typecheck:by-type  # Prioritize by error type
npm run typecheck:by-file  # Group by file for parallel processing
```

### Step 4: Auto-Fix Common Patterns (Always Run First)
```bash
npm run fix:auto          # Auto-fixes 30-40% of errors automatically
npm run fix:type-imports  # Optimize type-only imports
```

### Step 5: Watch Mode (Keep Running)
```bash
npm run typecheck:watch:preserve  # Optimized watch mode
# OR for large codebases:
npm run typecheck:build:watch     # Project references watch
```

## AGENT ASSIGNMENTS

### Agent 1: Quick Wins (TS6133 - Unused Variables)
**Task:** Fix all TS6133 errors (unused variables)
**Files:** Focus on files with highest TS6133 count from `typecheck:by-type`
**Strategy:**
- Remove unused imports/variables
- Prefix intentionally unused with `_`
- Use `npm run lint:fix` for auto-removal
**Worktree:** `../buildfast-shop-agent-1`

### Agent 2: Type Mismatches (TS2322)
**Task:** Fix all TS2322 errors (type mismatches)
**Files:** Focus on files with highest TS2322 count
**Strategy:**
- Use helper functions: `asUpdate(table, data)` from `src/lib/supabase-helpers.ts`
- Add proper type assertions
- Fix interface/type definitions
**Worktree:** `../buildfast-shop-agent-2`

### Agent 3: Argument Types (TS2345)
**Task:** Fix all TS2345 errors (argument type mismatches)
**Files:** Focus on files with highest TS2345 count
**Strategy:**
- Add explicit type annotations to function parameters
- Use type guards for null/undefined checks
- Fix function signatures
**Worktree:** `../buildfast-shop-agent-3`

### Agent 4: Implicit Any (TS7006)
**Task:** Fix all TS7006 errors (implicit any)
**Files:** Focus on files with highest TS7006 count
**Strategy:**
- Add explicit type annotations
- Use proper type definitions
- Avoid `any` type
**Worktree:** `../buildfast-shop-agent-4`

### Agent 5: Null Checks (TS18046)
**Task:** Fix all TS18046 errors (null/undefined checks)
**Files:** Focus on files with highest TS18046 count
**Strategy:**
- Add type guards: `err instanceof Error ? err.message : String(err)`
- Use optional chaining: `obj?.property`
- Add null checks before property access
**Worktree:** `../buildfast-shop-agent-5`

### Agent 6: Property Missing (TS2339)
**Task:** Fix all TS2339 errors (property does not exist)
**Files:** Focus on files with highest TS2339 count
**Strategy:**
- Add properties to type definitions
- Use type assertions: `(element as HTMLElement | null)?.querySelector()`
- Update interface definitions
**Worktree:** `../buildfast-shop-agent-6`

### Agent 7: Index Signatures (TS7053)
**Task:** Fix all TS7053 errors (index signature missing)
**Files:** Focus on files with highest TS7053 count
**Strategy:**
- Add index signature: `[key: string]: any;` to types
- Use proper type definitions
**Worktree:** `../buildfast-shop-agent-7`

### Agent 8: Remaining Errors & Verification
**Task:** Fix remaining errors and verify all fixes
**Strategy:**
- Fix any remaining error types
- Run `npm run typecheck` to verify
- Ensure all files pass type checking
**Worktree:** `../buildfast-shop-agent-8`

## REQUIRED PATTERNS (All Agents)

### Helper Functions (MANDATORY)
```typescript
// ❌ DON'T USE:
.update({ field: value } as Updates<'table'>)

// ✅ USE INSTEAD:
import { asUpdate } from '@/lib/supabase-helpers'
.update(asUpdate('table', { field: value }))
```

### Error Handling (MANDATORY)
```typescript
// ❌ DON'T USE:
catch (err) {
  toast.error(err.message)
}

// ✅ USE INSTEAD:
catch (err) {
  toast.error(err instanceof Error ? err.message : String(err))
}
```

### Type Guards (MANDATORY)
```typescript
// ❌ DON'T USE:
const count = (result as any).count || 0

// ✅ USE INSTEAD:
const count = 'count' in result ? (result as { count?: number }).count || 0 : 0
```

## PERFORMANCE OPTIMIZATIONS (Use These)

- `typecheck:watch:preserve` - Optimized watch mode
- `typecheck:build:watch` - Project references (modular compilation)
- `typecheck:fast` - Quick validation (skips libs)
- Parallel batch processing via multi-agents

## WORKTREE SETUP

Each agent works in their own isolated Git worktree to prevent conflicts:
- Agent 1: `../buildfast-shop-agent-1`
- Agent 2: `../buildfast-shop-agent-2`
- ... and so on

**Important:** Work in your assigned worktree directory, not the main repository.

## VERIFICATION

After all agents complete:
1. Run `npm run typecheck` - Should show 0 errors
2. Run `npm run lint:fix` - Auto-fix linting issues
3. Run `npm run format` - Format all code
4. Verify pre-commit hooks work: `git add . && git commit -m "test"`

## EXPECTED RESULTS

- **10-30x faster** error fixing
- **30-40% errors** fixed automatically
- **All TypeScript errors** resolved
- **Code follows** best practices from `.cursorrules`

## REFERENCE DOCUMENTATION

- `.cursorrules` Section 11 - Complete workflow
- `docs/AGENT_QUICK_REFERENCE.md` - Quick reference
- `docs/SPEED_OPTIMIZATIONS.md` - All optimizations
- `docs/PARALLEL_FIXING_WORKFLOW.md` - Parallel workflow

---

## QUICK COPY VERSION (For Cursor)

```
Fix TypeScript errors in parallel using multi-agent system:

1. Read your .agent-{id}.json file to know your assigned task
2. Run: npm run typecheck:by-type to get error breakdown
3. Run: npm run fix:auto to auto-fix 30-40% of errors
4. Work in your assigned worktree (../buildfast-shop-agent-{id})
5. Fix your assigned error type:
   - Agent 1: TS6133 (unused vars) - Remove or prefix with _
   - Agent 2: TS2322 (type mismatch) - Use asUpdate() helper
   - Agent 3: TS2345 (argument type) - Add explicit types
   - Agent 4: TS7006 (implicit any) - Add type annotations
   - Agent 5: TS18046 (null checks) - Add type guards
   - Agent 6: TS2339 (property missing) - Add to types
   - Agent 7: TS7053 (index signature) - Add signatures
   - Agent 8: Verify all fixes with npm run typecheck

All agents must:
- Use asUpdate/asInsert from src/lib/supabase-helpers.ts
- Follow patterns in .cursorrules Section 11
- Run npm run typecheck:watch:preserve in background
- Use error instanceof Error pattern for error handling
- Work in isolated worktree to prevent conflicts

Reference: docs/AGENT_QUICK_REFERENCE.md
```

---

**CRITICAL:** Each agent must work in isolation in their assigned worktree. After completion, Cursor will evaluate solutions and recommend the best merge strategy. Review and merge carefully.

