/**
 * Type declarations for price utility functions
 */
export function getCurrencySymbol(currency: string): string;
export function parsePrice(price: number | string | null | undefined): number;
export function formatPrice(price: number | string | null | undefined, decimals?: number): string;
export function formatPriceWithCurrency(price: number | string, currency?: string, decimals?: number): string;
export function formatPriceForDB(price: number | string | null | undefined): number;

