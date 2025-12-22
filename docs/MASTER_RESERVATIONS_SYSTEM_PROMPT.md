# 🍽️ MASTER RESERVATIONS SYSTEM PROMPT
## Production-Grade Restaurant Reservation System Implementation

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing a restaurant reservation system with Supabase, React Query, and TypeScript. It covers reservation creation, management, settings, RLS policies, real-time updates, and admin operations.

**Key Features:**
- Guest and authenticated user reservations
- Reservation settings management
- Real-time availability updates
- Admin reservation management
- Occasion and preference tracking
- Date/time validation
- RPC-based server-side validation

---

## 🎯 USE CASES

- Creating table reservations (guest and authenticated)
- Managing reservation settings (operating hours, time slots, capacity)
- Viewing and canceling user reservations
- Admin reservation management (view all, update status, notes)
- Real-time reservation availability
- Reservation filtering and search
- Blocked dates management
- Occasion and preference tracking

---

## 🏗️ ARCHITECTURE OVERVIEW

### Database Schema

**Main Tables:**
- `table_reservations` - Reservation records
- `reservation_settings` - Global reservation configuration (singleton)

**Key Relationships:**
- `table_reservations.user_id` → `auth.users(id)` (optional, for authenticated users)
- Guest reservations have `user_id = NULL`

**Reservation Status Flow:**
```
pending → confirmed/declined → completed/no_show or cancelled
```

---

## 🔒 PHASE 1: DATABASE SCHEMA & RLS

### Step 1.1: Reservation Table Schema

```sql
CREATE TABLE IF NOT EXISTS public.table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer Information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Reservation Details
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
  table_number TEXT,
  
  -- Extended Fields (for hotels/stays)
  check_in_date DATE,
  check_out_date DATE,
  room_type TEXT,
  
  -- Preferences & Occasions
  occasion TEXT,
  table_preference TEXT,
  guest_notes TEXT,
  
  -- Status and Notes
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Step 1.2: Reservation Settings Table (Singleton)

```sql
CREATE TABLE IF NOT EXISTS reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Operating Hours
  opening_time TIME NOT NULL DEFAULT '11:00:00',
  closing_time TIME NOT NULL DEFAULT '23:00:00',
  
  -- Time Slot Configuration
  time_slot_interval INTEGER NOT NULL DEFAULT 30 
    CHECK (time_slot_interval IN (15, 30, 60)),
  
  -- Capacity Settings
  max_capacity_per_slot INTEGER NOT NULL DEFAULT 50,
  max_party_size INTEGER NOT NULL DEFAULT 20,
  min_party_size INTEGER NOT NULL DEFAULT 1,
  
  -- Days of Operation (JSON array: 0=Sunday, 6=Saturday)
  operating_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  
  -- Feature Toggles
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT true,
  advance_booking_days INTEGER NOT NULL DEFAULT 30,
  
  -- Available Options (JSON arrays)
  enabled_occasions JSONB NOT NULL DEFAULT 
    '["birthday","anniversary","business","date","celebration","casual"]',
  enabled_preferences JSONB NOT NULL DEFAULT 
    '["window","quiet","bar","outdoor","any"]',
  
  -- Blocked Dates (JSON array of dates)
  blocked_dates JSONB NOT NULL DEFAULT '[]',
  
  -- Custom Messages
  special_notice TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Step 1.3: Indexes for Performance

```sql
-- User lookup
CREATE INDEX idx_reservations_user_id 
  ON public.table_reservations(user_id) 
  WHERE user_id IS NOT NULL;

-- Email lookup (for guests)
CREATE INDEX idx_reservations_customer_email 
  ON public.table_reservations(customer_email);

-- Date-based queries
CREATE INDEX idx_reservations_date 
  ON public.table_reservations(reservation_date);

-- Composite index for availability checks
CREATE INDEX idx_reservations_datetime 
  ON public.table_reservations(reservation_date, reservation_time);

-- Status filtering
CREATE INDEX idx_reservations_status 
  ON public.table_reservations(status);
```

### Step 1.4: RLS Policies

```sql
-- Enable RLS
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can create reservations (guest or authenticated)
CREATE POLICY "Anyone can create reservations"
  ON public.table_reservations FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 2: Authenticated users can view their own reservations
CREATE POLICY "Users can view own reservations"
  ON public.table_reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Public can view reservations (client-side filtering by email)
CREATE POLICY "Public can view reservations by email"
  ON public.table_reservations FOR SELECT
  TO public
  USING (true); -- Client-side filtering required

-- Policy 4: Users can cancel their own pending/confirmed reservations
CREATE POLICY "Users can cancel own reservations"
  ON public.table_reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    status IN ('pending', 'confirmed')
  );

-- Policy 5: Admins can view all reservations
CREATE POLICY "Admins can view all reservations"
  ON public.table_reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );

-- Policy 6: Admins can update any reservation
CREATE POLICY "Admins can update any reservation"
  ON public.table_reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );

-- Policy 7: Admins can delete reservations
CREATE POLICY "Admins can delete reservations"
  ON public.table_reservations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );
```

