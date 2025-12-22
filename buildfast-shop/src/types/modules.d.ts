// Type definitions for JavaScript modules without TypeScript

import React from 'react';

// StoreSettingsContext types
export interface StoreSettings {
  enable_reservations?: boolean;
  enable_menu_filters?: boolean;
  enable_quick_reorder?: boolean;
  enable_product_customization?: boolean;
  [key: string]: unknown;
}

export interface UpdateSettingsResponse {
  success: boolean;
  data?: StoreSettings;
  error?: string;
}

export interface StoreSettingsContextValue {
  settings: StoreSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<StoreSettings>) => Promise<UpdateSettingsResponse>;
  refreshSettings: () => Promise<void>;
  calculateShipping: (cartTotal: number) => number;
  calculateTax: (subtotal: number) => number;
  getCurrencySymbol: () => string;
  formatPrice: (amount: number) => string;
}

// guestSessionUtils types
export interface GuestCartItem {
  id: string;
  quantity: number;
  isMenuItem?: boolean;
  [key: string]: unknown;
}

export declare function addToGuestCart(
  item: { id: string; [key: string]: unknown },
  quantity: number,
  options?: { isMenuItem?: boolean }
): void;

// imageUtils types
export declare function generatePlaceholderImage(name: string): string;

// SEO component types
export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  [key: string]: unknown;
}

export declare const SEO: React.FC<SEOProps>;

// Menu hooks types
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  category_id: string;
  is_featured?: boolean;
  dietary_tags?: string[];
  dietaryTags?: string[];
  allergens?: string[];
  allergen_tags?: string[];
  allergen_info?: string;
  [key: string]: unknown;
}

export interface Category {
  id: string;
  name: string;
}

export interface UseMenuDataReturn {
  menuItems: MenuItem[];
  categories: Category[];
  loading: boolean;
  error: Error | null;
}

export interface UseCartCountOptions {
  user: { id: string } | null;
}

export interface UseCartCountReturn {
  cartCount: number;
}

export declare function useMenuData(): UseMenuDataReturn;
export declare function useCartCount(options: UseCartCountOptions): UseCartCountReturn;

// Menu components types
export interface MenuSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export interface CollapsibleSidebarProps {
  categories: Category[];
  menuItems: MenuItem[];
  selectedCategory: Category | null;
  onCategorySelect: (category: Category | null) => void;
  variant: 'desktop' | 'mobile';
  enableFilters?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  dietaryTags?: string[];
  activeDietaryTags?: string[];
  onDietaryToggle?: (tag: string) => void;
  allergenTags?: string[];
  activeAllergenTags?: string[];
  onAllergenToggle?: (tag: string) => void;
  quickReorderItems?: MenuItem[];
  onQuickReorder?: ((itemId: string) => void) | null;
}

export interface MenuReservationDrawerProps {
  open: boolean;
  onClose: () => void;
  cartCount: number;
}

export interface ProductCardProps {
  product: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  getImageUrl: (item: MenuItem) => string;
  enableCustomization?: boolean;
}

export declare const MenuSearchBar: React.FC<MenuSearchBarProps>;
export declare const CollapsibleSidebar: React.FC<CollapsibleSidebarProps>;
export declare const MenuReservationDrawer: React.FC<MenuReservationDrawerProps>;
export declare const ProductCard: React.FC<ProductCardProps>;

// Shared hooks
export declare function useTheme(): boolean;

// variantUtils types
export interface Variant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: string;
  price_modifier?: number;
  stock_quantity?: number;
  is_active: boolean;
  [key: string]: unknown;
}

export interface VariantResult {
  success: boolean;
  data?: Variant[];
  error?: Error;
}

export declare function getProductVariants(productId: string): Promise<VariantResult>;
export declare function getGroupedVariants(productId: string): Promise<{ success: boolean; data: Record<string, Variant[]> }>;
export declare function calculateVariantPrice(
  basePrice: number | string,
  variants: Variant[],
  selectedVariants: Record<string, string>
): number;

// variantCombinationsUtils types
export interface VariantCombination {
  id: string;
  product_id: string;
  variant_values: Record<string, string>;
  price: number;
  stock_quantity?: number;
  sku?: string;
  is_active: boolean;
  [key: string]: unknown;
}

