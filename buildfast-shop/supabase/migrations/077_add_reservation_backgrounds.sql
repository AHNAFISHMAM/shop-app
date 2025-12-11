-- ============================================================================
-- Add Reservation Page Background Settings (Theme-Aware)
-- ============================================================================
-- This migration adds background configuration for the reservations page
-- with separate settings for dark and light themes
-- ============================================================================

-- Add reservation background columns for dark theme
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS reservation_dark_bg_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS reservation_dark_bg_color TEXT,
ADD COLUMN IF NOT EXISTS reservation_dark_bg_gradient TEXT,
ADD COLUMN IF NOT EXISTS reservation_dark_bg_image_url TEXT DEFAULT 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920';

-- Add reservation background columns for light theme
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS reservation_light_bg_type TEXT DEFAULT 'solid',
ADD COLUMN IF NOT EXISTS reservation_light_bg_color TEXT DEFAULT '#FAF5EF',
ADD COLUMN IF NOT EXISTS reservation_light_bg_gradient TEXT,
ADD COLUMN IF NOT EXISTS reservation_light_bg_image_url TEXT;

-- Add helpful comments
COMMENT ON COLUMN public.store_settings.reservation_dark_bg_type IS 'Background type for reservations page (dark theme): solid, gradient, image, or none';
COMMENT ON COLUMN public.store_settings.reservation_dark_bg_color IS 'Solid color for reservations page (dark theme)';
COMMENT ON COLUMN public.store_settings.reservation_dark_bg_gradient IS 'CSS gradient for reservations page (dark theme)';
COMMENT ON COLUMN public.store_settings.reservation_dark_bg_image_url IS 'Background image URL for reservations page (dark theme)';

COMMENT ON COLUMN public.store_settings.reservation_light_bg_type IS 'Background type for reservations page (light theme): solid, gradient, image, or none';
COMMENT ON COLUMN public.store_settings.reservation_light_bg_color IS 'Solid color for reservations page (light theme)';
COMMENT ON COLUMN public.store_settings.reservation_light_bg_gradient IS 'CSS gradient for reservations page (light theme)';
COMMENT ON COLUMN public.store_settings.reservation_light_bg_image_url IS 'Background image URL for reservations page (light theme)';

-- Update existing row with defaults if values are null
UPDATE public.store_settings
SET
  reservation_dark_bg_type = COALESCE(reservation_dark_bg_type, 'image'),
  reservation_dark_bg_image_url = COALESCE(reservation_dark_bg_image_url, 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920'),
  reservation_light_bg_type = COALESCE(reservation_light_bg_type, 'solid'),
  reservation_light_bg_color = COALESCE(reservation_light_bg_color, '#FAF5EF')
WHERE singleton_guard = true;