### Step 1.5: Reservation Settings RLS

```sql
ALTER TABLE reservation_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for customer-facing form)
CREATE POLICY "Anyone can read reservation settings"
  ON reservation_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update reservation settings"
  ON reservation_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );
```

---

## 🔧 PHASE 2: RPC FUNCTIONS (Server-Side Validation)

### Step 2.1: Create Reservation RPC Function

```sql
CREATE OR REPLACE FUNCTION create_reservation(
  _user_id UUID,
  _customer_name TEXT,
  _customer_email TEXT,
  _customer_phone TEXT,
  _reservation_date DATE,
  _reservation_time TIME,
  _party_size INTEGER,
  _special_requests TEXT DEFAULT NULL
)
RETURNS TABLE (
  reservation_id UUID,
  error TEXT
) AS $$
DECLARE
  v_reservation_id UUID;
  v_error TEXT;
  v_datetime TIMESTAMPTZ;
BEGIN
  -- Validate party size
  IF _party_size < 1 OR _party_size > 20 THEN
    RETURN QUERY SELECT NULL::UUID, 'Party size must be between 1 and 20 guests'::TEXT;
    RETURN;
  END IF;

  -- Combine date and time
  v_datetime := (_reservation_date + _reservation_time)::TIMESTAMPTZ;

  -- Check if reservation is in the past
  IF v_datetime < NOW() THEN
    RETURN QUERY SELECT NULL::UUID, 'Cannot make reservations for past dates or times'::TEXT;
    RETURN;
  END IF;

  -- Check for duplicate reservations (same user, same date/time within 1 hour)
  IF _user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.table_reservations
      WHERE user_id = _user_id
      AND reservation_date = _reservation_date
      AND ABS(EXTRACT(EPOCH FROM (reservation_time - _reservation_time)) / 3600) < 1
      AND status NOT IN ('cancelled', 'no_show', 'declined')
    ) THEN
      RETURN QUERY SELECT NULL::UUID, 
        'You already have a reservation around this time. Please choose a different time.'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Insert reservation
  INSERT INTO public.table_reservations (
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    reservation_date,
    reservation_time,
    party_size,
    special_requests,
    status
  ) VALUES (
    _user_id,
    _customer_name,
    _customer_email,
    _customer_phone,
    _reservation_date,
    _reservation_time,
    _party_size,
    _special_requests,
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  -- Return success
  RETURN QUERY SELECT v_reservation_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 💻 PHASE 3: SERVICE LAYER

### Step 3.1: Reservation Service Types

```typescript
// lib/reservationService.ts

export interface ReservationData {
  userId?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  reservationDate: string
  reservationTime: string
  partySize: number
  specialRequests?: string | null
  occasion?: string | null
  tablePreference?: string | null
  checkInDate?: string | null
  checkOutDate?: string | null
  roomType?: string | null
  guestNotes?: string | null
}

export interface ReservationResponse {
  success: boolean
  reservationId: string | null
  error: string | null
}

export interface ReservationsResponse {
  success: boolean
  data: Reservation[] | null
  error: string | null
}

export interface ReservationFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  userId?: string
  email?: string
  limit?: number
}
```

### Step 3.2: Create Reservation Service Function

```typescript
import { supabase } from './supabase'
import { logger } from '../utils/logger'
import type { Database } from './database.types'

type Reservation = Database['public']['Tables']['table_reservations']['Row']

