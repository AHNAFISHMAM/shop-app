# 📚 MASTER PROMPTS DOCUMENTATION

This directory contains comprehensive master prompts for building production-grade applications. Each prompt provides a systematic, step-by-step workflow for specific development tasks.

---

## 🎯 Available Master Prompts

### 1. **UI/UX Development** (`MASTER_UI_UX_PROMPT.md`)
**Use for:** Building, refactoring, or replacing UI components and pages

**Covers:**
- Component and page-level development
- Design system enforcement
- Mobile-first responsive design
- Accessibility (WCAG 2.1/2.2)
- Performance optimization
- Browser compatibility
- Production-quality standards

**When to use:**
- Creating new UI components (DatePicker, Cards, Buttons, etc.)
- Building full page layouts (Dashboard, Profile, Home)
- Refactoring existing components
- Implementing data-heavy components (Tables, Charts, Forms)

---

### 2. **Supabase Database & RLS** (`MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`)
**Use for:** Database schema design, migrations, and security

**Covers:**
- Schema design and planning
- Migration creation
- Row-Level Security (RLS) policies
- Query optimization
- Real-time setup
- TypeScript type generation
- Security best practices

**When to use:**
- Creating new database tables
- Writing migrations
- Implementing RLS policies
- Optimizing database queries
- Setting up real-time subscriptions

---

### 3. **Data Fetching & React Query** (`MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md`)
**Use for:** Implementing data fetching with React Query

**Covers:**
- Query patterns (simple, nested, paginated)
- Mutation patterns with optimistic updates
- Cache management and invalidation
- Real-time cache synchronization
- Error handling and retry logic
- Performance optimization

**When to use:**
- Creating data fetching hooks
- Implementing mutations
- Managing cache invalidation
- Optimizing query performance
- Integrating real-time updates

---

### 4. **Form Handling & Validation** (`MASTER_FORM_HANDLING_VALIDATION_PROMPT.md`)
**Use for:** Building forms with validation

**Covers:**
- Single-step and multi-step forms
- Real-time validation with debouncing
- Field-level and form-level validation
- Error state management
- Integration with React Query mutations
- Accessibility in forms

**When to use:**
- Creating login/signup forms
- Building multi-step wizards
- Implementing complex forms
- Adding real-time validation
- Handling form submissions

---

### 5. **Custom Hooks Development** (`MASTER_CUSTOM_HOOKS_PROMPT.md`)
**Use for:** Building reusable custom hooks

**Covers:**
- Hook composition patterns
- Performance optimization (memoization)
- Error handling in hooks
- TypeScript typing for hooks
- Real-time hook patterns
- Cleanup and lifecycle management

**When to use:**
- Creating reusable data hooks
- Building real-time subscription hooks
- Implementing utility hooks
- Composing complex hooks
- Optimizing hook performance

---

### 6. **Real-time Subscriptions** (`MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md`)
**Use for:** Implementing real-time data synchronization

**Covers:**
- Supabase Realtime setup
- Channel management and cleanup
- Debounced cache invalidation
- Performance optimization
- Error recovery
- Mobile optimization (pause/resume)

**When to use:**
- Setting up real-time subscriptions
- Implementing live updates
- Syncing cache with real-time events
- Optimizing real-time performance

---

### 7. **Error Handling & Logging** (`MASTER_ERROR_HANDLING_LOGGING_PROMPT.md`)
**Use for:** Implementing error handling and logging

**Covers:**
- Error boundary patterns
- User-friendly error messages
- Error logging and tracking
- Network error handling
- Error recovery strategies
- Error state UI patterns

**When to use:**
- Implementing error boundaries
- Handling API errors
- Creating user-friendly error messages
- Setting up error logging
- Implementing error recovery

---

### 8. **Performance Optimization** (`MASTER_PERFORMANCE_OPTIMIZATION_PROMPT.md`)
**Use for:** Optimizing application performance

**Covers:**
- Component optimization
- Bundle size optimization
- Rendering optimization
- Image optimization
- Code splitting
- Core Web Vitals optimization

**When to use:**
- Optimizing slow components
- Reducing bundle size
- Improving Core Web Vitals
- Optimizing images
- Implementing code splitting

---

### 9. **TypeScript Patterns** (`MASTER_TYPESCRIPT_PATTERNS_PROMPT.md`)
**Use for:** TypeScript type safety and patterns

