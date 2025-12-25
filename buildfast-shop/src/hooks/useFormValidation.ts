import { useState, useCallback } from 'react'

type ValidationRule<T> = (value: T) => string | null

interface UseFormValidationOptions<T extends Record<string, unknown>> {
  initialValues: T
  validationRules: Partial<Record<keyof T, ValidationRule<unknown>>>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  handleChange: (
    field: keyof T
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleBlur: (field: keyof T) => () => void
  validateAll: () => boolean
  setValues: React.Dispatch<React.SetStateAction<T>>
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
  reset: () => void
}

/**
 * useFormValidation Hook
 *
 * Real-time form validation with immediate feedback.
 * Based on UX best practices:
 * - Immediate feedback as users type
 * - Clear, specific error messages
 * - Accessible error handling
 */
export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  validationRules,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback(
    (field: keyof T, value: unknown): string | null => {
      const rule = validationRules[field]
      if (!rule) return null
      return rule(value)
    },
    [validationRules]
  )

  const handleChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setValues(prev => ({ ...prev, [field]: newValue }))

      // Real-time validation on change
      if (validateOnChange) {
        const error = validateField(field, newValue)
        setErrors(prev => ({ ...prev, [field]: error || undefined }))
      }
    },
    [validateField, validateOnChange]
  )

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched(prev => ({ ...prev, [field]: true }))
      if (validateOnBlur) {
        const error = validateField(field, values[field])
        setErrors(prev => ({ ...prev, [field]: error || undefined }))
      }
    },
    [values, validateField, validateOnBlur]
  )

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    Object.keys(validationRules).forEach(key => {
      const field = key as keyof T
      const error = validateField(field, values[field])
      if (error) {
        newErrors[field] = error
        setTouched(prev => ({ ...prev, [field]: true }))
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validateField, validationRules])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setValues,
    setErrors,
    reset,
  }
}