export async function createReservation(
  reservationData: ReservationData
): Promise<ReservationResponse> {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      reservationDate,
      reservationTime,
      partySize,
      specialRequests,
      occasion,
      tablePreference,
      checkInDate,
      checkOutDate,
      roomType,
      guestNotes,
    } = reservationData

    // Validate required fields
    if (!customerName?.trim()) {
      return {
        success: false,
        reservationId: null,
        error: 'Customer name is required',
      }
    }

    if (!customerEmail?.trim()) {
      return {
        success: false,
        reservationId: null,
        error: 'Email address is required',
      }
    }

    if (!customerPhone?.trim()) {
      return {
        success: false,
        reservationId: null,
        error: 'Phone number is required',
      }
    }

    if (!reservationDate || !reservationTime) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation date and time are required',
      }
    }

    // Validate party size
    if (!partySize || partySize < 1 || partySize > 20) {
      return {
        success: false,
        reservationId: null,
        error: 'Party size must be between 1 and 20 guests',
      }
    }

    // Validate check-out date
    if (checkOutDate && reservationDate && checkOutDate < reservationDate) {
      return {
        success: false,
        reservationId: null,
        error: 'Check-out date must be after check-in date',
      }
    }

    // Normalize time format (HH:mm → HH:mm:ss)
    const normalizedTime =
      reservationTime.length === 5 ? `${reservationTime}:00` : reservationTime

    // Use RPC function for server-side validation
    const { data, error: rpcError } = await supabase.rpc('create_reservation', {
      _user_id: userId || null,
      _customer_name: customerName.trim(),
      _customer_email: customerEmail.trim(),
      _customer_phone: customerPhone.trim(),
      _reservation_date: reservationDate,
      _reservation_time: normalizedTime,
      _party_size: parseInt(String(partySize), 10),
      _special_requests: specialRequests?.trim() || null,
    })

    let error = rpcError
    let finalReservationId: string | null = null

    if (data) {
      const result = data as { reservation_id: string; error: string | null }
      finalReservationId = result.reservation_id
      error = result.error ? new Error(result.error) : null
    }

    // Update additional fields if RPC succeeded
    if (
      !error &&
      finalReservationId &&
      (occasion || tablePreference || checkInDate || checkOutDate || roomType || guestNotes)
    ) {
      const updateData: Partial<Reservation> = {}
      if (occasion) updateData.occasion = occasion
      if (tablePreference) updateData.table_preference = tablePreference
      if (checkInDate) updateData.check_in_date = checkInDate
      if (checkOutDate) updateData.check_out_date = checkOutDate
      if (roomType) updateData.room_type = roomType
      if (guestNotes) updateData.guest_notes = guestNotes

      const { error: updateError } = await supabase
        .from('table_reservations')
        .update(updateData)
        .eq('id', finalReservationId)

      if (updateError) {
        logger.warn('RPC succeeded but additional fields update failed:', updateError)
      }
    }

    if (error) {
      logger.error('Error creating reservation:', error)

      // Return user-friendly error messages
      if (error.message?.includes('already have a reservation')) {
        return {
          success: false,
          reservationId: null,
          error: 'You already have a reservation around this time. Please choose a different time.',
        }
      }

      if (error.message?.includes('past') || error.message?.includes('Cannot make reservations')) {
        return {
          success: false,
          reservationId: null,
          error: 'Cannot make reservations for past dates or times.',
        }
      }

      return {
        success: false,
        reservationId: null,
        error: error.message || 'Failed to create reservation',
      }
    }

    return {
      success: true,
      reservationId: finalReservationId,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in createReservation:', err)
    return {
      success: false,
      reservationId: null,
      error: 'An unexpected error occurred while creating your reservation',
    }
  }
}
```

### Step 3.3: Get User Reservations

```typescript
export async function getUserReservations(
  userId: string | null = null,
  email: string | null = null
): Promise<ReservationsResponse> {
  try {
    if (!userId && !email) {
      return {
        success: false,
        data: null,
        error: 'User ID or email is required',
      }
    }

    let query = supabase.from('table_reservations').select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.eq('customer_email', email)
    }

    const { data, error } = await query.order('reservation_date', { ascending: false })

    if (error) {
      logger.error('Error fetching reservations:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservations',
      }
    }

    return {
      success: true,
      data: (data as Reservation[]) || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getUserReservations:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}
```

### Step 3.4: Cancel Reservation

```typescript
export async function cancelReservation(
  reservationId: string,
  userId: string | null = null
): Promise<ReservationResponse> {
  try {
    if (!reservationId) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation ID is required',
      }
    }

    const { data, error } = await supabase
      .from('table_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .select('id')
      .single()

    if (error) {
      logger.error('Error cancelling reservation:', error)
      return {
        success: false,
        reservationId: null,
        error: error.message || 'Failed to cancel reservation',
      }
    }

    return {
      success: true,
      reservationId: data?.id || null,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in cancelReservation:', err)
    return {
      success: false,
      reservationId: null,
      error: 'An unexpected error occurred',
    }
  }
}
```

---

## 🔄 PHASE 4: REACT QUERY INTEGRATION

### Step 4.1: Query Keys

```typescript
// shared/lib/query-keys.ts

export const queryKeys = {
  reservations: {
    all: ['reservations'] as const,
    list: (userId: string | null) => [...queryKeys.reservations.all, 'list', userId] as const,
    reservation: (id: string) => [...queryKeys.reservations.all, 'reservation', id] as const,
    settings: () => [...queryKeys.reservations.all, 'settings'] as const,
  },
}
```

### Step 4.2: Reservation Queries

```typescript
// features/reservations/hooks/use-reservations.ts

import { useQuery } from '@tanstack/react-query'
import { getUserReservations } from '../../../lib/reservationService'
import { queryKeys } from '../../../shared/lib/query-keys'
import { useAuth } from '../../../contexts/AuthContext'
import { defaultQueryConfig } from '../../../shared/lib/query-config'

export function useReservations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.reservations.list(user?.id || null),
    queryFn: () => getUserReservations(user?.id || null, null),
    enabled: !!user?.id,
    ...defaultQueryConfig,
    select: (response) => {
      if (!response.success || !response.data) return []
      return response.data
    },
  })
}
```

### Step 4.3: Reservation Settings Query

```typescript
// features/reservations/hooks/use-reservation-settings.ts

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { queryKeys } from '../../../shared/lib/query-keys'
import { longLivedQueryConfig } from '../../../shared/lib/query-config'

