/**
 * Type declarations for addresses API
 */
export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressResult {
  success: boolean;
  data?: Address | Address[];
  error?: any;
}

export function fetchUserAddresses(userId: string): Promise<AddressResult>;
export function createAddress(userId: string, address: Partial<Address>): Promise<AddressResult>;
export function updateAddress(addressId: string, updates: Partial<Address>): Promise<AddressResult>;
export function deleteAddress(addressId: string): Promise<AddressResult>;
export function setDefaultAddress(addressId: string, userId: string): Promise<AddressResult>;