**Covers:**
- Type generation from schemas
- Utility types
- Type guards
- Generic types
- Discriminated unions
- Advanced TypeScript patterns

**When to use:**
- Generating types from database
- Creating type-safe utilities
- Implementing type guards
- Using advanced TypeScript features

---

### 10. **Code Refactoring & File Organization** (`MASTER_REFACTORING_PROMPT.md`)
**Use for:** Refactoring large files and organizing codebases

**Covers:**
- File identification and prioritization
- Dependency analysis and refactoring order
- Feature-based vs. shared component organization
- Backward compatibility strategies
- Performance optimization during refactoring
- Documentation and refactoring history
- Next.js App Router considerations

**When to use:**
- Refactoring large component files (>300 lines)
- Organizing monolithic page components
- Breaking down complex utility files
- Improving codebase structure
- Optimizing performance through refactoring
- Maintaining code quality and maintainability

---

## 🚀 Quick Start

1. **Identify your task** (e.g., "Create a new DatePicker component")
2. **Select the appropriate master prompt** (e.g., UI/UX Development)
3. **Follow the workflow** step-by-step
4. **Complete all checklists** before considering done
5. **Iterate based on feedback** using the iteration phase

---

## 📖 How to Use Master Prompts

### For New Features:
1. Read the relevant master prompt completely
2. Follow Phase 1: Research & Analysis
3. Follow Phase 2: Design & Planning
4. Follow Phase 3: Implementation
5. Follow Phase 4: Quality Assurance
6. Iterate based on feedback (Phase 5)

### For Refactoring:
1. Read the master prompt
2. Analyze existing implementation
3. Plan refactoring approach
4. Implement changes following the prompt
5. Verify no regressions
6. Complete all checklists

---

## 🎯 Master Prompt Structure

Each master prompt follows this structure:

1. **Overview** - What the prompt covers
2. **Core Principles** - Fundamental rules to follow
3. **Phase 1: Research & Analysis** - Understanding requirements
4. **Phase 2: Design & Planning** - Planning the implementation
5. **Phase 3: Implementation** - Building the feature
6. **Phase 4: Quality Assurance** - Testing and verification
7. **Phase 5: Iteration & Refinement** - Improving based on feedback
8. **Phase 6: Documentation** - Documenting the code
9. **Phase 7: Cleanup** - Removing old code (if applicable)
10. **Success Criteria** - Definition of done
11. **Common Pitfalls** - What to avoid

---

## 🔗 Cross-References

Master prompts are designed to work together:

- **UI/UX** + **TypeScript** = Type-safe components
- **Data Fetching** + **Supabase** = Secure data access
- **Forms** + **Error Handling** = Robust form validation
- **Custom Hooks** + **Real-time** = Live data hooks
- **Performance** + **All Prompts** = Optimized everything
- **Refactoring** + **All Prompts** = Clean, maintainable codebase

---

## 📝 Best Practices

1. **Read First**: Always read the entire master prompt before starting
2. **Follow Checklists**: Complete all checklists in order
3. **Don't Skip Steps**: Each phase builds on the previous
4. **Iterate**: Use Phase 5 to refine based on feedback
5. **Document**: Add JSDoc and inline comments as specified
6. **Test**: Complete all quality assurance steps
7. **Verify**: Ensure success criteria are met

---

## 🎓 Learning Path

**Beginner:**
1. Start with UI/UX Development
2. Learn TypeScript Patterns
3. Practice with Form Handling

**Intermediate:**
1. Master Data Fetching & React Query
2. Learn Custom Hooks Development
3. Implement Real-time Subscriptions

**Advanced:**
1. Deep dive into Supabase Database & RLS
2. Master Performance Optimization
3. Implement comprehensive Error Handling
4. Learn Code Refactoring & File Organization

---

## 🆘 Need Help?

If you're unsure which master prompt to use:

- **Building UI?** → UI/UX Development
- **Working with Database?** → Supabase Database & RLS
- **Fetching Data?** → Data Fetching & React Query
- **Creating Forms?** → Form Handling & Validation
- **Building Hooks?** → Custom Hooks Development
- **Real-time Updates?** → Real-time Subscriptions
- **Handling Errors?** → Error Handling & Logging
- **Optimizing?** → Performance Optimization
- **Type Safety?** → TypeScript Patterns
- **Refactoring Code?** → Code Refactoring & File Organization

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0

