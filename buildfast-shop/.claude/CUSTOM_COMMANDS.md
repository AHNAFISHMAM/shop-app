# Custom Claude Code Commands

## Available Commands & Shortcuts

| Command | Shortcut | Description |
|---------|----------|-------------|
| `/test-loops` | `Ctrl+Shift+L` | Test Loops email integration |
| `/review-code` | `Ctrl+Shift+R` | Review code for issues |
| `/quick-build` | `Ctrl+Shift+B` | Build and check for errors |
| `/debug-checkout` | `Ctrl+Shift+D` | Debug checkout flow |
| `/run-tests` | `Ctrl+Shift+T` | Run test suite |
| `/start-dev` | `Ctrl+Shift+S` | Start dev server |
| `/paste-image` | `Ctrl+Shift+V` | Paste/read image (auto-find recent) |
| `/paste-help` | `Ctrl+Alt+V` | Help with pasting text/images |
| `/read-screenshot` | `Ctrl+Shift+I` | Read screenshot/image file |
| `/find-screenshots` | `Ctrl+Shift+F` | Find recent screenshots |

## How to Use

### Option 1: Type the command
```
/test-loops
```

### Option 2: Use keyboard shortcut
Press `Ctrl+Shift+L` (or any other shortcut listed above)

## Creating Your Own Commands

1. Create a new `.md` file in `.claude/commands/`
2. Add frontmatter with description and keybinding:

```markdown
---
description: Your command description
keybinding: ctrl+shift+x
---

Your prompt here telling Claude what to do...
```

## Keybinding Format

- `ctrl+shift+letter` - Most common
- `ctrl+alt+letter` - Alternative
- `cmd+shift+letter` - macOS equivalent

## Examples

### Simple Command
**File:** `.claude/commands/hello.md`
```markdown
---
description: Say hello
keybinding: ctrl+shift+h
---

Say hello to the user in a friendly way!
```

### Complex Command
**File:** `.claude/commands/full-audit.md`
```markdown
---
description: Complete security audit
keybinding: ctrl+shift+a
---

Perform a complete security audit:
1. Check for vulnerabilities
2. Review authentication
3. Check API keys exposure
4. Review database security
5. Generate detailed report
```

## Tips

- Keep command names short and descriptive
- Use clear descriptions
- Choose shortcuts that don't conflict with system shortcuts
- Document what each command does
- Test your commands before relying on them

## Need Help?

Type `/help` to see all available commands or ask me to create a custom command for you!
