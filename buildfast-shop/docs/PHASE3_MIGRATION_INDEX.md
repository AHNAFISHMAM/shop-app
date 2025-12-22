# Phase 3: Supabase Database & RLS - Migration Index

**Last Updated:** 2025-01-XX  
**Status:** Phase 3 Complete

---

## Migration Summary

### Critical Security Migrations (Must Run)

| Migration | Purpose | Status |
|-----------|---------|--------|
| `081_phase3_supabase_audit_and_fixes.sql` | Comprehensive RLS audit, WITH CHECK fixes, index creation | ✅ Created |
| `082_fix_critical_menu_items_rls.sql` | Fixes dangerous `USING (true)` policy on menu_items | ✅ Created |

### Core Functionality Migrations

| Migration | Purpose | Status |
|-----------|---------|--------|
| `033_create_rpc_functions.sql` | Creates get_public_menu(), create_order_with_items(), create_reservation() | ✅ Complete |
| `034_fix_reservation_rls.sql` | Secures reservation SELECT policies | ✅ Complete |
| `025_create_reservations_table.sql` | Creates table_reservations table | ✅ Complete |
| `011_create_orders_tables.sql` | Creates orders and order_items tables | ✅ Complete |
| `050_star_cafe_menu_system.sql` | Creates menu_categories and menu_items tables | ✅ Complete |

### Migration Notes

#### Duplicate/Conflicting Migrations
- `FIX_MENU_ITEMS_RLS.sql` - **DANGEROUS** - Allows anyone to update menu_items. Fixed by `082_fix_critical_menu_items_rls.sql`
- `MANUAL_create_get_public_menu_FIXED.sql` - Duplicate of `033_create_rpc_functions.sql` (get_public_menu)
- Multiple `038_*` migrations - Review and consolidate if needed

#### Manual Migrations (Review Before Running)
- `MANUAL_*` files - These are one-off scripts, not part of standard migration flow
- `SKIP_024_transform_to_restaurant.sql` - Skipped migration, review if needed

---

## Rollback Scripts

**Note:** Most migrations use `IF EXISTS` and `DROP IF EXISTS` patterns, making them idempotent.  
For production rollbacks, create specific rollback migrations as needed.

---

## Next Steps

1. ✅ Run `081_phase3_supabase_audit_and_fixes.sql` in Supabase SQL Editor
2. ✅ Run `082_fix_critical_menu_items_rls.sql` in Supabase SQL Editor
3. ✅ Test RLS policies with different user contexts
4. ✅ Verify frontend functionality

---

## Migration Execution Order

For fresh database setup, run migrations in this order:
1. `001_create_products_table.sql` (legacy, can skip if using menu_items)
2. `002_setup_admin_user.sql`
3. `007_create_categories_table.sql`
4. `009_create_cart_items_table.sql`
5. `011_create_orders_tables.sql`
6. `025_create_reservations_table.sql`
7. `050_star_cafe_menu_system.sql`
8. `033_create_rpc_functions.sql`
9. `034_fix_reservation_rls.sql`
10. `081_phase3_supabase_audit_and_fixes.sql`
11. `082_fix_critical_menu_items_rls.sql`

---

## RPC Functions Status

| Function | Status | Used In |
|----------|--------|---------|
| `get_public_menu()` | ✅ Created | `useMenuData` hook, `menuService.js` |
| `create_order_with_items()` | ✅ Created | `orderService.js`, `Checkout.jsx` |
| `create_reservation()` | ✅ Created | `reservationService.js`, `ReservationsPage.jsx` |

---

## Security Checklist

- [x] All tables have RLS enabled
- [x] All UPDATE policies have WITH CHECK clauses
- [x] All INSERT policies have WITH CHECK clauses
- [x] menu_items UPDATE policy secured (was `USING (true)`)
- [x] Reservation SELECT policy secured
- [x] Indexes created on foreign keys
- [x] RPC functions use server-side validation

