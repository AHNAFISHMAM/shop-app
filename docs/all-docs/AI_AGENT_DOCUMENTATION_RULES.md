# 🤖 AI Agent: Documentation Evolution Rules
## Mandatory Behavior for Self-Evolving Documentation

---

## 🎯 CORE MANDATE

**YOU MUST:** Monitor ALL code changes and automatically propose documentation updates following these rules.

**YOU MUST:** Research minimum 5 authoritative sources before proposing ANY update.

**YOU MUST:** Request approval per-file/section before applying changes.

**YOU MUST:** Handle conflicts by proposing alternatives with options.

**YOU MUST:** Complete full inventory before executing multi-file tasks (see `AI_PROCESS_IMPROVEMENTS.md`).

---

## 🔍 DETECTION RULES

### Automatic Monitoring
Monitor ALL code changes for these triggers:

1. **Bug Fixes**
   - Error fixes
   - TypeScript errors resolved
   - Runtime errors fixed
   - Logic bugs corrected

2. **Refactoring**
   - Component extraction
   - Hook creation
   - Service layer addition
   - File reorganization

3. **New Patterns**
   - Custom hooks
   - Utility functions
   - Type definitions
   - Component patterns

4. **Optimizations**
   - Performance improvements
   - Memoization added
   - Lazy loading
   - Code splitting

5. **TypeScript Improvements**
   - @ts-ignore removed
   - Type definitions added
   - Type guards created
   - Utility types used

6. **Accessibility**
   - ARIA attributes added
   - Keyboard navigation
   - Screen reader support
   - Focus management

7. **Security**
   - Input validation
   - XSS prevention
   - CSRF protection
   - Auth improvements

---

## 🔬 RESEARCH REQUIREMENTS

### Minimum 5 Sources Per Update

**Source Priority:**
1. **Official Documentation** (React, TypeScript, MDN, etc.)
2. **Industry Leaders** (Kent C. Dodds, Dan Abramov, etc.)
3. **GitHub RFCs/Discussions**
4. **Stack Overflow** (highly upvoted, recent)
5. **Academic/Research** (if applicable)

**Research Process:**
1. Search for current best practices (2024-2025)
2. Verify against official docs
3. Check for pattern conflicts
4. Find authoritative sources
5. Document all sources with URLs

**Research Format:**
```markdown
### Research Findings (5+ Sources):

1. **[Source Name]** ([URL])
   - Finding: [Key insight]
   - Relevance: [Why this matters]
   - Date: [Publication date if available]

2. [Continue for minimum 5 sources...]
```

---

## 📝 PROPOSAL FORMAT

### Per-File/Section Proposal

**Required Elements:**
1. Trigger description
2. Files changed (code files)
3. Pattern detected
4. Research findings (5+ sources)
5. Proposed changes (specific)
6. Example code (from codebase)
7. Validation checklist
8. Approval request

**Format:**
```markdown
## 📝 Proposed Documentation Update

**Trigger:** [Type of change]
**Date:** [YYYY-MM-DD]
**Files Changed:** [List]
**Pattern Detected:** [Description]

### Research Findings (5+ Sources):
[Minimum 5 sources with findings]

### Proposed Changes:

#### File: [filename]
**Section:** [section name]

**Changes:**
- [ ] Add new subsection: "[Name]"
- [ ] Update existing: "[What]"
- [ ] Add example from: `file:line`
- [ ] Add reference: [URL]

**Example Code:**
\`\`\`typescript
[Real code from codebase]
\`\`\`

**Validation:**
- [x] Example verified
- [x] No duplicates
- [x] Consistent format
- [x] Markdown valid

**Approval Required:**
- [ ] Approve this file/section
- [ ] Approve with modifications
- [ ] Request more research
- [ ] Reject
```

---

## ⚠️ CONFLICT RESOLUTION

### When Research Conflicts with Existing Patterns

**YOU MUST:**
1. Identify the conflict clearly
2. Research both sides (5+ sources each)
3. Propose minimum 3 options
4. Provide pros/cons for each
5. Make a recommendation
6. Wait for user choice

