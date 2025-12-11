export const EFFECT_OPTIONS = [
  { value: 'crossfade', label: '✨ Crossfade', description: 'Smooth dissolve between images' },
  { value: 'slide', label: '➡️ Slide + Fade', description: 'Directional slide with fade' },
  { value: 'scaleFade', label: '🔍 Scale + Fade', description: 'Zoom in while fading' },
  { value: 'glowLift', label: '🌟 Glow Lift', description: 'Lift card with soft glow' },
  { value: 'tiltParallax', label: '🎚️ Tilt Parallax', description: '3D tilt toward cursor' },
  { value: 'underlineSweep', label: '〰️ Underline Sweep', description: 'Accent underline on hover' },
  { value: 'pulse', label: '💓 Gentle Pulse', description: 'Breathing scale pulse' },
  { value: 'flip', label: '🃏 Flip Reveal', description: 'Y-axis card flip' },
  { value: 'gradientSweep', label: '🌈 Gradient Sweep', description: 'Accent gradient wash' },
  { value: 'ripple', label: '💧 Ripple Highlight', description: 'Center-out ripple glow' },
  { value: 'perspectiveTilt', label: '📐 Perspective Tilt', description: 'Card tilts toward pointer' },
  { value: 'parallaxLayers', label: '🪄 Parallax Layers', description: 'Foreground & background move at different speeds' },
  { value: 'captionSlide', label: '📝 Caption Slide-Up', description: 'Details panel glides in from bottom' },
  { value: 'shadowShift', label: '🕶️ Shadow Shift', description: 'Dramatic shadow pivots to mimic moving light' },
  { value: 'neonFrame', label: '💡 Neon Frame', description: 'Glowing outline traces around the card' },
  { value: 'contentReveal', label: '📬 Content Reveal', description: 'Hidden text fades and slides into view' },
  { value: 'imageZoomOverlay', label: '🔍 Image Zoom + Overlay', description: 'Background zoom with translucent overlay' },
  { value: 'borderRun', label: '🏃 Border Run', description: 'Accent line races along the border' },
  { value: 'backgroundSwap', label: '🖼️ Background Swap', description: 'Alternate artwork crossfades in' },
  { value: 'staggeredText', label: '📚 Staggered Text', description: 'Card copy animates line by line' },
];

export const CAPTION_EFFECT_KEYS = ['captionSlide', 'contentReveal', 'staggeredText'];
export const SUPPORTED_EFFECT_KEYS = EFFECT_OPTIONS.map((option) => option.value);
export const MAX_EFFECTS_PER_ROUND = 3;
const DEFAULT_FALLBACK = 'crossfade';

export function parseEffects(effectValue, fallback = 'crossfade') {
  if (Array.isArray(effectValue)) {
    const sanitized = effectValue.filter((token) => SUPPORTED_EFFECT_KEYS.includes(token));
    return sanitized.length ? sanitized : [fallback];
  }

  if (typeof effectValue === 'string') {
    if (!effectValue.trim()) return [fallback];

    try {
      const parsed = JSON.parse(effectValue);
      if (Array.isArray(parsed) && parsed.length) {
        const sanitized = parsed.filter((token) => SUPPORTED_EFFECT_KEYS.includes(token));
        return sanitized.length ? sanitized : [fallback];
      }
    } catch {
      // ignore parse error and fall back to comma/pipe separated string
    }

    const tokens = effectValue
      .split(/[,|]/)
      .map((token) => token.trim())
      .filter((token) => SUPPORTED_EFFECT_KEYS.includes(token));

    if (tokens.length) {
      return tokens;
    }
  }

  return [fallback];
}

export function serializeEffects(effectArray) {
  if (!Array.isArray(effectArray)) {
    const single = SUPPORTED_EFFECT_KEYS.includes(effectArray) ? effectArray : 'crossfade';
    return JSON.stringify([single]);
  }
  const cleaned = effectArray.filter((token) => SUPPORTED_EFFECT_KEYS.includes(token));
  return JSON.stringify(cleaned.length ? cleaned : ['crossfade']);
}

export function sanitizeEffectList(effectList, fallbackList = [DEFAULT_FALLBACK]) {
  const fallback = fallbackList[0] ?? DEFAULT_FALLBACK;
  const parsed = parseEffects(effectList, fallback);
  const unique = [];
  for (const effectName of parsed) {
    if (!unique.includes(effectName)) {
      unique.push(effectName);
    }
  }
  return unique.slice(0, MAX_EFFECTS_PER_ROUND);
}

export function buildEffectVariants(baseList) {
  const base = sanitizeEffectList(baseList);
  const variants = [];

  variants.push(base);

  if (base.length >= 2) {
    const rotated = [...base.slice(1), base[0]];
    variants.push(rotated);
  } else {
    variants.push(sanitizeEffectList([base[0], 'glowLift']));
  }

  if (base.length >= 2) {
    const reversed = [...base].reverse();
    variants.push(reversed);
  } else {
    variants.push(sanitizeEffectList(['gradientSweep', base[0]]));
  }

  return variants.slice(0, MAX_EFFECTS_PER_ROUND);
}

export function normalizeEffectVariants(rawVariants, fallbackBase = [DEFAULT_FALLBACK]) {
  const baseList = sanitizeEffectList(fallbackBase);
  let variantArray = [];

  if (Array.isArray(rawVariants)) {
    variantArray = rawVariants;
  } else if (typeof rawVariants === 'string' && rawVariants.trim()) {
    try {
      const parsed = JSON.parse(rawVariants);
      if (Array.isArray(parsed)) {
        variantArray = parsed;
      }
    } catch {
      // ignore parse failure
    }
  }

  const sanitizedVariants = variantArray
    .map((variant) => sanitizeEffectList(variant, baseList))
    .filter((variant) => variant.length > 0)
    .slice(0, MAX_EFFECTS_PER_ROUND);

  if (sanitizedVariants.length === 0) {
    return buildEffectVariants(baseList);
  }

  while (sanitizedVariants.length < MAX_EFFECTS_PER_ROUND) {
    const fill = sanitizedVariants[sanitizedVariants.length - 1] || baseList;
    sanitizedVariants.push(fill);
  }

  return sanitizedVariants.slice(0, MAX_EFFECTS_PER_ROUND);
}

export function parseEffectVariants(rawVariants, fallbackBase = [DEFAULT_FALLBACK]) {
  return normalizeEffectVariants(rawVariants, fallbackBase);
}

export function serializeEffectVariants(variantArray, fallbackBase = [DEFAULT_FALLBACK]) {
  const normalized = normalizeEffectVariants(variantArray, fallbackBase);
  return JSON.stringify(normalized);
}