export interface CombinationResult {
  success: boolean;
  data?: VariantCombination | VariantCombination[] | null;
  error?: Error;
}

export declare function getProductCombinations(productId: string): Promise<CombinationResult>;
export declare function findCombinationByValues(
  productId: string,
  variantValues: Record<string, string>
): Promise<CombinationResult>;
export declare function calculateCombinationPrice(
  basePrice: number | string,
  selectedVariants: Record<string, string>,
  combinations: VariantCombination[]
): number;

// favoritesUtils types
export interface FavoriteResult {
  success: boolean;
  data?: unknown;
  error?: Error;
  alreadyExists?: boolean;
  message?: string;
}

export declare function toggleFavorites(
  targetId: string,
  userId: string | null,
  options?: { isMenuItem?: boolean }
): Promise<FavoriteResult>;
export declare function isInFavorites(
  targetId: string,
  userId: string | null,
  options?: { isMenuItem?: boolean }
): Promise<boolean>;
export declare function addToFavorites(
  targetId: string,
  userId: string,
  options?: { isMenuItem?: boolean }
): Promise<FavoriteResult>;
export declare function removeFromFavorites(
  targetId: string,
  userId: string,
  options?: { isMenuItem?: boolean }
): Promise<FavoriteResult>;

// priceUtils types
export declare function getCurrencySymbol(): string;
export declare function formatPrice(amount: number, currency?: string): string;
export declare function parsePrice(price: number | string): number;

// messageUtils types
export interface MessageClearer {
  clear: () => void;
  scheduleClear: () => void;
}

export declare function createMessageClearer(
  setMessage: (message: string | null) => void,
  setMessageType?: ((type: string) => void) | null,
  delay?: number
): MessageClearer;

export declare function setMessageWithAutoClear(
  setMessage: (message: string | null) => void,
  setMessageType: (type: string) => void,
  message: string,
  type?: 'success' | 'error',
  delay?: number
): MessageClearer;

