/*
  Gallery card animation constraints
  ----------------------------------
  Keeps the database aligned with the layered animation options exposed in the admin UI.

  Run the entire file in the Supabase SQL editor (no Markdown fences, single execution).
*/

-- 1. Ensure layered rounds column exists.
ALTER TABLE gallery_cards
ADD COLUMN IF NOT EXISTS effect_variants jsonb;

-- 2. Prepare reusable validation helpers (jsonb overload).
CREATE OR REPLACE FUNCTION gallery_card_effect_valid(e jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF e IS NULL THEN
    RETURN FALSE;
  END IF;

  IF jsonb_typeof(e) <> 'array' THEN
    RETURN FALSE;
  END IF;

  IF jsonb_array_length(e) < 1 OR jsonb_array_length(e) > 3 THEN
    RETURN FALSE;
  END IF;

  IF NOT (e <@ '[
      "crossfade",
      "slide",
      "scalefade",
      "glowLift",
      "tiltParallax",
      "underlineSweep",
      "pulse",
      "flip",
      "gradientSweep",
      "ripple",
      "perspectiveTilt",
      "parallaxLayers",
      "captionSlide",
      "shadowShift",
      "neonFrame",
      "contentReveal",
      "imageZoomOverlay",
      "borderRun",
      "backgroundSwap",
      "staggeredText"
    ]'::jsonb) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION gallery_card_effect_variants_valid(ev jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  idx integer;
  entry jsonb;
BEGIN
  IF ev IS NULL THEN
    RETURN FALSE;
  END IF;

  IF jsonb_typeof(ev) <> 'array' THEN
    RETURN FALSE;
  END IF;

  IF jsonb_array_length(ev) < 1 OR jsonb_array_length(ev) > 3 THEN
    RETURN FALSE;
  END IF;

  FOR idx IN 0 .. jsonb_array_length(ev) - 1 LOOP
    entry := ev -> idx;
    IF NOT gallery_card_effect_valid(entry) THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$;

-- 3. Provide text overloads so the helpers can coerce legacy rows.
CREATE OR REPLACE FUNCTION gallery_card_effect_valid(e text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN gallery_card_effect_valid(
    CASE
      WHEN e IS NULL OR trim(e) = '' THEN '["crossfade"]'::jsonb
      ELSE e::jsonb
    END
  );
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION gallery_card_effect_variants_valid(ev text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN gallery_card_effect_variants_valid(
    CASE
      WHEN ev IS NULL OR trim(ev) = '' THEN '[["crossfade"]]'::jsonb
      ELSE ev::jsonb
    END
  );
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$;

-- 4. Sanitize existing rows so they comply with the new schema.
UPDATE gallery_cards
SET effect = COALESCE(
        CASE
          WHEN gallery_card_effect_valid(effect) THEN effect::jsonb
          ELSE '["crossfade"]'::jsonb
        END,
        '["crossfade"]'::jsonb
     ),
    effect_variants = COALESCE(
        CASE
          WHEN gallery_card_effect_variants_valid(effect_variants) THEN effect_variants::jsonb
          ELSE jsonb_build_array(
                 COALESCE(
                   CASE
                     WHEN gallery_card_effect_valid(effect) THEN effect::jsonb
                     ELSE '["crossfade"]'::jsonb
                   END,
                   '["crossfade"]'::jsonb
                 )
               )
        END,
        jsonb_build_array('["crossfade"]'::jsonb)
     );

-- 5. Set sensible defaults to keep new inserts valid.
ALTER TABLE gallery_cards
ALTER COLUMN effect TYPE jsonb USING effect::jsonb;

ALTER TABLE gallery_cards
ALTER COLUMN effect_variants TYPE jsonb USING effect_variants::jsonb;

ALTER TABLE gallery_cards
ALTER COLUMN effect SET DEFAULT '["crossfade"]'::jsonb;

ALTER TABLE gallery_cards
ALTER COLUMN effect_variants SET DEFAULT '[["crossfade"]]'::jsonb;

-- 6. Drop old constraints (if they exist) before recreating them with the new logic.
ALTER TABLE gallery_cards
DROP CONSTRAINT IF EXISTS gallery_cards_effect_check;

ALTER TABLE gallery_cards
DROP CONSTRAINT IF EXISTS gallery_cards_effect_variants_check;

-- 7. Recreate the constraints using the helper functions.
ALTER TABLE gallery_cards
ADD CONSTRAINT gallery_cards_effect_check
CHECK (gallery_card_effect_valid(effect));

ALTER TABLE gallery_cards
ADD CONSTRAINT gallery_cards_effect_variants_check
CHECK (gallery_card_effect_variants_valid(effect_variants));
