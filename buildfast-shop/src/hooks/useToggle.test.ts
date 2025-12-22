/**
 * useToggle Hook Tests
 * 
 * Unit tests for useToggle hook.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToggle } from './useToggle'

describe('useToggle', () => {
  beforeEach(() => {
    // Reset before each test
  })

  it('should initialize with default value', () => {
    const { result } = renderHook(() => useToggle(false))

    expect(result.current[0]).toBe(false)
  })

  it('should initialize with true', () => {
    const { result } = renderHook(() => useToggle(true))

    expect(result.current[0]).toBe(true)
  })

  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[1]() // toggle is result.current[1]
    })

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1]() // toggle again
    })

    expect(result.current[0]).toBe(false)
  })

  it('should set to true', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[2]() // setTrue is result.current[2]
    })

    expect(result.current[0]).toBe(true)
  })

  it('should set to false', () => {
    const { result } = renderHook(() => useToggle(true))

    act(() => {
      result.current[3]() // setFalse is result.current[3]
    })

    expect(result.current[0]).toBe(false)
  })

  it('should maintain state across renders', () => {
    const { result, rerender } = renderHook(() => useToggle(false))

    act(() => {
      result.current[2]() // setTrue is result.current[2]
    })

    rerender()

    expect(result.current[0]).toBe(true)
  })
})

