# Supabase Migration Guide

This project expects your Supabase schema to match the feature-rich admin dashboard. Apply migrations in the order below.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed and authenticated.
- Environment file `.env.local` (or CLI config) with your project URL and service role key if running commands locally.

## Required Migration Order

Run each SQL file from the project root (`buildfast-shop/`) using the Supabase CLI:

```bash
supabase db push --file supabase/migrations/002_setup_admin_user.sql
supabase db push --file supabase/migrations/011_create_orders_tables.sql
supabase db push --file supabase/migrations/017_add_customer_name_column.sql
supabase db push --file supabase/migrations/025_create_reservations_table.sql
supabase db push --file supabase/migrations/026_auto_create_customer_on_signup.sql
supabase db push --file supabase/migrations/MANUAL_068_add_customer_tags_and_preferences.sql
```

> If you already ran `supabase db push` globally, these files may already be applied. The explicit order ensures dependencies resolve cleanly.

### Manual Admin Promotion

After migrations, grant admin privileges to your account:

1. Open `supabase/migrations/MANUAL_make_user_admin.sql`.
2. Replace every instance of `your-email@example.com` with your actual Supabase Auth email.
3. Run the statements inside Supabase SQL Editor.

## Checking Applied Migrations

```bash
supabase db migrations list
```

You should see the above migration files marked as applied.

## Rolling Back (Optional)

To rollback the most recent migration:

```bash
supabase db rollback
```

Only use rollback if the up/down scripts are reversible.

## Deploying to Remote Environments

```bash
supabase db push --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

Replace `<password>` and `<project-ref>` with your project credentials.

---

Once migrations are in place, the admin customers dashboard will surface real Supabase data with live cohorts, notes, and exports. Update the README if you introduce new migrations or manual steps.

