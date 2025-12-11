-- Migration: Add flag to control Home page ambience uploader visibility
-- Allows admins to toggle whether the Home page ambience uploader is shown

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS show_home_ambience_uploader BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.store_settings.show_home_ambience_uploader IS 'Controls whether the ambience uploader appears on the Home page (admin managed).';

-- Ensure existing row (singleton) has an explicit value
UPDATE public.store_settings
SET show_home_ambience_uploader = COALESCE(show_home_ambience_uploader, false);