**Format:**
```markdown
## ⚠️ Pattern Conflict Detected

**Existing Pattern:** [Current]
**New Research:** [Conflicting]

### Option 1: [Description]
**Pros:** [List]
**Cons:** [List]
**Research:** [Sources]

### Option 2: [Description]
**Pros:** [List]
**Cons:** [List]
**Research:** [Sources]

### Option 3: [Description]
**Pros:** [List]
**Cons:** [List]
**Research:** [Sources]

### Recommendation:
[Your recommendation with reasoning]

**Your Choice:**
- [ ] Option 1
- [ ] Option 2
- [ ] Option 3
- [ ] Custom: [specify]
```

---

## ✅ VALIDATION RULES

### Before Proposing ANY Update

**MANDATORY CHECKS:**
- [ ] All examples tested and working
- [ ] No duplicate content found
- [ ] Consistent with existing format
- [ ] Markdown formatting valid
- [ ] All links accessible
- [ ] Minimum 5 research sources
- [ ] Version history entry prepared
- [ ] Cross-references updated

**Example Verification:**
- Copy example code
- Test in isolation
- Verify it compiles/runs
- Check for errors

**Duplicate Check:**
- Search entire file for similar content
- Check other master prompts
- Ensure uniqueness

---

## 📅 VERSION HISTORY RULES

### Inline Version History

**YOU MUST:** Add version history entry to each master prompt after approval.

**Format:**
```markdown
### [YYYY-MM-DD] - Version [X.X]
**Trigger:** [What caused update]
**Files Changed:** [List]
**Research Sources:** [5+ sources]
- [Source 1](URL)
- [Source 2](URL)
...

**Changes Made:**
- Added: "[Section]"
- Updated: "[Section]"
- Example: `file:line`

**Pattern Documented:**
[Description]
```

**Location:** End of each master prompt file, before final separator.

---

## 🔄 SYNCHRONIZATION RULES

### After Applying Documentation Updates

**YOU MUST:**

1. **Update Source File** (`docs/[filename].md`)
   - Apply approved changes to source location
   - Update version history inline

2. **Sync to `docs/all-docs/`**
   - Automatically run sync script: `powershell -ExecutionPolicy Bypass -File docs/sync-docs.ps1`
   - Or prompt user: "Run `docs/sync-docs.ps1` to sync to all-docs folder"
   - Ensure both locations have identical content

3. **Verify Sync**
   - Confirm file exists in both locations
   - Verify content is identical
   - Check version history matches

**Sync Script Location:** `docs/sync-docs.ps1`

**Source of Truth:** Always edit files in `docs/` folder, never directly in `docs/all-docs/`

**Never:**
- ❌ Update only one location
- ❌ Skip synchronization
- ❌ Leave files out of sync
- ❌ Edit files directly in `docs/all-docs/`

---

## 🆘 TROUBLESHOOTING & HELP-SEEKING RULES

### When Code Fixes Fail Multiple Times

**CRITICAL RULE:** If you attempt to fix a code issue **3 times** and it's still not working:

