# Phase 13: Testing Infrastructure Setup

## Overview

Comprehensive testing infrastructure setup following the MASTER_TESTING_PROMPT.md guidelines.

## Completed Setup

### 1. Vitest Configuration (`vitest.config.ts`)
- ✅ Configured with jsdom environment
- ✅ Path aliases (`@/` → `src/`)
- ✅ Coverage thresholds (80% for lines, functions, branches, statements)
- ✅ Test file patterns (`**/*.{test,spec}.{js,ts,jsx,tsx}`)
- ✅ Coverage exclusions (node_modules, dist, test files)

### 2. Test Setup File (`src/test/setup.ts`)
- ✅ Jest-DOM matchers imported
- ✅ Global mocks:
  - `window.matchMedia`
  - `IntersectionObserver`
  - `ResizeObserver`
  - `window.scrollTo`
  - `localStorage`
  - `sessionStorage`
- ✅ Cleanup after each test
- ✅ Mock reset before each test

### 3. Test Utilities (`src/test/utils.tsx`)
- ✅ `renderWithProviders` function with all providers:
  - BrowserRouter
  - QueryClientProvider
  - ThemeProvider
  - AuthProvider
- ✅ Test QueryClient with no retries and immediate GC
- ✅ Re-exports from @testing-library/react

### 4. Mock Utilities
- ✅ `src/test/mocks/supabase.ts` - Supabase client mocks
- ✅ `src/test/mocks/react-query.ts` - React Query hook mocks
- ✅ `src/test/index.ts` - Centralized exports

### 5. Example Tests Created
- ✅ `src/lib/validation.test.ts` - Validation utilities
- ✅ `src/pages/Checkout/utils/calculations.test.ts` - Checkout calculations
- ✅ `src/hooks/useToggle.test.ts` - useToggle hook

## Dependencies Installed

```json
{
  "@testing-library/react": "^latest",
  "@testing-library/jest-dom": "^latest",
  "@testing-library/user-event": "^latest",
  "jsdom": "^latest"
}
```

## Known Issues

### Windows Path Issue
There is a known issue with Vitest on Windows when the project path contains spaces (e.g., "build fast"). The test runner times out when starting worker threads/forks.

**Workaround Options:**
1. Move project to a path without spaces
2. Use `--no-isolate` flag (may have limitations)
3. Run tests in WSL (Windows Subsystem for Linux)
4. Use single-threaded mode (slower but more reliable)

**Temporary Solution:**
The testing infrastructure is fully configured and ready. Tests can be run once the path issue is resolved or when using alternative environments.

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/lib/validation.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Structure

```
src/
  test/
    setup.ts          # Global test setup
    utils.tsx         # Test utilities and renderWithProviders
    mocks/
      supabase.ts     # Supabase mocks
      react-query.ts  # React Query mocks
    index.ts          # Centralized exports
  lib/
    validation.test.ts
  hooks/
    useToggle.test.ts
  pages/
    Checkout/
      utils/
        calculations.test.ts
```

## Next Steps

1. **Resolve Windows Path Issue**: Move project or use alternative test runner
2. **Add More Tests**: 
   - Component tests for UI components
   - Integration tests for features
   - Hook tests for all custom hooks
3. **CI/CD Integration**: Add test step to CI pipeline
4. **Coverage Reports**: Set up coverage reporting in CI

## Testing Best Practices

1. **Test User Behavior**: Focus on what users see and do
2. **Accessibility First**: Test with accessibility in mind
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Isolated Tests**: Each test should be independent
5. **Mock Strategically**: Mock external dependencies, not internal logic

## Coverage Targets

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

