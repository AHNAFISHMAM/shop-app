# Multi-Agent Activation Guide

## ✅ Pre-Flight Check Complete

All 22/22 checks passed. System ready for parallel TypeScript error fixing.

## 🚀 How to Activate Multi-Agents in Cursor

### Step 1: Open Cursor Multi-Agents Mode

1. In Cursor, open the **Multi-Agents** panel (sidebar or Cmd/Ctrl+Shift+P → "Multi-Agents")
2. Click **"Create New Plan"** or **"Start Multi-Agent Session"**

### Step 2: Copy the Master Prompt

Copy the entire content from `docs/MULTI_AGENT_MASTER_PROMPT.md` (lines 7-220) and paste it into the Multi-Agents prompt field.

**Quick Copy Command:**
```bash
# On Mac/Linux:
cat docs/MULTI_AGENT_MASTER_PROMPT.md | tail -n +7 | head -n 214

# Or just open the file and copy lines 7-220
```

### Step 3: Configure 8 Agents

Cursor will automatically create 8 agent instances. Each agent will:
- Read their `.agent-{id}.json` file
- Work in isolated worktree (`../buildfast-shop-agent-{id}`)
- Focus on their assigned error type

### Step 4: Start Execution

Click **"Start"** or **"Run Agents"**. Each agent will:
1. Verify setup (`npm run verify:setup`)
2. Analyze errors (`npm run typecheck:by-type`)
3. Auto-fix common patterns (`npm run fix:auto`)
4. Fix assigned error type
5. Run watch mode in background

### Step 5: Monitor Progress

Watch each agent's progress in real-time:
- Agent 1: TS6133 (Unused Variables) - Quick wins
- Agent 2: TS2322 (Type Mismatches) - Most common
- Agent 3: TS2345 (Argument Types)
- Agent 4: TS7006 (Implicit Any)
- Agent 5: TS18046 (Null Checks)
- Agent 6: TS2339 (Property Missing)
- Agent 7: TS7053 (Index Signatures)
- Agent 8: Verification & Remaining

### Step 6: Review & Merge

After completion:
1. Cursor will show candidate diffs side-by-side
2. Review each agent's changes
3. Merge the best solutions
4. Run final verification:
   ```bash
   npm run typecheck      # Should show 0 errors
   npm run lint:fix       # Auto-fix linting
   npm run format         # Format code
   ```

## 📋 Quick Reference

### Agent Assignments
- **Agent 1**: TS6133 - Remove unused vars or prefix with `_`
- **Agent 2**: TS2322 - Use `asUpdate()` helper from `src/lib/supabase-helpers.ts`
- **Agent 3**: TS2345 - Add explicit type annotations
- **Agent 4**: TS7006 - Add type annotations, avoid `any`
- **Agent 5**: TS18046 - Add type guards (`err instanceof Error`)
- **Agent 6**: TS2339 - Add properties to types
- **Agent 7**: TS7053 - Add index signatures
- **Agent 8**: Verify all fixes

### Required Patterns (All Agents)

**Helper Functions:**
```typescript
import { asUpdate } from '@/lib/supabase-helpers'
.update(asUpdate('table', { field: value }))
```

**Error Handling:**
```typescript
catch (err) {
  toast.error(err instanceof Error ? err.message : String(err))
}
```

**Type Guards:**
```typescript
const count = 'count' in result ? (result as { count?: number }).count || 0 : 0
```

## 🎯 Expected Results

- **10-30x faster** error fixing
- **30-40% errors** fixed automatically
- **All TypeScript errors** resolved
- **Code follows** best practices

## 🔧 Troubleshooting

**If agents conflict:**
- Each agent works in isolated worktree
- Conflicts are prevented by Git worktree isolation
- Review diffs before merging

**If setup fails:**
```bash
npm run verify:setup  # Check all 22 requirements
npm run setup:agents  # Recreate agent configs
```

**If errors persist:**
- Check `.cursorrules` Section 11 for patterns
- Review `docs/AGENT_QUICK_REFERENCE.md`
- See `docs/SPEED_OPTIMIZATIONS.md` for optimizations

## 📚 Reference Files

- `docs/MULTI_AGENT_MASTER_PROMPT.md` - Full prompt (copy lines 7-220)
- `docs/AGENT_QUICK_REFERENCE.md` - Quick workflow reference
- `docs/SPEED_OPTIMIZATIONS.md` - Performance optimizations
- `docs/PARALLEL_FIXING_WORKFLOW.md` - Detailed workflow
- `.agent-{1-8}.json` - Individual agent configs

---

**Ready to start?** Copy `MULTI_AGENT_MASTER_PROMPT.md` lines 7-220 into Cursor Multi-Agents mode and click Start! 🚀

