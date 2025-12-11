-- Enable admin control over public-facing reviews
alter table public.store_settings
  add column if not exists show_public_reviews boolean not null default false,
  add column if not exists show_home_testimonials boolean not null default true,
  add column if not exists reviews_visibility_updated_at timestamptz not null default timezone('utc', now());

update public.store_settings
set
  show_public_reviews = coalesce(show_public_reviews, false),
  show_home_testimonials = coalesce(show_home_testimonials, true),
  reviews_visibility_updated_at = timezone('utc', now())
where singleton_guard = true;

