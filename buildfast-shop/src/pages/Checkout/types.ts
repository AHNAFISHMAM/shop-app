/**
 * Checkout Types
 */

export interface ShippingAddress {
  fullName: string
  streetAddress: string
  city: string
  stateProvince: string
  postalCode: string
  country: string
  phoneNumber: string
}

export type FulfillmentMode = 'delivery' | 'pickup'
export type ScheduledSlot = 'asap' | string

export interface CheckoutState {
  // Guest checkout
  guestEmail: string
  showConversionModal: boolean
  guestCheckoutData: unknown | null
  continueAsGuest: boolean
  
  // Fulfillment
  fulfillmentMode: FulfillmentMode
  scheduledSlot: ScheduledSlot
  
  // Address
  selectedSavedAddress: unknown | null
  useManualAddress: boolean
  shippingAddress: ShippingAddress
  
  // Order
  placingOrder: boolean
  orderSuccess: boolean
  orderError: string
  
  // Payment
  showPayment: boolean
  clientSecret: string
  createdOrderId: string | null
  showSuccessModal: boolean
  
  // Order details
  showOrderNote: boolean
  orderNote: string
  
  // Loyalty
  showRewardsPanel: boolean
  trackingStatus: unknown | null
  
  // Marketing
  emailUpdatesOptIn: boolean
  smsUpdatesOptIn: boolean
  
  // Discount
  discountCodeInput: string
  appliedDiscountCode: unknown | null
  discountAmount: number
  discountError: string
  validatingDiscount: boolean
}

