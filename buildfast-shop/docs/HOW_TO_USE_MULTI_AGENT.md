# How to Use Multi-Agent TypeScript Error Fixing

## Quick Start

1. **Open Cursor Multi-Agents Mode**
   - In Cursor, enable Multi-Agents mode (up to 8 agents)
   - This feature uses git worktrees to prevent conflicts

2. **Copy the Prompt**
   - Open `docs/MULTI_AGENT_PROMPT_READY.md`
   - Copy the entire content (lines 1-220)

3. **Paste into Multi-Agents**
   - Paste the prompt into Cursor's Multi-Agents chat
   - Cursor will automatically distribute tasks to 8 agents

4. **Monitor Progress**
   - Each agent works in their isolated worktree
   - Watch for completion notifications
   - Review and merge changes when done

## Prerequisites

✅ All `.agent-{id}.json` files exist (run `npm run setup:agents` if needed)
✅ All npm scripts are available (`verify:setup`, `typecheck:by-type`, etc.)
✅ Git worktrees are set up (agents will create them automatically)
✅ Helper functions exist (`src/lib/supabase-helpers.ts`)

## Verification

Before starting, verify setup:
```bash
npm run verify:setup
```

After all agents complete:
```bash
npm run typecheck      # Should show 0 errors
npm run lint:fix       # Auto-fix linting
npm run format         # Format code
```

## Troubleshooting

**Issue:** Agents can't find `.agent-{id}.json` files
**Fix:** Run `npm run setup:agents` to regenerate them

**Issue:** Worktrees not created
**Fix:** Agents will create worktrees automatically, or create manually:
```bash
git worktree add ../buildfast-shop-agent-1 agent-1-worktree
```

**Issue:** Scripts not found
**Fix:** Ensure you're in `buildfast-shop` directory and run `npm install`

## Expected Timeline

- **Setup:** 2-5 minutes
- **Auto-fix:** 5-10 minutes (fixes 30-40% automatically)
- **Parallel fixing:** 15-60 minutes (depending on error count)
- **Verification:** 5 minutes

**Total:** Typically 30-90 minutes for large codebases

