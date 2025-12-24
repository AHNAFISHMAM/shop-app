# 📚 EvolveDoc Portable System

> **Self-Evolving Documentation System** - Copy this entire folder to any project to get EvolveDoc running

---

## 📦 Version

**Current Version:** 1.5.0  
**System Name:** EvolveDoc  
**Last Updated:** 2025-01-27

**What's New in 1.6.0:**
- Added React import patterns master prompt (MASTER_REACT_IMPORT_PATTERNS_PROMPT.md)
- Enhanced TypeScript patterns with Supabase type helpers (Phase 10: asUpdate, asInsert)
- Enhanced error handling with createSafeAsync usage examples
- Enhanced Vite configuration with environment variables section (import.meta.env patterns)
- Enhanced ESLint flat config with test file configuration and unused variable patterns
- All updates include real examples from buildfast-shop production codebase

**Previous Version (1.5.0):**
- Added linting & code quality master prompt (MASTER_LINTING_CODE_QUALITY_PROMPT.md)
- Enhanced TypeScript patterns with "Eliminating `any` Types" section (Phase 6.5)
- Enhanced ESLint flat config with production configuration patterns
- Enhanced error handling with type-safe `createSafeAsync` pattern
- Enhanced custom hooks with common pitfalls (conditional hooks, dependencies)
- Enhanced Supabase patterns with type-safe operations section
- All updates include real examples from buildfast-shop production codebase

**Previous Version (1.4.0):**
- Added checkout flow master prompt (with real examples)
- Added admin panel master prompt (with real examples)
- Added React Query patterns master prompt
- Added type safety migration master prompt
- Added Supabase setup integration step (STEP_7)
- Added payment integration step (STEP_8)
- Added TypeScript errors troubleshooting guide
- Added real-time connection troubleshooting guide
- Added Supabase best practices guide
- Added checkout flow development guide
- Added admin panel development guide
- Enhanced Vite configuration prompt with real examples
- Added 3 new script templates (fix suggestions, migration, bundle analysis)

**Previous Version (1.3.0):**
- Added Vite configuration master prompt
- Added TypeScript multi-config master prompt
- Added ESLint flat config master prompt
- Added Vitest testing master prompt
- Added feature-based structure master prompt
- Added Windows compatibility troubleshooting guide
- Added pre-commit hooks setup step (STEP_6)
- Enhanced package.json scripts template with advanced TypeScript tools
- Added script templates for error analysis and fixing

**Version 1.2.0:**
- Added mandatory development quality gates to prevent commit failures
- Added `.cursorrules.template` with quality gates built-in
- Added `QUALITY_GATES_CHECKLIST.md` for verification
- Added `package.json.scripts.template` for required scripts
- Updated AI agent rules to enforce quality checks during development
- Enhanced integration steps to include quality gate setup
- Updated verification steps to check quality gates configuration

---

## 📁 Folder Structure

```
evolvedoc-portable/
├── README.md                    ← You are here
├── NEW_PROJECT_SETUP_CHECKLIST.md ← ⭐ START HERE for new projects
├── .cursorrules.template        ← Template .cursorrules with quality gates
├── QUALITY_GATES_CHECKLIST.md   ← Quality gates setup checklist
├── package.json.scripts.template ← Required npm scripts template
├── core-system/                 ← Core EvolveDoc system files
├── master-prompts/              ← All MASTER_* prompt files
├── integration-steps/           ← Step-by-step integration prompts (copy-paste ready)
├── troubleshooting/             ← Troubleshooting system
├── scripts/                     ← Sync scripts
└── guides/                      ← Usage and migration guides
```

---

## 🚀 Quick Start

**⭐ FIRST:** Read `NEW_PROJECT_SETUP_CHECKLIST.md` to understand the complete setup process and prevent common issues.

### Step 1: Copy to Your Project

Copy the entire `evolvedoc-portable/` folder to your new project's `docs/` folder, or keep it at project root.

### Step 2: Follow Integration Steps

Go to `integration-steps/` folder and follow the step-by-step prompts:

