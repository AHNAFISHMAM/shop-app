# Multi-Agent Setup Checklist

## Pre-Flight Verification ✅

Run this before starting Multi-Agents mode:

```bash
# 1. Verify agent files exist
npm run setup:agents

# 2. Verify setup
npm run verify:setup

# 3. Check current error count
npm run typecheck:count

# 4. Get error breakdown
npm run typecheck:by-type
```

## Activation Steps 🚀

### Step 1: Open Cursor Multi-Agents Mode
- Click Multi-Agents button in Cursor (or Cmd/Ctrl + Shift + M)
- Select up to 8 agents

### Step 2: Copy Prompt
- Open `docs/MULTI_AGENT_PROMPT_READY.md`
- Select All (Cmd/Ctrl + A)
- Copy (Cmd/Ctrl + C)

### Step 3: Paste & Execute
- Paste into Multi-Agents chat
- Press Enter to start

### Step 4: Monitor Progress
- Watch agent status in Cursor UI
- Each agent will work in isolated worktree
- Review changes as they complete

## Post-Execution Verification ✅

After all agents complete:

```bash
# 1. Verify no errors remain
npm run typecheck

# 2. Fix linting issues
npm run lint:fix

# 3. Format code
npm run format

# 4. Run tests (if applicable)
npm test
```

## Expected Agent Behavior

Each agent will:
1. ✅ Read their `.agent-{id}.json` file
2. ✅ Run `npm run typecheck:by-type` to get errors
3. ✅ Run `npm run fix:auto` (auto-fixes 30-40%)
4. ✅ Work in isolated worktree
5. ✅ Fix assigned error type
6. ✅ Report completion

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Agents can't find `.agent-{id}.json` | Run `npm run setup:agents` |
| Worktrees not created | Agents create automatically, or run `git worktree add ../buildfast-shop-agent-{id} agent-{id}-worktree` |
| Scripts not found | Ensure in `buildfast-shop` directory, run `npm install` |
| Conflicts detected | Review changes, merge carefully using Cursor's merge tools |

## Success Criteria

- ✅ `npm run typecheck` shows 0 errors
- ✅ All code formatted and linted
- ✅ No merge conflicts
- ✅ All tests passing

