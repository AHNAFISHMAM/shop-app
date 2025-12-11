# React-admin Integration Checklist

Use this when preparing a dedicated admin app (React-admin v4) backed by Supabase.

## 1. Supabase Backend
- [ ] Ensure migrations listed in `docs/supabase-migration-guide.md` are applied.
- [ ] Expose REST endpoints via Supabase PostgREST (default) or create custom views for aggregated data.
- [ ] Confirm `customers`, `orders`, `table_reservations` have RLS policies allowing admins (`customers.is_admin = true`).
- [ ] Generate service-role key for server-to-server calls (store securely).

## 2. React-admin Data Provider
- [ ] Install `@supabase/auth-helpers` or use Supabase JS client with service key.
- [ ] Map resources:
  - `customers`: fields (id, full_name, email, status, tags, total_spent, last_visit_date, notes).
  - `orders`: join with order items if needed; expose order_total, status, created_at.
  - `table_reservations`: reservation_date, status, party_size, occasion, customer_email.
- [ ] Implement `getList`, `getOne`, `update`, `create`, `delete` using Supabase queries.
- [ ] Handle pagination via `range` headers or manual limit/offset with count queries.

## 3. Auth & Routing
- [ ] Use Supabase Auth session for admin login; ensure admin flag check before rendering React-admin.
- [ ] Implement logout (signOut) and session refresh (auth.onAuthStateChange).
- [ ] Protect routes so non-admins reroute to login.

## 4. UI Resources
- [ ] Customers List: columns (name/email, status badge, ordersCount, lifetimeValue, lastOrderAt).
- [ ] Customer Show/Edit: tabs for profile, orders (embedded datagrid), reservations, notes editable textarea.
- [ ] Orders List: filter by status/date range, show totals.
- [ ] Reservations List: filter by status/date, quick actions (confirm/cancel).
- [ ] Dashboard: surface metrics similar to current Next.js page (use Supabase RPC or views).

## 5. Enhancements
- [ ] Add optimistic updates for notes/status changes.
- [ ] Use Supabase realtime (channels) to refresh datagrids on insert/update.
- [ ] Integrate charts via `@mui/x-charts` or `recharts` reading from Supabase analytics views.
- [ ] Export buttons (CSV) leveraging React-admin `ExportButton` tied to Supabase queries.

## 6. Deployment
- [ ] Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only).
- [ ] If deploying separate admin app, restrict network via Supabase network policies or service key usage.
- [ ] Document onboarding in README (link to this checklist).