// Product hooks types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  image_url?: string;
  images?: string[];
  currency?: string;
  stock_quantity?: number;
  category_id?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseProductVariantsReturn {
  variants: Variant[];
  groupedVariants: Record<string, Variant[]>;
  combinations: VariantCombination[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export declare function useProduct(productId: string | undefined): UseProductReturn;
export declare function useProductVariants(productId: string | undefined): UseProductVariantsReturn;

// HomePage component types
export interface HeroProps {
  id?: string;
  title: string;
  subtitle: string;
  images: Array<{ src: string; alt: string }>;
  ctaButtons: Array<{ label: string; to: string; variant: 'primary' | 'outline' }>;
}

export interface TestimonialsProps {
  [key: string]: unknown;
}

export interface AmbienceUploaderProps {
  onUploadSuccess: (url: string) => void;
}

export interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ExperiencePulseProps {
  id?: string;
  [key: string]: unknown;
}

export declare const Hero: React.FC<HeroProps>;
export declare const Testimonials: React.FC<TestimonialsProps>;
export declare const AmbienceUploader: React.FC<AmbienceUploaderProps>;
export declare const SectionTitle: React.FC<SectionTitleProps>;
export declare const ExperiencePulse: React.FC<ExperiencePulseProps>;

// quoteBackgroundHelper types
export interface StoreSettingsWithQuote {
  hero_quote_bg_url?: string;
  [key: string]: unknown;
}

export declare function getQuoteBackgroundUrl(settings: StoreSettingsWithQuote | null): string;
export declare function getDefaultBackgroundUrl(): string;

// backgroundUtils types
export type BackgroundSection = 'hero' | 'gallery_section' | 'page' | 'hero_quote' | 'reservation_dark' | 'reservation_light';
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'none';

export interface BackgroundStyle {
  background?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: string;
  [key: string]: unknown;
}

export declare function getBackgroundStyle(settings: StoreSettings | null, section: BackgroundSection): BackgroundStyle;

// loyaltyUtils types
export interface LoyaltySnapshot {
  tier: string;
  currentPoints: number;
  nextTierThreshold: number;
  nextTierLabel: string;
  pointsMultiplier: number;
}

export interface Reward {
  id: string;
  label: string;
  cost: number;
}

export interface LoyaltyState extends LoyaltySnapshot {
  pointsEarnedThisOrder: number;
  projectedPoints: number;
  progressPercent: number;
  pointsToNextTier: number;
  redeemableRewards: Reward[];
  newlyUnlockedRewards: Reward[];
  rewardsCatalog: Reward[];
}

export interface ReferralInfo {
  code: string | null;
  shareUrl: string;
  headline: string;
  subcopy: string;
}

export declare function resolveLoyaltyState(orderTotal?: number): LoyaltyState;
export declare function resolveReferralInfo(user: { id: string; [key: string]: unknown } | null): ReferralInfo;

// OrderPage hooks types
export interface CartItem {
  id: string;
  product_id?: string | null;
  menu_item_id?: string | null;
  quantity: number;
  menu_items?: MenuItem | null;
  dishes?: unknown | null;
  resolvedProduct?: MenuItem | unknown | null;
  resolvedProductType?: 'menu_item' | 'dish' | 'legacy' | null;
  [key: string]: unknown;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  [key: string]: unknown;
}

export interface UseCartManagementReturn {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  handleUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  handleRemoveFromCart: (itemId: string) => Promise<void>;
  handleAddToCart: (meal: MenuItem, isMenuItem?: boolean) => Promise<void>;
}

export interface UseOrderFiltersReturn {
  searchQuery: string;
  selectedCategory: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setMinPrice: (price: string) => void;
  setMaxPrice: (price: string) => void;
  setSortBy: (sort: string) => void;
  sortedMeals: MenuItem[];
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
}

export interface UseFavoritesManagementReturn {
  favoriteItems: Set<string | number>;
  togglingFavorites: Record<string | number, boolean>;
  fetchFavoriteItems: () => Promise<void>;
  handleToggleFavorites: (e: React.MouseEvent, meal: MenuItem) => Promise<void>;
}

export interface UseMenuItemsReturn {
  meals: MenuItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface SectionConfig {
  section_key: string;
  section_name: string;
  is_available: boolean;
  display_order: number;
  [key: string]: unknown;
}

export interface UseSectionConfigsReturn {
  sectionConfigs: SectionConfig[];
  loading: boolean;
  error: Error | null;
}

export interface Category {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface UseMenuCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: Error | null;
}

export declare function useCartManagement(user: { id: string } | null): UseCartManagementReturn;
export declare function useOrderFilters(meals: MenuItem[]): UseOrderFiltersReturn;
export declare function useFavoritesManagement(user: { id: string } | null): UseFavoritesManagementReturn;
export declare function useMenuItems(): UseMenuItemsReturn;
export declare function useSectionConfigs(): UseSectionConfigsReturn;
export declare function useMenuCategories(): UseMenuCategoriesReturn;

// OrderPage component types
export interface CartSidebarProps {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  getImageUrl: (item: MenuItem) => string;
}

export interface CartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  cartSummary: CartSummary;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  getImageUrl: (item: MenuItem) => string;
}

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (price: string) => void;
  onMaxPriceChange: (price: string) => void;
  onApply: () => void;
  onClearAll: () => void;
}

export interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SectionContainerProps {
  allDishes: MenuItem[];
  sectionConfigs: SectionConfig[];
  onAddToCart: (meal: MenuItem) => Promise<void>;
  getImageUrl: (item: MenuItem) => string;
}

export interface OrderPageHeaderProps {
  user: { id: string; [key: string]: unknown } | null;
  onShowSignupModal: () => void;
}

export interface OrderPageFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categories: Category[];
  onMoreFilters: () => void;
  minPrice: string;
  maxPrice: string;
}

export interface OrderPageViewToggleProps {
  viewMode: 'sections' | 'grid';
  onViewModeChange: (mode: 'sections' | 'grid') => void;
}

export interface ActiveFiltersChipsProps {
  searchQuery: string;
  selectedCategory: string;
  minPrice: string;
  maxPrice: string;
  categories: Category[];
  onClearSearch: () => void;
  onClearCategory: () => void;
  onClearPrice: () => void;
  onClearAll: () => void;
}

export declare const CartSidebar: React.FC<CartSidebarProps>;
export declare const CartBottomSheet: React.FC<CartBottomSheetProps>;
export declare const FilterDrawer: React.FC<FilterDrawerProps>;
export declare const SignupPromptModal: React.FC<SignupPromptModalProps>;
export declare const SectionContainer: React.FC<SectionContainerProps>;
export declare const OrderPageHeader: React.FC<OrderPageHeaderProps>;
export declare const OrderPageFilters: React.FC<OrderPageFiltersProps>;
export declare const OrderPageViewToggle: React.FC<OrderPageViewToggleProps>;
export declare const ActiveFiltersChips: React.FC<ActiveFiltersChipsProps>;

