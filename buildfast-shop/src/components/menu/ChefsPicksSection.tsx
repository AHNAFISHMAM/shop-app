import React, { memo } from 'react';
import { m } from 'framer-motion';
import { fadeSlideUp, gridReveal, batchFadeSlideUp } from '../animations/menuAnimations';
import ProductCard from './ProductCard';

interface MenuItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ChefsPicksSectionProps {
  chefsPicks: MenuItem[];
  chefBatches: MenuItem[][];
  onAddToCart: (item: MenuItem) => void;
  getImageUrl: (item: MenuItem) => string;
  enableCustomization: boolean;
  prefersReducedMotion: boolean;
}

const ChefsPicksSection = memo(({
  chefsPicks,
  chefBatches,
  onAddToCart,
  getImageUrl,
  enableCustomization,
  prefersReducedMotion
}: ChefsPicksSectionProps) => {
  if (chefsPicks.length === 0) return null;

  return (
    <m.section
      variants={prefersReducedMotion ? {} : fadeSlideUp}
      custom={0.38}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate={prefersReducedMotion ? false : 'visible'}
      exit={prefersReducedMotion ? false : 'exit'}
      aria-labelledby="chefs-picks-heading"
    >
      <h2 id="chefs-picks-heading" className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-4 sm:mb-6">
        ⭐ Chef&apos;s Picks
      </h2>
      {chefBatches.map((batch, batchIndex) => {
        const batchMotionProps = batchIndex === 0
          ? {
              initial: 'hidden',
              animate: 'visible',
              variants: prefersReducedMotion ? {} : gridReveal,
              exit: 'exit',
            }
          : {
              initial: 'hidden',
              variants: prefersReducedMotion ? {} : gridReveal,
              whileInView: 'visible',
              viewport: { once: true, amount: 0.25, margin: '40px 0px 0px 0px' },
              exit: 'exit',
            };

        return (
          <m.div
            key={`chef-batch-${batchIndex}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            {...batchMotionProps}
          >
            {batch.map((item) => (
              <m.div
                key={item.id}
                variants={prefersReducedMotion ? {} : batchFadeSlideUp}
                layout={!prefersReducedMotion}
                initial="hidden"
                animate={batchIndex === 0 ? 'visible' : undefined}
                whileInView={batchIndex === 0 ? undefined : 'visible'}
                viewport={
                  batchIndex === 0
                    ? undefined
                    : { once: true, amount: 0.25, margin: '40px 0px 0px 0px' }
                }
                exit="exit"
              >
                <ProductCard
                  product={item}
                  onAddToCart={onAddToCart}
                  getImageUrl={getImageUrl}
                  enableCustomization={enableCustomization}
                />
              </m.div>
            ))}
          </m.div>
        );
      })}
    </m.section>
  );
});

ChefsPicksSection.displayName = 'ChefsPicksSection';

export default ChefsPicksSection;

