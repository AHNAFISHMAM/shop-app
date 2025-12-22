# 📚 Self-Evolving Documentation System
## Automated Master Prompts & Concepts Comparison Evolution

---

## 🎯 System Overview

This system automatically evolves your master prompt files and CONCEPTS_COMPARISON.md by:
1. **Monitoring** all code changes automatically
2. **Researching** current best practices (minimum 5 sources)
3. **Proposing** documentation updates per-file/section
4. **Requesting approval** before applying changes
5. **Maintaining** consistency, quality, and version history

---

## 🔄 Complete Workflow

### Phase 1: Auto-Detection
**Trigger Conditions** (AI monitors ALL code changes):
- ✅ Bug fixes
- ✅ Component refactoring
- ✅ New patterns/utilities added
- ✅ Best practices learned
- ✅ Performance optimizations
- ✅ TypeScript improvements
- ✅ Accessibility enhancements
- ✅ Security fixes

**Detection Method:**
- AI analyzes code diffs
- Identifies patterns, solutions, improvements
- Categorizes by type and impact

### Phase 2: Research & Analysis
**Research Requirements:**
- **Minimum 5 authoritative sources** per update
- Sources must be current (2024-2025)
- Verify against official documentation
- Check for pattern conflicts
- Find industry best practices

**Research Sources Priority:**
1. Official documentation (React, TypeScript, MDN, etc.)
2. Industry-leading blogs (Kent C. Dodds, Dan Abramov, etc.)
3. GitHub discussions and RFCs
4. Stack Overflow (highly upvoted, recent)
5. Academic papers or research (if applicable)

### Phase 3: Documentation Proposal
**Per-File/Section Approval Format:**

```markdown
## 📝 Proposed Documentation Update

**Trigger:** [Type of change - e.g., "Bug Fix: Removed @ts-ignore comments"]
**Date:** [YYYY-MM-DD]
**Files Changed:** [List of code files]
**Pattern Detected:** [Description]

### Research Findings (5+ Sources):

1. **[Source Name]** ([URL])
   - Finding: [Key insight]
   - Relevance: [Why this matters]

2. **[Source Name]** ([URL])
   - Finding: [Key insight]
   - Relevance: [Why this matters]

3. **[Source Name]** ([URL])
   - Finding: [Key insight]
   - Relevance: [Why this matters]

4. **[Source Name]** ([URL])
   - Finding: [Key insight]
   - Relevance: [Why this matters]

5. **[Source Name]** ([URL])
   - Finding: [Key insight]
   - Relevance: [Why this matters]

### Proposed Changes:

#### File: `docs/MASTER_TYPESCRIPT_PATTERNS_PROMPT.md`
**Section:** "Phase 6: Eliminating @ts-ignore Comments"

**Changes:**
- [ ] Add new subsection: "[Subsection Name]"
- [ ] Update existing content: "[What to update]"
- [ ] Add example from: `src/pages/ProductDetail.tsx:45-67`
- [ ] Add reference link: [URL]

**Example Code:**
\`\`\`typescript
// Real example from codebase
[code snippet]
\`\`\`

**Validation:**
- [x] Example verified and works
- [x] No duplicates found in file
- [x] Consistent with existing format
- [x] Markdown formatting valid
- [x] Links are accessible

**Approval Required:**
- [ ] Approve this file/section
- [ ] Approve with modifications: [specify]
- [ ] Request more research
- [ ] Reject

---

#### File: `docs/CONCEPTS_COMPARISON.md`
**Section:** "[Section Name]"

**Changes:**
[Same format as above]

**Approval Required:**
- [ ] Approve this file/section
- [ ] Approve with modifications: [specify]
- [ ] Request more research
- [ ] Reject
```

### Phase 4: Conflict Resolution

**When Research Conflicts with Existing Patterns:**

```markdown
## ⚠️ Pattern Conflict Detected

**Existing Pattern:** [Current pattern in documentation]
**New Research Finding:** [Conflicting finding]

### Option 1: Update to New Pattern
**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

**Research Support:** [Sources]

### Option 2: Keep Existing Pattern
**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

**Research Support:** [Sources]

### Option 3: Document Both Patterns
**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

**Research Support:** [Sources]

### Recommendation:
[AI's recommendation with reasoning]

**Your Choice:**
- [ ] Option 1
- [ ] Option 2
- [ ] Option 3
- [ ] Custom solution: [specify]
```

### Phase 5: Validation & Approval

**Pre-Approval Validation:**
- ✅ All examples tested and working
- ✅ No duplicate content found
- ✅ Consistent with existing format
- ✅ Markdown formatting valid
- ✅ All links accessible
- ✅ Version history entry prepared

**Approval Process:**
1. AI presents proposal per-file/section
2. User reviews each proposal
3. User approves/rejects/modifies per-file/section
4. AI applies only approved changes
5. AI updates version history inline

### Phase 6: Integration

**After Approval:**
1. Apply changes to approved files/sections
2. Add version history entry (inline)
3. Update cross-references if needed
4. Validate final state
5. Confirm completion

### Phase 7: Automatic Synchronization

**After Approval and Integration:**

1. **Update Source File** (`docs/[filename].md`)
   - Apply approved changes to source location
   - Update version history inline

2. **Automatic Sync to `docs/all-docs/`**
   - AI automatically runs sync script: `powershell -ExecutionPolicy Bypass -File docs/sync-docs.ps1`
   - Or prompts user to run sync if automatic execution fails
   - Ensures `docs/all-docs/` always has latest version
   - Both locations stay synchronized

3. **Verification**
   - Confirm both files are identical
   - Verify version history in both locations
   - Confirm INDEX.md is updated if needed

**Sync Script Location:** `docs/sync-docs.ps1`