// Menu utils types
export declare function getMealImage(item: MenuItem): string;

// AddressBook types
export interface Address {
  id: string | number;
  label?: string;
  isDefault?: boolean;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressFormData extends Partial<Address> {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AddressApiResult {
  success: boolean;
  data?: Address | Address[] | null;
  error?: Error;
  message?: string;
}

export interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (address: Address) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (address: Address) => void;
  'data-animate'?: string;
  'data-animate-active'?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: Address | null;
  onSave: (data: AddressFormData) => void | Promise<void>;
  loading?: boolean;
}

export declare function fetchUserAddresses(userId: string): Promise<AddressApiResult>;
export declare function getDefaultAddress(userId: string): Promise<AddressApiResult>;
export declare function createAddress(addressData: Partial<Address>): Promise<AddressApiResult>;
export declare function updateAddress(addressId: string | number, addressData: Partial<Address>): Promise<AddressApiResult>;
export declare function deleteAddress(addressId: string | number): Promise<AddressApiResult>;
export declare function setDefaultAddress(addressId: string | number, userId: string): Promise<AddressApiResult>;

export declare const AddressCard: React.FC<AddressCardProps>;
export declare const AddressModal: React.FC<AddressModalProps>;

// Admin page types
export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  subtitleColor?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  link?: string;
  loading?: boolean;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    label?: string;
  } | null;
  animationDelay?: number;
}

export interface RecentActivityProps {
  [key: string]: unknown;
}

export interface LowStockAlertsProps {
  [key: string]: unknown;
}

export type UseViewportAnimationTriggerReturn = React.RefCallback<HTMLElement>;

export interface UseCountUpOptions {
  duration?: number;
  start?: number;
  end: number;
  decimals?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
  onComplete?: () => void;
}

export interface UseCountUpReturn {
  count: number;
  isAnimating: boolean;
  start: () => void;
  reset: () => void;
}

export declare const StatCard: React.FC<StatCardProps>;
export declare const RecentActivity: React.FC<RecentActivityProps>;
export declare const LowStockAlerts: React.FC<LowStockAlertsProps>;
export declare function useViewportAnimationTrigger(): UseViewportAnimationTriggerReturn;
export declare function useCountUp(options: UseCountUpOptions): UseCountUpReturn;

// AboutPage types
export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  eyebrow?: string;
  [key: string]: unknown;
}

export interface GalleryCardProps {
  defaultImage: string;
  hoverImage?: string;
  effect?: string | string[] | Record<string, unknown> | null;
  effectVariants?: string | string[] | string[][] | unknown[];
  alt: string;
  caption?: string;
  [key: string]: unknown;
}

export interface ParsedEffect {
  [key: string]: unknown;
}

export interface EffectVariant {
  [key: string]: unknown;
}

export declare const SectionTitle: React.FC<SectionTitleProps>;
export declare const GalleryCard: React.FC<GalleryCardProps>;
export declare function parseEffects(effectString?: string | null): ParsedEffect | null;
export declare function parseEffectVariants(variantsString?: string | null, baseEffects?: ParsedEffect | null): EffectVariant[];

// ReservationsPage types
export interface ReservationSettings {
  opening_time: string;
  closing_time: string;
  time_slot_interval: number;
  max_capacity_per_slot: number;
  max_party_size: number;
  min_party_size: number;
  operating_days: number[];
  allow_same_day_booking: boolean;
  advance_booking_days: number;
  enabled_occasions: string[];
  enabled_preferences: string[];
  blocked_dates: string[];
  special_notice: string | null;
}

export interface ReservationSettingsResult {
  success: boolean;
  data?: ReservationSettings | null;
  error?: string | null;
}

export interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme?: () => void;
  setTheme?: (theme: 'light' | 'dark') => void;
  [key: string]: unknown;
}

export declare function getReservationSettings(): Promise<ReservationSettingsResult>;
export declare function useTheme(): ThemeContextValue;

