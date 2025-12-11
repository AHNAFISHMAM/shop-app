-- Add adjustable scroll thumb brightness stored setting
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS scroll_thumb_brightness numeric(4,3) DEFAULT 0.60;

UPDATE store_settings
SET scroll_thumb_brightness = COALESCE(scroll_thumb_brightness, 0.60)
WHERE singleton_guard = true;

