/**
 * useAuth Hook
 *
 * Hook for accessing authentication context.
 * Must be used within an AuthProvider.
 *
 * @throws {Error} If used outside AuthProvider
 * @returns AuthContextType
 */

import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '../contexts/AuthContext'

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