// ContactPage types
export interface ConciergeBookingModalProps {
  open: boolean;
  onClose: () => void;
}

export declare const ConciergeBookingModal: React.FC<ConciergeBookingModalProps>;

// Animation variants types
export interface AnimationVariant {
  hidden: { opacity?: number; y?: number; scale?: number; [key: string]: unknown };
  visible: { opacity?: number; y?: number; scale?: number; [key: string]: unknown };
  exit?: { opacity?: number; y?: number; scale?: number; [key: string]: unknown };
  [key: string]: unknown;
}

export declare const fadeSlideDown: AnimationVariant;
export declare const batchFadeSlideUp: AnimationVariant;

// StarRating component types
export interface StarRatingProps {
  rating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
}
export declare const StarRating: React.FC<StarRatingProps>;

// Reviews API types
export interface FetchProductReviewsOptions {
  itemType?: 'product' | 'menu_item' | 'all';
  sortBy?: 'recent' | 'highest' | 'lowest';
  limit?: number;
  offset?: number;
  source?: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  review_text: string | null;
  review_images: string[] | null;
  user_id: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  product_id?: string | null;
  menu_item_id?: string | null;
  [key: string]: unknown;
}

export interface FetchProductReviewsResult {
  success: boolean;
  data: ProductReview[];
  error?: unknown;
  hasMore?: boolean;
}

export interface CreateReviewOptions {
  productId: string;
  itemType?: 'product' | 'menu_item' | 'all';
  orderId?: string;
  orderItemId?: string;
  rating: number;
  reviewText?: string;
  reviewImages?: string[];
  [key: string]: unknown;
}

export interface CreateReviewResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
  warning?: string;
}

export interface UploadReviewImageResult {
  success: boolean;
  url?: string;
  bucketMissing?: boolean;
  error?: Error;
}

export interface ProductRatingStats {
  success: boolean;
  averageRating: number;
  totalReviews: number;
  error?: unknown;
}

export interface RatingDistributionItem {
  rating: number;
  count: number;
  percentage: number;
}

export interface ProductRatingDistributionResult {
  success: boolean;
  data: RatingDistributionItem[];
  error?: unknown;
}

export declare function fetchProductReviews(
  itemId: string,
  options?: FetchProductReviewsOptions
): Promise<FetchProductReviewsResult>;
export declare function createReview(options: CreateReviewOptions): Promise<CreateReviewResult>;
export declare function uploadReviewImage(file: File): Promise<UploadReviewImageResult>;
export declare function getProductRatingStats(itemId: string): Promise<ProductRatingStats>;
export declare function getProductRatingDistribution(itemId: string): Promise<ProductRatingDistributionResult>;

// Guest cart utilities types
export interface GuestCartItem {
  id: string;
  quantity: number;
  [key: string]: unknown;
}
export declare function getGuestCart(): GuestCartItem[];

// Cart events types
export declare function onCartChanged(callback: () => void): () => void;
export declare function emitCartChanged(): void;

// Cart item metadata types
export interface CartItemMetadataResult {
  success: boolean;
  error?: unknown;
}
export interface SavedForLaterItem {
  id: string;
  savedAt: string;
  [key: string]: unknown;
}
export declare function getCartItemNote(itemId: string): string | null;
export declare function saveCartItemNote(itemId: string, note: string): CartItemMetadataResult;
export declare function saveItemForLater(item: { id: string; [key: string]: unknown }): CartItemMetadataResult;
export declare function saveSelectedReward(reward: unknown): CartItemMetadataResult;

// Favorites utilities types
export declare function getFavoritesCount(userId: string): Promise<number>;

// Favorites events types
export declare function onFavoritesChanged(callback: () => void): () => void;
export declare function emitFavoritesChanged(): void;

// Recently viewed utilities types
export interface RecentlyViewedItem {
  productId: string;
  itemType: string;
  timestamp: number;
}
export declare function getRecentlyViewed(): RecentlyViewedItem[];

// Background utilities types
export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'none';
  color?: string | null;
  gradient?: string | null;
  imageUrl?: string | null;
}
export interface BackgroundStyle {
  background?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  [key: string]: unknown;
}
export interface BackgroundValidation {
  isValid: boolean;
  errors: string[];
}
export declare function getBackgroundStyle(settings: Record<string, unknown>, section: string): BackgroundStyle;
export declare function getPresetPreview(preset: unknown): BackgroundStyle;
export declare function validateBackgroundConfig(config: BackgroundConfig): BackgroundValidation;
export declare function configToDbFormat(config: BackgroundConfig, section: string): Record<string, unknown>;
export declare function dbFormatToConfig(dbData: Record<string, unknown>, section: string): BackgroundConfig;

