# 🎯 MASTER CURSOR FOLDER PROMPT
## Universal Documentation Access Using @Folders Feature

> **Part of EvolveDoc System** - Self-evolving documentation that learns from your codebase

---

## 📋 OVERVIEW

This master prompt leverages Cursor's `@Folders` feature to access ALL documentation files from the `docs/all-docs/` folder. Use this prompt to get comprehensive context from all documentation files automatically.

**EvolveDoc Integration:** All documentation in this folder is maintained by EvolveDoc, which automatically updates master prompts based on code changes and best practices.

**Key Features:**
- Uses Cursor's `@Folders` syntax for folder-wide access
- Automatically includes all documentation files
- Adapts to project structure
- Provides intelligent file selection guidance

---

## 🚀 QUICK START

### Basic Usage

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

[Your task description]
```

This automatically includes ALL files from `docs/all-docs/` folder as context.

---

## 📁 PROJECT STRUCTURE

### Documentation Folder
```
docs/
├── all-docs/                    ← All documentation files here
│   ├── INDEX.md                 ← File index and navigation
│   ├── DOCUMENTATION_EVOLUTION_SYSTEM.md
│   ├── AI_AGENT_DOCUMENTATION_RULES.md
│   ├── CONCEPTS_COMPARISON.md
│   ├── MASTER_*.md              ← All master prompts
│   └── [guides].md
└── MASTER_CURSOR_FOLDER_PROMPT.md  ← This file
```

### Project Structure Reference
```
project-root/
├── src/                         ← Source code
│   ├── pages/                   ← Page components
│   ├── components/              ← Reusable components
│   ├── features/                ← Feature modules
│   ├── hooks/                   ← Custom hooks
│   ├── lib/                     ← Utilities
│   └── types/                   ← TypeScript types
├── docs/                        ← Documentation
│   └── all-docs/                ← All docs folder
└── [config files]
```

---

## 🎯 USAGE PATTERNS

### Pattern 1: Full Documentation Access

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

[Your task]
```

**What this does:**
- Includes ALL files from `docs/all-docs/` folder
- Provides complete documentation context
- AI can reference any file automatically

### Pattern 2: Task-Specific with Folder

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Building a new authentication feature:
- Use relevant authentication patterns
- Follow security best practices
- Reference appropriate master prompts
```

**AI will automatically:**
- Find `MASTER_AUTHENTICATION_SECURITY_PROMPT.md`
- Reference `CONCEPTS_COMPARISON.md` for pattern decisions
- Use `DOCUMENTATION_EVOLUTION_SYSTEM.md` for doc updates

### Pattern 3: Code Review with Documentation

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Review this code:
[code snippet]

Check against all relevant documentation standards.
```

### Pattern 4: Refactoring with Full Context

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Refactoring [component/file]:
- Follow refactoring patterns
- Maintain type safety
- Ensure consistency with project standards
```

---

## 📖 INTELLIGENT FILE SELECTION

When you use `@Folders docs/all-docs`, the AI automatically:

1. **Identifies Relevant Files** based on your task
2. **References Appropriate Master Prompts** for the domain
3. **Uses CONCEPTS_COMPARISON.md** for pattern decisions
4. **Follows Documentation Evolution System** for updates

### Example: Building UI Component

**Your Prompt:**
```markdown
@Folders docs/all-docs
Building a new ProductCard component
```

**AI Automatically References:**
- `MASTER_UI_UX_PROMPT.md` - Component patterns
- `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md` - Type definitions
- `CONCEPTS_COMPARISON.md` - Styling pattern decisions

### Example: Database Work

**Your Prompt:**
```markdown
@Folders docs/all-docs
Creating a new database table with RLS policies
```

**AI Automatically References:**
- `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md` - Database patterns
- `MASTER_AUTHENTICATION_SECURITY_PROMPT.md` - Security patterns
- `CONCEPTS_COMPARISON.md` - Architecture decisions

---

## 🔧 CURSOR SETTINGS

### Enable Full Folder Content

For best results, enable "Full Folder Content" in Cursor:

1. Open Cursor Settings
2. Search for "Full Folder Content"
3. Enable the toggle
4. This ensures all file contents are included, not just file names

### Context Window Management

If you have many large files:

1. **Use specific file references** instead of full folder:
   ```markdown
   @docs/all-docs/MASTER_UI_UX_PROMPT.md
   @docs/all-docs/MASTER_TYPESCRIPT_PATTERNS_PROMPT.md
   ```

2. **Reference INDEX.md** to see available files:
   ```markdown
   @docs/all-docs/INDEX.md
   Show me available documentation files
   ```

---

## 📋 TASK-SPECIFIC GUIDANCE

### Building Features

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Building [feature name]:
- Domain: [e.g., e-commerce, auth, payments]
- Components needed: [list]
- Data requirements: [list]
```

**AI will:**
- Select relevant master prompts
- Reference domain-specific patterns
- Follow project structure conventions

### Code Review

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Review this code for:
- Type safety
- Pattern compliance
- Security best practices
- Performance optimization
```

### Refactoring

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Refactoring [file/component]:
- Current issues: [list]
- Goals: [list]
- Constraints: [list]
```

### Documentation Updates

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

