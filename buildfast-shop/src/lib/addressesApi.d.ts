export interface Address {
  id: string
  userId: string
  label: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
  [key: string]: unknown
}

export interface AddressResult {
  success: boolean
  data?: Address[]
  error?: unknown
}

export function fetchUserAddresses(userId: string): Promise<AddressResult>
export function getDefaultAddress(
  userId: string
): Promise<{ success: boolean; data?: Address | null; error?: unknown }>
export function createAddress(
  address: Partial<Address>
): Promise<{ success: boolean; data?: Address; error?: unknown }>
export function updateAddress(
  addressId: string,
  address: Partial<Address>
): Promise<{ success: boolean; error?: unknown }>
export function deleteAddress(addressId: string): Promise<{ success: boolean; error?: unknown }>
export function setDefaultAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; data?: Address; error?: unknown }>