// Reservation utilities types
export interface ReservationSettings {
  id?: string;
  opening_time?: string;
  closing_time?: string;
  time_slot_interval?: number;
  allow_same_day_booking?: boolean;
  advance_booking_days?: number;
  operating_days?: number[];
  blocked_dates?: string[];
  [key: string]: unknown;
}
export interface ReservationSettingsResult {
  success: boolean;
  data: ReservationSettings | null;
  error: string | null;
}
export declare function getReservationSettings(): Promise<ReservationSettingsResult>;
export declare function generateTimeSlotsFromSettings(settings: ReservationSettings): string[];
export declare function isDateBlocked(date: string, blockedDates?: string[]): boolean;
export declare function isDayOperating(date: Date, operatingDays?: number[]): boolean;
export declare function getMinBookingDate(allowSameDayBooking?: boolean): Date;
export declare function getMaxBookingDate(advanceBookingDays?: number): Date;

// Component types
export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
}
export declare const QuantityStepper: React.FC<QuantityStepperProps>;

export interface ItemActionsProps {
  onRemove: () => void;
  onSaveForLater?: () => void;
  onAddNote?: (note: string) => void;
  itemName: string;
  hasNote?: boolean;
  showSaveForLater?: boolean;
}
export declare const ItemActions: React.FC<ItemActionsProps>;

export interface CustomDropdownProps {
  options?: Array<{ value: string | number; label: string }>;
  value?: string | number;
  onChange?: (event: { target: { value: string | number; name?: string } }) => void;
  placeholder?: string;
  [key: string]: unknown;
}
export declare const CustomDropdown: React.FC<CustomDropdownProps>;

export interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  [key: string]: unknown;
}
export declare const SignupPromptModal: React.FC<SignupPromptModalProps>;

export interface SwipeableCartItemProps {
  item: { id: string; quantity: number; [key: string]: unknown };
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  [key: string]: unknown;
}
export declare const SwipeableCartItem: React.FC<SwipeableCartItemProps>;

export interface EmptyCartStateProps {
  onBrowseMenu?: () => void;
  onViewFavorites?: () => void;
  hasFavorites?: boolean;
}
export declare const EmptyCartState: React.FC<EmptyCartStateProps>;

export interface CartTotalsProps {
  subtotal: number;
  shipping: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
  isLightTheme: boolean;
  [key: string]: unknown;
}
export declare const CartTotals: React.FC<CartTotalsProps>;

export interface LoyaltyCardProps {
  loyalty: unknown;
  isLightTheme: boolean;
  [key: string]: unknown;
}
export declare const LoyaltyCard: React.FC<LoyaltyCardProps>;

export interface CartSkeletonProps {
  count?: number;
}
export declare const CartSkeleton: React.FC<CartSkeletonProps>;

export interface GlowPanelProps {
  as?: React.ElementType;
  radius?: string;
  padding?: string;
  background?: string;
  borderColor?: string;
  glow?: 'none' | 'subtle' | 'soft' | 'medium' | 'strong';
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  [key: string]: unknown;
}
export declare const GlowPanel: React.FC<GlowPanelProps>;

export interface ProductCardProps {
  product: { id: string; name?: string; price?: number | string; [key: string]: unknown };
  [key: string]: unknown;
}
export declare const ProductCard: React.FC<ProductCardProps>;

// Theme context types (already defined in ThemeContext.tsx but need to declare for imports)
export interface ThemeContextValue {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  themes: ('dark' | 'light')[];
}
export declare function useTheme(): ThemeContextValue;

// Animation variants (additional)
export declare const staggerContainer: AnimationVariant;
export declare const gridReveal: AnimationVariant;
export declare const searchBarSequence: AnimationVariant;

