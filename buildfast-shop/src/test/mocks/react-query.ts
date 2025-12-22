/**
 * React Query Mock Utilities
 * 
 * Helpers for mocking React Query hooks in tests.
 */

import { vi } from 'vitest'

/**
 * Mock useQuery hook
 */
export function mockUseQuery(data: unknown, isLoading = false, error: unknown = null) {
  return vi.fn().mockReturnValue({
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: vi.fn().mockResolvedValue({ data, error }),
  })
}

/**
 * Mock useMutation hook
 */
export function mockUseMutation() {
  return vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({ data: null, error: null }),
    isLoading: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  })
}

