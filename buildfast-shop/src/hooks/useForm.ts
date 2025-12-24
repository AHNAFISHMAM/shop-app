/**
 * useForm Hook
 *
 * Custom hook for managing form state, validation, and submission.
 * Provides real-time validation, error handling, and integration with React Query mutations.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { logError, getUserFriendlyError } from '../lib/error-handler'

/**
 * Form field validation function type
 */
export type FieldValidator<T = any> = (value: T) => string | null

/**
 * Form validation schema
 */
export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidator<T[K]> | FieldValidator<T[K]>[]
}

/**
 * Form options
 */
export interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T
  validationSchema?: ValidationSchema<T>
  onSubmit: (values: T) => Promise<void> | void
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnMount?: boolean
}

/**
 * Form state
 */
export interface FormState<T extends Record<string, any>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

/**
 * Form handlers
 */
export interface FormHandlers<T extends Record<string, any>> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  setError: <K extends keyof T>(field: K, error: string | null) => void
  setErrors: (errors: Partial<Record<keyof T, string>>) => void
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void
  handleBlur: <K extends keyof T>(field: K) => () => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
  resetErrors: () => void
  validate: () => boolean
  validateField: <K extends keyof T>(field: K) => string | null
}

/**
 * useForm hook return type
 */
export interface UseFormReturn<T extends Record<string, any>>
  extends FormState<T>, FormHandlers<T> {}

// Debounce utility removed - not used in current implementation

/**
 * useForm Hook
 *
 * Manages form state, validation, and submission.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationSchema: {
 *     email: validateEmailField,
 *     password: (p) => validatePassword(p).valid ? null : 'Invalid password'
 *   },
 *   onSubmit: async (values) => {
 *     await login(values.email, values.password)
 *   }
 * })
 * ```
 */
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const {
    initialValues,
    validationSchema,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
  } = options

  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isInitialMount = useRef(true)

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    <K extends keyof T>(field: K): string | null => {
      if (!validationSchema || !validationSchema[field]) {
        return null
      }

      const validator = validationSchema[field]
      const value = values[field]

      if (Array.isArray(validator)) {
        // Multiple validators
        for (const validate of validator) {
          const error = validate(value)
          if (error) return error
        }
        return null
      } else {
        // Single validator
        return validator(value)
      }
    },
    [values, validationSchema]
  )

  /**
   * Validate all fields
   */
  const validate = useCallback((): boolean => {
    if (!validationSchema) {
      return true
    }

    const newErrors: Partial<Record<keyof T, string>> = {}

    for (const field in validationSchema) {
      const error = validateField(field)
      if (error) {
        newErrors[field] = error
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [validationSchema, validateField])

  /**
   * Set field value
   */
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]): void => {
      setValuesState((prev: T) => ({ ...prev, [field]: value }))

      // Validate on change if enabled
      if (validateOnChange && touched[field]) {
        const error = validateField(field)
        setErrors((prev: Partial<Record<keyof T, string>>) => {
          if (error) {
            return { ...prev, [field]: error }
          } else {
            const newErrors = { ...prev }
            delete newErrors[field]
            return newErrors as Partial<Record<keyof T, string>>
          }
        })
      }
    },
    [validateOnChange, touched, validateField]
  )

  /**
   * Set multiple field values
   */
  const setValues = useCallback((newValues: Partial<T>): void => {
    setValuesState((prev: T) => ({ ...prev, ...newValues }))
  }, [])

  /**
   * Set field error
   */
  const setError = useCallback(<K extends keyof T>(field: K, error: string | null): void => {
    setErrors((prev: Partial<Record<keyof T, string>>) => {
      if (error) {
        return { ...prev, [field]: error }
      } else {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors as Partial<Record<keyof T, string>>
      }
    })
  }, [])

  /**
   * Set multiple errors
   */
  const setErrorsMultiple = useCallback((newErrors: Partial<Record<keyof T, string>>): void => {
    setErrors(newErrors)
  }, [])

  /**
   * Set touched state
   */
  const setTouchedField = useCallback(<K extends keyof T>(field: K, isTouched: boolean): void => {
    setTouched((prev: Partial<Record<keyof T, boolean>>) => ({ ...prev, [field]: isTouched }))
  }, [])

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    <K extends keyof T>(field: K) => {
      return (value: T[K]): void => {
        setValue(field, value)
      }
    },
    [setValue]
  )

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    <K extends keyof T>(field: K) => {
      return (): void => {
        setTouchedField(field, true)

        // Validate on blur if enabled
        if (validateOnBlur) {
          const error = validateField(field)
          setError(field, error)
        }
      }
    },
    [validateOnBlur, setTouchedField, validateField, setError]
  )

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      if (e) {
        e.preventDefault()
      }

      // Mark all fields as touched
      const allTouched: Partial<Record<keyof T, boolean>> = {}
      for (const field in initialValues) {
        allTouched[field] = true
      }
      setTouched(allTouched)

      // Validate all fields
      if (!validate()) {
        return
      }

      setIsSubmitting(true)

      try {
        await onSubmit(values)
      } catch (error) {
        logError(error, 'useForm.handleSubmit')
        // Set form-level error if no field-specific error
        const errorMessage = getUserFriendlyError(error)
        setError('form' as keyof T, errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit, initialValues, setError]
  )

  /**
   * Reset form to initial values
   */
  const reset = useCallback((): void => {
    setValuesState(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  /**
   * Reset errors only
   */
  const resetErrors = useCallback((): void => {
    setErrors({})
  }, [])

  // Validate on mount if enabled
  useEffect(() => {
    if (validateOnMount && isInitialMount.current) {
      isInitialMount.current = false
      validate()
    }
  }, [validateOnMount, validate])

  // Compute derived state
  const isValid = Object.keys(errors).length === 0
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setValue,
    setValues,
    setError,
    setErrors: setErrorsMultiple,
    setTouched: setTouchedField,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    resetErrors,
    validate,
    validateField,
  }
}