I just [made a change]. Following documentation evolution system:
1. Research best practices (5+ sources)
2. Propose documentation updates
3. Request approval per-file/section
```

---

## 🎯 PROJECT STRUCTURE AWARENESS

The AI understands your project structure:

### Source Code Organization
- `src/pages/` - Page components
- `src/components/` - Reusable components
- `src/features/` - Feature modules
- `src/hooks/` - Custom hooks
- `src/lib/` - Utilities
- `src/types/` - TypeScript definitions

### Documentation Organization
- `docs/all-docs/` - All documentation files
- Master prompts follow naming: `MASTER_[DOMAIN]_PROMPT.md`
- Core system files: Evolution system, AI rules, Concepts comparison

### File Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `use[camelCase].ts`
- Utilities: `camelCase.ts`
- Types: `types.ts` or `modules.d.ts`

---

## ✅ BEST PRACTICES

1. **Always start with @Folders**
   ```markdown
   @Folders docs/all-docs
   ```

2. **Reference this master prompt**
   ```markdown
   @docs/MASTER_CURSOR_FOLDER_PROMPT.md
   ```

3. **Be specific about your task**
   - Describe what you're building/fixing
   - Mention relevant domains
   - List constraints or requirements

4. **Let AI select relevant files**
   - Don't manually reference every file
   - AI will automatically find relevant documentation
   - Use specific references only when needed

5. **Use INDEX.md for discovery**
   ```markdown
   @docs/all-docs/INDEX.md
   What documentation files are available?
   ```

---

## 🔄 DOCUMENTATION EVOLUTION

When code changes are made:

1. **AI detects changes** automatically
2. **References DOCUMENTATION_EVOLUTION_SYSTEM.md**
3. **Researches best practices** (5+ sources)
4. **Proposes updates** per-file/section
5. **Requests approval** before applying
6. **Updates source files** in `docs/` folder
7. **Automatically syncs** to `docs/all-docs/` folder

**Example:**
```markdown
@Folders docs/all-docs
I just fixed a bug by removing @ts-ignore comments.
Following documentation evolution system, propose updates.
```

### Automatic Synchronization

When documentation is updated:
1. Source files in `docs/` are updated (source of truth)
2. Changes automatically sync to `docs/all-docs/`
3. Both locations stay in sync

**Sync Script:** `docs/sync-docs.ps1`
- Run automatically by AI after updates
- Or run manually: `powershell -File docs/sync-docs.ps1`

**Important:** Always edit files in `docs/` folder, never directly in `docs/all-docs/`

---

## 📝 EXAMPLE WORKFLOWS

### Workflow 1: New Feature Development

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Building a "Wishlist" feature:
- Users can save products to wishlist
- Needs authentication
- Real-time updates when items change
- UI components needed

Provide comprehensive guidance using all relevant documentation.
```

**AI Response Includes:**
- Authentication patterns from `MASTER_AUTHENTICATION_SECURITY_PROMPT.md`
- Database patterns from `MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`
- Real-time patterns from `MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md`
- UI patterns from `MASTER_UI_UX_PROMPT.md`
- Pattern decisions from `CONCEPTS_COMPARISON.md`

### Workflow 2: Code Review

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Review this component:
[code snippet]

Check against all project standards and best practices.
```

### Workflow 3: Refactoring

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

Refactoring Cart component:
- Extract reusable hooks
- Improve TypeScript types
- Optimize performance
- Add proper error handling

Follow refactoring patterns and maintain consistency.
```

---

## 🎯 QUICK REFERENCE

### Most Common Usage

```markdown
@Folders docs/all-docs
@docs/MASTER_CURSOR_FOLDER_PROMPT.md

[Your task]
```

### For Specific Domains

**UI/UX:**
```markdown
@Folders docs/all-docs
Building UI components
```

**Backend:**
```markdown
@Folders docs/all-docs
Working with database and APIs
```

**Full-Stack:**
```markdown
@Folders docs/all-docs
Building full-stack feature
```

---

## 🔗 RELATED FILES

- **Folder:** `docs/all-docs/` - All documentation files
- **Index:** `@docs/all-docs/INDEX.md` - File navigation
- **Evolution System:** `@docs/all-docs/DOCUMENTATION_EVOLUTION_SYSTEM.md`
- **AI Rules:** `@docs/all-docs/AI_AGENT_DOCUMENTATION_RULES.md`

---

## 💡 TIPS

1. **Use @Folders for comprehensive context** - Gets all files automatically
2. **Be specific about your task** - Helps AI select relevant files
3. **Trust AI file selection** - It knows which docs are relevant
4. **Use INDEX.md for discovery** - See what's available
5. **Enable Full Folder Content** - In Cursor settings for best results

---

## 🆘 Troubleshooting

**If AI struggles with fixes:**
- AI will stop after 3 failed attempts
- AI will ask you to update files manually
- After you fix it, AI will log the solution
- Check `TROUBLESHOOTING.md` for similar issues

**Reference:**
- `@TROUBLESHOOTING.md` - Complete troubleshooting log
- `@docs/troubleshooting/` - Detailed logs folder

---

**This master prompt provides universal access to all documentation through Cursor's @Folders feature, automatically selecting and using relevant files based on your task and project structure.**

