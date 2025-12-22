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
      result.current[1].toggle()
    })

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1].toggle()
    })

    expect(result.current[0]).toBe(false)
  })

  it('should set to true', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[1].setTrue()
    })

    expect(result.current[0]).toBe(true)
  })

  it('should set to false', () => {
    const { result } = renderHook(() => useToggle(true))

    act(() => {
      result.current[1].setFalse()
    })

    expect(result.current[0]).toBe(false)
  })

  it('should maintain state across renders', () => {
    const { result, rerender } = renderHook(() => useToggle(false))

    act(() => {
      result.current[1].setTrue()
    })

    rerender()

    expect(result.current[0]).toBe(true)
  })
})