// Background presets types
export interface BackgroundPreset {
  id: string;
  name: string;
  description?: string;
  color?: string;
  gradient?: string;
  url?: string;
  [key: string]: unknown;
}
export declare const solidColorPresets: BackgroundPreset[];
export declare const gradientPresets: BackgroundPreset[];
export declare const imagePresets: BackgroundPreset[];
export declare const restaurantInteriorImages: BackgroundPreset[];
export declare const tableSettingsImages: BackgroundPreset[];
export declare const subtleTextureImages: BackgroundPreset[];
export declare const additionalImages: BackgroundPreset[];
export declare function getPresetPreview(preset: BackgroundPreset): BackgroundStyle;
export declare function isValidHexColor(color: string): boolean;
export declare function isValidGradient(gradient: string): boolean;

// Order components types
export interface SwipeableCartItemProps {
  item: unknown;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  getImageUrl: (item: unknown) => string;
  [key: string]: unknown;
}
export declare const SwipeableCartItem: React.FC<SwipeableCartItemProps>;

export interface EmptyCartStateProps {
  [key: string]: unknown;
}
export declare const EmptyCartState: React.FC<EmptyCartStateProps>;

export interface CartTotalsProps {
  subtotal: number;
  deliveryFee: number;
  total: number;
  [key: string]: unknown;
}
export declare const CartTotals: React.FC<CartTotalsProps>;

export interface LoyaltyCardProps {
  loyalty: unknown;
  [key: string]: unknown;
}
export declare const LoyaltyCard: React.FC<LoyaltyCardProps>;

export interface CartSkeletonProps {
  [key: string]: unknown;
}
export declare const CartSkeleton: React.FC<CartSkeletonProps>;

export interface ItemActionsProps {
  itemId: string;
  onSaveForLater: () => void;
  onAddNote: () => void;
  [key: string]: unknown;
}
export declare const ItemActions: React.FC<ItemActionsProps>;

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  [key: string]: unknown;
}
export declare const QuantityStepper: React.FC<QuantityStepperProps>;

export interface CustomDropdownProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  [key: string]: unknown;
}
export declare const CustomDropdown: React.FC<CustomDropdownProps>;

export interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  [key: string]: unknown;
}
export declare const SignupPromptModal: React.FC<SignupPromptModalProps>;

// Vite types for import.meta
declare global {
  interface ImportMeta {
    env?: {
      DEV?: boolean;
      MODE?: string;
      [key: string]: unknown;
    };
    hot?: {
      send: (event: string) => void;
      on: (event: string, handler: () => void) => void;
      [key: string]: unknown;
    };
  }
}

// Price utilities types
export declare function formatPrice(value: number | string, decimals?: number): string;
export declare function getCurrencySymbol(currencyCode?: string): string;
export declare function parsePrice(price: string | number | null | undefined): number;

// Discount utilities types
export interface ApplyDiscountCodeOptions {
  code: string;
  orderTotal: number;
  [key: string]: unknown;
}
export interface ApplyDiscountCodeResult {
  success: boolean;
  discountAmount?: number;
  error?: string;
  [key: string]: unknown;
}
export declare function applyDiscountCodeToOrder(options: ApplyDiscountCodeOptions): Promise<ApplyDiscountCodeResult>;

// Edge function client types
export interface EdgeFunctionClient {
  invoke: (functionName: string, options?: { body?: unknown; [key: string]: unknown }) => Promise<{ data?: unknown; error?: unknown }>;
  [key: string]: unknown;
}
export declare const edgeFunctionClient: EdgeFunctionClient;

// Stripe types
export interface StripePromise {
  [key: string]: unknown;
}
export declare const stripePromise: StripePromise;
export interface StripeCheckoutFormProps {
  clientSecret: string;
  orderId: string | null;
  onSuccess: () => void;
  onError: (error: Error) => void;
  [key: string]: unknown;
}
export declare const StripeCheckoutForm: React.FC<StripeCheckoutFormProps>;

// Auth components types
export interface AuthShellProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

export declare const AuthShell: React.FC<AuthShellProps> & {
  Root: React.FC<{ children: React.ReactNode }>;
  Card: React.FC<{ children: React.ReactNode }>;
  Header: React.FC<{ children: React.ReactNode }>;
  Title: React.FC<{ children: React.ReactNode }>;
  Subtitle: React.FC<{ children: React.ReactNode }>;
  Body: React.FC<{ children: React.ReactNode }>;
  Footer: React.FC<{ children: React.ReactNode }>;
};

