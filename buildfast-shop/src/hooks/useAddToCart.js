import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { addToGuestCart } from '../lib/guestSessionUtils'
import { addProductToCart } from '../lib/cartUtils'
import { logger } from '../utils/logger'

/**
 * Custom hook for adding items to cart
 *
 * Returns:
 * - addToCart: Function to add/update cart item
 * - addingToCart: Boolean indicating if operation is in progress
 * - message: Success or error message (null if none)
 *
 * @param {string} returnPath - Path to return to after login if needed
 * @returns {{ addToCart: Function, addingToCart: boolean, message: string|null }}
 */
export const useAddToCart = (_returnPath = '/products') => {
  const { user } = useAuth()
  const _navigate = useNavigate()
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success') // 'success' or 'error'

  const clearMessage = () => {
    setMessage(null)
    setMessageType('success')
  }

  const addToCart = async (product, options = {}) => {
    const { preventDefault = false, stopPropagation = false, event } = options

    if (preventDefault && event) {
      event.preventDefault()
    }
    if (stopPropagation && event) {
      event.stopPropagation()
    }

    const isMenuItem =
      product?.isMenuItem ??
      (product?.category_id !== undefined && product?.is_available !== undefined)
    // Note: menu_items doesn't have stock_quantity, use is_available instead
    const _isAvailable = product?.is_available !== false
    // For non-menu items, check if stock_quantity exists (legacy products table)
    const hasFiniteStock = product?.stock_quantity !== null && product?.stock_quantity !== undefined
    const isOutOfStock = isMenuItem
      ? product?.is_available === false
      : hasFiniteStock && product?.stock_quantity === 0

    if (!product || isOutOfStock) {
      setMessage('This product is out of stock')
      setMessageType('error')
      setTimeout(() => clearMessage(), 5000)
      return
    }

    try {
      setAddingToCart(true)
      clearMessage()

      if (!user) {
        addToGuestCart(product, 1, { isMenuItem })
        setMessage('Added to cart!')
        setMessageType('success')
        setTimeout(() => clearMessage(), 5000)
        return
      }

      const result = await addProductToCart(product, user.id)

      if (result.stockExceeded) {
        const limit = result.stockLimit ?? 0
        setMessage(
          limit > 0 ? `Only ${limit} item(s) available in stock` : 'This product is out of stock'
        )
        setMessageType('error')
        setTimeout(() => clearMessage(), 5000)
        return
      }

      if (result.error) {
        throw result.error
      }

      setMessage('Added to cart!')
      setMessageType('success')
      setTimeout(() => clearMessage(), 5000)
    } catch (err) {
      logger.error('Error adding to cart:', err)
      setMessage('Failed to add product to cart. Please try again.')
      setMessageType('error')
      setTimeout(() => clearMessage(), 5000)
    } finally {
      setAddingToCart(false)
    }
  }

  return {
    addToCart,
    addingToCart,
    message,
    messageType,
    clearMessage,
  }
}