1. **STOP attempting fixes immediately**
2. **Document the issue clearly:**
   - Issue description (what feature/bug you're fixing)
   - All 3 failed attempts with error messages
   - Files affected
   - Error type (front-end or back-end)
   - Tags/categories for searchability
3. **Ask the user to update the files:**
   - Clearly explain the problem
   - Provide context of what you tried
   - Ask: "I've attempted 3 times without success. Could you please update the files manually?"

**Scope:** Applies to ALL code fixes:
- ✅ Bug fixes
- ✅ Refactoring
- ✅ New feature implementation
- ✅ Performance optimizations
- ✅ TypeScript/type errors

**Issue Definition:** One issue = one feature/bug being fixed
- Counter resets per new issue
- Same error in different files = same issue
- Different errors = different issues

**Error Types:** Applies to:
- ✅ Front-end errors (React, TypeScript, UI issues)
- ✅ Back-end errors (API, database, server issues)

**Never:**
- ❌ Continue trying after 3 failed attempts
- ❌ Loop endlessly on the same issue
- ❌ Skip asking for help when stuck
- ❌ Attempt fixes without documenting attempts

**Format for Asking:**
```markdown
## ⚠️ Need Manual Update - 3 Attempts Failed

**Issue:** [Feature/Bug Description]
**Type:** [Front-end / Back-end]
**Files Affected:** [List of files]
**Tags:** [tag1, tag2, tag3]

**Failed Attempts:**
1. **Attempt 1:** [Approach] - Error: [Error message]
2. **Attempt 2:** [Approach] - Error: [Error message]
3. **Attempt 3:** [Approach] - Error: [Error message]

**Root Cause Analysis:** [Your analysis of why it's failing]

**Solution Needed:**
[Clear instructions for what needs to be fixed]

Could you please update the files manually? I'll document the successful fix in the troubleshooting log once confirmed.
```

### After User Fixes the Issue

**YOU MUST:**

1. **Create detailed log entry:**
   - Location: `docs/troubleshooting/[type]_[YYYY-MM-DD]_[issue-id].md`
   - Format: Follow troubleshooting log template
   - Include: Only the successful attempt (detailed)
   - Brief mention of failed attempts (summary only)
   - Add tags/categories for searchability

2. **Update root troubleshooting index:**
   - Location: `TROUBLESHOOTING.md` (root level)
   - Add full entry with all details
   - Include tags for searchability
   - Link to detailed log file

3. **Verify fix:**
   - Confirm with user that issue is resolved
   - Ensure code compiles/runs correctly
   - Check no new errors introduced

**File Naming Convention:**
- Format: `[type]_[YYYY-MM-DD]_[issue-id].md`
- Type: `frontend` or `backend`
- Date: `YYYY-MM-DD`
- Issue ID: Short identifier (e.g., `login-error`, `type-error-001`, `api-timeout`)
- Multiple issues per day: Append number if needed: `frontend_2025-01-27_1.md`, `frontend_2025-01-27_2.md`

**Tags/Categories:**
- Use consistent tags: `typescript`, `react`, `api`, `database`, `auth`, `performance`, `ui`, `error-handling`
- Add issue-specific tags as needed
- Include in both log file and root index

---

## 🚫 PROHIBITED ACTIONS

**NEVER:**
- ❌ Update documentation without approval
- ❌ Skip research phase
- ❌ Use fewer than 5 sources
- ❌ Add unverified examples
- ❌ Break existing formatting
- ❌ Add duplicate content
- ❌ Skip validation checks
- ❌ Update without version history
- ❌ Ignore pattern conflicts
- ❌ Apply changes without per-file approval
- ❌ Skip synchronization after updates

---

## 🎯 SUCCESS CRITERIA

**Documentation is successful when:**
- ✅ 100% of patterns are documented
- ✅ All examples work correctly
- ✅ All updates research-backed (5+ sources)
- ✅ Consistent formatting across files
- ✅ Complete version history
- ✅ No duplicate content
- ✅ All links accessible
- ✅ User approval rate high

---

## 📋 QUICK REFERENCE

**When you detect a code change:**
1. Analyze the change
2. Research 5+ sources
3. Propose per-file/section
4. Validate everything
5. Request approval
6. Apply approved changes
7. Update version history

**When research conflicts:**
1. Identify conflict
2. Research both sides
3. Propose 3+ options
4. Provide pros/cons
5. Make recommendation
6. Wait for choice

**Always:**
- Research first (5+ sources)
- Validate examples
- Check duplicates
- Request approval
- Update version history

---

## 🔗 Related Files

- `DOCUMENTATION_EVOLUTION_SYSTEM.md` - Complete system overview
- `AI_PROCESS_IMPROVEMENTS.md` - Process improvement lessons and execution methodology
- All `MASTER_*_PROMPT.md` files - Documentation targets
- `CONCEPTS_COMPARISON.md` - Comparison documentation

---

## 🔄 Process Improvements

See `AI_PROCESS_IMPROVEMENTS.md` for:
- Complete inventory methodology
- Batch execution rules
- Verification processes
- Lessons learned from execution failures

**Key Rule:** Always complete full inventory before executing multi-file tasks.

---

**Last Updated:** 2025-01-27
**Rules Version:** 1.1.0

