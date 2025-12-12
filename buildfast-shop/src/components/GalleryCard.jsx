import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  parseEffects,
  parseEffectVariants,
  buildEffectVariants,
  CAPTION_EFFECT_KEYS,
  SUPPORTED_EFFECT_KEYS,
} from '../utils/effects';

const CAPTION_DEPENDENT_EFFECTS = new Set(CAPTION_EFFECT_KEYS);

/**
 * GalleryCard Component
 *
 * Displays a card with two images (default + hover) and optional layered animations.
 * Animation effects are applied via CSS classes derived from the `effect` prop.
 */
const GalleryCard = memo(function GalleryCard({
  defaultImage,
  hoverImage,
  effect = 'crossfade',
  alt = 'Gallery image',
  caption = undefined,
  effectVariants = undefined,
}) {
  const baseEffects = useMemo(() => parseEffects(effect), [effect]);
  const variantSequence = useMemo(() => {
    if (effectVariants !== undefined && effectVariants !== null) {
      return parseEffectVariants(effectVariants, baseEffects);
    }
    return buildEffectVariants(baseEffects);
  }, [effectVariants, baseEffects]);
  const [hoverSequence, setHoverSequence] = useState(0);

  useEffect(() => {
    setHoverSequence(0);
  }, [variantSequence]);

  const variantCount = variantSequence.length || 1;
  const activeVariant = variantSequence[hoverSequence % variantCount];

  const effectClassNames = useMemo(
    () => activeVariant.map((effectName) => `gallery-card-${effectName}`).join(' '),
    [activeVariant],
  );

  const needsCaption = useMemo(
    () => activeVariant.some((effectName) => CAPTION_DEPENDENT_EFFECTS.has(effectName)),
    [activeVariant],
  );

  const captionContent = needsCaption ? caption ?? alt ?? '' : undefined;

  const advanceHoverSequence = useCallback(() => {
    setHoverSequence((prev) => prev + 1);
  }, []);

  return (
    <div
      data-caption={captionContent}
      className={`gallery-card ${effectClassNames} relative overflow-hidden rounded-lg aspect-[4/3] bg-neutral-900 shadow-xl`}
      onMouseLeave={advanceHoverSequence}
      onTouchEnd={advanceHoverSequence}
      onBlur={advanceHoverSequence}
    >
      {/* Default Image */}
      <img
        src={defaultImage}
        alt={alt}
        className="gallery-card-default absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Hover Image */}
      <img
        src={hoverImage}
        alt={`${alt} (hover state)`}
        className="gallery-card-hover absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
});

GalleryCard.propTypes = {
  defaultImage: PropTypes.string.isRequired,
  hoverImage: PropTypes.string.isRequired,
  effect: PropTypes.oneOfType([
    PropTypes.oneOf(SUPPORTED_EFFECT_KEYS),
    PropTypes.arrayOf(PropTypes.oneOf(SUPPORTED_EFFECT_KEYS)),
    PropTypes.string,
  ]),
  alt: PropTypes.string,
  caption: PropTypes.string,
  effectVariants: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOf(SUPPORTED_EFFECT_KEYS))),
    PropTypes.arrayOf(PropTypes.oneOf(SUPPORTED_EFFECT_KEYS)),
  ]),
};

export default GalleryCard;