**Manual Sync Command:**
```powershell
powershell -ExecutionPolicy Bypass -File docs/sync-docs.ps1
```

**Important:**
- Source of truth: `docs/` folder (always edit here)
- Sync target: `docs/all-docs/` folder (for Cursor @Folders)
- Never edit files directly in `docs/all-docs/` - always edit in `docs/` and sync

---

## 📋 Master Prompts Evolution Rules

### MASTER_TYPESCRIPT_PATTERNS_PROMPT.md
**Update Triggers:**
- TypeScript patterns change
- New utility types used
- Type guards added
- @ts-ignore removed
- Type definitions created

**Research Focus:**
- TypeScript official documentation
- React TypeScript patterns
- Type safety best practices
- Utility type patterns

**Add:**
- Real examples from codebase
- New type patterns discovered
- Type guard patterns
- Generic type examples

### MASTER_REFACTORING_PROMPT.md
**Update Triggers:**
- Refactoring patterns emerge
- Component extraction patterns
- New hooks created
- Service layer patterns
- File organization changes

**Research Focus:**
- React best practices
- Refactoring patterns
- Code organization
- Component composition

**Add:**
- Before/after examples
- Phased refactoring approaches
- Hook extraction patterns
- Service layer examples

### MASTER_UI_UX_PROMPT.md
**Update Triggers:**
- UI patterns change
- Accessibility improvements
- Animation patterns
- Theme integration
- Performance optimizations

**Research Focus:**
- WCAG guidelines
- Modern UI patterns
- Accessibility best practices
- Animation performance

**Add:**
- Component optimization patterns
- Theme integration examples
- Accessibility patterns
- Animation examples

### CONCEPTS_COMPARISON.md
**Update Triggers:**
- New X vs Y patterns discovered
- Pattern conflicts resolved
- Best practices updated
- Framework changes

**Research Focus:**
- Current industry standards
- Framework documentation
- Pattern comparisons
- Best practice evolution

**Add:**
- New comparison entries
- Updated recommendations
- Pattern conflict resolutions
- Real-world examples

---

## 📅 Version History Format (Inline)

Each master prompt should include this section at the end:

```markdown
---

## 📅 Version History

### [YYYY-MM-DD] - Version [X.X]
**Trigger:** [What caused the update - e.g., "Fixed @ts-ignore removal pattern"]
**Files Changed:** [List code files that triggered this]
**Research Sources:** [5+ sources consulted]
- [Source 1](URL)
- [Source 2](URL)
- [Source 3](URL)
- [Source 4](URL)
- [Source 5](URL)

**Changes Made:**
- Added section: "[Section Name]"
- Updated section: "[Section Name]"
- Added example from: `src/pages/ProductDetail.tsx:45-67`
- Added reference: [URL]

**Examples Added:**
- `src/pages/ProductDetail.tsx` - Type definition pattern
- `src/types/modules.d.ts` - Module declaration pattern

**Pattern Documented:**
[Brief description of the pattern/solution documented]

---

### [Previous Version Entry]
[Same format]
```

---

## ✅ Validation Checklist

Before proposing ANY update:

- [ ] **Examples Work**: All code examples tested and functional
- [ ] **No Duplicates**: Checked existing content for duplicates
- [ ] **Consistency**: Matches existing format and style
- [ ] **Markdown Valid**: Properly formatted, no broken syntax
- [ ] **Links Valid**: All URLs accessible and relevant
- [ ] **Research Backed**: Minimum 5 authoritative sources
- [ ] **Current**: Uses 2024-2025 best practices
- [ ] **Relevant**: Directly applicable to codebase
- [ ] **Version History**: Entry prepared and formatted
- [ ] **Cross-References**: Updated if needed

---

## 🚀 Integration Points

### Automatic Detection
AI monitors all code changes and automatically:
1. Detects patterns, fixes, improvements
2. Researches best practices (5+ sources)
3. Proposes documentation updates
4. Requests per-file/section approval
5. Applies approved changes
6. Updates version history

### Troubleshooting Integration

**If AI struggles with code fixes:**
- After 3 failed attempts, AI will ask for manual update
- User can update files directly
- AI will then log the successful fix in troubleshooting log
- This prevents endless fix loops
- See `AI_AGENT_DOCUMENTATION_RULES.md` for detailed troubleshooting rules

### Manual Trigger
```markdown
@DOCUMENTATION_EVOLUTION_SYSTEM.md

I just [description of change].
Please:
1. Research current best practices (5+ sources)
2. Propose documentation updates per-file/section
3. Validate all examples
4. Request approval for each file/section
```

### After Code Changes
When you make code changes, AI automatically:
1. Analyzes the change
2. Researches best practices
3. Proposes documentation updates
4. Waits for your approval
5. Applies approved changes

---

## 📊 Quality Metrics

**Track:**
- Documentation coverage (% of patterns documented)
- Example accuracy (all examples work)
- Research freshness (last updated dates)
- Approval rate per file/section
- Consistency score across files
- Version history completeness

**Goals:**
- 100% pattern coverage
- 100% example accuracy
- All updates research-backed (5+ sources)
- Consistent formatting across all files
- Complete version history

---

## 🔗 Related Files

- `AI_AGENT_DOCUMENTATION_RULES.md` - Mandatory AI behavior rules
- `MASTER_TYPESCRIPT_PATTERNS_PROMPT.md` - TypeScript patterns
- `MASTER_REFACTORING_PROMPT.md` - Refactoring patterns
- `MASTER_UI_UX_PROMPT.md` - UI/UX patterns
- `CONCEPTS_COMPARISON.md` - X vs Y comparisons

---

**Last Updated:** 2025-01-27
**System Version:** 1.0.0

