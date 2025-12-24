/**
 * Database Type Definitions
 *
 * Auto-generated TypeScript types for Supabase database schema.
 * These types should be regenerated when the schema changes.
 *
 * To regenerate:
 * 1. Use Supabase CLI: `supabase gen types typescript --local > src/lib/database.types.ts`
 * 2. Or use Supabase Studio: Database > Types > TypeScript > Copy
 *
 * Last Updated: 2025-01-20
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // Menu System Tables
      menu_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Order System Tables
      orders: {
        Row: {
          id: string
          user_id: string | null
          customer_name: string | null
          customer_email: string | null
          order_total: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          order_total: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          order_total?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          product_id: string | null
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id?: string | null
          product_id?: string | null
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string | null
          product_id?: string | null
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      // Reservation System Tables
      table_reservations: {
        Row: {
          id: string
          user_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          reservation_date: string
          reservation_time: string
          party_size: number
          special_requests: string | null
          occasion: string | null
          table_preference: string | null
          status: string
          check_in_date: string | null
          check_out_date: string | null
          room_type: string | null
          guest_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          reservation_date: string
          reservation_time: string
          party_size: number
          special_requests?: string | null
          occasion?: string | null
          table_preference?: string | null
          status?: string
          check_in_date?: string | null
          check_out_date?: string | null
          room_type?: string | null
          guest_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          reservation_date?: string
          reservation_time?: string
          party_size?: number
          special_requests?: string | null
          occasion?: string | null
          table_preference?: string | null
          status?: string
          check_in_date?: string | null
          check_out_date?: string | null
          room_type?: string | null
          guest_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Customer System Tables
      customers: {
        Row: {
          id: string
          full_name: string | null
          email: string
          phone: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Cart System Tables
      cart_items: {
        Row: {
          id: string
          user_id: string | null
          menu_item_id: string | null
          product_id: string | null
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          menu_item_id?: string | null
          product_id?: string | null
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          menu_item_id?: string | null
          product_id?: string | null
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Reviews System Tables
      reviews: {
        Row: {
          id: string
          user_id: string | null
          menu_item_id: string | null
          product_id: string | null
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          menu_item_id?: string | null
          product_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          menu_item_id?: string | null
          product_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_public_menu: {
        Args: Record<PropertyKey, never>
        Returns: {
          categories: Json
          items: Json
        }
      }
      create_order_with_items: {
        Args: {
          _user_id: string | null
          _customer_name: string | null
          _customer_email: string | null
          _customer_phone: string | null
          _order_items: Json
        }
        Returns: {
          order_id: string
          success: boolean
          error: string | null
        }
      }
      create_reservation: {
        Args: {
          _user_id: string | null
          _customer_name: string
          _customer_email: string
          _customer_phone: string
          _reservation_date: string
          _reservation_time: string
          _party_size: number
          _special_requests?: string | null
        }
        Returns: {
          reservation_id: string
          success: boolean
          error: string | null
        }
      }
    }
    Enums: Record<string, never>
  }
}

// Helper types for common use cases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific table types
export type MenuCategory = Tables<'menu_categories'>
export type MenuItem = Tables<'menu_items'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Reservation = Tables<'table_reservations'>
export type Customer = Tables<'customers'>
export type CartItem = Tables<'cart_items'>
export type Review = Tables<'reviews'>

// RPC Function return types
export type GetPublicMenuResult = Database['public']['Functions']['get_public_menu']['Returns']
export type CreateOrderResult =
  Database['public']['Functions']['create_order_with_items']['Returns']
export type CreateReservationResult =
  Database['public']['Functions']['create_reservation']['Returns']
