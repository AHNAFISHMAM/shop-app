alter table public.store_settings
add column if not exists show_theme_toggle boolean not null default true;

update public.store_settings
set show_theme_toggle = coalesce(show_theme_toggle, true);