1. **STEP_1_COPY_FILES.md** - Copy files to your project
2. **STEP_2_UPDATE_REFERENCES.md** - Update project names/paths
3. **STEP_3_CUSTOMIZE_STACK.md** - Customize for your tech stack
4. **STEP_4_INITIALIZE_SYSTEM.md** - Initialize EvolveDoc
5. **STEP_5_VERIFY_SETUP.md** - Verify everything works
6. **STEP_6_PRE_COMMIT_HOOKS.md** - Set up pre-commit hooks (Husky + lint-staged)
7. **STEP_7_SUPABASE_SETUP.md** - Set up Supabase (optional)
8. **STEP_8_PAYMENT_INTEGRATION.md** - Set up payment processing (optional)

**Or use QUICK_START.md** for a summary of all steps.

### Step 3: Use the System

Once integrated, EvolveDoc will:
- Automatically monitor code changes
- Propose documentation updates
- Maintain master prompts up-to-date
- Log troubleshooting issues

---

## 📂 What's in Each Folder

### `core-system/`
Essential EvolveDoc files:
- `DOCUMENTATION_EVOLUTION_SYSTEM.md` - Main system documentation
- `AI_AGENT_DOCUMENTATION_RULES.md` - AI behavior rules
- `MASTER_CURSOR_FOLDER_PROMPT.md` - Cursor @Folders integration
- `CONCEPTS_COMPARISON.md` - Pattern comparisons

### `master-prompts/`
All master prompt files for different domains:
- **Build Tools:** Vite configuration
- **TypeScript:** Patterns, multi-config setups, migration, eliminating `any` types, Supabase type helpers
- **Linting:** ESLint flat config, code quality
- **Testing:** Vitest setup and patterns
- **Structure:** Feature-based organization
- **UI/UX:** Development patterns
- **Error Handling:** Logging and recovery, type-safe async wrappers, createSafeAsync pattern
- **Application Patterns:** Checkout flow, admin panel
- **Data Fetching:** React Query patterns
- **Backend:** Supabase, real-time subscriptions, type-safe operations
- **Payments:** Stripe integration
- **React Hooks:** Custom hooks, common pitfalls, conditional hooks
- **React Imports:** Import patterns, type safety, environment variables (NEW)
- **And more...** (See full list below)

### `integration-steps/`
Step-by-step prompts you can copy-paste into Cursor/AI:
- Each step has a ready-to-use prompt
- Includes verification checklists
- Guides you through the entire setup

### `troubleshooting/`
Troubleshooting system:
- `TROUBLESHOOTING.md` - Main troubleshooting log
- `WINDOWS_COMPATIBILITY.md` - Windows-specific issues and solutions
- `TYPESCRIPT_ERRORS.md` - Common TypeScript errors and solutions (with real examples)
- `REALTIME_CONNECTION.md` - Real-time connection issues and solutions (with real examples)
- `.template.md` - Template for log entries
- `README.md` - Troubleshooting system docs

### `scripts/`
Utility scripts and templates:
- `sync-docs.ps1` - Syncs docs to `docs/all-docs/` folder
- `group-errors.js.template` - Groups TypeScript errors by type
- `errors-by-file.js.template` - Groups errors by file
- `errors-by-type.js.template` - Groups errors with fix suggestions
- `typecheck-fix-suggestions.js.template` - Provides specific fix suggestions
- `migrate-js-to-ts.js.template` - Analyzes and plans JS to TS migration
- `analyze-bundle-size.js.template` - Analyzes bundle sizes and optimization opportunities

### `guides/`
Additional guides:
- `MASTER_PROMPTS_USAGE_GUIDE.md` - How to use master prompts
- `MIGRATION_GUIDE_OTHER_PROJECTS.md` - Migration details
- `SUPABASE_BEST_PRACTICES.md` - Supabase best practices (with real examples)
- `CHECKOUT_FLOW_GUIDE.md` - Checkout flow development (with real examples)
- `ADMIN_PANEL_DEVELOPMENT.md` - Admin panel development (with real examples)

