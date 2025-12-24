/**
 * useCheckoutRealtime Hook
 *
 * Manages real-time subscriptions for cart items, addresses, and products during checkout.
 */

import { useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  menu_item_id?: string
  product_id?: string
  resolvedProduct?: { id?: string } | null
  resolvedProductType?: 'menu_item' | 'dish' | 'legacy' | null
}

interface UseCheckoutRealtimeOptions {
  cartItems: CartItem[]
  user: { id: string } | null
  showPayment: boolean
  showSuccessModal: boolean
  placingOrder: boolean
  refetchCart?: () => void
  refetchAddresses?: () => void
  onProductUpdate?: (payload: unknown) => void
}

/**
 * Hook for managing real-time subscriptions in checkout
 */
export function useCheckoutRealtime({
  cartItems,
  user,
  showPayment,
  showSuccessModal,
  placingOrder,
  refetchCart,
  refetchAddresses,
  onProductUpdate,
}: UseCheckoutRealtimeOptions) {
  const channelsRef = useRef<Array<ReturnType<typeof supabase.channel>>>([])

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return
    if (showPayment || showSuccessModal || placingOrder) return

    const menuItemIds = [
      ...new Set(
        cartItems
          .filter(item => item.menu_item_id || item.resolvedProductType === 'menu_item')
          .map(item => item.menu_item_id || item.resolvedProduct?.id)
          .filter(Boolean)
      ),
    ]

    const dishIds = [
      ...new Set(
        cartItems
          .filter(item => item.product_id || item.resolvedProductType === 'dish')
          .map(item => item.product_id || item.resolvedProduct?.id)
          .filter(Boolean)
      ),
    ]

    const productIds = [
      ...new Set(
        cartItems
          .filter(item => item.product_id || item.resolvedProductType === 'legacy')
          .map(item => item.product_id || item.resolvedProduct?.id)
          .filter(Boolean)
      ),
    ]

    const channels: Array<ReturnType<typeof supabase.channel>> = []

    // Subscribe to menu_items updates
    if (menuItemIds.length > 0) {
      try {
        const menuItemsSet = new Set(menuItemIds.map(id => String(id)))
        const menuItemsChannel = supabase
          .channel('checkout-menu-items-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'menu_items',
            },
            async payload => {
              const itemId = String(payload.new?.id || payload.old?.id)
              if (!menuItemsSet.has(itemId)) return

              logger.log('Menu item updated in checkout:', payload)

              const oldPrice = payload.old?.price
              const newPrice = payload.new?.price

              if (oldPrice !== newPrice) {
                toast('Price updated for an item in your cart', {
                  icon: '💰',
                  duration: 4000,
                })
              }

              if (payload.new?.is_available === false) {
                toast.error('An item in your cart is no longer available', {
                  icon: '⚠️',
                  duration: 5000,
                })
              }

              if (refetchCart) {
                setTimeout(() => {
                  refetchCart()
                }, 500)
              }

              if (onProductUpdate) {
                onProductUpdate(payload)
              }
            }
          )
          .subscribe(status => {
            if (status === 'CHANNEL_ERROR') {
              logger.warn(
                'Real-time subscription error for menu_items (table might not exist or real-time not enabled)'
              )
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for menu_items - retrying...')
              setTimeout(() => {
                try {
                  menuItemsChannel.subscribe()
                } catch (retryErr) {
                  logger.warn('Failed to retry menu_items subscription:', retryErr)
                }
              }, 2000)
            }
          })

        channels.push(menuItemsChannel)
      } catch (err) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err.code === '42P01' ||
            ('message' in err && err instanceof Error
              ? err instanceof Error
                ? err instanceof Error
                  ? err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err instanceof Error
                                        ? err.message
                                        : String(err)
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                  : String(err)
                : String(err)
              : String(err) &&
                String(
                  err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err instanceof Error
                                        ? err instanceof Error
                                          ? err instanceof Error
                                            ? err instanceof Error
                                              ? err.message
                                              : String(err)
                                            : String(err)
                                          : String(err)
                                        : String(err)
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                ).includes('does not exist')))
        ) {
          logger.warn(
            'menu_items table does not exist or real-time not enabled - skipping subscription'
          )
        } else {
          logger.warn('Failed to subscribe to menu_items updates:', err)
        }
      }
    }

    // Subscribe to menu_items updates
    if (dishIds.length > 0) {
      try {
        const menuItemsSet = new Set(dishIds.map(id => String(id)))
        const menuItemsChannel = supabase
          .channel('checkout-menu-items-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'menu_items',
            },
            async payload => {
              const itemId = String(payload.new?.id || payload.old?.id)
              if (!menuItemsSet.has(itemId)) return

              logger.log('Menu item updated in checkout:', payload)

              const oldPrice = payload.old?.price
              const newPrice = payload.new?.price

              if (oldPrice !== newPrice) {
                toast('Price updated for an item in your cart', {
                  icon: '💰',
                  duration: 4000,
                })
              }

              if (payload.new?.is_available === false) {
                toast.error('An item in your cart is no longer available', {
                  icon: '⚠️',
                  duration: 5000,
                })
              }

              if (refetchCart) {
                setTimeout(() => {
                  refetchCart()
                }, 500)
              }

              if (onProductUpdate) {
                onProductUpdate(payload)
              }
            }
          )
          .subscribe(status => {
            if (status === 'CHANNEL_ERROR') {
              logger.warn(
                'Real-time subscription error for menu_items (table might not exist or real-time not enabled)'
              )
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for menu_items - retrying...')
              setTimeout(() => {
                try {
                  menuItemsChannel.subscribe()
                } catch (retryErr) {
                  logger.warn('Failed to retry menu_items subscription:', retryErr)
                }
              }, 2000)
            }
          })

        channels.push(menuItemsChannel)
      } catch (err) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err.code === '42P01' ||
            ('message' in err && err instanceof Error
              ? err instanceof Error
                ? err instanceof Error
                  ? err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err instanceof Error
                                        ? err.message
                                        : String(err)
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                  : String(err)
                : String(err)
              : String(err) &&
                String(
                  err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err instanceof Error
                                        ? err instanceof Error
                                          ? err instanceof Error
                                            ? err instanceof Error
                                              ? err.message
                                              : String(err)
                                            : String(err)
                                          : String(err)
                                        : String(err)
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                ).includes('does not exist')))
        ) {
          logger.warn(
            'menu_items table does not exist or real-time not enabled - skipping subscription'
          )
        } else {
          logger.warn('Failed to subscribe to menu_items updates:', err)
        }
      }
    }

    // Subscribe to products updates (legacy)
    if (productIds.length > 0) {
      try {
        const productsSet = new Set(productIds.map(id => String(id)))
        const productsChannel = supabase
          .channel('checkout-products-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'menu_items',
            },
            async payload => {
              const itemId = String(payload.new?.id || payload.old?.id)
              if (!productsSet.has(itemId)) return

              logger.log('Product updated in checkout:', payload)

              if (refetchCart) {
                setTimeout(() => {
                  refetchCart()
                }, 500)
              }

              if (onProductUpdate) {
                onProductUpdate(payload)
              }
            }
          )
          .subscribe(status => {
            if (status === 'CHANNEL_ERROR') {
              logger.warn(
                'Real-time subscription error for products (table might not exist or real-time not enabled)'
              )
            }
          })

        channels.push(productsChannel)
      } catch (err) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err.code === '42P01' ||
            ('message' in err && err instanceof Error
              ? err instanceof Error
                ? err instanceof Error
                  ? err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err instanceof Error
                                        ? err.message
                                        : String(err)
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                  : String(err)
                : String(err)
              : String(err) &&
                String(
                  err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err instanceof Error
                                        ? err instanceof Error
                                          ? err instanceof Error
                                            ? err instanceof Error
                                              ? err.message
                                              : String(err)
                                            : String(err)
                                          : String(err)
                                        : String(err)
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                ).includes('does not exist')))
        ) {
          logger.warn(
            'products table does not exist or real-time not enabled - skipping subscription'
          )
        } else {
          logger.warn('Failed to subscribe to products updates:', err)
        }
      }
    }

    channelsRef.current = channels

    return () => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel)
        } catch (err) {
          logger.warn('Error removing real-time channel:', err)
        }
      })
    }
  }, [cartItems, showPayment, showSuccessModal, placingOrder, refetchCart, onProductUpdate])

  // Subscribe to addresses updates
  useEffect(() => {
    if (!user) return
    if (showPayment || showSuccessModal || placingOrder) return

    try {
      const addressesChannel = supabase
        .channel('checkout-addresses-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'addresses',
            filter: `user_id=eq.${user.id}`,
          },
          async payload => {
            logger.log('Address updated in real-time:', payload)

            if (refetchAddresses) {
              setTimeout(() => {
                refetchAddresses()
              }, 500)
            }
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            logger.warn(
              'Real-time subscription error for addresses (table might not exist or real-time not enabled)'
            )
          } else if (status === 'TIMED_OUT') {
            logger.warn('Real-time subscription timed out for addresses - retrying...')
            setTimeout(() => {
              try {
                addressesChannel.subscribe()
              } catch (retryErr) {
                logger.warn('Failed to retry addresses subscription:', retryErr)
              }
            }, 2000)
          }
        })

      return () => {
        try {
          supabase.removeChannel(addressesChannel)
        } catch (err) {
          logger.warn('Error removing addresses channel:', err)
        }
      }
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err.code === '42P01' ||
          ('message' in err && err instanceof Error
            ? err instanceof Error
              ? err instanceof Error
                ? err instanceof Error
                  ? err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err.message
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                  : String(err)
                : String(err)
              : String(err)
            : String(err) &&
              String(
                err instanceof Error
                  ? err instanceof Error
                    ? err instanceof Error
                      ? err instanceof Error
                        ? err instanceof Error
                          ? err instanceof Error
                            ? err instanceof Error
                              ? err instanceof Error
                                ? err instanceof Error
                                  ? err instanceof Error
                                    ? err instanceof Error
                                      ? err instanceof Error
                                        ? err instanceof Error
                                          ? err instanceof Error
                                            ? err.message
                                            : String(err)
                                          : String(err)
                                        : String(err)
                                      : String(err)
                                    : String(err)
                                  : String(err)
                                : String(err)
                              : String(err)
                            : String(err)
                          : String(err)
                        : String(err)
                      : String(err)
                    : String(err)
                  : String(err)
              ).includes('does not exist')))
      ) {
        logger.warn(
          'addresses table does not exist or real-time not enabled - skipping subscription'
        )
      } else {
        logger.warn('Failed to subscribe to addresses updates:', err)
      }
      return undefined
    }
  }, [user, showPayment, showSuccessModal, placingOrder, refetchAddresses])
}