export function useReservationSettings() {
  return useQuery({
    queryKey: queryKeys.reservations.settings(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservation_settings')
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    ...longLivedQueryConfig, // Settings change infrequently
  })
}
```

### Step 4.4: Reservation Mutations

```typescript
// features/reservations/hooks/use-reservation-mutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { defaultMutationConfig } from '../../../shared/lib/query-config'
import {
  createReservation,
  type ReservationData,
  type ReservationResponse,
} from '../../../lib/reservationService'

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation<ReservationResponse, Error, ReservationData>({
    ...defaultMutationConfig,
    mutationFn: async (reservationData) => {
      return await createReservation(reservationData)
    },
    onSuccess: (data, variables) => {
      if (data.success && data.reservationId) {
        // Invalidate reservations list to refetch updated reservations
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.reservations.list(variables.userId || null) 
        })
        // Invalidate settings to refresh availability
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.reservations.settings() 
        })
      }
    },
  })
}
```

---

## 📡 PHASE 5: REAL-TIME SUBSCRIPTIONS

### Step 5.1: Real-time Reservation Updates

```typescript
// hooks/useReservationRealtime.ts

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../shared/lib/query-keys'
import { logger } from '../utils/logger'

export function useReservationRealtime(userId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('reservations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_reservations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.log('Reservation updated in real-time:', payload)
          
          // Invalidate reservations list
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.reservations.list(userId) 
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
```

---

## 🎨 PHASE 6: UI COMPONENTS

### Step 6.1: Reservation Form Component

```typescript
// components/ReservationForm.tsx

import { useState } from 'react'
import { useCreateReservation } from '../features/reservations/hooks/use-reservation-mutations'
import { useReservationSettings } from '../features/reservations/hooks/use-reservation-settings'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export function ReservationForm() {
  const { user } = useAuth()
  const { data: settings } = useReservationSettings()
  const createReservation = useCreateReservation()

  const [formData, setFormData] = useState({
    customerName: user?.user_metadata?.full_name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
    specialRequests: '',
    occasion: '',
    tablePreference: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await createReservation.mutateAsync({
      userId: user?.id || null,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      reservationDate: formData.reservationDate,
      reservationTime: formData.reservationTime,
      partySize: formData.partySize,
      specialRequests: formData.specialRequests || null,
      occasion: formData.occasion || null,
      tablePreference: formData.tablePreference || null,
    })

    if (result.success) {
      toast.success('Reservation created successfully!')
      // Reset form or navigate
    } else {
      toast.error(result.error || 'Failed to create reservation')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

---

## ✅ BEST PRACTICES

### ✅ DO:

- **Use RPC functions** for server-side validation (prevents duplicate reservations, past date validation)
- **Validate on both client and server** - client for UX, server for security
- **Handle guest reservations** - allow `user_id = NULL` for non-authenticated users
- **Use React Query** for cache management and invalidation
- **Implement real-time subscriptions** for live availability updates
- **Normalize time format** - convert `HH:mm` to `HH:mm:ss` for consistency
- **Check reservation settings** before allowing bookings (operating hours, blocked dates)
- **Use optimistic updates** for better UX when canceling reservations
- **Log errors** for debugging and monitoring

### ❌ DON'T:

- **Don't trust client-side validation alone** - always validate server-side
- **Don't allow past date/time reservations** - validate in RPC function
- **Don't expose admin operations** to non-admin users (use RLS)
- **Don't forget to cleanup** real-time subscriptions on unmount
- **Don't hardcode reservation limits** - use settings table
- **Don't ignore duplicate reservation checks** - prevent double bookings
- **Don't store sensitive data** in reservation notes (use admin_notes for internal use)

---

## 🚨 COMMON ANTI-PATTERNS

**❌ Never:**
- Bypass RPC validation for "convenience"
- Allow reservations without validating operating hours
- Skip duplicate reservation checks
- Store unvalidated user input
- Forget to handle guest reservations
- Ignore reservation settings

**✅ Always:**
- Use RPC functions for creation
- Validate date/time on server
- Check for duplicates
- Sanitize user input
- Support both authenticated and guest users
- Respect reservation settings

---

## 📚 REFERENCE

- **Reservation Service:** `src/lib/reservationService.ts`
- **Reservation Hooks:** `src/features/reservations/hooks/`
- **Reservation Settings Service:** `src/lib/reservationSettingsService.ts`
- **Database Types:** `src/lib/database.types.ts`
- **Query Keys:** `src/shared/lib/query-keys.ts`

---

## 🔗 RELATED MASTER PROMPTS

- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** - Database schema and RLS patterns
- **🔄 [MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md](./MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md)** - React Query patterns
- **📡 [MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md](./MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md)** - Real-time subscription patterns
- **🔐 [MASTER_AUTHENTICATION_SECURITY_PROMPT.md](./MASTER_AUTHENTICATION_SECURITY_PROMPT.md)** - Authentication patterns

---

## 📝 PHASE 8: FORM VALIDATION & AVAILABILITY CHECKING

### Step 8.1: Real-Time Availability Checking

**From**: `buildfast-shop/src/components/ReservationForm.tsx`

```typescript
// ✅ CORRECT - Real-time availability checking with settings validation
const checkAvailability = useCallback(async (): Promise<void> => {
  if (!settings) return

  setCheckingAvailability(true)
  setIsAvailable(null)

  try {
    // Check if date is blocked
    const blockedDates = settings.blocked_dates || []
    if (isDateBlocked(formData.date, blockedDates)) {
      setIsAvailable(false)
      setCheckingAvailability(false)
      return
    }

    // Check if day is operating
    const dateObj = new Date(formData.date + 'T00:00:00')
    if (!isDayOperating(dateObj, settings.operating_days)) {
      setIsAvailable(false)
      setCheckingAvailability(false)
      return
    }

    // Query existing reservations for the selected date/time
    const { data: existingReservations, error } = await supabase
      .from('table_reservations')
      .select('party_size')
      .eq('reservation_date', formData.date)
      .eq('reservation_time', formData.time)
      .in('status', ['pending', 'confirmed'])

    if (error) {
      logger.error('Error checking availability:', error)
      setIsAvailable(true) // Default to available if check fails
      return
    }

    // Calculate total guests for this time slot
    const maxCapacity = settings.max_capacity_per_slot || 50
    const totalGuests = (existingReservations || []).reduce(
      (sum: number, r: { party_size: number }) => sum + r.party_size,
      0
    )
    const available = totalGuests + formData.guests <= maxCapacity

    setIsAvailable(available)
  } catch (err) {
    logger.error('Availability check error:', err)
    setIsAvailable(true)
  } finally {
    setCheckingAvailability(false)
  }
}, [settings, formData.date, formData.time, formData.guests])

// Check availability when date/time/guests change
useEffect(() => {
  if (formData.date && formData.time && formData.guests) {
    checkAvailability()
  }
}, [formData.date, formData.time, formData.guests, checkAvailability])
```

**Key Points:**
- Check blocked dates before querying database
- Verify operating days (restaurant may be closed certain days)
- Query only `pending` and `confirmed` reservations (ignore cancelled/completed)
- Calculate total capacity dynamically from settings
- Default to available if check fails (graceful degradation)

### Step 8.2: Form Validation with Settings

```typescript
// ✅ CORRECT - Form validation using reservation settings
const validateForm = useCallback((): boolean => {
  const newErrors: FormErrors = {}

  // Name validation
  if (!formData.name.trim()) {
    newErrors.name = 'Name is required'
  } else if (formData.name.trim().length < 2) {
    newErrors.name = 'Name must be at least 2 characters'
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email.trim()) {
    newErrors.email = 'Email is required'
  } else if (!emailRegex.test(formData.email.trim())) {
    newErrors.email = 'Please enter a valid email address'
  }

  // Phone validation
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  if (!formData.phone.trim()) {
    newErrors.phone = 'Phone number is required'
  } else if (!phoneRegex.test(formData.phone.trim())) {
    newErrors.phone = 'Please enter a valid phone number'
  }

  // Date validation
  if (!formData.date) {
    newErrors.date = 'Reservation date is required'
  } else {
    const selectedDate = new Date(formData.date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (settings && !settings.allow_same_day_booking && selectedDate <= today) {
      newErrors.date = 'Same-day bookings are not allowed'
    }

    if (settings) {
      const maxDate = getMaxBookingDate(settings.advance_booking_days)
      if (selectedDate > maxDate) {
        newErrors.date = `Reservations can only be made up to ${settings.advance_booking_days} days in advance`
      }
    }

    // Check if date is blocked
    if (settings && isDateBlocked(formData.date, settings.blocked_dates || [])) {
      newErrors.date = 'This date is not available for reservations'
    }

    // Check if day is operating
    if (settings && !isDayOperating(selectedDate, settings.operating_days || [])) {
      newErrors.date = 'Restaurant is closed on this day'
    }
  }

  // Time validation
  if (!formData.time) {
    newErrors.time = 'Reservation time is required'
  } else if (settings) {
    const timeSlots = generateTimeSlotsFromSettings(settings)
    const isValidTime = timeSlots.some(slot => slot.value === formData.time)
    if (!isValidTime) {
      newErrors.time = 'Please select a valid time slot'
    }
  }

  // Guests validation
  if (!formData.guests || formData.guests < 1) {
    newErrors.guests = 'Party size must be at least 1'
  } else if (settings && formData.guests > settings.max_party_size) {
    newErrors.guests = `Maximum party size is ${settings.max_party_size} guests`
  } else if (settings && formData.guests < settings.min_party_size) {
    newErrors.guests = `Minimum party size is ${settings.min_party_size} guest`
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}, [formData, settings])
```

**Key Points:**
- Validate against reservation settings (not hardcoded values)
- Check blocked dates and operating days
- Validate time slots against generated slots from settings
- Use regex for email and phone validation
- Provide clear, user-friendly error messages

### Step 8.3: Time Slot Generation

```typescript
// ✅ CORRECT - Generate time slots from reservation settings
export function generateTimeSlotsFromSettings(settings: ReservationSettings): TimeSlot[] {
  const slots: TimeSlot[] = []
  const { opening_time, closing_time, time_slot_interval } = settings

  // Parse opening and closing times
  const [openHour, openMinute] = opening_time.split(':').map(Number)
  const [closeHour, closeMinute] = closing_time.split(':').map(Number)

  const openTime = new Date()
  openTime.setHours(openHour, openMinute, 0, 0)

  const closeTime = new Date()
  closeTime.setHours(closeHour, closeMinute, 0, 0)

  // Generate slots
  let currentTime = new Date(openTime)
  while (currentTime < closeTime) {
    const hours = currentTime.getHours().toString().padStart(2, '0')
    const minutes = currentTime.getMinutes().toString().padStart(2, '0')
    const timeString = `${hours}:${minutes}:00`
    const displayTime = `${hours}:${minutes}`

    slots.push({
      value: timeString,
      label: formatTimeForDisplay(displayTime), // e.g., "11:00 AM"
      disabled: false,
    })

    // Increment by interval
    currentTime.setMinutes(currentTime.getMinutes() + time_slot_interval)
  }

  return slots
}
```

**Key Points:**
- Generate slots dynamically from settings (not hardcoded)
- Support different intervals (15, 30, 60 minutes)
- Format times for display (12-hour format with AM/PM)
- Return slots with `value` (for database) and `label` (for display)

---

## ⚙️ PHASE 9: RESERVATION SETTINGS MANAGEMENT

### Step 9.1: Settings Service Pattern

**From**: `buildfast-shop/src/lib/reservationSettingsService.ts`

```typescript
// ✅ CORRECT - Get reservation settings (singleton table)
export async function getReservationSettings(): Promise<SettingsResponse> {
  try {
    const { data, error } = await supabase
      .from('reservation_settings')
      .select('*')
      .maybeSingle() // Use maybeSingle for singleton table

    if (error) {
      logger.error('Error fetching reservation settings:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservation settings',
      }
    }

    // Return default settings if none exist
    if (!data) {
      return {
        success: true,
        data: DEFAULT_SETTINGS,
        error: null,
      }
    }

    return {
      success: true,
      data: data as ReservationSettings,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getReservationSettings:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

// ✅ CORRECT - Update reservation settings (admin only)
export async function updateReservationSettings(
  updates: Partial<ReservationSettings>
): Promise<SettingsResponse> {
  try {
    // Check if settings exist
    const { data: existing } = await supabase
      .from('reservation_settings')
      .select('id')
      .maybeSingle()

    let result

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('reservation_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Create new settings (first time setup)
      const { data, error } = await supabase
        .from('reservation_settings')
        .insert({
          ...DEFAULT_SETTINGS,
          ...updates,
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      logger.error('Error updating reservation settings:', result.error)
      return {
        success: false,
        data: null,
        error: result.error.message || 'Failed to update settings',
      }
    }

    return {
      success: true,
      data: result.data as ReservationSettings,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in updateReservationSettings:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}
```

**Key Points:**
- Use `maybeSingle()` for singleton table queries
- Return default settings if none exist (graceful fallback)
- Support both INSERT (first time) and UPDATE (subsequent) operations
- Always update `updated_at` timestamp

### Step 9.2: Settings Validation Helpers

```typescript
// ✅ CORRECT - Check if date is blocked
export function isDateBlocked(date: string, blockedDates: string[]): boolean {
  if (!blockedDates || blockedDates.length === 0) return false
  return blockedDates.includes(date)
}

// ✅ CORRECT - Check if day is operating
export function isDayOperating(date: Date, operatingDays: number[]): boolean {
  if (!operatingDays || operatingDays.length === 0) return true // Default to all days
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  return operatingDays.includes(dayOfWeek)
}

// ✅ CORRECT - Get minimum booking date
export function getMinBookingDate(allowSameDay: boolean): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (allowSameDay) {
    return today
  }
  
  // Next day
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

// ✅ CORRECT - Get maximum booking date
export function getMaxBookingDate(advanceBookingDays: number): Date {
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + advanceBookingDays)
  maxDate.setHours(23, 59, 59, 999)
  return maxDate
}
```

**Key Points:**
- Helper functions for common validation checks
- Support for blocked dates (JSON array of date strings)
- Operating days as array of day numbers (0-6)
- Calculate min/max dates from settings

---

## 🎨 PHASE 10: COMPONENT INTEGRATION PATTERNS

### Step 10.1: Reservation Form Component Structure

**From**: `buildfast-shop/src/components/ReservationForm.tsx`

```typescript
// ✅ CORRECT - Complete reservation form component structure
const ReservationForm: React.FC<ReservationFormProps> = ({ 
  onSubmit, 
  disabled = false, 
  className = '' 
}) => {
  const { user } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)
  
  // Settings state
  const [settings, setSettings] = useState<ReservationSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true)

  // Form state
  const [formData, setFormData] = useState<ReservationFormData>({
    name: '',
    email: user?.email || '', // Pre-fill for authenticated users
    phone: '',
    date: '',
    time: '',
    guests: 2,
    requests: '',
    occasion: '',
    preference: ''
  })

  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Generate time slots from settings
  const timeSlots = useMemo(() => {
    if (!settings) return []
    return generateTimeSlotsFromSettings(settings)
  }, [settings])

  // Filter occasions/preferences based on settings
  const occasions = useMemo(() => {
    if (!settings) return ALL_OCCASIONS
    return ALL_OCCASIONS.filter(occ => 
      settings.enabled_occasions.includes(occ.value)
    )
  }, [settings])

  const preferences = useMemo(() => {
    if (!settings) return ALL_PREFERENCES
    return ALL_PREFERENCES.filter(pref => 
      settings.enabled_preferences.includes(pref.value)
    )
  }, [settings])

  // Check availability when date/time/guests change
  useEffect(() => {
    if (formData.date && formData.time && formData.guests) {
      checkAvailability()
    }
  }, [formData.date, formData.time, formData.guests, checkAvailability])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (onSubmit) {
      await onSubmit(formData)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className}>
      {/* Form fields */}
    </form>
  )
}
```

**Key Points:**
- Pre-fill email for authenticated users
- Load settings on mount
- Generate time slots dynamically from settings
- Filter occasions/preferences based on enabled options
- Real-time availability checking
- Form validation before submission

### Step 10.2: Using Reservation Mutations

**From**: `buildfast-shop/src/features/reservations/hooks/use-reservation-mutations.ts`

```typescript
// ✅ CORRECT - Using reservation mutation in component
function ReservationsPage() {
  const { user } = useAuth()
  const createReservation = useCreateReservation()

  const handleReservationSubmit = async (formData: ReservationFormData) => {
    try {
      const result = await createReservation.mutateAsync({
        userId: user?.id || null,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        reservationDate: formData.date,
        reservationTime: formData.time,
        partySize: formData.guests,
        specialRequests: formData.requests || null,
        occasion: formData.occasion || null,
        tablePreference: formData.preference || null,
      })

      if (result.success) {
        // Show success message
        toast.success('Reservation created successfully!')
        // Navigate or reset form
      } else {
        // Show error message
        toast.error(result.error || 'Failed to create reservation')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <ReservationForm 
      onSubmit={handleReservationSubmit}
      disabled={createReservation.isPending}
    />
  )
}
```

**Key Points:**
- Use mutation hook for reservation creation
- Handle loading state (`isPending`)
- Show user-friendly success/error messages
- Pass `user?.id || null` for guest support

---

## 🔍 PHASE 11: ERROR HANDLING & EDGE CASES

### Step 11.1: RPC Error Handling

```typescript
// ✅ CORRECT - Handle RPC errors with user-friendly messages
if (error) {
  logger.error('Error creating reservation:', error)

  // Return user-friendly error messages
  if (error.message?.includes('already have a reservation')) {
    return {
      success: false,
      reservationId: null,
      error: 'You already have a reservation around this time. Please choose a different time.',
    }
  }

  if (error.message?.includes('past') || error.message?.includes('Cannot make reservations')) {
    return {
      success: false,
      reservationId: null,
      error: 'Cannot make reservations for past dates or times.',
    }
  }

  if (error.message?.includes('party_size')) {
    return {
      success: false,
      reservationId: null,
      error: 'Party size must be between 1 and 20 guests.',
    }
  }

  return {
    success: false,
    reservationId: null,
    error: error.message || 'Failed to create reservation',
  }
}
```

**Key Points:**
- Parse RPC error messages for specific cases
- Provide user-friendly error messages
- Log technical errors for debugging
- Fallback to generic error message

### Step 11.2: Settings Fallback

```typescript
// ✅ CORRECT - Fallback to default settings if loading fails
const loadSettings = async (): Promise<void> => {
  setLoadingSettings(true)
  const result = await getReservationSettings()

  if (result.success && result.data) {
    setSettings(result.data)
  } else {
    logger.error('Failed to load settings:', result.error)
    // Use defaults if settings fail to load (graceful degradation)
    setSettings(DEFAULT_SETTINGS)
  }

  setLoadingSettings(false)
}
```

**Key Points:**
- Always provide fallback settings
- Log errors but don't break the form
- Use default values that are reasonable

---

## 📊 PHASE 12: REAL-WORLD EXAMPLES

### Example 1: Complete Reservation Creation Flow

```typescript
// ✅ CORRECT - Complete flow from form to database
async function createReservationFlow(formData: ReservationFormData) {
  // 1. Load settings
  const settingsResult = await getReservationSettings()
  if (!settingsResult.success || !settingsResult.data) {
    throw new Error('Failed to load reservation settings')
  }
  const settings = settingsResult.data

  // 2. Validate against settings
  const selectedDate = new Date(formData.date + 'T00:00:00')
  if (!isDayOperating(selectedDate, settings.operating_days)) {
    throw new Error('Restaurant is closed on this day')
  }

  if (isDateBlocked(formData.date, settings.blocked_dates || [])) {
    throw new Error('This date is not available')
  }

  // 3. Check availability
  const { data: existing } = await supabase
    .from('table_reservations')
    .select('party_size')
    .eq('reservation_date', formData.date)
    .eq('reservation_time', formData.time)
    .in('status', ['pending', 'confirmed'])

  const totalGuests = (existing || []).reduce((sum, r) => sum + r.party_size, 0)
  if (totalGuests + formData.guests > settings.max_capacity_per_slot) {
    throw new Error('This time slot is fully booked')
  }

  // 4. Create reservation via RPC
  const { user } = useAuth()
  const result = await createReservation({
    userId: user?.id || null,
    customerName: formData.name,
    customerEmail: formData.email,
    customerPhone: formData.phone,
    reservationDate: formData.date,
    reservationTime: formData.time,
    partySize: formData.guests,
    specialRequests: formData.requests || null,
    occasion: formData.occasion || null,
    tablePreference: formData.preference || null,
  })

  if (!result.success) {
    throw new Error(result.error || 'Failed to create reservation')
  }

  return result.reservationId
}
```

**Key Points:**
- Load settings first
- Validate against settings
- Check availability before creating
- Use RPC function for final creation
- Handle errors at each step

---

## 🎯 SUCCESS CRITERIA (EXPANDED)

A reservation system implementation is complete when:

1. ✅ **Database**: Tables created with proper schema and RLS
2. ✅ **RPC Functions**: Server-side validation and duplicate checking
3. ✅ **Service Layer**: Type-safe service functions with error handling
4. ✅ **React Query**: Queries and mutations with cache management
5. ✅ **Form Validation**: Client and server-side validation
6. ✅ **Availability Checking**: Real-time capacity checking
7. ✅ **Settings Management**: Dynamic configuration from database
8. ✅ **Guest Support**: Both authenticated and guest reservations
9. ✅ **Error Handling**: User-friendly error messages
10. ✅ **Real-time Updates**: Live availability updates
11. ✅ **Admin Management**: Admin can view/update all reservations
12. ✅ **Accessibility**: WCAG 2.2 AA compliant form
13. ✅ **Testing**: Unit tests for service functions
14. ✅ **Documentation**: Code comments and type definitions

---

## 🚨 COMMON PITFALLS (EXPANDED)

### ❌ Don't:
- Trust client-side validation alone
- Allow past date/time reservations
- Skip duplicate reservation checks
- Hardcode reservation limits
- Ignore reservation settings
- Forget to handle guest reservations
- Skip availability checking
- Use hardcoded time slots
- Forget to cleanup subscriptions
- Store sensitive data in notes

### ✅ Do:
- Validate on both client and server
- Use RPC functions for creation
- Check for duplicates server-side
- Use settings table for configuration
- Support both authenticated and guest users
- Check availability before allowing booking
- Generate time slots from settings
- Cleanup subscriptions on unmount
- Use admin_notes for internal use
- Provide user-friendly error messages

---

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This prompt ensures all reservation operations follow production-ready patterns with proper validation, security, and real-time synchronization.**