### `.cursorrules.template`
Template `.cursorrules` file with mandatory quality gates:
- Includes Section 13: Development Checklist (MANDATORY)
- Includes Section 6: Mandatory Quality Checks workflow
- Includes Section 11: TypeScript Workflow (MANDATORY DURING DEVELOPMENT)
- Prevents commit failures by catching errors during development
- Copy to your project root and customize for your tech stack

### `QUALITY_GATES_CHECKLIST.md`
Standalone checklist for verifying quality gates are set up:
- Verification steps for `.cursorrules` configuration
- Required `package.json` scripts checklist
- Pre-commit hooks setup verification
- Testing instructions
- Common issues and solutions
- Reference during project setup

### `package.json.scripts.template`
Template showing required npm scripts for quality gates:
- TypeScript checking scripts
- Linting and formatting scripts
- Pre-commit hooks configuration
- Use as reference when setting up `package.json`

---

## 🎯 How It Works

1. **Copy** this folder to your project
2. **Follow** integration steps (copy-paste prompts)
3. **Customize** for your tech stack
4. **Initialize** the system
5. **Start coding** - EvolveDoc learns from your code!

---

## 📖 Documentation

- **System Overview:** `core-system/DOCUMENTATION_EVOLUTION_SYSTEM.md`
- **Integration Guide:** `integration-steps/QUICK_START.md`
- **Usage Guide:** `guides/MASTER_PROMPTS_USAGE_GUIDE.md`

---

## ✅ Requirements

- Cursor IDE (for @Folders feature)
- PowerShell (for sync script, Windows)
- Node.js project (for most master prompts)

---

**Version:** 1.5.0  
**System Name:** EvolveDoc  
**Last Updated:** 2025-01-27

---

## 🆕 Version 1.6.0 Highlights

This version includes **production-ready patterns** from the buildfast-shop codebase:

- ✅ **1 New Master Prompt:** React Import Patterns (MASTER_REACT_IMPORT_PATTERNS_PROMPT.md)
- ✅ **Enhanced TypeScript Patterns:** New Phase 10 on Supabase type helpers (asUpdate, asInsert)
- ✅ **Enhanced Error Handling:** createSafeAsync usage examples and service patterns
- ✅ **Enhanced Vite Configuration:** Environment variables section (import.meta.env vs process.env)
- ✅ **Enhanced ESLint Config:** Test file configuration and unused variable patterns with `_` prefix

All updates include **real examples** from buildfast-shop production codebase.

## 🆕 Version 1.5.0 Highlights

This version includes **production-ready patterns** from the buildfast-shop codebase:

- ✅ **1 New Master Prompt:** Linting & Code Quality (MASTER_LINTING_CODE_QUALITY_PROMPT.md)
- ✅ **Enhanced TypeScript Patterns:** New Phase 6.5 on eliminating `any` types with real examples
- ✅ **Enhanced ESLint Config:** Production configuration patterns section
- ✅ **Enhanced Error Handling:** Type-safe `createSafeAsync` pattern
- ✅ **Enhanced React Hooks:** Common pitfalls section (conditional hooks, dependencies)
- ✅ **Enhanced Supabase:** Type-safe operations section (Phase 10)

All updates include **real examples** from buildfast-shop production codebase.

---

## 🆕 Version 1.4.0 Highlights

This version includes **real-world examples** from the buildfast-shop production codebase:

- ✅ **4 New Master Prompts** with production patterns
- ✅ **3 New Script Templates** for error analysis and migration
- ✅ **2 New Integration Steps** (Supabase, Payment)
- ✅ **2 New Troubleshooting Guides** with real solutions
- ✅ **3 New Documentation Guides** with practical examples
- ✅ **Enhanced Existing Prompts** with real code examples

All new content includes **real examples** from buildfast-shop, making it immediately applicable to your projects.

---

**Version:** 1.6.0  
**System Name:** EvolveDoc  
**Last Updated:** 2025-01-27

